const pool = require("../../config/db");
const { generateCourseId } = require("../../utils/generateCourseId");

// ================== Add a New Course ==================
exports.addCourse = async (req, res, next) => {
  try {
    const { course_name, course_type } = req.body;
    if (!course_name || !course_type) {
      return res
        .status(400)
        .json({ success: false, error: "Course name and type are required." });
    }

    const course_id = await generateCourseId(course_name);
    const result = await pool.query(
      "INSERT INTO course (course_id, course_name, course_type) VALUES ($1, $2, $3) RETURNING *",
      [course_id, course_name, course_type]
    );

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error adding course:", error.message);
    return next(error);
  }
};

// ================== Get All Courses (or by Course Type) ==================
// Get Courses with Filters
exports.getCourses = async (req, res) => {
  try {
    let query = `
      SELECT DISTINCT course_id, course_type, course_name 
      FROM course
      WHERE 1=1
    `;
    let queryParams = [];
    let index = 1;

    // Apply `course_type` filter if provided
    if (req.query.course_type) {
      query += ` AND LOWER(course_type) = LOWER($${index++})`;
      queryParams.push(req.query.course_type);
    }

    // Apply `course_id` filter if provided
    if (req.query.course_id) {
      query += ` AND course_id = $${index++}`;
      queryParams.push(req.query.course_id);
    }

    // Order results
    query += ` ORDER BY course_type, course_name`;

    

    const { rows } = await pool.query(query, queryParams);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Internal server error while fetching courses" });
  } 
};

// ================== Update a Course ==================
exports.updateCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { course_name, course_type } = req.body;

    if (!courseId || (!course_name && !course_type)) {
      return res.status(400).json({
        success: false,
        error: "Course ID and at least one field are required.",
      });
    }

    const existing = await pool.query(
      "SELECT * FROM course WHERE course_id = $1",
      [courseId]
    );
    if (existing.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Course not found." });
    }

    const updatedCourse = await pool.query(
      "UPDATE course SET course_name = COALESCE($1, course_name), course_type = COALESCE($2, course_type) WHERE course_id = $3 RETURNING *",
      [course_name, course_type, courseId]
    );

    return res
      .status(200)
      .json({ success: true, updatedCourse: updatedCourse.rows[0] });
  } catch (error) {
    console.error("Error updating course:", error.message);
    return next(error);
  }
};

// ================== Delete a Course ==================
exports.deleteCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    if (!courseId) {
      return res
        .status(400)
        .json({ success: false, error: "Course ID is required for deletion." });
    }

    const result = await pool.query(
      "DELETE FROM course WHERE course_id = $1 RETURNING *",
      [courseId]
    );
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Course not found." });
    }

    return res
      .status(200)
      .json({ success: true, deletedCourse: result.rows[0] });
  } catch (error) {
    console.error("Error deleting course:", error.message);
    return next(error);
  }
};

// ✅ Controller to Fetch Filtered Courses
exports.getFilteredCourses = async (req, res) => {
  try {
    const { course_type, course_id } = req.query;

    let query = `SELECT course_id, course_type, course_name FROM course WHERE 1=1`;
    let queryParams = [];

    if (course_type) {
      query += ` AND LOWER(course_type) = LOWER($${queryParams.length + 1})`;
      queryParams.push(course_type);
    }

    if (course_id) {
      query += ` AND course_id = $${queryParams.length + 1}`;
      queryParams.push(course_id);
    }

    query += ` ORDER BY course_type, course_name`;
    
    const { rows } = await pool.query(query, queryParams);
    res.status(200).json({ success: true, courses: rows });
  } catch (error) {
    console.error("❌ Error filtering courses:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};