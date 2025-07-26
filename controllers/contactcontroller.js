require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "mail.privateemail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    method: "PLAIN",
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 30000,
  greetingTimeout: 15000,
});

transporter.verify((error) => {
  if (error) {
    console.error("SMTP Connection Error:", error);
  } else {
    console.log("Ready to send contact emails");
  }
});

const contact = async (req, res) => {
  const { name, email, phone, address,message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: "Name, email, and message are required",
    });
  }

  const mailOptions = {
    from: `"Contact Page" <${process.env.EMAIL_USER}>`,
    to: process.env.RECIPIENT_EMAIL,
    subject: `📩 Contact Request from ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 20px;">
        <h2 style="color: #333;">New Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        ${phone ? `<p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>` : ""}

        <p><strong>Message:</strong></p>
        <p style="background:#fff;padding:10px;border-left:4px solid #3b82f6;border-radius:5px">${message.replace(/\n/g, "<br>")}</p>
        <br>
        <small>Received at ${new Date().toLocaleString()}</small>
      </div>
    `,
    text: `
New Contact Message

Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ""}

Message:
${message}

Received at ${new Date().toLocaleString()}
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    res.status(200).json({
      success: true,
      message: "Contact message sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Error sending contact email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send contact email",
      error: error.message,
    });
  }
};

module.exports = { contact };
