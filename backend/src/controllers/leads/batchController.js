const pool = require("../../config/db");

// ================== CREATE A BATCH ==================
async function createBatch(req, res) {
  const { batch_name, start_date, end_date, class_timing, days_of_week } =
    req.body;

  if (
    !batch_name ||
    !class_timing ||
    !days_of_week ||
    days_of_week.length === 0
  ) {
    return res.status(400).json({
      error: "All batch details, including days, are required.",
    });
  }

  try {
    const formattedDaysOfWeek = `{${days_of_week.join(",")}}`;
    const result = await pool.query(
      "INSERT INTO batch (batch_name, start_date, end_date, class_timing, days_of_week) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [batch_name, start_date, end_date, class_timing, formattedDaysOfWeek]
    );
    res.status(201).json({ success: true, batch: result.rows[0] });
  } catch (err) {
    console.error("Error creating batch:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create batch. Please try again.",
    });
  }
}

// ================== UPDATE A BATCH ==================
async function updateBatch(req, res) {
  const { batch_id } = req.params;
  const { batch_name, start_date, end_date, class_timing, days_of_week } =
    req.body;

  if (
    !batch_id ||
    !batch_name ||
    !start_date ||
    !class_timing ||
    !Array.isArray(days_of_week)
  ) {
    return res.status(400).json({ error: "Invalid or missing fields." });
  }

  try {
    const formattedDaysOfWeek = `{${days_of_week.join(",")}}`;

    const result = await pool.query(
      "UPDATE batch SET batch_name = $1, start_date = $2, end_date = $3, class_timing = $4, days_of_week = $5 WHERE batch_id = $6 RETURNING *",
      [
        batch_name,
        start_date,
        end_date || null,
        class_timing,
        formattedDaysOfWeek,
        batch_id,
      ]
    );

    

    if (result.rowCount === 0) {
     
      return res.status(404).json({ error: "Batch not found." });
    }

   

    res.status(200).json({ success: true, batch: result.rows[0] });
  } catch (err) {
    console.error("Error updating batch:", err);
    res.status(500).json({ error: "Failed to update batch." });
  }
}

// ================== DELETE A BATCH ==================
async function deleteBatch(req, res) {
  const { batch_id } = req.params;

  try {
    const checkBatch = await pool.query(
      "SELECT * FROM batch WHERE batch_id = $1",
      [batch_id]
    );

    if (checkBatch.rowCount === 0) {
      return res.status(404).json({ error: "Batch not found." });
    }

    await pool.query("DELETE FROM batch WHERE batch_id = $1", [batch_id]);

    res
      .status(200)
      .json({ success: true, message: "Batch deleted successfully" });
  } catch (err) {
    console.error("Error deleting batch:", err);
    res.status(500).json({ error: "Failed to delete batch." });
  }
}

// ================== GET ALL BATCHES ==================
async function getBatches(req, res) {
  try {
    const result = await pool.query("SELECT * FROM batch");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching batches:", err);
    res.status(500).json({ error: "Failed to fetch batches." });
  }
}

// ================== GET DISTINCT BATCHES ==================
async function getDistinctBatches(req, res) {
  try {
    const result = await pool.query("SELECT DISTINCT batch_name FROM batch");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching batches:", error);
    res.status(500).json({ error: "Server error" });
  }
}

