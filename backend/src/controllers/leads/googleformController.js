// Endpoint to handle new leads from Google Form submissions

app.post("/leads/form-submit", async (req, res) => {
    const {
      name,
      mobile_number,
      email,
      role,
      college_company,
      location,
      source,
      course_type,
      course_name,
    } = req.body;
  
    // Check for required fields
    const missingFields = [];
    if (!name) missingFields.push("Name");
    if (!mobile_number) missingFields.push("Mobile Number");
    if (!course_type || !course_name)
      missingFields.push("Course Type and Course Name");
  
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `The following fields are required: ${missingFields.join(", ")}.`,
      });
    }
  
    try {
      // Fetch the course_id based on course_type and course_name
      const courseResult = await pool.query(
        "SELECT course_id FROM course WHERE course_type = $1 AND course_name = $2",
        [course_type.trim(), course_name.trim()] // Trim to avoid spacing issues
      );
  
      if (courseResult.rows.length === 0) {
       
        return res.status(400).json({
          error: `Invalid course type or course name. Please ensure that both match entries in the course database.`,
        });
      }
  
      const course_id = courseResult.rows[0].course_id;
  
      // Insert the new lead into the leads table with the obtained course_id
      const columns = [
        "name",
        "mobile_number",
        "email",
        "role",
        "college_company",
        "location",
        "source",
        "course_id", // Use the fetched course_id
        "created_at",
      ];
      const values = [
        name,
        mobile_number,
        email || null,
        role || null,
        college_company || null,
        location || null,
        source || null,
        course_id, // Mapped course_id
        new Date(),
      ];
  
      const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
      const query = `INSERT INTO leads (${columns.join(
        ", "
      )}) VALUES (${placeholders}) RETURNING *`;
  
      const result = await pool.query(query, values);
      const lead = result.rows[0];
  
      res.status(201).json({ success: true, lead });
    } catch (err) {
      console.error("Error adding lead from form submission:", err);
      res.status(500).json({ error: "Failed to add lead" });
    }
  });
  