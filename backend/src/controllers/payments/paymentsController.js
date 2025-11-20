const pool = require("../../config/db"); // PostgreSQL connection pool

// Fetch Payment Insights (excluding 'enquiry' and 'prospect')
exports.getPayments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        lead_id, 
        name, 
        course_id, 
        actual_fee AS "formatted_actual_fee", 
        discounted_fee AS "formatted_discounted_fee", 
        fee_paid AS "formatted_fee_paid", 
        status, 
        paid_status,
        created_at  -- ✅ Add this line to include created_at
      FROM leads
      WHERE status NOT IN ('enquiry', 'prospect','archived','onhold')
    `);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, error: "No payment-related data found" });
    }

    res.status(200).json({ success: true, payments: result.rows });
  } catch (err) {
    console.error("Error fetching payment insights:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch payment insights" });
  }
};
