require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");
const contactRoutes = require('./router/contact-router');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use("/api",contactRoutes);

// Verify environment variables are loaded
console.log("Environment Variables:", {
  EMAIL_USER: process.env.EMAIL_USER,
  RECIPIENT_EMAIL: process.env.RECIPIENT_EMAIL,
});
console.log("Current SMTP Config:", {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS,
  host: "mail.privateemail.com",
});

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: "mail.privateemail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    method: "PLAIN",
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 30000, // 30 seconds
  greetingTimeout: 15000,
});

// Verify transporter connection
transporter.verify((error) => {
  if (error) {
    console.error("SMTP Connection Error:", error);
  } else {
    console.log("Server is ready to send emails");
  }
});

const sendEmail = async (formData) => {
  const mailOptions = {
    from: `"Website Contact" <${process.env.EMAIL_USER}>`,
    to: process.env.RECIPIENT_EMAIL,
    subject: `🔥 New Contact: ${formData.name}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Roboto, sans-serif;
      background-color: #f3f4f6;
    }

    .container {
      max-width: 640px;
      margin: 40px auto;
      background-color: #e9e6e6ff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid #e5e7eb;
    }

    .header {
      background: linear-gradient(to right, #6366f1, #3b82f6);
      color: #000;
      padding: 32px;
      text-align: center;
    }

    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }

    .header p {
      margin-top: 8px;
      font-size: 14px;
      opacity: 0.9;
    }

    .content {
      padding: 32px;
    }

    .row {
      margin-bottom: 16px;
    }

    .label {
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .value {
      color: #111827;
      font-size: 15px;
    }

    .message-box {
      margin-top: 24px;
      padding: 20px;
      background-color: #f9fafb;
      border-left: 4px solid #3b82f6;
      border-radius: 8px;
      line-height: 1.6;
    }

    .message-box pre {
      white-space: pre-wrap;
      margin: 0;
      font-size: 15px;
      color: #1f2937;
    }

    .footer {
      padding: 24px;
      font-size: 13px;
      text-align: center;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
      background-color: #f9fafb;
    }

    a {
      color: #3b82f6;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    @media (max-width: 600px) {
      .content {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Contact Message</h1>
      <p>Submitted via your website</p>

    </div>
    <div class="content">
      <div class="row">
        <div class="label">Name</div>
        <div class="value">${formData.name}</div>
      </div>
      <div class="row">
        <div class="label">Email</div>
        <div class="value"><a href="mailto:${formData.email}">${
      formData.email
    }</a></div>
      </div>
      ${
        formData.phone
          ? `
      <div class="row">
        <div class="label">Phone</div>
        <div class="value"><a href="tel:${formData.phone.replace(
          /[^\d+]/g,
          ""
        )}">${formData.phone}</a></div>
      </div>`
          : ""
      }

      ${
        formData.quantity
          ? `
      <div class="row">
        <div class="label">Quantity</div>
        <div class="value">${formData.quantity}</div>
      </div>`
          : ""
      }

      <div class="message-box">
        <div class="label">Message</div>
        <pre>${formData.message.replace(/\n/g, "<br>")}</pre>
      </div>
    </div>
    <div class="footer">
      <p>Received at ${new Date().toLocaleString()}</p>
      <p>This email was sent from your website's contact form.</p>
    </div>
  </div>
</body>
</html>
`,
    text: `NEW CONTACT SUBMISSION\n\nName: ${formData.name}\nEmail: ${
      formData.email
    }\n${formData.phone ? `Phone: ${formData.phone}\n` : ""}${
      formData.quantity ? `Quantity: ${formData.quantity}\n` : ""
    }\nMessage:\n${
      formData.message
    }\n\nReceived at: ${new Date().toLocaleString()}`,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      message: "Email sent successfully",
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Email send error:", error);
    return {
      success: false,
      message: "Failed to send email",
      error: error.message,
    };
  }
};

// API endpoint
app.post("/api/send-email", async (req, res) => {
  const { name, email, phone, quantity, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: "Name, email, and message are required",
    });
  }

  const result = await sendEmail({ name, email, phone, quantity, message });

  res.status(result.success ? 200 : 500).json(result);
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
