const pool = require("../../config/db");
const { createObjectCsvWriter } = require("csv-writer");
const path = require("path");
const fs = require("fs/promises"); // Use promise-based fs

exports.exportLeads = async (req, res) => {
  try {
    // Query the database
    const result = await pool.query(`
      SELECT leads.*, 
             batch.batch_name,
             batch.class_timing,
             batch.days_of_week,
             trainer.trainer_name, 
             trainer.trainer_mobile, 
             trainer.trainer_email,
             course.course_name,
             course.course_type
      FROM leads
      LEFT JOIN batch ON leads.batch_id = batch.batch_id
      LEFT JOIN trainer ON leads.trainer_id = trainer.trainer_id
      LEFT JOIN course ON leads.course_id = course.course_id
    `);

    const leads = result.rows;

    // Create temporary directory
    const tempDir = path.join(__dirname, "../../temp");
    await fs.mkdir(tempDir, { recursive: true }); // Ensure temp directory exists

    const tempFilePath = path.join(tempDir, `leads_${Date.now()}.csv`);

    // Write CSV file
    const csvWriter = createObjectCsvWriter({
      path: tempFilePath,
      header: [
        { id: "enrollment_id", title: "Enrollment ID" },
        { id: "name", title: "Name" },
        { id: "mobile_number", title: "Mobile Number" },
        { id: "email", title: "Email" },
        { id: "role", title: "Role" },
        { id: "college_company", title: "College/Company" },
        { id: "location", title: "Location" },
        { id: "source", title: "Source" },
        { id: "course_type", title: "Course Type" },
        { id: "course_name", title: "Course Name" },
        { id: "batch_name", title: "Batch Name" },
        { id: "class_timing", title: "Timing" },
        { id: "days_of_week", title: "Days" },
        { id: "trainer_name", title: "Trainer Name" },
        { id: "trainer_mobile", title: "Trainer Mobile" },
        { id: "trainer_email", title: "Trainer Email" },
        { id: "actual_fee", title: "Actual Fee" },
        { id: "discounted_fee", title: "Discounted Fee" },
        { id: "fee_paid", title: "Fee Paid" },
        { id: "fee_balance", title: "Fee Balance" },
        { id: "status", title: "Status" },
        { id: "paid_status", title: "Paid Status" },
        { id: "created_at", title: "Created At" },
        { id: "updated_at", title: "Updated At" },
      ],
    });

    await csvWriter.writeRecords(leads); // Write data to CSV

    // Download the file
    res.download(tempFilePath, "leads.csv", async (err) => {
      if (err) {
        console.error("Error during file download:", err.message);
        res.status(500).send("Error downloading the file.");
      }

      // Cleanup file after download
      try {
        await fs.unlink(tempFilePath);
      } catch (unlinkErr) {
        console.error("Error cleaning up file:", unlinkErr.message);
      }
    });
  } catch (err) {
    console.error("Error exporting leads:", err.message);
    res.status(500).json({ error: "Failed to export leads" });
  }
};
