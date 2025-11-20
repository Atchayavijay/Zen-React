const pool = require("../../config/db");

exports.getCardTypes = async (req, res) => {
    try {
      const result = await pool.query("SELECT card_type_id, card_type_name FROM card_type ORDER BY card_type_name ASC");
      res.status(200).json(result.rows);
    } catch (err) {
      console.error("Error fetching card types:", err);
      res.status(500).json({ error: "Failed to fetch card types" });
    }
  };
  