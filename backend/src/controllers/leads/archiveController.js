const pool = require("../../config/db");
const {
  sendArchiveNotification,
  sendRestoreNotification,
} = require("../../services/emailservice");

const bufferToBase64 = (value) =>
  Buffer.isBuffer(value) ? value.toString("base64") : null;

// Archive a lead by ID
exports.archiveLead = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE leads
       SET status = $1
       WHERE lead_id = $2
       RETURNING leads.*, 
                 (SELECT course_name FROM course WHERE course_id = leads.course_id) AS course_name`,
      ["archived", id]
    );

    const archivedLead = result.rows[0];
    res.json(archivedLead);

    // Send a single archive notification email
    await sendArchiveNotification(archivedLead);
  } catch (err) {
    console.error("Failed to archive lead:", err);
    res.status(500).json({ error: "Failed to archive lead" });
  }
};

// Fetch archived leads
exports.getArchivedLeads = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        leads.*, 
        course.course_name, 
        batch.batch_name,
        usr.username AS assignee_name,
        usr.profile_image AS assignee_profile_image
      FROM leads
      LEFT JOIN course ON leads.course_id = course.course_id
      LEFT JOIN batch ON leads.batch_id = batch.batch_id
      LEFT JOIN users usr ON leads.user_id = usr.user_id
      WHERE leads.status = $1
    `,
      ["archived"]
    );

    const leads = result.rows.map((lead) => ({
      ...lead,
      assignee_profile_image: bufferToBase64(lead.assignee_profile_image),
    }));

    res.json(leads);
  } catch (err) {
    console.error("Error fetching archived leads:", err);
    res.status(500).json({ error: "Failed to fetch archived leads" });
  }
};

// Restore a lead by ID
exports.restoreLead = async (req, res) => {
  const { id } = req.params;
  let { status } = req.body;

  status = status?.toLowerCase().replace(/\s+/g, ""); // Normalize
  const allowedStatuses = [
    "enquiry",
    "prospect",
    "enrollment",
    "trainingprogress",
    "handsonproject",
    "certification",
    "cvbuild",
    "mockinterviews",
    "liveinterviews",
    "placement",
    "placementdue",
    "placementpaid",
    "finishers",
    "onhold",
    "archived",
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    const result = await pool.query(
      `UPDATE leads 
       SET status = $1 
       WHERE lead_id = $2 
       RETURNING leads.*, 
                 (SELECT course_name FROM course WHERE course_id = leads.course_id) AS course_name`,
      [status, id]
    );

    const restoredLead = result.rows[0];
    res.json(restoredLead);

    await sendRestoreNotification(restoredLead, status);
  } catch (err) {
    console.error("Failed to restore lead:", err);
    res.status(500).json({ error: "Failed to restore lead" });
  }
};

