const pool = require("../../config/db");

// Add a comment to a specific lead
exports.createComment= async (req, res) => {
  const { lead_id } = req.params;
  const { comment_text } = req.body;
  const created_by = req.user.username; 

  if (!comment_text) {
    return res.status(400).json({ error: "Comment text is required." });
  }

  try {
    const query = `
      INSERT INTO comments (lead_id, comment_text, created_by) 
      VALUES ($1, $2, $3) 
      RETURNING *`;
    const values = [lead_id, comment_text, created_by];

    const result = await pool.query(query, values);
    res.status(201).json({ success: true, comment: result.rows[0] });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ error: "Failed to add comment" });
  }
};

// Get all comments for a specific lead
exports.getComment= async (req, res) => {
  const { lead_id } = req.params;

  try {
    const query = `
      SELECT comment_id, comment_text, created_at, created_by 
      FROM comments 
      WHERE lead_id = $1 
      ORDER BY created_at DESC`;
    const result = await pool.query(query, [lead_id]);
    res.status(200).json({ success: true, comments: result.rows });
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

// Edit a specific comment
exports.editComment= async (req, res) => {
  const { comment_id } = req.params;
  const { comment_text } = req.body;

  if (!comment_text) {
    return res.status(400).json({ error: "Comment text is required." });
  }

  try {
    const query = `
      UPDATE comments 
      SET comment_text = $1, created_at = NOW() 
      WHERE comment_id = $2 
      RETURNING *`;
    const result = await pool.query(query, [comment_text, comment_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found." });
    }

    res.status(200).json({ success: true, comment: result.rows[0] });
  } catch (err) {
    console.error("Error updating comment:", err);
    res.status(500).json({ error: "Failed to update comment" });
  }
};

// Delete a specific comment
exports.deleteComment= async (req, res) => {
  const { comment_id } = req.params;

  try {
    const query = `DELETE FROM comments WHERE comment_id = $1 RETURNING *`;
    const result = await pool.query(query, [comment_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found." });
    }

    res.status(200).json({ success: true, message: "Comment deleted." });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

