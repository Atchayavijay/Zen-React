
const pool = require("../../config/db");
const {
  sendLeadNotifications,
  sendDeleteNotification,
  sendStatusUpdateEmail,
  sendEnrollmentEmail,
} = require("../../services/emailservice");
const { generateEnrollmentID } = require("../../utils/generateEnrollmentID");

const bufferToBase64 = (value) =>
  Buffer.isBuffer(value) ? value.toString("base64") : value ? String(value) : null;

const normalizeTrainingStatus = (value) => {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim().toLowerCase();
  if (!raw) return null;
  const mapping = {
    nottaken: "nottaken",
    "not_taken": "nottaken",
    "not taken": "nottaken",
    scheduled: "scheduled",
    inprogress: "in_progress",
    "in_progress": "in_progress",
    "in progress": "in_progress",
    "in-progress": "in_progress",
    onhold: "onhold",
    "on_hold": "onhold",
    "on hold": "onhold",
    "on-hold": "onhold",
    completed: "completed",
  };
  return mapping[raw] || raw;
};

// ======================= Add New Lead =======================
// src/controllers/leads/leadController.js

exports.addLead = async (req, res) => {
  try {
    console.log("=== ADD LEAD REQUEST ===");
    console.log("Full request body:", JSON.stringify(req.body, null, 2));

    let {
      name,
      country_code = "+91",
      mobile_number,
      email,
      role_id,
      college_company,
      location,
      source_id,
      referred_by, // manual text field
      course_id,
      batch_id,
      trainer_id,
      actual_fee,
      discounted_fee,
      fee_paid,
      placement_fee,
      placement_discounted_fee,
      placement_paid,
      status,
      paid_status,
      placement_paid_status,
      user_id,
      unit_id,
      card_type_id,
      meta_campaign_id,
      sub_courses = [],
      trainer_share,
      trainer_share_amount,
      amount_paid_trainer,
      pending_amount,
      training_status,
      training_start_date,
      training_end_date,
      trainer_paid,
      course_structure,
    } = req.body;

    // Parse sub_courses if it's a JSON string
    if (typeof sub_courses === "string") {
      try {
        sub_courses = JSON.parse(sub_courses);
      } catch (e) {
        console.error("Error parsing sub_courses JSON in addLead:", e);
        sub_courses = [];
      }
    }

    // Ensure sub_courses is an array
    if (!Array.isArray(sub_courses)) {
      sub_courses = [];
    }

    training_status = normalizeTrainingStatus(training_status) || "nottaken";
    sub_courses = sub_courses.map((sub) => ({
      ...sub,
      training_status: normalizeTrainingStatus(sub?.training_status) || "nottaken",
    }));

    training_status = normalizeTrainingStatus(training_status) || "nottaken";
    sub_courses = sub_courses.map((sub) => ({
      ...sub,
      training_status: normalizeTrainingStatus(sub?.training_status) || "nottaken",
    }));

    console.log("Parsed sub_courses in addLead:", sub_courses);

    // Auto-set course_structure based on sub_courses
    if (!course_structure) {
      course_structure = sub_courses.length > 0 ? "multiple" : "single";
      console.log("Auto-set course_structure to:", course_structure);
    }

    // Validate meta_campaign_id if provided
    if (meta_campaign_id) {
      const metaRes = await pool.query(
        "SELECT id FROM meta_campaigns WHERE id = $1",
        [meta_campaign_id]
      );
      if (!metaRes.rowCount)
        return res.status(400).json({ error: "Invalid meta_campaign_id" });
    }

    // 1) Validate required fields
    const missingFields = [];
    if (!name) missingFields.push("Name");
    if (!mobile_number) missingFields.push("Mobile Number");
    if (!course_id) missingFields.push("Course");
    if (!status) missingFields.push("Status");
    if (!unit_id) missingFields.push("Unit");
    if (!card_type_id) missingFields.push("Card Type");
    if (missingFields.length) {
      return res.status(400).json({
        error: `The following fields are required: ${missingFields.join(
          ", "
        )}.`,
      });
    }

    // 2) Validate references
    if (role_id) {
      const roleRes = await pool.query("SELECT id FROM roles WHERE id = $1", [
        role_id,
      ]);
      if (!roleRes.rowCount)
        return res.status(400).json({ error: "Invalid role_id" });
    }

    if (source_id) {
      const sourceRes = await pool.query(
        "SELECT id FROM sources WHERE id = $1",
        [source_id]
      );
      if (!sourceRes.rowCount)
        return res.status(400).json({ error: "Invalid source_id" });
    }

    if (user_id) {
      const userRes = await pool.query(
        "SELECT user_id FROM users WHERE user_id = $1",
        [user_id]
      );
      if (!userRes.rowCount)
        return res.status(400).json({ error: "Invalid user_id" });
    }

    // No validation needed for referred_by (manual text)

    // 3) Format numeric fields
    console.log("Trainer ID debugging:", {
      trainer_id,
      type: typeof trainer_id,
      length: trainer_id?.toString().length,
      trimmed: trainer_id?.toString().trim(),
    });

    const formatted_trainer_id =
      trainer_id && trainer_id !== "undefined" && trainer_id.toString().trim() !== ""
        ? parseInt(trainer_id.toString().trim(), 10)
        : null;

    console.log("Formatted trainer_id:", formatted_trainer_id);

    const f_actual_fee =
      actual_fee && actual_fee.toString().trim() !== "" ? parseFloat(actual_fee.toString().trim()) : null;
    const f_discounted_fee =
      discounted_fee && discounted_fee.toString().trim() !== ""
        ? parseFloat(discounted_fee.toString().trim())
        : null;
    const f_fee_paid =
      fee_paid && fee_paid.toString().trim() !== "" ? parseFloat(fee_paid.toString().trim()) : 0;

    // Fix placement fee parsing - handle numeric strings properly
    const f_placement_fee =
      placement_fee &&
        placement_fee.toString().trim() !== "" &&
        !isNaN(parseFloat(placement_fee))
        ? parseFloat(placement_fee)
        : null;
    const f_placement_discounted_fee =
      placement_discounted_fee &&
        placement_discounted_fee.toString().trim() !== "" &&
        !isNaN(parseFloat(placement_discounted_fee))
        ? parseFloat(placement_discounted_fee)
        : null;
    const f_placement_paid =
      placement_paid &&
        placement_paid.toString().trim() !== "" &&
        !isNaN(parseFloat(placement_paid))
        ? parseFloat(placement_paid)
        : null;

    // Debug logging for fee fields
    console.log("Fee field debugging:", {
      original: {
        actual_fee,
        discounted_fee,
        fee_paid,
        placement_fee,
        placement_discounted_fee,
        placement_paid,
        trainer_id,
        placement_fee_type: typeof placement_fee,
        placement_paid_type: typeof placement_paid,
        placement_fee_string: placement_fee?.toString(),
        placement_paid_string: placement_paid?.toString(),
      },
      parsed: {
        f_actual_fee,
        f_discounted_fee,
        f_fee_paid,
        f_placement_fee,
        f_placement_discounted_fee,
        f_placement_paid,
        formatted_trainer_id,
      },
    });

    const fee_balance =
      f_discounted_fee !== null
        ? Math.max(0, f_discounted_fee - f_fee_paid)
        : null;

    // Placement Paid Status logic - based on discounted fee
    if (!placement_paid_status) {
      if (f_placement_discounted_fee === null || f_placement_discounted_fee === 0) {
        placement_paid_status = "not paid";
      } else if (f_placement_paid === null || f_placement_paid <= 0) {
        placement_paid_status = "not paid";
      } else if (f_placement_paid > 0 && f_placement_paid < f_placement_discounted_fee) {
        placement_paid_status = "partially paid";
      } else if (f_placement_paid >= f_placement_discounted_fee) {
        placement_paid_status = "paid";
      } else {
        placement_paid_status = "not paid";
      }
    }

    if (!paid_status) {
      if (f_fee_paid === 0) paid_status = "not paid";
      else if (fee_balance === 0) paid_status = "paid";
      else paid_status = "partially paid";
    }

    if (!/^\+\d{1,4}$/.test(country_code))
      return res.status(400).json({ error: "Invalid country code format." });
    if (!/^\d{5,15}$/.test(mobile_number))
      return res.status(400).json({ error: "Invalid mobile number format." });

    // 4) Prevent duplicates
    const dup = await pool.query(
      "SELECT lead_id FROM leads WHERE name=$1 AND mobile_number=$2 AND course_id=$3",
      [name, mobile_number, course_id]
    );
    if (dup.rowCount)
      return res
        .status(409)
        .json({ error: "Lead already exists with the same details." });

    // 5) Get course name
    const courseRes = await pool.query(
      "SELECT course_name FROM course WHERE course_id=$1",
      [course_id]
    );
    if (!courseRes.rowCount)
      return res.status(400).json({ error: "Invalid course_id" });
    const course_name = courseRes.rows[0].course_name;

    // 6) Generate enrollment ID if applicable
    const excluded = ["enquiry", "prospect", "onhold", "archived"];
    const enrollment_id = excluded.includes(status.toLowerCase())
      ? null
      : generateEnrollmentID();

    // --- Transaction for lead and sub-courses ---
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // Insert lead
      const result = await client.query(
        `INSERT INTO leads (
          name, country_code, mobile_number, email,
          role_id, college_company, location, source_id,
          referred_by,
          course_id, batch_id, trainer_id,
          actual_fee, discounted_fee, fee_paid, fee_balance,
          placement_fee, placement_discounted_fee, placement_paid, placement_paid_status,
          status, paid_status, user_id,
          unit_id, card_type_id, enrollment_id, created_at,
          meta_campaign_id,
          trainer_share, trainer_share_amount, amount_paid_trainer, pending_amount, training_status, training_start_date, training_end_date, trainer_paid,
          course_structure
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,
          $10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,
          $23,$24,$25,$26,$27,
          $28,$29,$30,$31,$32,$33,$34,$35,
          $36,$37
        ) RETURNING *`,
        [
          name,
          country_code,
          mobile_number,
          email || null,
          role_id || null,
          college_company || null,
          location || null,
          source_id || null,
          referred_by || null,
          course_id,
          batch_id ? parseInt(batch_id, 10) : null,
          formatted_trainer_id,
          f_actual_fee,
          f_discounted_fee,
          f_fee_paid,
          fee_balance,
          f_placement_fee,
          f_placement_discounted_fee,
          f_placement_paid,
          placement_paid_status,
          status,
          paid_status,
          user_id || null,
          unit_id,
          card_type_id,
          enrollment_id,
          new Date(),
          meta_campaign_id || null,
          trainer_share || 0,
          trainer_share_amount || 0,
          amount_paid_trainer || 0,
          pending_amount || 0,
          training_status,
          training_start_date || null,
          training_end_date || null,
          trainer_paid || false,
          course_structure || "single",
        ]
      );
      const lead = result.rows[0];

      console.log("Lead inserted successfully:", {
        lead_id: lead.lead_id,
        fee_paid: lead.fee_paid,
        placement_fee: lead.placement_fee,
        placement_paid: lead.placement_paid,
      });

      // Insert sub-courses only if present
      if (Array.isArray(sub_courses) && sub_courses.length > 0) {
        for (const sub of sub_courses) {
          await client.query(
            `INSERT INTO lead_sub_courses
              (lead_id, course_id, sub_course_id, trainer_id, trainer_share, trainer_share_amount, amount_paid_trainer, pending_amount, training_status, training_start_date, training_end_date, trainer_paid)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              lead.lead_id,
              course_id,
              sub.sub_course_id,
              sub.trainer_id,
              sub.trainer_share || 0,
              sub.trainer_share_amount || 0,
              sub.amount_paid_trainer || 0,
              sub.pending_amount || 0,
              sub.training_status || "nottaken",
              sub.training_start_date || null,
              sub.training_end_date || null,
              sub.trainer_paid || false,
            ]
          );
        }
      }
      await client.query("COMMIT");
      // 8) Send Notifications
      await sendLeadNotifications({
        name,
        mobile_number: `${lead.country_code}${lead.mobile_number}`,
        email,
        course_id,
        course_name,
      });
      if (enrollment_id) {
        await sendEnrollmentEmail({
          name,
          email,
          mobile_number: `${lead.country_code}${lead.mobile_number}`,
          course_id,
          course_name,
          enrollment_id,
        });
      }
      return res.status(201).json(lead);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    // 8) Send Notifications
    await sendLeadNotifications({
      name,
      mobile_number: `${lead.country_code}${lead.mobile_number}`,
      email,
      course_id,
      course_name,
    });

    if (enrollment_id) {
      await sendEnrollmentEmail({
        name,
        email,
        mobile_number: `${lead.country_code}${lead.mobile_number}`,
        course_id,
        course_name,
        enrollment_id,
      });
    }

    return res.status(201).json(lead);
  } catch (err) {
    console.error("Error adding lead:", err);
    console.error("Error stack:", err.stack);
    return res.status(500).json({
      error: err.message || "Failed to add lead",
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// ======================= Update Lead =======================
exports.updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    let {
      name,
      country_code = "+91",
      mobile_number,
      email,
      role_id,
      college_company,
      location,
      source_id,
      referred_by, // manual text field
      course_id,
      batch_id,
      trainer_id,
      actual_fee,
      discounted_fee,
      fee_paid,
      placement_fee,
      placement_discounted_fee,
      placement_paid,
      placement_balance,

      status,
      paid_status,
      placement_paid_status,
      user_id,
      unit_id,
      card_type_id,
      meta_campaign_id,
      sub_courses = [],
      trainer_share,
      trainer_share_amount,
      amount_paid_trainer,
      pending_amount,
      training_status,
      training_start_date,
      training_end_date,
      trainer_paid,
      course_structure,
    } = req.body;

    // Parse sub_courses if it's a JSON string
    if (typeof sub_courses === "string") {
      try {
        sub_courses = JSON.parse(sub_courses);
      } catch (e) {
        console.error("Error parsing sub_courses JSON:", e);
        sub_courses = [];
      }
    }

    // Ensure sub_courses is an array
    if (!Array.isArray(sub_courses)) {
      sub_courses = [];
    }

    console.log("Parsed sub_courses:", sub_courses);

    // Auto-set course_structure based on sub_courses if not explicitly set
    if (!course_structure) {
      course_structure = sub_courses.length > 0 ? "multiple" : "single";
      console.log("Auto-set course_structure to:", course_structure);
    }

    // Validate meta_campaign_id if provided
    if (meta_campaign_id) {
      const metaRes = await pool.query(
        "SELECT id FROM meta_campaigns WHERE id = $1",
        [meta_campaign_id]
      );
      if (!metaRes.rowCount)
        return res.status(400).json({ error: "Invalid meta_campaign_id" });
    }

    // 1) Validate required fields
    const missing = [];
    if (!name) missing.push("Name");
    if (!mobile_number) missing.push("Mobile Number");
    if (!status) missing.push("Status");
    if (!course_id) missing.push("Course");
    if (!unit_id) missing.push("Unit");
    if (!card_type_id) missing.push("Card Type");
    if (missing.length) {
      return res.status(400).json({
        error: `The following fields are required: ${missing.join(", ")}.`,
      });
    }

    // 2) Validate phone formats
    if (!/^\+\d{1,4}$/.test(country_code))
      return res.status(400).json({ error: "Invalid country code format." });
    if (!/^\d{5,15}$/.test(mobile_number))
      return res.status(400).json({ error: "Invalid mobile number format." });

    // 3) Fetch existing lead
    const existing = await pool.query(
      "SELECT * FROM leads WHERE lead_id = $1",
      [id]
    );
    if (!existing.rowCount) {
      return res.status(404).json({ error: "Lead not found." });
    }
    const oldStatus = existing.rows[0].status;

    // 4) Validate references
    if (role_id) {
      const roleRes = await pool.query("SELECT id FROM roles WHERE id = $1", [
        role_id,
      ]);
      if (!roleRes.rowCount)
        return res.status(400).json({ error: "Invalid role_id" });
    }

    if (source_id) {
      const sourceRes = await pool.query(
        "SELECT id FROM sources WHERE id = $1",
        [source_id]
      );
      if (!sourceRes.rowCount)
        return res.status(400).json({ error: "Invalid source_id" });
    }

    // No validation needed for referred_by (manual text)

    // 5) Format numeric fields
    const formatted_trainer_id =
      trainer_id && trainer_id !== "undefined" && trainer_id.toString().trim() !== ""
        ? parseInt(trainer_id.toString().trim(), 10)
        : null;
    const f_actual_fee =
      actual_fee && actual_fee.toString().trim() !== "" ? parseFloat(actual_fee.toString().trim()) : null;
    const f_discounted_fee =
      discounted_fee && discounted_fee.toString().trim() !== ""
        ? parseFloat(discounted_fee.toString().trim())
        : null;
    const f_fee_paid =
      fee_paid && fee_paid.toString().trim() !== "" ? parseFloat(fee_paid.toString().trim()) : 0;

    // Fix placement fee parsing - handle numeric strings properly (same as addLead)
    const f_placement_fee =
      placement_fee &&
        placement_fee.toString().trim() !== "" &&
        !isNaN(parseFloat(placement_fee))
        ? parseFloat(placement_fee)
        : null;
    const f_placement_discounted_fee =
      placement_discounted_fee &&
        placement_discounted_fee.toString().trim() !== "" &&
        !isNaN(parseFloat(placement_discounted_fee))
        ? parseFloat(placement_discounted_fee)
        : null;
    const f_placement_paid =
      placement_paid &&
        placement_paid.toString().trim() !== "" &&
        !isNaN(parseFloat(placement_paid))
        ? parseFloat(placement_paid)
        : null;

    const fee_balance =
      f_discounted_fee !== null
        ? Math.max(0, f_discounted_fee - f_fee_paid)
        : null;

    // 6) Derive paid_status if missing
    if (!paid_status) {
      if (f_fee_paid === 0) paid_status = "not paid";
      else if (fee_balance === 0) paid_status = "paid";
      else paid_status = "partially paid";
    }

    // Placement Paid Status logic - based on discounted fee
    if (!placement_paid_status) {
      if (f_placement_discounted_fee === null || f_placement_discounted_fee === 0) {
        placement_paid_status = "not paid";
      } else if (f_placement_paid === null || f_placement_paid <= 0) {
        placement_paid_status = "not paid";
      } else if (f_placement_paid > 0 && f_placement_paid < f_placement_discounted_fee) {
        placement_paid_status = "partially paid";
      } else if (f_placement_paid >= f_placement_discounted_fee) {
        placement_paid_status = "paid";
      } else {
        placement_paid_status = "not paid";
      }
    }

    // 7) Build update fields
    const fields = {
      name,
      country_code,
      mobile_number,
      email: email || null,
      role_id: role_id || null,
      college_company: college_company || null,
      location: location || null,
      source_id: source_id || null,
      referred_by: referred_by || null,
      course_id,
      batch_id: batch_id ? parseInt(batch_id, 10) : null,
      trainer_id: formatted_trainer_id,
      actual_fee: f_actual_fee,
      discounted_fee: f_discounted_fee,
      fee_paid: f_fee_paid,
      fee_balance,
      placement_fee: f_placement_fee,
      placement_discounted_fee: f_placement_discounted_fee,
      placement_paid: f_placement_paid,
      placement_paid_status,
      status,
      paid_status,
      user_id: user_id || null,
      unit_id,
      card_type_id,
      meta_campaign_id: meta_campaign_id || null,
      trainer_share: trainer_share || 0,
      trainer_share_amount: trainer_share_amount || 0,
      amount_paid_trainer: amount_paid_trainer || 0,
      pending_amount: pending_amount || 0,
      training_status,
      training_start_date: training_start_date || null,
      training_end_date: training_end_date || null,
      trainer_paid: trainer_paid || false,
      course_structure: course_structure || "single",
      updated_at: new Date(),
    };

    const entries = Object.entries(fields);
    const setClauses = entries
      .map(([key], i) => `${key} = $${i + 1}`)
      .join(", ");
    const values = entries.map(([, val]) => val);

    // --- Transaction for lead and sub-courses ---
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // Update lead
      const updateQuery = `
        UPDATE leads
        SET ${setClauses}
        WHERE lead_id = $${values.length + 1}
        RETURNING *`;
      const { rows } = await client.query(updateQuery, [...values, id]);
      const updatedLead = rows[0];
      // Remove all old sub-courses for this lead
      await client.query("DELETE FROM lead_sub_courses WHERE lead_id = $1", [
        id,
      ]);
      console.log(`Deleted existing sub-courses for lead ${id}`);

      // Insert new sub-courses only if present
      console.log(
        `Processing ${sub_courses.length} sub-courses for lead ${id}`
      );
      if (Array.isArray(sub_courses) && sub_courses.length > 0) {
        for (const sub of sub_courses) {
          console.log("Inserting sub-course:", sub);
          try {
            await client.query(
              `INSERT INTO lead_sub_courses
                (lead_id, course_id, sub_course_id, trainer_id, trainer_share, trainer_share_amount, amount_paid_trainer, pending_amount, training_status, training_start_date, training_end_date, trainer_paid)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
              [
                id,
                course_id,
                sub.sub_course_id,
                sub.trainer_id,
                sub.trainer_share || 0,
                sub.trainer_share_amount || 0,
                sub.amount_paid_trainer || 0,
                sub.pending_amount || 0,
                sub.training_status || "nottaken",
                sub.training_start_date || sub.start_date || null,
                sub.training_end_date || sub.end_date || null,
                sub.trainer_paid || false,
              ]
            );
            console.log("Successfully inserted sub-course:", sub.sub_course_id);
          } catch (subError) {
            console.error("Error inserting sub-course:", subError);
            console.error("Failed sub-course data:", sub);
            throw subError; // Re-throw to trigger rollback
          }
        }
      } else {
        console.log("No sub-courses to insert");
      }
      // 9) Notify if status changed
      if (oldStatus !== status) {
        await sendStatusUpdateEmail(
          {
            name,
            email,
            mobile_number: `${country_code}${mobile_number}`,
            course_id,
          },
          status
        );
      }
      // 10) Generate enrollment ID if status reaches Enrollment and doesn't have one yet
      const enrollmentStatuses = ["enrollment", "completed", "placed"];
      const shouldHaveEnrollmentId = enrollmentStatuses.includes(status.toLowerCase());

      if (shouldHaveEnrollmentId && !updatedLead.enrollment_id) {
        const courseRes = await client.query(
          "SELECT course_name FROM course WHERE course_id = $1",
          [course_id]
        );
        const course_name = courseRes.rows[0]?.course_name || "your course";
        const enrollment_id = generateEnrollmentID();

        await client.query(
          "UPDATE leads SET enrollment_id = $1 WHERE lead_id = $2",
          [enrollment_id, id]
        );

        // Update the returned object with the new enrollment_id
        updatedLead.enrollment_id = enrollment_id;

        await sendEnrollmentEmail({
          name,
          email,
          mobile_number: `${country_code}${mobile_number}`,
          course_id,
          course_name,
          enrollment_id,
        });
      }
      await client.query("COMMIT");
      return res.status(200).json(updatedLead);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error updating lead:", err);
    return res.status(500).json({ error: "Failed to update lead" });
  }
};

