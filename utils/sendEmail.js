const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.MY_EMAIL,
      pass: process.env.GMAIL_KEY,
    },
  });

  const mailOptions = {
    from: process.env.MY_EMAIL,
    to,
    subject,
    html, // Use `html` instead of `text`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

module.exports = sendEmail;
