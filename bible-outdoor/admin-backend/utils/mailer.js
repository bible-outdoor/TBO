const nodemailer = require('nodemailer');

// Debug: Log email configuration (without exposing password)
console.log('Email configuration:');
console.log('GMAIL_USER:', process.env.GMAIL_USER || 'NOT SET');
console.log('GMAIL_PASS:', process.env.GMAIL_PASS ? 'SET (' + process.env.GMAIL_PASS.length + ' characters)' : 'NOT SET');

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
        <img src="https://res.cloudinary.com/dby5luwcf/image/upload/v1752499890/logo3_ckqlzk.png" alt="The Bible Outdoor Logo" style="width:120px; height:auto; margin-bottom:20px; display: block; margin-left: auto; margin-right: auto;"/>
      </div>
      <p style="font-size:1.1em;">Your verification code is: <b>${code}</b></p>
      <p style="color:#888; font-size:0.95em;">If you did not request this, please ignore this email.</p>
    `
  };
  await transporter.sendMail(mailOptions);
}

async function sendAdminInviteEmail(to, inviteLink, defaultPassword, adminName = '') {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject: 'Admin Invitation - The Bible Outdoor',
    text: `Welcome to The Bible Outdoor Admin Panel!

You have been invited to join as an administrator.

Your login details:
- Email: ${to}
- Default Password: ${defaultPassword}
- Login Link: ${inviteLink}

Important:
- This link expires in 30 minutes
- You must change your password on first login
- Keep these credentials secure

If you did not expect this invitation, please ignore this email.

Best regards,
The Bible Outdoor Team`,
    html: `
      <div style="text-align:center; margin-bottom:30px;">
        <img src="https://res.cloudinary.com/dby5luwcf/image/upload/v1752499890/logo3_ckqlzk.png" alt="The Bible Outdoor Logo" style="width:120px; height:auto; margin-bottom:20px; display: block; margin-left: auto; margin-right: auto;"/>
        <h2 style="color:#0288d1; margin:0;">Welcome to The Bible Outdoor</h2>
        <p style="color:#666; font-size:1.1em; margin:10px 0 0 0;">Admin Panel Invitation</p>
      </div>
      
      <div style="background:#f8f9fa; border-radius:8px; padding:20px; margin:20px 0;">
        <h3 style="color:#0288d1; margin-top:0;">You've been invited as an Administrator!</h3>
        <p style="font-size:1.1em; margin-bottom:20px;">Hello${adminName ? ' ' + adminName : ''},</p>
        <p>You have been granted administrator access to The Bible Outdoor admin panel.</p>
      </div>

      <div style="background:#fff; border:2px solid #0288d1; border-radius:8px; padding:20px; margin:20px 0;">
        <h3 style="color:#0288d1; margin-top:0;">Your Login Credentials:</h3>
        <p><strong>Email:</strong> ${to}</p>
        <p><strong>Default Password:</strong> <code style="background:#f1f1f1; padding:4px 8px; border-radius:4px; font-family:monospace; color:#d63384;">${defaultPassword}</code></p>
        <div style="text-align:center; margin:25px 0;">
          <a href="${inviteLink}" style="display:inline-block; background:#0288d1; color:white; padding:12px 24px; text-decoration:none; border-radius:8px; font-weight:bold; font-size:1.1em;">Access Admin Panel</a>
        </div>
      </div>

      <div style="background:#fff3cd; border:1px solid #ffeaa7; border-radius:8px; padding:15px; margin:20px 0;">
        <h4 style="color:#856404; margin-top:0;">⚠️ Important Security Notes:</h4>
        <ul style="color:#856404; margin:10px 0;">
          <li><strong>This invitation expires in 30 minutes</strong></li>
          <li>You must change your password on first login</li>
          <li>Keep these credentials secure and don't share them</li>
          <li>If you didn't expect this invitation, please ignore this email</li>
        </ul>
      </div>

      <div style="text-align:center; margin-top:30px; padding-top:20px; border-top:1px solid #eee;">
        <p style="color:#888; font-size:0.9em;">Best regards,<br>The Bible Outdoor Team</p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail, sendAdminInviteEmail };
