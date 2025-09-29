const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Member = require('../models/Member');
const { sendVerificationEmail } = require('../utils/mailer');
const router = express.Router();

// Register member
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    const existing = await Member.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const member = new Member({ name, email, password: hashed, verificationCode, isVerified: false });
    await member.save();
    
    // Try to send verification email, but don't fail if it errors
    try {
      await sendVerificationEmail(email, verificationCode);
      res.status(201).json({ 
        success: true, 
        message: 'Registration successful. Please check your email for the verification code.' 
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Still return success since user was created, just inform about email issue
      res.status(201).json({ 
        success: true, 
        message: 'Registration successful. However, there was an issue sending the verification email. Please try to resend the code.' 
      });
    }
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// Verify member email
router.post('/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    const member = await Member.findOne({ email });
    if (!member) return res.status(404).json({ message: 'Member not found.' });
    if (member.isVerified) return res.status(400).json({ message: 'Already verified.' });
    if (member.verificationCode !== code) return res.status(400).json({ message: 'Invalid code.' });
    member.isVerified = true;
    member.verificationCode = undefined;
    await member.save();
    res.json({ message: 'Email verified successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Login member
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const member = await Member.findOne({ email });
    if (!member) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    if (!member.isVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in.' });
    }
    const match = await bcrypt.compare(password, member.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    const token = jwt.sign({ id: member._id, role: member.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, member: { name: member.name, email: member.email, role: member.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Resend verification code endpoint
router.post('/resend-code', async (req, res) => {
  try {
    const { email } = req.body;
    const member = await Member.findOne({ email });
    if (!member) return res.status(404).json({ message: 'Member not found.' });
    if (member.isVerified) return res.status(400).json({ message: 'Already verified.' });
    // Generate new code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    member.verificationCode = verificationCode;
    await member.save();
    await sendVerificationEmail(email, verificationCode);
    res.json({ message: 'Verification code resent.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Send password reset code
router.post('/send-reset-code', async (req, res) => {
  try {
    const { email } = req.body;
    const member = await Member.findOne({ email });
    if (!member) return res.status(404).json({ message: 'Member not found.' });
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    member.resetCode = resetCode;
    member.resetCodeExpires = Date.now() + 15 * 60 * 1000; // 15 min expiry
    await member.save();
    await require('../utils/mailer').sendVerificationEmail(email, resetCode, 'Password Reset Code');
    res.json({ message: 'Reset code sent to your email.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Verify password reset code
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    const member = await Member.findOne({ email });
    if (!member || !member.resetCode || !member.resetCodeExpires) return res.status(400).json({ message: 'No reset code found.' });
    if (member.resetCode !== code) return res.status(400).json({ message: 'Invalid code.' });
    if (Date.now() > member.resetCodeExpires) return res.status(400).json({ message: 'Code expired.' });
    res.json({ message: 'Code verified.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const member = await Member.findOne({ email });
    if (!member || !member.resetCode || !member.resetCodeExpires) return res.status(400).json({ message: 'No reset code found.' });
    if (member.resetCode !== code) return res.status(400).json({ message: 'Invalid code.' });
    if (Date.now() > member.resetCodeExpires) return res.status(400).json({ message: 'Code expired.' });
    member.password = await require('bcryptjs').hash(newPassword, 10);
    member.resetCode = undefined;
    member.resetCodeExpires = undefined;
    await member.save();
    res.json({ message: 'Password reset successful.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
