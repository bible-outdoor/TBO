const nodemailer = require('nodemailer');

// SMTP configuration options with cloud-friendly alternatives
const smtpConfigs = [
  {
    name: 'SendGrid SMTP (Render-friendly)',
    config: {
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      },
      connectionTimeout: 20000,
      greetingTimeout: 10000,
      socketTimeout: 20000
    },
    requiresEnv: 'SENDGRID_API_KEY'
  },
  {
    name: 'Gmail SSL (Port 465)',
    config: {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // Use SSL
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    },
    requiresEnv: 'GMAIL_USER,GMAIL_PASS'
  },
  {
    name: 'Gmail TLS (Port 587)',
    config: {
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
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    },
    requiresEnv: 'GMAIL_USER,GMAIL_PASS'
  }
];

// Start with the first configuration
let transporter = nodemailer.createTransport(smtpConfigs[0].config);
let currentConfigIndex = 0;

// Check if required environment variables are set for a config
function hasRequiredEnvVars(requiresEnv) {
  if (!requiresEnv) return true;
  const envVars = requiresEnv.split(',');
  return envVars.every(envVar => process.env[envVar?.trim()]);
}

// Function to try different SMTP configurations
async function tryBestTransporter() {
  for (let i = 0; i < smtpConfigs.length; i++) {
    const { name, config, requiresEnv } = smtpConfigs[i];
    
    // Check if required environment variables are set
    if (!hasRequiredEnvVars(requiresEnv)) {
      console.log(`⏭️ Skipping ${name} - missing environment variables: ${requiresEnv}`);
      continue;
    }
    
    try {
      console.log(`🔧 Trying ${name}...`);
      const testTransporter = nodemailer.createTransport(config);
      
      // Test the connection with shorter timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Quick test timeout')), 8000);
        testTransporter.verify((error, success) => {
          clearTimeout(timeout);
          if (error) reject(error);
          else resolve(success);
        });
      });
      
      console.log(`✅ ${name} working!`);
      transporter = testTransporter;
      currentConfigIndex = i;
      return true;
    } catch (error) {
      console.log(`❌ ${name} failed: ${error.message}`);
    }
  }
  
  console.log('⚠️ All SMTP configurations failed, using fallback');
  return false;
}

async function sendVerificationEmail(to, code, subject = 'Verify your email for The Bible Outdoor') {
  // Check if any email credentials are configured
  const hasGmail = process.env.GMAIL_USER && process.env.GMAIL_PASS;
  const hasSendGrid = process.env.SENDGRID_API_KEY;
  
  if (!hasGmail && !hasSendGrid) {
    console.log('No email service configured. Verification code for', to, ':', code);
    throw new Error('Email service not configured');
  }

  if (!transporter) {
    console.log('Email transporter not available. Verification code for', to, ':', code);
    throw new Error('Email transporter not available');
  }

  const mailOptions = {
    from: process.env.SENDGRID_FROM_EMAIL || process.env.GMAIL_USER || 'noreply@thebibleoutdoor.com',
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
  // Check if any email credentials are configured
  const hasGmail = process.env.GMAIL_USER && process.env.GMAIL_PASS;
  const hasSendGrid = process.env.SENDGRID_API_KEY;
  
  if (!hasGmail && !hasSendGrid) {
    console.log('No email service configured. Admin invitation for', to, 'Password:', defaultPassword);
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
    from: process.env.SENDGRID_FROM_EMAIL || process.env.GMAIL_USER || 'noreply@thebibleoutdoor.com',
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

// Test email connection with multiple configurations
async function testGmailConnection() {
  const hasGmail = process.env.GMAIL_USER && process.env.GMAIL_PASS;
  const hasSendGrid = process.env.SENDGRID_API_KEY;
  
  console.log('📧 Available email services:');
  console.log('SendGrid:', hasSendGrid ? '✅ SENDGRID_API_KEY set' : '❌ Missing SENDGRID_API_KEY');
  console.log('Gmail:', hasGmail ? '✅ GMAIL_USER & GMAIL_PASS set' : '❌ Missing GMAIL credentials');
  
  if (!hasGmail && !hasSendGrid) {
    console.log('❌ No email service credentials configured');
    return false;
  }

  console.log('🔗 Testing email SMTP configurations...');
  const success = await tryBestTransporter();
  
  if (success) {
    console.log(`✅ Email SMTP connection successful using ${smtpConfigs[currentConfigIndex].name}!`);
    return true;
  } else {
    console.log('❌ All email SMTP configurations failed');
    console.log('💡 Render may be blocking outbound SMTP ports (465, 587)');
    console.log('💡 To fix this, set up SendGrid:');
    console.log('   1. Sign up at https://sendgrid.com (free tier: 100 emails/day)');
    console.log('   2. Create API key in SendGrid dashboard');
    console.log('   3. Add SENDGRID_API_KEY environment variable to Render');
    console.log('   4. Add SENDGRID_FROM_EMAIL=thebibleoutdoor@gmail.com to Render');
    return false;
  }
}

module.exports = { sendVerificationEmail, sendAdminInvitationEmail, testGmailConnection, tryBestTransporter };