// ======================= Get Leads with Filters =======================
exports.getLeads = async (req, res) => {
  const {
    courseType,
    course,
    status,
    trainer,
    batch,
    feeStatus,
    source,
    role,
    user_id,
    unit,
    cardType,
    referred_by,
    meta_campaign_id, // Optional: to allow filtering by referrer (text)
  } = req.query;

  // If status filter is provided, do not exclude 'onhold' in NOT IN
  let query = `
    SELECT
      leads.*,
      (leads.discounted_fee - leads.fee_paid) AS fee_balance,
      roles.name AS role,
      sources.name AS source,
      batch.batch_name,
      trainer.trainer_name,
      trainer.trainer_mobile,
      trainer.trainer_email,
      course.course_name,
      course.course_type,
      unit.unit_name,
      card_type.card_type_name,
      usr.username AS assignee_name,
      usr.mobile AS assignee_mobile,
      usr.email AS assignee_email,
      usr.profile_image AS assignee_profile_image,
      meta_campaigns.name AS meta_campaign_name
    FROM leads
    LEFT JOIN roles     ON leads.role_id      = roles.id
    LEFT JOIN sources   ON leads.source_id    = sources.id
    LEFT JOIN batch     ON leads.batch_id     = batch.batch_id
    LEFT JOIN trainer   ON leads.trainer_id   = trainer.trainer_id
    LEFT JOIN course    ON leads.course_id    = course.course_id
    LEFT JOIN unit      ON leads.unit_id      = unit.unit_id
    LEFT JOIN card_type ON leads.card_type_id = card_type.card_type_id
    LEFT JOIN users usr ON leads.user_id      = usr.user_id
    LEFT JOIN meta_campaigns ON leads.meta_campaign_id = meta_campaigns.id
    WHERE 1=1
  `;

  const params = [];
  let idx = 1;

  // Do not exclude any status; fetch all leads

  // Dynamic filters
  if (courseType) {
    query += ` AND course.course_type = $${idx++}`;
    params.push(courseType);
  }
  if (course) {
    query += ` AND leads.course_id = $${idx++}`;
    params.push(course);
  }
  if (status) {
    query += ` AND leads.status = $${idx++}`;
    params.push(status);
  }
  if (trainer) {
    query += ` AND trainer.trainer_name = $${idx++}`;
    params.push(trainer);
  }
  if (batch) {
    query += ` AND batch.batch_name = $${idx++}`;
    params.push(batch);
  }
  if (feeStatus) {
    query += ` AND leads.paid_status = $${idx++}`;
    params.push(feeStatus);
  }
  if (source) {
    query += ` AND leads.source_id = $${idx++}`;
    params.push(source);
  }
  if (role) {
    query += ` AND leads.role_id = $${idx++}`;
    params.push(role);
  }
  if (user_id) {
    query += ` AND leads.user_id = $${idx++}`;
    params.push(user_id);
  }
  if (unit) {
    query += ` AND unit.unit_name = $${idx++}`;
    params.push(unit);
  }
  if (cardType) {
    query += ` AND card_type.card_type_name = $${idx++}`;
    params.push(cardType);
  }
  if (referred_by) {
    query += ` AND leads.referred_by ILIKE $${idx++}`;
    params.push(`%${referred_by}%`);
  }
  if (meta_campaign_id) {
    query += ` AND leads.meta_campaign_id = $${idx++}`;
    params.push(meta_campaign_id);
  }

  // Sort by newest leads first
  query += ` ORDER BY leads.created_at DESC`;

  try {
    const { rowCount, rows } = await pool.query(query, params);
    if (!rowCount) {
      return res
        .status(404)
        .json({ error: "No leads found with the given filters." });
    }
    rows.forEach((lead) => {
      lead.assignee_profile_image = bufferToBase64(
        lead.assignee_profile_image
      );
    });
    // Fetch sub-courses for each lead with details
    const leadIds = rows.map((lead) => lead.lead_id);
    let subCoursesMap = {};
    if (leadIds.length > 0) {
      const subCoursesRes = await pool.query(
        `SELECT lsc.*, sc.sub_course_name, t.trainer_name
         FROM lead_sub_courses lsc
         LEFT JOIN sub_courses sc ON lsc.sub_course_id = sc.sub_course_id
         LEFT JOIN trainer t ON lsc.trainer_id = t.trainer_id
         WHERE lsc.lead_id = ANY($1)`,
        [leadIds]
      );
      // Group sub-courses by lead_id
      subCoursesRes.rows.forEach((sub) => {
        if (!subCoursesMap[sub.lead_id]) subCoursesMap[sub.lead_id] = [];
        subCoursesMap[sub.lead_id].push({
          id: sub.id,
          sub_course_id: sub.sub_course_id,
          sub_course_name: sub.sub_course_name,
          trainer_id: sub.trainer_id,
          trainer_name: sub.trainer_name,
          trainer_share: sub.trainer_share,
          trainer_share_amount: sub.trainer_share_amount,
          amount_paid_trainer: sub.amount_paid_trainer,
          pending_amount: sub.pending_amount,
          training_status: sub.training_status,
          training_start_date: sub.training_start_date,
          training_end_date: sub.training_end_date,
          trainer_paid: sub.trainer_paid,
        });
      });
    }
    // Attach sub_courses to each lead
    const leadsWithSubCourses = rows.map((lead) => ({
      ...lead,
      sub_courses: subCoursesMap[lead.lead_id] || [],
    }));
    return res.status(200).json(leadsWithSubCourses);
  } catch (err) {
    console.error("❌ Error fetching leads with filters:", err);
    return res
      .status(500)
      .json({ error: "Failed to fetch leads with filters." });
  }
};

