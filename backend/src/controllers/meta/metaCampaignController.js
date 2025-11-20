// Meta Campaign Controller
const db = require("../../config/db");

// Get all meta campaigns (include lead_count)
exports.getAllMetaCampaigns = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, description, total_budget, start_date, end_date, status, lead_count FROM meta_campaigns ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching meta campaigns:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch meta campaigns", details: err.message });
  }
};

// Get a single meta campaign by ID (include lead_count)
exports.getMetaCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      "SELECT id, name, description, total_budget, start_date, end_date, status, lead_count FROM meta_campaigns WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Meta campaign not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch meta campaign", details: err.message });
  }
};

// Create a new meta campaign (include lead_count)
exports.createMetaCampaign = async (req, res) => {
  try {
    const {
      name,
      description,
      total_budget,
      start_date,
      end_date,
      status,
      lead_count,
    } = req.body;
    const result = await db.query(
      "INSERT INTO meta_campaigns (name, description, total_budget, start_date, end_date, status, lead_count) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        name,
        description,
        total_budget,
        start_date,
        end_date,
        status,
        lead_count,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating meta campaign:", err);
    res
      .status(500)
      .json({ error: "Failed to create meta campaign", details: err.message });
  }
};

// Update a meta campaign (include lead_count)
exports.updateMetaCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      total_budget,
      start_date,
      end_date,
      status,
      lead_count,
    } = req.body;
    const result = await db.query(
      "UPDATE meta_campaigns SET name = $1, description = $2, total_budget = $3, start_date = $4, end_date = $5, status = $6, lead_count = $7 WHERE id = $8 RETURNING *",
      [
        name,
        description,
        total_budget,
        start_date,
        end_date,
        status,
        lead_count,
        id,
      ]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Meta campaign not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update meta campaign", details: err.message });
  }
};

// Delete a meta campaign
exports.deleteMetaCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      "DELETE FROM meta_campaigns WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Meta campaign not found" });
    res.json({ message: "Meta campaign deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to delete meta campaign", details: err.message });
  }
};
