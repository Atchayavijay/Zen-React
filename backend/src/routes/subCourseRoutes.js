const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authMiddleware");
const subCourseController = require("../controllers/course/subCourseController");

// Sub-Course CRUD Routes
router.post("/", authenticateToken, subCourseController.addSubCourse); // Add a sub-course
router.get("/", authenticateToken, subCourseController.getSubCourses); // List sub-courses (optionally by course_id)
router.put(
  "/:sub_course_id",
  authenticateToken,
  subCourseController.updateSubCourse
); // Update a sub-course
router.delete(
  "/:sub_course_id",
  authenticateToken,
  subCourseController.deleteSubCourse
); // Delete a sub-course

module.exports = router;
