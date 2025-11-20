const express = require("express");
const router = express.Router();
const multer = require("multer");
const assigneeController = require("../controllers/assignee/assigneeController");
const { authenticateToken } = require("../middlewares/authMiddleware");

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ==================== Protected Assignee Routes ====================

// CREATE Assignee (Protected)
router.post(
  "/",
  authenticateToken,
  upload.single("profile_image"),
  assigneeController.createAssignee
);

// GET all Assignees (Protected)
router.get("/", authenticateToken, assigneeController.getAllAssignees);

// GET Assignee Profile Image (Public or Protected — your choice)
router.get("/:id/image", assigneeController.getAssigneeImage); // Optional: add auth here

// UPDATE Assignee (Protected)
router.put(
  "/:id",
  authenticateToken,
  upload.single("profile_image"),
  assigneeController.updateAssignee
);

// DELETE Assignee (Protected)
router.delete("/:id", authenticateToken, assigneeController.deleteAssignee);

module.exports = router;
