const pool = require("../../config/db");
exports.getUnits = async (req, res) => {
    try {
      const result = await pool.query("SELECT unit_id, unit_name FROM unit ORDER BY unit_name ASC");
      res.status(200).json(result.rows);
    } catch (err) {
      console.error("Error fetching units:", err);
      res.status(500).json({ error: "Failed to fetch units" });
    }
  };
  