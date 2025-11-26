const pool = require("../../config/db"); // Correct path
const {
  sendTrainerPayoutSummaryEmails,
} = require("../../services/emailservice");

/**
 * POST: Create a new trainer
 */
exports.createTrainer = async (req, res) => {
  const { trainer_name, trainer_mobile, trainer_email } = req.body;

  if (!trainer_name || !trainer_mobile || !trainer_email) {
    return res
      .status(400)
      .json({ error: "Trainer name, mobile, and email are required." });
  }

  try {
    // Check if trainer already exists
    const existingTrainer = await pool.query(
      "SELECT * FROM trainer WHERE trainer_email = $1 OR trainer_mobile = $2",
      [trainer_email, trainer_mobile]
    );

    if (existingTrainer.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Trainer with this email or mobile already exists." });
    }

    // Insert trainer
    const result = await pool.query(
      "INSERT INTO trainer (trainer_name, trainer_mobile, trainer_email) VALUES ($1, $2, $3) RETURNING *",
      [trainer_name, trainer_mobile, trainer_email]
    );

    res.status(201).json({ success: true, trainer: result.rows[0] });
  } catch (err) {
    console.error("❌ Error creating trainer:", err.message);
    res.status(500).json({ error: "Failed to create trainer." });
  }
};

/**
 * GET: Fetch all trainers
 */
exports.getAllTrainers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM trainer WHERE is_active = true ORDER BY trainer_name ASC"
    );

    res.status(200).json({ success: true, trainers: result.rows });
  } catch (err) {
    console.error("❌ Error fetching trainers:", err.message);
    res.status(500).json({ error: "Failed to fetch trainers." });
  }
};

/**
 * PUT: Update trainer details
 */
