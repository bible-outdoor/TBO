const nodemailer = require('nodemailer');

// Create transporter with better error handling
let transporter;
try {
  transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    },
    // Add additional Gmail configuration
    secure: false, // Use TLS
    tls: {
      rejectUnauthorized: false
    }
  });
} catch (error) {
  console.error('Failed to create email transporter:', error);
}

async function sendVerificationEmail(to, code, subject = 'Verify your email for The Bible Outdoor') {
  // Check if email credentials are configured
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.log('Email credentials not configured. Verification code for', to, ':', code);
    throw new Error('Email service not configured');
  }

  if (!transporter) {
    console.log('Email transporter not available. Verification code for', to, ':', code);
    throw new Error('Email transporter not available');
  }

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

  try {
    console.log('Attempting to send email to:', to);
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Failed to send email to', to, ':', error.message);
    console.log('Verification code for debugging:', code);
    throw error;
  }
}

module.exports = { sendVerificationEmail };
