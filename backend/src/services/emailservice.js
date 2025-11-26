const { sendEmail } = require("./gmailService");
const fetch = require("node-fetch");
const pool = require("../config/db");
const { Parser } = require("json2csv");
// Admin email address
const adminEmail = "admi@urbancode.in";

const isValidLead = (lead, fields = ["email", "name", "course_name"]) => {
  return fields.every((field) => lead?.[field]);
};

const safeSendEmail = async (options) => {
  if (!options?.to) {
    console.error("❌ Email not sent: Missing recipient.");
    return;
  }

  try {
    await sendEmail(options);
  } catch (err) {
    console.error(`❌ Failed to send email to ${options.to}:`, err.message);
  }
};

// Function to create the HTML Email Template with dynamic header and content
const createEmailTemplate = (headerText, content) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${headerText}</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
      <style>
        body, table, td {
          font-family: "Poppins", Arial, sans-serif;
          color: #333;
          margin: 0;
          padding: 0;
          background-image: url("https://postimg.cc/Th4Bdtw8");
          background-size: cover;
          background-repeat: no-repeat;
          background-color: #f7f7f7;
        }
        .container { width: 100%; padding: 20px; }
        .email-body {
          max-width: 600px;
          margin: auto;
          background-color: rgba(255, 255, 255, 0.9);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          background-color: #1ab79d;
          color: #ffffff;
          padding: 20px;
          text-align: center;
        }
        .header-logo-background {
          background-color: #E5E7EB !important;
          padding: 15px 20px;
          width: fit-content;
          max-width: 200px;
          margin: 0 auto 15px auto;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header img { max-width: 150px; height: auto; display: block; }
        .header h1 {
          margin: 0;
          padding: 10px 0; /* Adjust top and bottom padding for spacing */
          font-size: 24px;
          color: #ffffff;
        }
        .content { padding: 20px; line-height: 1.6; }
        .content h2 { color: #1ab79d; font-size: 20px; }
        .cta-button {
          display: inline-block;
          margin: 20px 0;
          padding: 10px 20px;
          background-color: #1ab79d;
          color: #ffffff;
          text-decoration: none;
          border-radius: 5px;
          font-weight: 600;
        }
        .footer {
          background-color: #1ab79d;
          padding: 20px;
          text-align: center;
          font-size: 14px;
          color: #ffffff;
        }
        .footer a { color: #ffffff; text-decoration: underline; }
        .social-icons { margin-top: 10px; }
        .social-icons img {
          width: 24px;
          height: 24px;
          margin: 0 8px;
          vertical-align: middle;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <table class="email-body" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td class="header">
              <div class="header-logo-background ">
                <img src="https://www.urbancode.in/images/home/logo.png" alt="Urbancode Logo" />
                
              </div>
              <h1>${headerText}</h1>
            </td>
          </tr>
          <tr>
            <td class="content">${content}</td>
          </tr>
          <tr>
            <td class="footer">
              <p>
                ✉️ If you have any questions, feel free to reach out to our support team at
                <a href="mailto:admin@urbancode.in">admin@urbancode.in</a>
              </p>
              <div class="social-icons">
                <a href="https://in.linkedin.com/company/urbanc0de" target="_blank">
                  <img src="https://img.icons8.com/color/48/000000/linkedin.png" alt="LinkedIn" />
                </a>
                <a href="https://www.facebook.com/urbancode.in/" target="_blank">
                  <img src="https://img.icons8.com/color/48/000000/facebook-new.png" alt="Facebook" />
                </a>
                <a href="https://www.instagram.com/_urbancode/" target="_blank">
                  <img src="https://img.icons8.com/color/48/000000/instagram-new.png" alt="Instagram" />
                </a>
              </div>
              <p>Copyright © 2024 UrbanCode. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </div>
    </body>
  </html>
`;

// Function to get course name using course_id
async function getCourseName(course_id) {
  const result = await pool.query(
    "SELECT course_name FROM course WHERE course_id = $1",
    [course_id]
  );
  return result.rows[0] ? result.rows[0].course_name : "your selected course"; // Default if not found
}

// Function to send Welcome Email to Lead & Notification Email to Admin
async function sendWelcomeEmail(lead) {
  if (!isValidLead(lead)) {
    console.warn("⚠️ Skipping welcome email: lead data incomplete", lead);
    return;
  }
  const leadContent = `
    <tr>
      <td class="content">
        <h2>🤝 Thank You for Inquiring About the <strong>${lead.course_name}</strong> Course!</h2>
        <p>We are truly grateful that you've chosen Urbancode to explore your learning journey. Thank you for your interest in the <strong>${lead.course_name}</strong> course! We are excited about the possibilities ahead and thrilled to have you in our community.</p>
        <p>At Urbancode, our goal is to provide you with a transformative and supportive learning experience. Every lesson and project is designed to not only teach but to inspire and empower you to take control of your future.</p>
        <p>Whether it's gaining new skills, collaborating with like-minded peers, or tackling real-world challenges, we are here to support you every step of the way. We can’t wait for you to dive in and make incredible progress!</p>
      </td>
    </tr>
    <!-- What to Expect -->
    <tr>
      <td class="content">
        <h2>Here's What You Can Expect:</h2>
        <ul style="padding-left: 20px; margin: 10px 0">
          <li>👨‍🏫 <strong>Expert Guidance:</strong> Learn from seasoned professionals who are dedicated to your success.</li>
          <li>💪 <strong>Hands-On Projects:</strong> Engage in real-world projects that boost your confidence and help you master new skills.</li>
          <li>🤝 <strong>Supportive Community:</strong> Connect with peers and get the support you need to excel.</li>
        </ul>
      </td>
    </tr>
    <!-- Call to Action -->
    <tr>
      <td class="content" align="center">
        <a href="https://urbancode.in" class="cta-button">✨ Start Exploring Today!</a>
      </td>
    </tr>
  `;
  const adminContent = `
    <h2>📝 New Course Enquiry: <strong>${lead.course_name}</strong></h2>
    <p><strong>Lead Name:</strong> ${lead.name}</p>
    <p><strong>Email:</strong> ${lead.email}</p>
    <p><strong>Mobile Number:</strong> ${lead.mobile_number}</p>
    <p>A new enquiry has been received. Please check the details in the admin panel.</p>
  `;

  await safeSendEmail({
    to: lead.email,
    subject: `Welcome to the ${lead.course_name} course!`,
    message: createEmailTemplate(
      "Thank You for Choosing Urbancode!",
      leadContent
    ),
  });

  await safeSendEmail({
    to: adminEmail,
    subject: `New Lead Enquiry for ${lead.course_name}`,
    message: createEmailTemplate("Zen System Notification", adminContent),
  });
}

// Function to send Enrollment Email with Enrollment-Specific UI for Lead & Notification Email to Admin
async function sendEnrollmentEmail(lead) {

  if (!isValidLead(lead)) {
    console.warn("⚠️ Skipping lead notification: invalid data", lead);
    return;
  }
  // Inspect the lead object
  const courseName = await getCourseName(lead.course_id);

  const enrollmentLeadContent = `
    <!-- Introduction -->
    <tr>
      <td class="content">
        <h2>
          🎓 Welcome to the Exciting World of
          <strong>${courseName}</strong>!
        </h2>
        <p>
          Congratulations on embarking on this transformative journey toward
          achieving your professional aspirations! We are absolutely
          thrilled to have you as a vital part of our dynamic learning
          community. Here, every lesson, project, and interaction is crafted
          not just to teach, but to inspire and empower you.
        </p>
        <p>
          Imagine the possibilities that await you! Our dedicated team of
          experts is here to guide you through every twist and turn of this
          course. You’ll uncover new skills, tackle real-world challenges,
          and engage in thought-provoking discussions that will ignite your
          passion for learning.
        </p>
        <p>
          Are you ready to push your boundaries? We believe this course will
          not only challenge you but also reward you in ways you never
          imagined. Get ready to dive deep into fascinating topics,
          collaborate with like-minded peers, and develop a skill set that
          will set you apart in your career. Your adventure starts now—let’s
          make it unforgettable!
        </p>
      </td>
    </tr>

    <!-- What to Expect -->
    <tr>
      <td class="content">
        <h2>What You Can Expect:</h2>
        <ul style="padding-left: 20px; margin: 10px 0">
          <li>
            👨‍🏫 <strong>Expert Guidance:</strong> Learn from experienced
            professionals dedicated to helping you succeed.
          </li>
          <li>
            💪 <strong>Hands-On Projects:</strong> Dive into real-world
            projects that build confidence and skills.
          </li>
          <li>
            🤝 <strong>Supportive Community:</strong> Connect with peers and
            get support whenever you need it.
          </li>
        </ul>
      </td>
    </tr>

    <!-- Call to Action -->
    <tr>
      <td class="content" align="center">
        <a href="https://urbancode.in" class="cta-button"
          >🎓 Start Building Your Future</a
        >
      </td>
    </tr>
  `;

  const adminEnrollmentContent = `
  <h2>🎉 Exciting News! A New Enrollment in <strong>${courseName}</strong> 🎉</h2>
  <p>We’re thrilled to welcome a new learner into the course! Here are the details:</p>
  <p><strong>Lead Name:</strong> ${lead.name}</p>
  <p><strong>Email:</strong> ${lead.email}</p>
  <p><strong>Mobile Number:</strong> ${lead.mobile_number}</p>
  <p>Let's make their onboarding experience smooth and memorable! Please check their details in the system and provide them with a warm welcome to the community. 🌟</p>
`;

  await safeSendEmail({
    to: lead.email,
    subject: `Enrollment Confirmation for ${courseName}`,
    message: createEmailTemplate("Welcome to Urbancode", enrollmentLeadContent),
  });

  await safeSendEmail({
    to: adminEmail,
    subject: `Lead Enrolled: ${courseName}`,
    message: createEmailTemplate(
      "Zen System Notification",
      adminEnrollmentContent
    ),
  });
}

async function sendStatusUpdateEmail(lead, newStatus) {
  const capitalizeFirstLetter = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const capitalizedStatus = capitalizeFirstLetter(newStatus);
  const courseName = await getCourseName(lead.course_id);

  // Email content for status update
  const statusUpdateContent = `
    <h2>🔄 Lead Status Update for Course: <strong>${courseName}</strong></h2>
    <p><strong>Lead Name:</strong> ${lead.name}</p>
    <p><strong>Email:</strong> ${lead.email}</p>
    <p><strong>Mobile Number:</strong> ${lead.mobile_number}</p>
    <p>This lead, who is currently enrolled in the <strong>${courseName}</strong> course, has had their status updated to: <strong>${capitalizedStatus}</strong>.</p>
    <p>For more details and to review the lead's progression, please visit the Zen admin panel.</p>
  `;

  // Determine recipients based on status
  let recipients = [adminEmail]; // Default: only admin
  if (capitalizedStatus === "Certification") {
    recipients.push("ranjith.c96me@gmail.com"); // Add Ranjith for "Certification"
  }

  // Send email to all recipients
  for (const recipient of recipients) {
    await safeSendEmail({
      to: recipient,
      subject: `Lead Status Updated: ${capitalizedStatus} for ${courseName}`,
      message: createEmailTemplate(
        "Zen Lead Status Update",
        statusUpdateContent
      ),
    });
  }
}

// WhatsApp API integration (AskEva) for sending predefined templates
// async function sendWhatsAppMessage(mobile_number) {
//   const url = "https://backend.askeva.io/v1/message/send-message";
//   const token = process.env.ASKEVA_API_TOKEN;
//   const mobileWithCountryCode = mobile_number.startsWith("+")
//     ? mobile_number
//     : `91${mobile_number}`;

//   const messageData = {
//     to: mobileWithCountryCode,
//     type: "template",
//     template: {
//       language: { policy: "deterministic", code: "en" },
//       name: "python_brochure",
//     },
//   };

//   try {
//     const response = await fetch(`${url}?token=${token}`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(messageData),
//     });

//     if (response.ok) {
//       const result = await response.json();
//       console.log("WhatsApp message sent successfully:", result);
//     } else {
//       const errorResponse = await response.json();
//       console.error("Error sending WhatsApp message:", errorResponse);
//     }
//   } catch (error) {
//     console.error("Error sending WhatsApp message:", error);
//   }
// }

// Function to Send Notifications for New Leads
async function sendLeadNotifications(lead) {
  await sendWelcomeEmail(lead); // Send welcome email to lead and notification to admin
  // await sendWhatsAppMessage(lead.mobile_number); // Send WhatsApp message
}

const sendAdminNotification = async (subject, content) => {
  await sendEmail({
    to: adminEmail,
    subject: subject,
    message: createEmailTemplate("Zen System Notification", content),
  });
};
const sendDeleteNotification = async (lead, reason) => {
  const content = `
    <h2>🗑️ Lead ${lead.name} Deleted</h2>
    <p><strong>Lead Name:</strong> ${lead.name}</p>
    <p><strong>Email:</strong> ${lead.email}</p>
    <p><strong>Course:</strong> ${lead.course}</p>
    <p>Reason for deletion: <strong>${reason}</strong></p>
    <p>The lead has been successfully deleted and moved to the deleted leads tray.</p>
  `;
  await sendAdminNotification("Lead Deleted", content);
};

const sendArchiveNotification = async (lead) => {
  const content = `
    <h2>📁 Lead ${lead.name} Archived</h2>
    <p><strong>Lead Name:</strong> ${lead.name}</p>
    <p><strong>Email:</strong> ${lead.email}</p>
    <p><strong>Course:</strong> ${lead.course}</p>
    <p>The lead has been successfully archived.</p>
  `;
  await sendAdminNotification("Lead Archived", content);
};

const sendRestoreNotification = async (lead, status) => {
  const content = `
    <h2>🔄 Lead ${lead.name} Restored</h2>
    <p><strong>Lead Name:</strong> ${lead.name}</p>
    <p><strong>Email:</strong> ${lead.email}</p>
    <p><strong>Course:</strong> ${lead.course}</p>
    <p>The lead status has been updated to: <strong>${status}</strong>.</p>
    <p>The lead has been successfully restored from the archive.</p>
  `;
  await sendAdminNotification("Lead Restored", content);
};

const sendOnHoldNotification = async (lead) => {
  const content = `
    <h2>⏸️ Lead ${lead.name} Moved to On-Hold</h2>
    <p><strong>Lead Name:</strong> ${lead.name}</p>
    <p><strong>Email:</strong> ${lead.email}</p>
    <p><strong>Course:</strong> ${lead.course}</p>
    <p>The lead has been moved to on-hold status.</p>
    <p>Please review any pending actions needed for this lead.</p>
  `;
  await sendAdminNotification("Lead Moved to On-Hold", content);
};

const sendRestoreOnHoldNotification = async (lead, status) => {
  const content = `
    <h2>🔄 Lead ${lead.name} Restored from On-Hold</h2>
    <p><strong>Lead Name:</strong> ${lead.name}</p>
    <p><strong>Email:</strong> ${lead.email}</p>
    <p><strong>Course:</strong> ${lead.course}</p>
    <p>The lead has been restored from on-hold to: <strong>${status}</strong>.</p>
  `;
  await sendAdminNotification("Lead Restored from On-Hold", content);
};

const sendTrainerPayoutSummaryEmails = async (period, customDateFrom = null, customDateTo = null) => {
  try {
    let query = `
      SELECT 
        tp.payout_id, tp.amount, tp.status, tp.paid_on,
        t.trainer_name, t.trainer_email,
        l.name AS student_name,
        b.batch_name
      FROM trainer_payouts tp
      JOIN trainer t ON tp.trainer_id = t.trainer_id
      JOIN leads l ON tp.lead_id = l.lead_id
      JOIN batch b ON l.batch_id = b.batch_id
      WHERE tp.status = 'Paid' AND tp.paid_on IS NOT NULL
    `;

    const params = [];

    if (period === "last30days") {
      query += ` AND tp.paid_on >= NOW() - INTERVAL '30 days'`;
    } else if (period === "last15days") {
      query += ` AND tp.paid_on >= NOW() - INTERVAL '15 days'`;
    } else if (period === "custom") {
      if (customDateFrom) {
        query += ` AND DATE(tp.paid_on) >= $${params.length + 1}`;
        params.push(customDateFrom);
      }
      if (customDateTo) {
        query += ` AND DATE(tp.paid_on) <= $${params.length + 1}`;
        params.push(customDateTo);
      }
    }

    const result = await pool.query(query, params);
    const payouts = result.rows;

    if (!payouts.length) {
      console.log("No payouts found for selected period.");
      return;
    }

    // Group payouts by trainer email
    const grouped = {};
    payouts.forEach((p) => {
      if (!grouped[p.trainer_email]) grouped[p.trainer_email] = [];
      grouped[p.trainer_email].push(p);
    });

    for (const [email, list] of Object.entries(grouped)) {
      const trainerName = list[0].trainer_name;

      // Create HTML table
      let html = `
        <p>Dear <strong>${trainerName}</strong>,</p>
        <p>Here is your payout summary for the selected period:</p>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr style="background-color: #1ab79d; color: #fff;">
              <th>#</th>
              <th>Batch</th>
              <th>Student</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
      `;
      list.forEach((p, i) => {
        html += `
          <tr>
            <td>${i + 1}</td>
            <td>${p.batch_name}</td>
            <td>${p.student_name}</td>
            <td>₹${parseFloat(p.amount).toFixed(2)}</td>
            <td>${new Date(p.paid_on).toLocaleDateString()}</td>
          </tr>
        `;
      });
      html += `</tbody></table><p>Thank you for your contribution!</p>`;

      // Generate CSV in memory
      const parser = new Parser({
        fields: ["batch_name", "student_name", "amount", "paid_on"],
      });
      const csvContent = parser.parse(list);

      // Send email with CSV from memory
      await sendEmail({
        to: email,
        subject: `Trainer Payout Summary - ${period === "custom" ? customDate : period
          }`,
        message: createEmailTemplate("Trainer Payout Summary", html),
        attachments: [
          {
            filename: `payout-summary-${trainerName.replace(/\s+/g, "_")}.csv`,
            content: csvContent,
          },
        ],
      });

      console.log(`✅ Email with CSV sent to ${trainerName} (${email})`);
    }
  } catch (err) {
    console.error("❌ Error sending payout emails:", err);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendEnrollmentEmail,
  sendLeadNotifications,
  // sendWhatsAppMessage,
  sendStatusUpdateEmail,
  sendAdminNotification,
  sendDeleteNotification,
  sendArchiveNotification,
  sendRestoreNotification,
  sendOnHoldNotification,
  sendRestoreOnHoldNotification,
  sendTrainerPayoutSummaryEmails, // Add this line
};
