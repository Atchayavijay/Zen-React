const pool = require("../config/db"); // Ensure you import the pool object for database connection


/**
 * Function to generate a unique course ID in the format 'CRS-XXX-000'
 * @param {string} course_name - The name of the course (e.g., Python for Beginners)
 * @returns {Promise<string>} - The newly generated course ID
 */
async function generateCourseId(course_name) {
  // Extract the first 3 uppercase letters from the course name
  const courseCode = course_name.toUpperCase().substring(0, 3);

  try {
    // Query the database for the latest course_id with the matching prefix
    const result = await pool.query(
      "SELECT course_id FROM course WHERE course_id LIKE $1 ORDER BY course_id DESC LIMIT 1",
      [`CRS-${courseCode}-%`]
    );

    let count = 1; // Default to 1 if no course ID exists

    if (result.rows.length > 0) {
      // Extract the sequence number from the latest course ID
      const lastCourseId = result.rows[0].course_id;
      const lastSequence = parseInt(lastCourseId.split("-")[2], 10);
      count = lastSequence + 1;
    }

    // Format the sequence number to 3 digits (e.g., '001', '012')
    const sequenceNumber = count.toString().padStart(3, "0");

    // Construct the final course ID
    const newCourseId = `CRS-${courseCode}-${sequenceNumber}`;

    return newCourseId;
  } catch (err) {
    console.error("Error generating course ID:", err.message);
    throw new Error("Failed to generate course ID");
  }
}

module.exports = { generateCourseId };
