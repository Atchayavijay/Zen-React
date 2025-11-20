/**
 * Function to generate a unique enrollment ID
 * @returns {string} A unique enrollment ID
 */
function generateEnrollmentID() {
  return "ENR" + Date.now().toString(36).toUpperCase();
}

module.exports = {
  generateEnrollmentID,
};
