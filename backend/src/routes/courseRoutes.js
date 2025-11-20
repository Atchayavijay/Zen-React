const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authMiddleware");
const courseController = require("../controllers/course/courseController");
const apiKeyMiddleware = require("../middlewares/apikey");

// Course Routes
router.post("/", authenticateToken, courseController.addCourse); // Add a new course
router.get("/", authenticateToken, courseController.getCourses); // Get all courses (or filter by type)
router.put("/:courseId", authenticateToken, courseController.updateCourse); // Update a course
router.delete("/:courseId", authenticateToken, courseController.deleteCourse); // Delete a course by ID
router.get("/filter/courses", courseController.getFilteredCourses);

router.get("/progz", apiKeyMiddleware, courseController.getCourses);

module.exports = router;
