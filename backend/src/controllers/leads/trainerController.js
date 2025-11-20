const pool = require("../../config/db");

/**
 * GET: Fetch leads for trainers
 * Retrieves all leads with statuses relevant to the trainer (e.g., Training Progress, Placement).
 */
app.get("/trainer/leads", authenticateToken, async (req, res) => {
  try {
    // Query to fetch leads with specific statuses
    const result = await pool.query(
      "SELECT * FROM leads WHERE status IN ($1, $2, $3, $4, $5, $6)",
      [
        "Training Progress",
        "Hands on Project",
        "Certificate Completion",
        "CV Build",
        "Mock Interviews",
        "Placement",
      ]
    );

    // Return the fetched leads as JSON
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching trainer leads:", err.message);
    res.status(500).json({ error: "Failed to fetch leads for trainer" });
  }
});

/**
 * PUT: Update lead status for trainers
 * Allows trainers to update the status and details of a lead and sends email notifications.
 */
app.put("/trainer/leads/:id", authenticateToken, async (req, res) => {
  const { id } = req.params; // Lead ID from the route parameter
  const {
    name,
    mobile_number,
    email,
    role,
    college_company,
    location,
    source,
    course_type,
    course,
    batch_id,
    trainer_name,
    trainer_mobile,
    trainer_email,
    comments,
    status,
    paid_status,
  } = req.body;

  try {
    // Update lead details in the database
    const result = await pool.query(
      `
      UPDATE leads 
      SET name = $1, 
          mobile_number = $2, 
          email = $3, 
          role = $4, 
          college_company = $5, 
          location = $6, 
          source = $7, 
          course_type = $8, 
          course = $9, 
          batch_id = $10, 
          trainer_name = $11, 
          trainer_mobile = $12, 
          trainer_email = $13, 
          comments = $14, 
          status = $15, 
          paid_status = $16 
      WHERE lead_id = $17 
      RETURNING *
      `,
      [
        name,
        mobile_number,
        email,
        role,
        college_company,
        location,
        source,
        course_type,
        course,
        batch_id,
        trainer_name,
        trainer_mobile,
        trainer_email,
        comments,
        status,
        paid_status,
        id,
      ]
    );

    const updatedLead = result.rows[0]; // Fetch the updated lead

    // Send an email notification if the lead status is updated
    if (status) {
      await sendStatusUpdateEmail(updatedLead, status); // Email for status updates
    }

    // Send an email notification if there's a significant lead update
    await sendLeadNotifications({
      name,
      mobile_number,
      email,
      course,
      trainer_name,
      status,
    });

    // Respond with the updated lead details
    res.json({ success: true, lead: updatedLead });
  } catch (err) {
    console.error("Error updating trainer lead status:", err.message);
    res.status(500).json({ error: "Failed to update lead status" });
  }
});

// Get distinct trainers for filters
app.get("/filter-trainers", authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT DISTINCT trainer_name FROM trainer"
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching trainers:", error);
      res.status(500).send("Server error");
    }
  });
  