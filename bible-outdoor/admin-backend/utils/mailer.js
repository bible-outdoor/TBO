const nodemailer = require('nodemailer');

// Create transporter with better error handling
let transporter;
try {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    },
    // Add timeout and connection settings
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000, // 30 seconds
    socketTimeout: 60000, // 60 seconds
    // Add debug for troubleshooting
    debug: process.env.NODE_ENV !== 'production',
    logger: process.env.NODE_ENV !== 'production'
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

// Send admin invitation email with professional template
async function sendAdminInvitationEmail(to, defaultPassword, inviteToken) {
  // Check if email credentials are configured
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.log('Email credentials not configured. Admin invitation for', to, 'Password:', defaultPassword);
    throw new Error('Email service not configured');
  }

  if (!transporter) {
    console.log('Email transporter not available. Admin invitation for', to, 'Password:', defaultPassword);
    throw new Error('Email transporter not available');
  }

  const adminPanelUrl = inviteToken 
    ? `https://tbo-qyda.onrender.com/frontend/admin/login.html?token=${inviteToken}`
    : 'https://tbo-qyda.onrender.com/frontend/admin/login.html';

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject: 'Welcome to The Bible Outdoor - Admin Access Granted',
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admin Invitation - The Bible Outdoor</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        
        <!-- Header with Logo -->
        <div style="text-align: center; padding: 40px 20px 20px; background: linear-gradient(135deg, #0288d1 0%, #1565c0 100%);">
          <div style="background: white; width: 90px; height: 90px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 8px;">
            <img src="https://res.cloudinary.com/dby5luwcf/image/upload/v1752499890/logo3_ckqlzk.png" alt="The Bible Outdoor Logo" style="width: 70px; height: 70px; object-fit: contain; border-radius: 50%;" />
          </div>
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Welcome to The Bible Outdoor</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Admin Panel Invitation</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 30px;">
          <h2 style="color: #0288d1; margin: 0 0 20px; font-size: 20px; font-weight: 600;">You've been invited as an Administrator!</h2>
          
          <p style="color: #555; line-height: 1.6; margin: 0 0 20px;">Hello ${to.split('@')[0]},</p>
          
          <p style="color: #555; line-height: 1.6; margin: 0 0 30px;">
            You have been granted administrator access to The Bible Outdoor admin panel.
          </p>

          <!-- Login Credentials Box -->
          <div style="background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #0288d1; margin: 0 0 15px; font-size: 16px; font-weight: 600;">Your Login Credentials:</h3>
            
            <div style="margin-bottom: 12px;">
              <strong style="color: #333; display: inline-block; width: 120px;">Email:</strong>
              <span style="color: #0288d1; font-weight: 500;">${to}</span>
            </div>
            
            <div style="margin-bottom: 20px;">
              <strong style="color: #333; display: inline-block; width: 120px;">Default Password:</strong>
              <code style="background: #fff; border: 1px solid #ddd; padding: 4px 8px; border-radius: 4px; font-family: 'Courier New', monospace; color: #e91e63; font-weight: bold;">${defaultPassword}</code>
            </div>

            <div style="text-align: center;">
              <a href="${adminPanelUrl}" style="display: inline-block; background: linear-gradient(135deg, #0288d1, #1565c0); color: white; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(2,136,209,0.3);">
                Access Admin Panel
              </a>
            </div>
          </div>

          <!-- Security Notes -->
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h4 style="color: #856404; margin: 0 0 12px; font-size: 15px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">⚠️</span> Important Security Notes:
            </h4>
            <ul style="color: #856404; margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>This invitation expires in 30 minutes</li>
              <li>You must change your password on first login</li>
              <li>Do not share these credentials with anyone</li>
              <li>If you don't expect this invitation, please ignore this email</li>
            </ul>
          </div>

          <p style="color: #777; font-size: 14px; line-height: 1.6; margin: 30px 0 0;">
            If you have any questions or need assistance, please contact our support team.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="color: #777; margin: 0; font-size: 14px;">
            Best regards,<br>
            <strong style="color: #0288d1;">The Bible Outdoor Team</strong>
          </p>
          <p style="color: #999; margin: 10px 0 0; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
    `
  };

  try {
    console.log('Attempting to send admin invitation email to:', to);
    const result = await transporter.sendMail(mailOptions);
    console.log('Admin invitation email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Failed to send admin invitation email to', to, ':', error.message);
    console.log('Admin credentials for debugging - Email:', to, 'Password:', defaultPassword);
    throw error;
  }
}

// Test Gmail connection
async function testGmailConnection() {
  if (!transporter) {
    console.log('❌ Email transporter not available');
    return false;
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.log('❌ Gmail credentials not configured');
    console.log('GMAIL_USER:', process.env.GMAIL_USER ? '✅ Set' : '❌ Missing');
    console.log('GMAIL_PASS:', process.env.GMAIL_PASS ? '✅ Set' : '❌ Missing');
    return false;
  }

  try {
    console.log('🔗 Testing Gmail SMTP connection...');
    await transporter.verify();
    console.log('✅ Gmail SMTP connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Gmail SMTP connection failed:', error.message);
    console.log('📧 Using Gmail user:', process.env.GMAIL_USER);
    console.log('🔐 Gmail pass length:', process.env.GMAIL_PASS ? process.env.GMAIL_PASS.length : 0);
    
    // Provide specific error guidance
    if (error.code === 'ETIMEDOUT') {
      console.log('💡 Connection timeout - check network/firewall settings');
    } else if (error.code === 'EAUTH') {
      console.log('💡 Authentication failed - check Gmail credentials and app password');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 DNS resolution failed - check internet connection');
    }
    
    return false;
  }
}

module.exports = { sendVerificationEmail, sendAdminInvitationEmail, testGmailConnection };
