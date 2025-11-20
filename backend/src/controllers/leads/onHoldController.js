const pool = require("../../config/db");
const { sendOnHoldNotification, sendRestoreOnHoldNotification } = require("../../services/emailservice");

// Move a lead to on-hold by ID
exports.moveToOnHold = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE leads 
       SET status = $1 
       WHERE lead_id = $2 
       RETURNING leads.*, 
                 (SELECT course_name FROM course WHERE course_id = leads.course_id) AS course_name`,
      ["onhold", id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const onHoldLead = result.rows[0];

    // Send a single on-hold notification email
    await sendOnHoldNotification(onHoldLead);

    res.status(200).json(onHoldLead);
  } catch (err) {
    console.error("Failed to move lead to on-hold:", err);
    res.status(500).json({ error: "Failed to move lead to on-hold" });
  }
};

// Fetch on-hold leads
exports.getOnHoldLeads = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT leads.*, course.course_name, batch.batch_name
      FROM leads
      LEFT JOIN course ON leads.course_id = course.course_id
      LEFT JOIN batch ON leads.batch_id = batch.batch_id
      WHERE leads.status = $1
    `,
      ["onhold"]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch on-hold leads:", err.message);
    res.status(500).json({ error: "Failed to fetch on-hold leads" });
  }
};

//Restore a lead from on-hold to a given status
exports.restoreFromOnHold = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE leads 
       SET status = $1 
       WHERE lead_id = $2 
       RETURNING leads.*, 
                 (SELECT course_name FROM course WHERE course_id = leads.course_id) AS course_name`,
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const restoredLead = result.rows[0];

    // Send a single restore-on-hold notification email
    await sendRestoreOnHoldNotification(restoredLead, status);

    res.status(200).json(restoredLead);
  } catch (err) {
    console.error("Failed to restore lead from on-hold:", err);
    res.status(500).json({ error: "Failed to restore lead from on-hold" });
  }
};
