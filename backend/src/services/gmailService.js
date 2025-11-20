require("dotenv").config();
const { google } = require("googleapis");
const fs = require("fs");

// Set up OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Set OAuth2 credentials
oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});

// Gmail API instance
const gmail = google.gmail({ version: "v1", auth: oauth2Client });

// Utility function to send email using Gmail API
async function sendEmail({ to, subject, message, attachments }) {
  let rawMessage = [
    `From: "Urbancode" <${process.env.EMAIL_USER}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="boundary"`,
    ``,
    `--boundary`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    message,
    ``,
  ];

  // Attach files
  if (attachments && attachments.length) {
    attachments.forEach((attachment) => {
      let contentBase64;

      if (attachment.content) {
        contentBase64 = Buffer.from(attachment.content).toString("base64");
      } else if (attachment.path) {
        contentBase64 = fs.readFileSync(attachment.path).toString("base64");
      } else {
        console.warn("Skipping attachment with no path or content.");
        return;
      }

      rawMessage.push(
        `--boundary`,
        `Content-Type: application/octet-stream; name="${attachment.filename}"`,
        `Content-Transfer-Encoding: base64`,
        `Content-Disposition: attachment; filename="${attachment.filename}"`,
        ``,
        contentBase64
      );
    });

    rawMessage.push(`--boundary--`);
  }

  try {
    const result = await gmail.users.messages.send({
      userId: "me",
      resource: {
        raw: Buffer.from(rawMessage.join("\r\n"))
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, ""),
      },
    });
    console.log("✅ Email sent successfully:", result.data.id);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
}

module.exports = { sendEmail };
