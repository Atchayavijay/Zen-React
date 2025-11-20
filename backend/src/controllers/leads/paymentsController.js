const pool = require("../../config/db");

// ========================== RECORD INSTALLMENT ==========================

async function recordInstallmentAndSplitShares(req, res) {
  const { lead_id } = req.params;
  const { amount, payment_date, payment_mode, remarks } = req.body;

  if (!lead_id || !amount || !payment_date) {
    return res
      .status(400)
      .json({ error: "lead_id, amount, and payment_date are required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Get student fee details
    const leadRes = await client.query(
      `SELECT actual_fee, discounted_fee, fee_paid FROM leads WHERE lead_id = $1`,
      [lead_id]
    );
    if (leadRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Lead not found." });
    }

    const { actual_fee, discounted_fee, fee_paid } = leadRes.rows[0];

    const paidSoFar = parseFloat(fee_paid || 0);
    const remaining = parseFloat(discounted_fee || 0) - paidSoFar;

    if (amount > remaining) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: `Installment exceeds remaining fee. Remaining: ₹${remaining}`,
      });
    }

    // 2. Get current installment count for this lead
    const countRes = await client.query(
      `SELECT COUNT(*) FROM installments WHERE lead_id = $1`,
      [lead_id]
    );
    const currentInstallmentCount = parseInt(countRes.rows[0].count) + 1;

    // 3. Insert new installment with new count
    const installmentResult = await client.query(
      `INSERT INTO installments (
         lead_id, amount, paid_amount, payment_date,
         payment_mode, remarks, installment_count
       )
       VALUES ($1, $2, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        lead_id,
        amount,
        payment_date,
        payment_mode || null,
        remarks || null,
        currentInstallmentCount,
      ]
    );
    const installment = installmentResult.rows[0];

    // 4. Update fee_paid and fee_balance in leads
    const updatedFeePaid = paidSoFar + parseFloat(amount);
    const updatedFeeBalance = parseFloat(discounted_fee || 0) - updatedFeePaid;

    await client.query(
      `UPDATE leads SET fee_paid = $1, fee_balance = $2 WHERE lead_id = $3`,
      [updatedFeePaid, updatedFeeBalance, lead_id]
    );

    // 5. Get all lead_sub_courses for this lead (single or multi-course)
    const subCoursesRes = await client.query(
      `SELECT lsc.sub_course_id, lsc.trainer_id, lsc.trainer_share, sc.sub_course_name, t.trainer_name
       FROM lead_sub_courses lsc
       JOIN sub_courses sc ON lsc.sub_course_id = sc.sub_course_id
       JOIN trainer t ON lsc.trainer_id = t.trainer_id
       WHERE lsc.lead_id = $1`,
      [lead_id]
    );
    let subCourses = subCoursesRes.rows;
    let trainerShares = [];
    let totalTrainerShare = 0;

    if (subCourses.length > 0) {
      // Multi/sub-course case
      for (const subCourse of subCourses) {
        const share = (amount * (parseFloat(subCourse.trainer_share) || 0)) / 100;
        totalTrainerShare += share;
        trainerShares.push({
          trainer_id: subCourse.trainer_id,
          trainer_name: subCourse.trainer_name,
          sub_course_id: subCourse.sub_course_id,
          sub_course_name: subCourse.sub_course_name,
          share_percentage: subCourse.trainer_share,
          share_amount: share,
        });
      }
    } else {
      // Single course fallback: get trainer from leads table
      const singleTrainerRes = await client.query(
        `SELECT l.trainer_id, t.trainer_name, l.batch_id FROM leads l JOIN trainer t ON l.trainer_id = t.trainer_id WHERE l.lead_id = $1`,
        [lead_id]
      );
      if (singleTrainerRes.rowCount === 0 || !singleTrainerRes.rows[0].trainer_id) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "No trainers found for this lead. Please assign a trainer." });
      }
      const { trainer_id, trainer_name, batch_id } = singleTrainerRes.rows[0];
      // Get share % from batch_trainers if available, else default to 100
      let share_percentage = 100;
      if (batch_id) {
        const batchShareRes = await client.query(
          `SELECT share_percentage FROM batch_trainers WHERE batch_id = $1 AND trainer_id = $2`,
          [batch_id, trainer_id]
        );
        if (batchShareRes.rowCount > 0) {
          share_percentage = parseFloat(batchShareRes.rows[0].share_percentage) || 100;
        }
      }
      const share = (amount * share_percentage) / 100;
      totalTrainerShare = share;
      trainerShares.push({
        trainer_id,
        trainer_name,
        sub_course_id: null,
        sub_course_name: null,
        share_percentage,
        share_amount: share,
      });
    }

    // Insert trainer payouts (per sub-course/trainer or single trainer)
    for (const ts of trainerShares) {
      await client.query(
        `INSERT INTO trainer_payouts (trainer_id, lead_id, installment_id, amount, paid_on, status)
         VALUES ($1, $2, $3, $4, NULL, 'Pending')`,
        [ts.trainer_id, lead_id, installment.installment_id, ts.share_amount]
      );
    }

    const instituteShare = amount - totalTrainerShare;

    await client.query("COMMIT");
    return res.status(201).json({
      success: true,
      installment,
      trainerShares,
      totalTrainerShare,
      instituteShare,
      fees: {
        actual_fee,
        discounted_fee,
        fee_paid: updatedFeePaid,
        fee_balance: updatedFeeBalance,
        installment_number: currentInstallmentCount,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error recording payment and calculating shares:", err);
    return res
      .status(500)
      .json({ error: "Failed to record payment and split shares." });
  } finally {
    client.release();
  }
}

// ========================== GET PAYMENT INFO ==========================

async function getPaymentInfo(req, res) {
  const { lead_id } = req.params;
  const client = await pool.connect();
  try {
    // Get lead info
    const leadRes = await client.query(
      `SELECT actual_fee, discounted_fee, fee_paid, fee_balance, batch_id 
       FROM leads WHERE lead_id = $1`,
      [lead_id]
    );
    if (leadRes.rowCount === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }
    const {
      actual_fee,
      discounted_fee,
      fee_paid,
      fee_balance,
      batch_id,
    } = leadRes.rows[0];

    // Count installments for this lead
    const countRes = await client.query(
      `SELECT COUNT(*) FROM installments WHERE lead_id = $1`,
      [lead_id]
    );
    const installment_number = parseInt(countRes.rows[0].count, 10) + 1;

    // Get trainers for this batch
    const trainerRes = await client.query(
      `SELECT t.trainer_id, t.trainer_name, bt.share_percentage
       FROM batch_trainers bt
       JOIN trainer t ON t.trainer_id = bt.trainer_id
       WHERE bt.batch_id = $1`,
      [batch_id]
    );
    const trainers = trainerRes.rows;
    const totalTrainerPercentage = trainers.reduce(
      (acc, tr) => acc + parseFloat(tr.share_percentage),
      0
    );
    const institute_percentage = 100 - totalTrainerPercentage;

    return res.json({
      actual_fee,
      discounted_fee,
      fee_paid,
      fee_balance,
      installment_number,
      trainers,
      institute_percentage,
    });
  } catch (err) {
    console.error("Error fetching payment info:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

// ========================== GET ALL INSTALLMENTS FOR LEAD ==========================
async function getInstallmentsForLead(req, res) {
  const { lead_id } = req.params;
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM installments WHERE lead_id = $1 ORDER BY installment_count ASC`,
      [lead_id]
    );
    return res.json({ installments: result.rows });
  } catch (err) {
    console.error("Error fetching installments for lead:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

// ========================== GET ALL TRAINER SHARES FOR LEAD ==========================
async function getTrainerSharesForLead(req, res) {
  const { lead_id } = req.params;
  const client = await pool.connect();
  try {
    // Aggregate trainer shares for this lead
    const breakdownRes = await client.query(
      `SELECT 
         tp.trainer_id,
         t.trainer_name,
         SUM(tp.amount) AS total_share,
         SUM(CASE WHEN tp.status = 'Paid' THEN tp.amount ELSE 0 END) AS paid_share,
         SUM(CASE WHEN tp.status != 'Paid' THEN tp.amount ELSE 0 END) AS pending_share
       FROM trainer_payouts tp
       JOIN trainer t ON tp.trainer_id = t.trainer_id
       WHERE tp.lead_id = $1
       GROUP BY tp.trainer_id, t.trainer_name
       ORDER BY t.trainer_name ASC`
      , [lead_id]
    );
    return res.json({ trainerShares: breakdownRes.rows });
  } catch (err) {
    console.error("Error fetching trainer shares for lead:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

// ========================== GET ALL INSTALLMENTS ==========================
async function getAllInstallments(req, res) {
  const client = await pool.connect();
  try {
    const result = await pool.query(`
      SELECT 
        i.installment_id,
        i.lead_id,
        i.amount,
        i.paid_amount,
        i.payment_date,
        i.payment_mode,
        i.remarks,
        i.installment_count,
        l.name AS student_name,
        l.mobile_number AS mobile,
        l.course_id,
        c.course_name,
        b.batch_name,
        t.trainer_name
      FROM installments i
      JOIN leads l ON i.lead_id = l.lead_id
      LEFT JOIN course c ON l.course_id = c.course_id
      LEFT JOIN batch b ON l.batch_id = b.batch_id
      LEFT JOIN trainer t ON l.trainer_id = t.trainer_id
      ORDER BY i.payment_date DESC, i.installment_id DESC
    `);
    
    return res.json({ success: true, installments: result.rows });
  } catch (err) {
    console.error("Error fetching all installments:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

module.exports = {
  recordInstallmentAndSplitShares,
  getPaymentInfo,
  getInstallmentsForLead,
  getTrainerSharesForLead,
  getAllInstallments,
};