exports.updateTrainer = async (req, res) => {
  const { id } = req.params;
  const { trainer_name, trainer_mobile, trainer_email } = req.body;

  if (!trainer_name || !trainer_mobile || !trainer_email) {
    return res
      .status(400)
      .json({ error: "Trainer name, mobile, and email are required." });
  }

  try {
    // Update trainer details
    const result = await pool.query(
      "UPDATE trainer SET trainer_name = $1, trainer_mobile = $2, trainer_email = $3 WHERE trainer_id = $4 RETURNING *",
      [trainer_name, trainer_mobile, trainer_email, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Trainer not found." });
    }

    res.status(200).json({
      success: true,
      message: "Trainer updated successfully",
      trainer: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error updating trainer:", err.message);
    res.status(500).json({ error: "Failed to update trainer." });
  }
};

/**
 * DELETE: Soft delete trainer by ID (sets is_active = false)
 */
exports.deleteTrainer = async (req, res) => {
  const { id } = req.params;

  try {
    // Soft delete: set is_active to false
    const result = await pool.query(
      "UPDATE trainer SET is_active = false WHERE trainer_id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Trainer not found." });
    }

    res
      .status(200)
      .json({ success: true, message: "Trainer deactivated successfully" });
  } catch (err) {
    console.error("❌ Error deactivating trainer:", err.message);
    res.status(500).json({ error: "Failed to deactivate trainer." });
  }
};

exports.getAllTrainerPayouts = async (req, res) => {
  try {
    // 1. Get all installments for all leads with student, batch, and fee info
    const installmentsRes = await pool.query(`
      SELECT i.installment_id, i.lead_id, i.paid_amount, i.installment_count, i.payment_date,
             l.name AS student_name, l.discounted_fee, l.fee_paid, l.batch_id, b.batch_name
      FROM installments i
      JOIN leads l ON i.lead_id = l.lead_id
      LEFT JOIN batch b ON l.batch_id = b.batch_id
      ORDER BY i.installment_id DESC
    `);
    const installments = installmentsRes.rows;

    // 2. Get all current sub-course trainer assignments
    const subTrainersRes = await pool.query(`
      SELECT lsc.lead_id, lsc.sub_course_id, lsc.trainer_id, lsc.trainer_share, sc.sub_course_name, t.trainer_name
      FROM lead_sub_courses lsc
      JOIN sub_courses sc ON lsc.sub_course_id = sc.sub_course_id
      JOIN trainer t ON lsc.trainer_id = t.trainer_id
    `);
    // Map: { lead_id: [ {sub_course_id, trainer_id, trainer_share, ...} ] }
    const subTrainersMap = {};
    for (const row of subTrainersRes.rows) {
      if (!subTrainersMap[row.lead_id]) subTrainersMap[row.lead_id] = [];
      subTrainersMap[row.lead_id].push(row);
    }

    // 4. For each installment, calculate trainer shares using latest assignments
    let payouts = [];
    for (const inst of installments) {
      const {
        installment_id,
        lead_id,
        paid_amount,
        installment_count,
        student_name,
        discounted_fee,
        fee_paid,
        batch_id,
        batch_name,
        payment_date,
      } = inst;
      // If sub-courses exist for this lead, use sub-course trainers
      const subTrainers = subTrainersMap[lead_id] || [];
      if (subTrainers.length > 0) {
        for (const sub of subTrainers) {
          const share_percentage = parseFloat(sub.trainer_share || 0);
          const share_amount =
            (parseFloat(paid_amount || 0) * share_percentage) / 100;
          payouts.push({
            payout_id: `${installment_id}_${sub.trainer_id}_${sub.sub_course_id}`,
            trainer_id: sub.trainer_id,
            trainer_name: sub.trainer_name,
            lead_id,
            student_name,
            installment_id,
            paid_amount,
            installment_count,
            discounted_fee,
            fee_paid,
            sub_course_id: sub.sub_course_id,
            sub_course_name: sub.sub_course_name,
            sub_course_share: share_percentage,
            batch_share_percentage: null,
            amount: share_amount,
            status: "Pending", // You can enhance this to fetch payout status if needed
            paid_on: null,
            batch_name,
            payment_date,
          });
        }
      } else {
        // No sub-courses: use single course trainer from leads table, use trainer_share if present
        const singleTrainerRes = await pool.query(
          `SELECT l.trainer_id, t.trainer_name, l.trainer_share FROM leads l JOIN trainer t ON l.trainer_id = t.trainer_id WHERE l.lead_id = $1`,
          [lead_id]
        );
        if (
          singleTrainerRes.rowCount > 0 &&
          singleTrainerRes.rows[0].trainer_id
        ) {
          const { trainer_id, trainer_name, trainer_share } =
            singleTrainerRes.rows[0];
          const share_percentage = parseFloat(trainer_share || 0);
          const share_amount =
            (parseFloat(paid_amount || 0) * share_percentage) / 100;
          payouts.push({
            payout_id: `${installment_id}_${trainer_id}`,
            trainer_id,
            trainer_name,
            lead_id,
            student_name,
            installment_id,
            paid_amount,
            installment_count,
            discounted_fee,
            fee_paid,
            sub_course_id: null,
            sub_course_name: null,
            sub_course_share: share_percentage,
            batch_share_percentage: null,
            amount: share_amount,
            status: "Pending",
            paid_on: null,
            batch_name,
            payment_date,
          });
        }
      }
    }

    // Overlay persisted status/paid_on from trainer_payouts so admin UI reflects updates
    if (payouts.length > 0) {
      const installmentIds = [...new Set(payouts.map((p) => p.installment_id))];
      const trainerIds = [...new Set(payouts.map((p) => p.trainer_id))];
      // Fetch statuses for relevant installment/trainer pairs
      const statusRes = await pool.query(
        `SELECT payout_id, trainer_id, installment_id, status, paid_on, amount
         FROM trainer_payouts
         WHERE installment_id = ANY($1::int[]) AND trainer_id = ANY($2::int[])`,
        [installmentIds, trainerIds]
      );
      const statusMap = new Map();
      for (const row of statusRes.rows) {
        const key = `${row.installment_id}_${row.trainer_id}`;
        // Keep the latest DB payout row for this pair if duplicates
        statusMap.set(key, row);
      }
      payouts = payouts.map((p) => {
        const key = `${p.installment_id}_${p.trainer_id}`;
        const match = statusMap.get(key);
        if (match) {
          return {
            ...p,
            payout_id: match.payout_id,
            status: match.status || p.status,
            paid_on: match.paid_on || p.paid_on,
            amount: match.amount ?? p.amount,
          };
        }
        return p;
      });
    }

    res.json({ success: true, payouts });
  } catch (err) {
    console.error("Error fetching trainer payouts:", err);
    res.status(500).json({ error: "Failed to load trainer payouts." });
  }
};

exports.updateTrainerPayoutStatus = async (req, res) => {
  const { payoutId } = req.params;
  const { status } = req.body;

  try {
    let paid_on = null;

    // Set paid_on only if status is "Paid"
    if (status === "Paid") {
      paid_on = new Date();
    }

    // Check if payoutId is a temporary ID (contains underscore)
    if (String(payoutId).includes('_')) {
      // Parse temporary ID: format is "installment_id_trainer_id" or "installment_id_trainer_id_sub_course_id"
      const parts = String(payoutId).split('_');
      const installment_id = parseInt(parts[0]);
      const trainer_id = parseInt(parts[1]);

      if (!installment_id || !trainer_id) {
        return res.status(400).json({
          success: false,
          error: "Invalid payout ID format"
        });
      }

      // Check if record exists by installment_id and trainer_id
      const existingRes = await pool.query(
        `SELECT payout_id FROM trainer_payouts 
         WHERE installment_id = $1 AND trainer_id = $2`,
        [installment_id, trainer_id]
      );

      if (existingRes.rowCount > 0) {
        // Update existing record
        const existingPayoutId = existingRes.rows[0].payout_id;
        await pool.query(
          `UPDATE trainer_payouts
           SET status = $1, paid_on = $2
           WHERE payout_id = $3`,
          [status, paid_on, existingPayoutId]
        );
        return res.json({
          success: true,
          message: "Status updated successfully",
          payout_id: existingPayoutId
        });
      } else {
        // Create new record - need to get lead_id, paid_amount, and calculate trainer share
        const installmentRes = await pool.query(
          `SELECT i.lead_id, i.paid_amount 
           FROM installments i 
           WHERE i.installment_id = $1`,
          [installment_id]
        );

        if (installmentRes.rowCount === 0) {
          return res.status(404).json({
            success: false,
            error: "Installment not found"
          });
        }

        const { lead_id, paid_amount } = installmentRes.rows[0];

        // Get trainer share percentage from lead_sub_courses or leads table
        let trainerShare = 0;
        let amount = 0;

        // Check if it's a sub-course (parts.length === 3) or single course (parts.length === 2)
        if (parts.length === 3) {
          // Sub-course: format is "installment_id_trainer_id_sub_course_id"
          const sub_course_id = parseInt(parts[2]);
          const subCourseRes = await pool.query(
            `SELECT trainer_share FROM lead_sub_courses 
             WHERE lead_id = $1 AND trainer_id = $2 AND sub_course_id = $3`,
            [lead_id, trainer_id, sub_course_id]
          );
          if (subCourseRes.rowCount > 0) {
            trainerShare = parseFloat(subCourseRes.rows[0].trainer_share || 0);
            amount = (parseFloat(paid_amount || 0) * trainerShare) / 100;
          }
        } else {
          // Single course: get trainer_share from leads table
          const leadRes = await pool.query(
            `SELECT trainer_share FROM leads WHERE lead_id = $1 AND trainer_id = $2`,
            [lead_id, trainer_id]
          );
          if (leadRes.rowCount > 0) {
            trainerShare = parseFloat(leadRes.rows[0].trainer_share || 0);
            amount = (parseFloat(paid_amount || 0) * trainerShare) / 100;
          }
        }

        const insertRes = await pool.query(
          `INSERT INTO trainer_payouts (trainer_id, lead_id, installment_id, amount, status, paid_on)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING payout_id`,
          [trainer_id, lead_id, installment_id, amount, status, paid_on]
        );

        return res.json({
          success: true,
          message: "Payout created and status set successfully",
          payout_id: insertRes.rows[0].payout_id
        });
      }
    } else {
      // Regular payout_id (numeric) - update existing record
      const result = await pool.query(
        `UPDATE trainer_payouts
         SET status = $1, paid_on = $2
         WHERE payout_id = $3`,
        [status, paid_on, payoutId]
      );

      if (result.rowCount === 0) {
        return res
          .status(404)
          .json({ success: false, error: "Payout ID not found" });
      }

      res.json({ success: true, message: "Status updated successfully" });
    }

    console.log("Updating payout:", payoutId, "to status:", status);
  } catch (err) {
    console.error("Failed to update payout status:", err);
    res.status(500).json({ error: "Failed to update payout status" });
  }
};

exports.sendTrainerPayoutSummary = async (req, res) => {
  const { period, customDateFrom, customDateTo } = req.body;
  try {
    await sendTrainerPayoutSummaryEmails(period, customDateFrom, customDateTo);
    res.json({
      success: true,
      message: "Emails sent to trainers successfully.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send emails." });
  }
};
