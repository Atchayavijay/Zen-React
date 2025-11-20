// controllers/sourceController.js
const pool = require("../../config/db");

// GET /api/sources
exports.getSources = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name FROM sources ORDER BY name"
    );
    return res.json(rows);
  } catch (err) {
    console.error("Error fetching sources:", err);
    return res.status(500).json({ error: "Failed to fetch sources" });
  }
};

// POST /api/sources
exports.createSource = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Source name is required" });
    }
    const { rows } = await pool.query(
      "INSERT INTO sources (name) VALUES ($1) RETURNING id, name",
      [name]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error creating source:", err);
    if (err.code === "23505") {
      return res.status(409).json({ error: "Source already exists" });
    }
    return res.status(500).json({ error: "Failed to create source" });
  }
};

// PUT /api/sources/:id
exports.updateSource = async (req, res) => {
  try {
    const { id }   = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Source name is required" });
    }
    const { rows } = await pool.query(
      "UPDATE sources SET name = $1, updated_at = now() WHERE id = $2 RETURNING id, name",
      [name, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Source not found" });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error("Error updating source:", err);
    if (err.code === "23505") {
      return res.status(409).json({ error: "Source name conflicts with existing" });
    }
    return res.status(500).json({ error: "Failed to update source" });
  }
};

// DELETE /api/sources/:id
exports.deleteSource = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM sources WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Source not found" });
    }
    return res.status(204).end();
  } catch (err) {
    console.error("Error deleting source:", err);
    return res.status(500).json({ error: "Failed to delete source" });
  }
};
