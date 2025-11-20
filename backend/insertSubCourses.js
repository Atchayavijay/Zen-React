const pool = require("./src/config/db");

async function insertSubCourses() {
  try {
    // First, get all existing courses to map course names to IDs
    const coursesResult = await pool.query(
      "SELECT course_id, course_name FROM course ORDER BY course_name"
    );
    const courses = coursesResult.rows;

    console.log("Available courses:");
    courses.forEach((course) => {
      console.log(`- ${course.course_name} (ID: ${course.course_id})`);
    });

    // Define sub-courses for different course types
    const subCoursesData = [
      // Data Analytics related sub-courses
      {
        courseNames: ["Data Analytics", "Data Science", "Business Analytics"],
        subCourses: [
          "Python Fundamentals",
          "SQL and Database Management",
          "Data Visualization with PowerBI",
          "Statistical Analysis",
          "Machine Learning Basics",
          "Excel Advanced",
          "Tableau Dashboard",
          "R Programming",
        ],
      },

      // DevOps related sub-courses
      {
        courseNames: ["DevOps", "Cloud Computing", "AWS"],
        subCourses: [
          "Linux Fundamentals",
          "Docker Containerization",
          "Kubernetes Orchestration",
          "CI/CD Pipeline",
          "AWS Cloud Services",
          "Monitoring and Logging",
          "Terraform Infrastructure",
          "Jenkins Automation",
        ],
      },

      // Development related sub-courses
      {
        courseNames: [
          "Full Stack",
          "Web Development",
          "JavaScript",
          "Node.js",
          "React",
        ],
        subCourses: [
          "HTML/CSS Fundamentals",
          "JavaScript ES6+",
          "React.js Framework",
          "Node.js Backend",
          "Database Design",
          "API Development",
          "MongoDB Integration",
          "Authentication & Security",
        ],
      },

      // Python related sub-courses
      {
        courseNames: ["Python", "Django", "Flask"],
        subCourses: [
          "Python Basics",
          "Object Oriented Programming",
          "Web Scraping",
          "Django Framework",
          "Flask Microframework",
          "API Integration",
          "Database ORM",
          "Testing and Debugging",
        ],
      },

      // Digital Marketing related sub-courses
      {
        courseNames: ["Digital Marketing", "SEO", "Social Media"],
        subCourses: [
          "SEO Optimization",
          "Social Media Marketing",
          "Google Ads",
          "Content Marketing",
          "Email Marketing",
          "Analytics and Reporting",
          "PPC Campaigns",
          "Conversion Optimization",
        ],
      },

      // Mobile Development related sub-courses
      {
        courseNames: ["Mobile Development", "Android", "iOS", "Flutter"],
        subCourses: [
          "Mobile UI/UX Design",
          "Native Android Development",
          "React Native Framework",
          "Flutter Development",
          "Mobile Database",
          "Push Notifications",
          "App Store Deployment",
          "Mobile Testing",
        ],
      },
    ];

    let insertedCount = 0;

    for (const courseGroup of subCoursesData) {
      // Find matching courses for this group
      const matchingCourses = courses.filter((course) =>
        courseGroup.courseNames.some((courseName) =>
          course.course_name.toLowerCase().includes(courseName.toLowerCase())
        )
      );

      for (const course of matchingCourses) {
        console.log(`\nInserting sub-courses for: ${course.course_name}`);

        for (const subCourseName of courseGroup.subCourses) {
          try {
            // Check if sub-course already exists
            const existingCheck = await pool.query(
              "SELECT sub_course_id FROM sub_courses WHERE course_id = $1 AND sub_course_name = $2",
              [course.course_id, subCourseName]
            );

            if (existingCheck.rows.length === 0) {
              await pool.query(
                "INSERT INTO sub_courses (course_id, sub_course_name) VALUES ($1, $2)",
                [course.course_id, subCourseName]
              );
              console.log(`  ✓ Added: ${subCourseName}`);
              insertedCount++;
            } else {
              console.log(`  - Skipped: ${subCourseName} (already exists)`);
            }
          } catch (error) {
            console.log(`  ✗ Error adding ${subCourseName}:`, error.message);
          }
        }
      }
    }

    console.log(`\n✅ Successfully inserted ${insertedCount} sub-courses!`);

    // Show final count
    const totalResult = await pool.query(
      "SELECT COUNT(*) as count FROM sub_courses"
    );
    console.log(`Total sub-courses in database: ${totalResult.rows[0].count}`);
  } catch (error) {
    console.error("Error inserting sub-courses:", error);
  } finally {
    await pool.end();
  }
}

insertSubCourses();
