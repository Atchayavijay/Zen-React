const pool = require("../../config/db");

// Filter leads based on the provided filters
exports.filterLeads = async (req, res) => {
  const { courseType, course, status, timePeriod, trainer, feeStatus, batch, source, assignee } = req.body;

  // Building the query based on the filters
  let query = 'SELECT * FROM leads WHERE 1=1';
  let queryParams = [];

  // Add conditions to the query based on the provided filters
  if (courseType) {
    query += ` AND course_type = $${queryParams.length + 1}`;
    queryParams.push(courseType);
  }
  if (course) {
    query += ` AND course_id = $${queryParams.length + 1}`;
    queryParams.push(course);
  }
  if (status) {
    query += ` AND status = $${queryParams.length + 1}`;
    queryParams.push(status);
  }
  if (timePeriod) {
    query += ` AND created_at >= NOW() - INTERVAL $${queryParams.length + 1}`;
    queryParams.push(timePeriod); // Ensure timePeriod is in a valid format like '7 days'
  }
  if (trainer) {
    query += ` AND trainer_id = $${queryParams.length + 1}`;
    queryParams.push(trainer);
  }
  if (feeStatus) {
    query += ` AND fee_status = $${queryParams.length + 1}`;
    queryParams.push(feeStatus);
  }
  if (batch) {
    query += ` AND batch_id = $${queryParams.length + 1}`;
    queryParams.push(batch);
  }
  if (source) {
    query += ` AND source = $${queryParams.length + 1}`;
    queryParams.push(source);
  }
  if (assignee) {
    query += ` AND assignee = $${queryParams.length + 1}`;
    queryParams.push(assignee);
  }

  try {
    // Execute the query with the parameters
    const result = await pool.query(query, queryParams); // Use parameterized query with queryParams
    res.json(result.rows); // Return the filtered leads
  } catch (error) {
    console.error('Error fetching filtered leads:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