// GET /api/leads/trainingprogress
exports.getTrainingProgressLeads = async (req, res) => {
  try {
    const query = `
      SELECT
        l.*,
        (l.actual_fee - l.fee_paid) AS fee_balance,
        c.course_name,
        c.course_type,
        json_build_object(
          'batch_id', b.batch_id,
          'batch_name', b.batch_name,
          'start_date', b.start_date,
          'end_date', b.end_date,
          'class_timing', b.class_timing,
          'days_of_week', b.days_of_week,
          'trainer_id', b.trainer_id
        ) AS batch,
        json_build_object(
          'trainer_id', t.trainer_id,
          'trainer_name', t.trainer_name,
          'trainer_mobile', t.trainer_mobile,
          'trainer_email', t.trainer_email
        ) AS trainer
      FROM leads l
      LEFT JOIN batch b ON l.batch_id = b.batch_id
      LEFT JOIN course c ON l.course_id = c.course_id
      LEFT JOIN trainer t ON l.trainer_id = t.trainer_id
      WHERE l.status = $1
      ORDER BY l.lead_id DESC
    `;

    const { rows } = await pool.query(query, ["trainingprogress"]);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to fetch." });
  }
};

// ======================= Delete Lead =======================
exports.deleteLead = async (req, res) => {
  const { id } = req.params;
  let { reason } = req.body ?? {};

  if (!reason || String(reason).trim() === "") {
    reason = "Deleted via API";
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const leadRes = await client.query(
      "SELECT * FROM leads WHERE lead_id = $1",
      [id]
    );
    if (!leadRes.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Lead not found." });
    }
    const lead = leadRes.rows[0];

    // Delete dependent records first to satisfy FK constraints
    await client.query(
      "DELETE FROM trainer_payouts WHERE lead_id = $1",
      [id]
    );
    await client.query(
      "DELETE FROM lead_sub_courses WHERE lead_id = $1",
      [id]
    );

    await client.query("DELETE FROM leads WHERE lead_id = $1", [id]);

    await client.query("COMMIT");

    try {
      await sendDeleteNotification(lead, reason);
    } catch (notifyError) {
      console.error("Failed to send delete notification:", notifyError);
      // Notification failures should not block successful deletion.
    }

    res.status(200).json({ message: "Lead deleted successfully." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error deleting lead:", err);
    // Provide a user-friendly message if FK constraints fail
    if (err.code === "23503") {
      return res.status(400).json({
        error:
          "Unable to delete lead because related trainer payouts or sub-course records still exist.",
      });
    }
    res.status(500).json({ error: "Failed to delete lead." });
  } finally {
    client.release();
  }
};

// ======================= Update Status Only (For Drag & Drop) =======================
exports.updateStatusLead = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required." });
  }

  try {
    // Fetch old status (optional: for notifications or logging)
    const { rowCount: existCount, rows: existRows } = await pool.query(
      "SELECT name, email, mobile_number, country_code, course_id, status FROM leads WHERE lead_id = $1",
      [id]
    );
    if (!existCount) {
      return res.status(404).json({ error: "Lead not found." });
    }
    const oldStatus = existRows[0].status;

    // Update status and updated_at only
    const { rowCount, rows } = await pool.query(
      "UPDATE leads SET status = $1, updated_at = NOW() WHERE lead_id = $2 RETURNING *",
      [status, id]
    );
    if (!rowCount) {
      return res.status(404).json({ error: "Failed to update status." });
    }

    // Send notification email if status changed
    if (oldStatus !== status) {
      // If you want to trigger notification emails here:
      const lead = existRows[0];
      const { name, email, mobile_number, country_code, course_id } = lead;
      await sendStatusUpdateEmail(
        {
          name,
          email,
          mobile_number: `${country_code}${mobile_number}`,
          course_id,
        },
        status
      );
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Error updating lead status:", err);
    res.status(500).json({ error: "Failed to update status." });
  }
};


// ======================= Get Lead by ID =======================
exports.getLeadById = async (req, res) => {
  const { lead_id } = req.params;
  try {
    // Main lead query with joins for course, batch, trainer, etc.
    const leadQuery = `
      SELECT
        leads.*,
        (leads.discounted_fee - leads.fee_paid) AS fee_balance,
        roles.name AS role,
        sources.name AS source,
        batch.batch_name,
        trainer.trainer_name,
        trainer.trainer_mobile,
        trainer.trainer_email,
        course.course_name,
        course.course_type,
        unit.unit_name,
        card_type.card_type_name,
        usr.username AS assignee_name,
        usr.mobile AS assignee_mobile,
        usr.email AS assignee_email,
        usr.profile_image AS assignee_profile_image,
        meta_campaigns.name AS meta_campaign_name
      FROM leads
      LEFT JOIN roles     ON leads.role_id      = roles.id
      LEFT JOIN sources   ON leads.source_id    = sources.id
      LEFT JOIN batch     ON leads.batch_id     = batch.batch_id
      LEFT JOIN trainer   ON leads.trainer_id   = trainer.trainer_id
      LEFT JOIN course    ON leads.course_id    = course.course_id
      LEFT JOIN unit      ON leads.unit_id      = unit.unit_id
      LEFT JOIN card_type ON leads.card_type_id = card_type.card_type_id
      LEFT JOIN users usr ON leads.user_id      = usr.user_id
      LEFT JOIN meta_campaigns ON leads.meta_campaign_id = meta_campaigns.id
      WHERE leads.lead_id = $1
      LIMIT 1
    `;
    const { rowCount, rows } = await pool.query(leadQuery, [lead_id]);
    if (!rowCount) {
      return res.status(404).json({ error: "Lead not found." });
    }
    const lead = rows[0];
    lead.assignee_profile_image = bufferToBase64(
      lead.assignee_profile_image
    );

    // Fetch sub-courses for this lead
    const subCoursesRes = await pool.query(
      `SELECT lsc.*, sc.sub_course_name, t.trainer_name
       FROM lead_sub_courses lsc
       LEFT JOIN sub_courses sc ON lsc.sub_course_id = sc.sub_course_id
       LEFT JOIN trainer t ON lsc.trainer_id = t.trainer_id
       WHERE lsc.lead_id = $1`,
      [lead_id]
    );
    lead.sub_courses = subCoursesRes.rows || [];

    // Add all important fee/payment details explicitly
    lead.actual_fee = lead.actual_fee !== undefined ? Number(lead.actual_fee) : null;
    lead.discounted_fee = lead.discounted_fee !== undefined ? Number(lead.discounted_fee) : null;
    lead.fee_paid = lead.fee_paid !== undefined ? Number(lead.fee_paid) : null;
    lead.fee_balance = lead.fee_balance !== undefined ? Number(lead.fee_balance) : null;
    lead.placement_fee = lead.placement_fee !== undefined ? Number(lead.placement_fee) : null;
    lead.placement_paid = lead.placement_paid !== undefined ? Number(lead.placement_paid) : null;
    lead.placement_balance = lead.placement_balance !== undefined ? Number(lead.placement_balance) : null;
    lead.paid_status = lead.paid_status || (lead.fee_paid === 0 ? "not paid" : (lead.fee_balance === 0 ? "paid" : "partially paid"));
    lead.placement_paid_status = lead.placement_paid_status || (lead.placement_paid === 0 ? "not paid" : (lead.placement_balance === 0 ? "paid" : "partially paid"));

    // Add any other important fields for admin validation
    lead.college_company = lead.college_company || null;
    lead.location = lead.location || null;
    lead.email = lead.email || null;
    lead.status = lead.status || null;
    lead.batch_name = lead.batch_name || null;
    lead.trainer_name = lead.trainer_name || null;
    lead.trainer_mobile = lead.trainer_mobile || null;
    lead.trainer_email = lead.trainer_email || null;
    lead.course_name = lead.course_name || null;
    lead.course_type = lead.course_type || null;
    lead.unit_name = lead.unit_name || null;
    lead.card_type_name = lead.card_type_name || null;
    lead.assignee_name = lead.assignee_name || null;
    lead.assignee_mobile = lead.assignee_mobile || null;
    lead.assignee_email = lead.assignee_email || null;
    lead.meta_campaign_name = lead.meta_campaign_name || null;

    return res.status(200).json(lead);
  } catch (err) {
    console.error("❌ Error fetching lead by ID:", err);
    return res.status(500).json({ error: "Failed to fetch lead by ID." });
  }
};

