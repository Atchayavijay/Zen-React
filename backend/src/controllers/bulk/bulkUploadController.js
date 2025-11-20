const fs = require("fs");
const csv = require("csv-parser");
const pool = require("../../config/db");
const format = require("pg-format");
const { generateEnrollmentID } = require("../../utils/generateEnrollmentID");

exports.bulkUploadLeads = async (req, res) => {
  const filePath = req.file.path;
  const leads = [];
  const errors = [];

  const allowedStatuses = new Set([
    "enquiry",
    "prospect",
    "enrollment",
    "trainingprogress",
    "handsonproject",
    "certification",
    "cvbuild",
    "mockinterviews",
    "liveinterviews",
    "placement",
    "placementdue",
    "placementpaid",
    "finishers",
    "onhold",
    "archived",
    "completed",
  ]);

  const statusesWithoutEnrollmentID = new Set([
    "enquiry",
    "prospect",
    "onhold",
    "archived",
  ]);

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  try {
    let data = fs.readFileSync(filePath, "utf8");
    if (data.charCodeAt(0) === 0xfeff) data = data.slice(1); // Remove BOM

    const stream = require("stream");
    const readableStream = new stream.Readable();
    readableStream.push(data);
    readableStream.push(null);

    let rowNumber = 1;
    const rows = [];

    readableStream
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.trim().toLowerCase(),
          mapValues: ({ value }) => value.trim(),
        })
      )
      .on("headers", (headers) => {
       
        const requiredFields = [
          "name",
          "mobile_number",
          "course_id",
          "status",
          "unit_id",
          "card_type_id",
        ];
        for (const field of requiredFields) {
          if (!headers.includes(field)) {
            const errMsg = `Missing required field: '${field}'`;
            console.error("Header Error:", errMsg);
            return res.status(400).json({ error: errMsg });
          }
        }
      })
      .on("data", (row) => {
        rowNumber++;
        rows.push({ ...row, rowNumber });
      })
      .on("end", async () => {
      

        for (const rowObj of rows) {
          const {
            name,
            country_code = "+91",
            mobile_number,
            email,
            role_id,
            college_company,
            location,
            source_id,
            course_id,
            batch_id,
            trainer_id,
            actual_fee,
            discounted_fee,
            fee_paid,
            status = "enquiry",
            paid_status,
            user_id,
            unit_id,
            card_type_id,
            rowNumber,
          } = rowObj;

        

          const normalizedStatus = status.toLowerCase().replace(/\s+/g, "");
          let rowErrors = [];

          if (!name) rowErrors.push("'name' is required.");
          if (!mobile_number) rowErrors.push("'mobile_number' is required.");
          if (!course_id) rowErrors.push("'course_id' is required.");
          if (!status) rowErrors.push("'status' is required.");
          if (!unit_id || !uuidRegex.test(unit_id))
            rowErrors.push(`Invalid or missing 'unit_id': ${unit_id}`);
          if (!card_type_id || !uuidRegex.test(card_type_id))
            rowErrors.push(
              `Invalid or missing 'card_type_id': ${card_type_id}`
            );
          if (!allowedStatuses.has(normalizedStatus))
            rowErrors.push(`Invalid status '${status}'`);

          // DB validations
          if (source_id) {
            const sourceRes = await pool.query(
              "SELECT id FROM sources WHERE id = $1",
              [source_id]
            );
            if (!sourceRes.rowCount)
              rowErrors.push(`Invalid source_id '${source_id}'`);
          }

          if (role_id) {
            const roleRes = await pool.query(
              "SELECT id FROM roles WHERE id = $1",
              [role_id]
            );
            if (!roleRes.rowCount)
              rowErrors.push(`Invalid role_id '${role_id}'`);
          }

          if (rowErrors.length > 0) {
            const errorMessage = `Line ${rowNumber}: ${rowErrors.join(", ")}`;
            errors.push(errorMessage);
            
            continue;
          }

          // Prepare row for insertion
          const f_actual_fee = actual_fee ? parseFloat(actual_fee) : 0;
          const f_discounted_fee = discounted_fee
            ? parseFloat(discounted_fee)
            : 0;
          const f_fee_paid = fee_paid ? parseFloat(fee_paid) : 0;
          const balance = f_discounted_fee - f_fee_paid;

          let final_paid_status =
            paid_status ||
            (f_fee_paid === 0
              ? "not paid"
              : balance === 0
              ? "paid"
              : "partially paid");

          const enrollment_id = !statusesWithoutEnrollmentID.has(
            normalizedStatus
          )
            ? generateEnrollmentID()
            : null;

          leads.push([
            name,
            country_code,
            mobile_number,
            email || null,
            role_id || null,
            college_company || null,
            location || null,
            source_id || null,
            course_id,
            batch_id || null,
            trainer_id || null,
            f_actual_fee,
            f_discounted_fee,
            f_fee_paid,
            normalizedStatus,
            final_paid_status,
            user_id || null,
            unit_id,
            card_type_id,
            enrollment_id,
            new Date(),
          ]);

         
        }

        fs.unlinkSync(filePath);

       

        if (errors.length > 0) {
          return res.status(400).json({
            error: "Validation errors in CSV",
            issues: errors,
          });
        }

        if (!leads.length) {
          return res.status(400).json({ error: "No valid leads to upload." });
        }

        const insertQuery = format(
          `
          INSERT INTO leads (
            name, country_code, mobile_number, email, role_id,
            college_company, location, source_id, course_id,
            batch_id, trainer_id, actual_fee, discounted_fee, fee_paid,
            status, paid_status, user_id, unit_id, card_type_id,
            enrollment_id, created_at
          ) VALUES %L RETURNING *
        `,
          leads
        );

        try {
          const result = await pool.query(insertQuery);
         
          return res.status(200).json({
            message: `${result.rowCount} leads uploaded successfully.`,
          });
        } catch (dbErr) {
          console.error("Database Insertion Error:", dbErr.message);
          return res.status(500).json({
            error: "Failed to insert leads into database",
            details: dbErr.message,
          });
        }
      });
  } catch (err) {
    console.error("Unexpected Server Error:", err.message);
    return res.status(500).json({
      error: "Unexpected server error during bulk upload.",
    });
  }
};