// Add or update a trainer and share percentage for a batch
async function addOrUpdateBatchTrainer(req, res) {
  const { batch_id } = req.params;
  const { trainer_id, share_percentage } = req.body;

  if (!batch_id || !trainer_id || share_percentage == null) {
    return res.status(400).json({
      error: "batch_id, trainer_id, and share_percentage are required.",
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Upsert trainer to batch_trainers
    await client.query(
      `INSERT INTO batch_trainers (batch_id, trainer_id, share_percentage)
       VALUES ($1, $2, $3)
       ON CONFLICT (batch_id, trainer_id) DO UPDATE SET share_percentage = $3`,
      [batch_id, trainer_id, share_percentage]
    );

    // 2. Backfill missing trainer payouts for past installments
    const leads = await client.query(
      `SELECT lead_id FROM leads WHERE batch_id = $1`,
      [batch_id]
    );

    for (const lead of leads.rows) {
      const installments = await client.query(
        `SELECT installment_id, amount FROM installments WHERE lead_id = $1`,
        [lead.lead_id]
      );

      for (const inst of installments.rows) {
        const exists = await client.query(
          `SELECT 1 FROM trainer_payouts
           WHERE trainer_id = $1 AND installment_id = $2`,
          [trainer_id, inst.installment_id]
        );

        if (exists.rowCount === 0) {
          const shareAmount = (inst.amount * share_percentage) / 100;

          await client.query(
            `INSERT INTO trainer_payouts (trainer_id, lead_id, installment_id, amount, status)
             VALUES ($1, $2, $3, $4, 'Pending')`,
            [trainer_id, lead.lead_id, inst.installment_id, shareAmount]
          );
        }
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message:
        "Trainer added/updated and payouts backfilled for past installments.",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error in addOrUpdateBatchTrainer:", err);
    res.status(500).json({ error: "Failed to add/update batch trainer." });
  } finally {
    client.release();
  }
}

// ================== UPDATE ALL TRAINERS & SHARES FOR A BATCH ==================
async function updateAllBatchTrainers(req, res) {
  const { batch_id } = req.params;
  const { trainers } = req.body; // Array: [{ trainer_id, share_percentage }, ...]

  if (!batch_id || !Array.isArray(trainers) || trainers.length === 0) {
    return res.status(400).json({
      error: "batch_id and a non-empty trainers array are required.",
    });
  }

  // Calculate total share for validation
  const totalShare = trainers.reduce(
    (sum, t) => sum + Number(t.share_percentage || 0),
    0
  );
  if (totalShare > 100) {
    return res
      .status(400)
      .json({ error: "Total trainer share cannot exceed 100%" });
  }

  // Optionally: Check for duplicate trainers in the array
  const uniqueTrainers = new Set(trainers.map((t) => t.trainer_id));
  if (uniqueTrainers.size !== trainers.length) {
    return res.status(400).json({ error: "Duplicate trainers not allowed" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Remove all current trainers for the batch
    await client.query("DELETE FROM batch_trainers WHERE batch_id = $1", [
      batch_id,
    ]);

    // 2. Insert all new trainers
    for (const t of trainers) {
      await client.query(
        `INSERT INTO batch_trainers (batch_id, trainer_id, share_percentage) VALUES ($1, $2, $3)`,
        [batch_id, t.trainer_id, t.share_percentage]
      );
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Batch trainers updated successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating all batch trainers:", err);
    res.status(500).json({ error: "Failed to update batch trainers." });
  } finally {
    client.release();
  }
}

async function removeBatchTrainer(req, res) {
  const { batch_id, trainer_id } = req.params;

  try {
    await pool.query(
      "DELETE FROM batch_trainers WHERE batch_id = $1 AND trainer_id = $2",
      [batch_id, trainer_id]
    );
    res
      .status(200)
      .json({ success: true, message: "Trainer removed from batch." });
  } catch (err) {
    console.error("Error removing batch trainer:", err);
    res.status(500).json({ error: "Failed to remove batch trainer." });
  }
}

async function getBatchTrainers(req, res) {
  const { batch_id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT t.trainer_id, t.trainer_name, bt.share_percentage
       FROM trainer t
       JOIN batch_trainers bt ON t.trainer_id = bt.trainer_id
       WHERE bt.batch_id = $1`,
      [batch_id]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching batch trainers:", err);
    res.status(500).json({ error: "Failed to fetch batch trainers." });
  }
}

async function getTrainerBatches(req, res) {
  const { trainer_id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT b.*, bt.share_percentage
       FROM batch b
       JOIN batch_trainers bt ON b.batch_id = bt.batch_id
       WHERE bt.trainer_id = $1`,
      [trainer_id]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching trainer's batches:", err);
    res.status(500).json({ error: "Failed to fetch trainer's batches." });
  }
}

// Get students (leads) for a batch
// Get students (leads) for a particular batch
async function getBatchLeads(req, res) {
  const { batch_id } = req.params;
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT lead_id, name, mobile_number, email
       FROM leads
       WHERE batch_id = $1 AND status != 'archived'`, // Or any filter you want
      [batch_id]
    );
    res.json(result.rows); // Return as array
  } catch (err) {
    console.error("Error fetching leads for batch:", err);
    res.status(500).json({ error: "Failed to fetch leads for batch" });
  } finally {
    client.release();
  }
}


// ================== EXPORT ALL FUNCTIONS ==================
module.exports = {
  createBatch,
  updateBatch,
  deleteBatch,
  getBatches,
  getBatchLeads,
  getDistinctBatches,
  addOrUpdateBatchTrainer,
  updateAllBatchTrainers,
  removeBatchTrainer,
  getBatchTrainers,
  getTrainerBatches,
  getBatchLeads,
};
