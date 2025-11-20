const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authMiddleware");
const commentController = require("../controllers/comment/commentController.js");

router.post(
  "/leads/:lead_id/comments",
  authenticateToken,
  commentController.createComment
);
router.get(
  "/leads/:lead_id/comments",
  authenticateToken,
  commentController.getComment
);
router.delete(
  "/comments/:comment_id",
  authenticateToken,
  commentController.deleteComment
);
router.put(
  "/comments/:comment_id",
  authenticateToken,
  commentController.editComment
);

module.exports = router;
