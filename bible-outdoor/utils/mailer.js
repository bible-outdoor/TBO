const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

async function sendVerificationEmail(to, code, subject = 'Verify your email for The Bible Outdoor') {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject,
    text: `Your verification code is: ${code}`,
    html: `
      <div style="text-align:center;">
        <img src="https://res.cloudinary.com/dby5luwcf/image/upload/v1752499890/logo3_ckqlzk.png" alt="Logo" style="width:120px; height:auto; margin-bottom:20px;"/>
      </div>
      <p style="font-size:1.1em;">Your verification code is: <b>${code}</b></p>
      <p style="color:#888; font-size:0.95em;">If you did not request this, please ignore this email.</p>
    `
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail };
