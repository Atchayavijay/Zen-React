const pool = require("../../config/db");

// ================== Add a Sub-Course ==================
exports.addSubCourse = async (req, res) => {
  try {
    const {
      course_id,
      sub_course_name,
      sub_course_description,
      duration_hours,
    } = req.body;
    if (!course_id || !sub_course_name) {
      return res
        .status(400)
        .json({ error: "course_id and sub_course_name are required." });
    }
    const result = await pool.query(
      "INSERT INTO sub_courses (course_id, sub_course_name, sub_course_description, duration_hours) VALUES ($1, $2, $3, $4) RETURNING *",
      [
        course_id,
        sub_course_name,
        sub_course_description || null,
        duration_hours || null,
      ]
    );
    res.status(201).json({ success: true, sub_course: result.rows[0] });
  } catch (error) {
    console.error("Error adding sub-course:", error);
    res.status(500).json({ error: "Failed to add sub-course." });
  }
};

// ================== Get Sub-Courses (by course_id or all) ==================
exports.getSubCourses = async (req, res) => {
  try {
    const { course_id } = req.query;
    let query = `
      SELECT 
        sc.sub_course_id,
        sc.course_id,
        sc.sub_course_name,
        sc.sub_course_description,
        sc.duration_hours,
        sc.created_at,
        sc.updated_at,
        c.course_name,
        c.course_type
      FROM sub_courses sc
      LEFT JOIN course c ON sc.course_id = c.course_id
    `;
    let params = [];
    if (course_id) {
      query += " WHERE sc.course_id = $1";
      params.push(course_id);
    }
    query += " ORDER BY sc.sub_course_name";
    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching sub-courses:", error);
    res.status(500).json({ error: "Failed to fetch sub-courses." });
  }
};

// ================== Update a Sub-Course ==================
exports.updateSubCourse = async (req, res) => {
  try {
    const { sub_course_id } = req.params;
    const {
      sub_course_name,
      course_id,
      sub_course_description,
      duration_hours,
    } = req.body;

    if (!sub_course_id) {
      return res.status(400).json({ error: "sub_course_id is required." });
    }

    // Build dynamic update query based on provided fields
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (sub_course_name !== undefined) {
      updateFields.push(`sub_course_name = $${paramIndex++}`);
      values.push(sub_course_name);
    }

    if (course_id !== undefined) {
      updateFields.push(`course_id = $${paramIndex++}`);
      values.push(course_id);
    }

    if (sub_course_description !== undefined) {
      updateFields.push(`sub_course_description = $${paramIndex++}`);
      values.push(sub_course_description || null);
    }

    if (duration_hours !== undefined) {
      updateFields.push(`duration_hours = $${paramIndex++}`);
      values.push(duration_hours || null);
    }

    if (updateFields.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one field to update is required." });
    }

    values.push(sub_course_id);
    const query = `UPDATE sub_courses SET ${updateFields.join(
      ", "
    )} WHERE sub_course_id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Sub-course not found." });
    }

    res.status(200).json({ success: true, sub_course: result.rows[0] });
  } catch (error) {
    console.error("Error updating sub-course:", error);
    res.status(500).json({ error: "Failed to update sub-course." });
  }
};

// ================== Delete a Sub-Course ==================
exports.deleteSubCourse = async (req, res) => {
  try {
    const { sub_course_id } = req.params;
    if (!sub_course_id) {
      return res.status(400).json({ error: "sub_course_id is required." });
    }

    // Check if sub-course is being used in lead_sub_courses
    const usageCheck = await pool.query(
      "SELECT COUNT(*) as count FROM lead_sub_courses WHERE sub_course_id = $1",
      [sub_course_id]
    );

    if (parseInt(usageCheck.rows[0].count) > 0) {
      return res.status(400).json({
        error: "Cannot delete sub-course",
        message:
          "This sub-course is currently assigned to one or more students. Please remove those assignments before deleting.",
        in_use: true,
        usage_count: parseInt(usageCheck.rows[0].count),
      });
    }

    const result = await pool.query(
      "DELETE FROM sub_courses WHERE sub_course_id = $1 RETURNING *",
      [sub_course_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Sub-course not found." });
    }

    res
      .status(200)
      .json({ success: true, message: "Sub-course deleted successfully." });
  } catch (error) {
    console.error("Error deleting sub-course:", error);

    // Check if it's a foreign key constraint error
    if (error.code === "23503") {
      return res.status(400).json({
        error: "Cannot delete sub-course",
        message:
          "This sub-course is currently in use and cannot be deleted. Please remove all related records first.",
        in_use: true,
      });
    }

    res.status(500).json({ error: "Failed to delete sub-course." });
  }
};
