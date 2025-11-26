const { v4: uuidv4 } = require("uuid");
const pool = require("../../config/db");
// Create New Assignee

exports.createAssignee = async (req, res) => {
  try {
    let {
      assignee_name,
      mobile_number,
      email,
      country_code = "+91",
    } = req.body;
    const profile_image = req.file ? req.file.buffer : null;

    // Validate required fields
    if (!assignee_name) {
      return res.status(400).json({ error: "Assignee name is required." });
    }

    // Trim and sanitize inputs
    assignee_name = assignee_name.trim();
    email = email?.trim().toLowerCase() || null;
    mobile_number = mobile_number?.trim() || null;
    country_code = country_code.trim();

    // Check for duplicate assignee_name
    const duplicateName = await pool.query(
      "SELECT assignee_id FROM assignee WHERE LOWER(assignee_name) = LOWER($1)",
      [assignee_name]
    );
    if (duplicateName.rowCount > 0) {
      return res
        .status(409)
        .json({ error: "Assignee with this name already exists." });
    }

    // Check for duplicate mobile number
    if (mobile_number) {
      const duplicateMobile = await pool.query(
        "SELECT assignee_id FROM assignee WHERE mobile_number = $1",
        [mobile_number]
      );
      if (duplicateMobile.rowCount > 0) {
        return res.status(409).json({ error: "Mobile number already exists." });
      }
    }

    // Check for duplicate email
    if (email) {
      const duplicateEmail = await pool.query(
        "SELECT assignee_id FROM assignee WHERE email = $1",
        [email]
      );
      if (duplicateEmail.rowCount > 0) {
        return res.status(409).json({ error: "Email already exists." });
      }
    }

    // Insert new assignee
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO assignee (
        assignee_id, assignee_name, profile_image,
        mobile_number, email, country_code
      ) VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING assignee_id, assignee_name, email, mobile_number, country_code`,
      [id, assignee_name, profile_image, mobile_number, email, country_code]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating assignee:", error);
    res.status(500).json({ error: "Failed to create assignee." });
  }
};

// Get all Assignee

exports.getAllAssignees = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        assignee_id, 
        assignee_name, 
        profile_image, 
        email, 
        mobile_number, 
        country_code 
      FROM assignee 
      ORDER BY assignee_name`
    );

    const assignees = result.rows.map((row) => ({
      assignee_id: row.assignee_id,
      assignee_name: row.assignee_name,
      profile_image: row.profile_image
        ? row.profile_image.toString("base64")
        : null,
      has_image: !!row.profile_image, // ✅ this helps prevent 404 in frontend
      email: row.email || null,
      mobile_number: row.mobile_number || null,
      country_code: row.country_code || "+91",
    }));

    res.json(assignees);
  } catch (error) {
    console.error("Error fetching assignees:", error);
    res.status(500).json({ error: "Failed to fetch assignees." });
  }
};

// Get assigneeimage

exports.getAssigneeImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === "null") {
      return res.status(400).json({ error: "Invalid assignee ID." });
    }

    const result = await pool.query(
      `SELECT profile_image FROM assignee WHERE assignee_id = $1`,
      [id]
    );

    if (!result.rows.length || !result.rows[0].profile_image) {
      return res.status(404).json({ error: "No image found." });
    }

    res.set("Content-Type", "image/png");
    res.send(result.rows[0].profile_image);
  } catch (error) {
    console.error("Error fetching assignee image:", error);
    res.status(500).json({ error: "Image fetch failed." });
  }
};

// UPDATE Assignee by ID
exports.updateAssignee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      assignee_name,
      email,
      mobile_number,
      country_code = "+91",
    } = req.body;
    const profile_image = req.file ? req.file.buffer : null;

    if (!assignee_name || !email || !mobile_number) {
      return res
        .status(400)
        .json({
          error: "Assignee name, email, and mobile number are required.",
        });
    }

    // Check for duplicate name (excluding self)
    const nameCheck = await pool.query(
      `SELECT 1 FROM assignee WHERE assignee_name = $1 AND assignee_id != $2`,
      [assignee_name, id]
    );
    if (nameCheck.rowCount > 0) {
      return res
        .status(409)
        .json({ error: "Another assignee already has this name." });
    }

    // Check for duplicate mobile number
    const mobileCheck = await pool.query(
      `SELECT 1 FROM assignee WHERE mobile_number = $1 AND assignee_id != $2`,
      [mobile_number, id]
    );
    if (mobileCheck.rowCount > 0) {
      return res
        .status(409)
        .json({
          error: "This mobile number is already used by another assignee.",
        });
    }

    // Check for duplicate email
    const emailCheck = await pool.query(
      `SELECT 1 FROM assignee WHERE email = $1 AND assignee_id != $2`,
      [email, id]
    );
    if (emailCheck.rowCount > 0) {
      return res
        .status(409)
        .json({ error: "This email is already used by another assignee." });
    }

    // Build dynamic update query
    let query = `UPDATE assignee SET 
      assignee_name = $1,
      email = $2,
      mobile_number = $3,
      country_code = $4`;

    const params = [assignee_name, email, mobile_number, country_code];

    if (profile_image) {
      query += `, profile_image = $5`;
      params.push(profile_image);
    }

    query += ` WHERE assignee_id = $${params.length + 1} RETURNING *`;
    params.push(id);

    const result = await pool.query(query, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Assignee not found." });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error updating assignee:", error);
    res.status(500).json({ error: "Failed to update assignee." });
  }
};

exports.deleteAssignee = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM assignee WHERE assignee_id = $1`, [id]);
    res.json({ message: "Assignee deleted." });
  } catch (error) {
    console.error("Error deleting assignee:", error);
    res.status(500).json({ error: "Failed to delete assignee." });
  }
};
