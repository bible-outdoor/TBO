const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { sendAdminInvitationEmail, testGmailConnection } = require('../utils/mailer');

// Get all users (superadmin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden' });
    const users = await User.find({}, '-pass');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add user (superadmin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden' });
    const { email, pass, role, status, name } = req.body;
    if (!email || !pass) return res.status(400).json({ message: 'Email and password required' });
    // Generate one-time token and expiry
    const oneTimeToken = crypto.randomBytes(32).toString('hex');
    const oneTimeTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    const user = await User.create({
      email,
      pass, // pass is plain here, will be hashed by pre-save hook
      role,
      status,
      name,
      oneTimeToken,
      oneTimeTokenExpires,
      mustChangePassword: true
    });
    // Send beautiful admin invitation email
    try {
      await sendAdminInvitationEmail(email, pass, oneTimeToken);
      res.json({ 
        success: true, 
        user, 
        message: 'Admin created successfully and invitation email sent.',
        defaultPassword: pass 
      });
    } catch (emailError) {
      console.error('Failed to send admin invitation email:', emailError);
      // Still return success since user was created, just inform about email issue
      const baseUrl = process.env.ADMIN_ONBOARD_URL || 'https://tbo-qyda.onrender.com/frontend/admin/login.html';
      const oneTimeLink = `${baseUrl}?token=${oneTimeToken}&email=${encodeURIComponent(email)}`;
      res.json({ 
        success: true, 
        user, 
        oneTimeLink, 
        defaultPassword: pass,
        message: 'Admin created successfully but email sending failed. Use the provided link.',
        emailError: true
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Edit user (superadmin only)
router.put('/:email', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden' });
    const { role, status, name } = req.body;
    const user = await User.findOneAndUpdate(
      { email: req.params.email },
      { role, status, name },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (superadmin only)
router.delete('/:email', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden' });
    await User.deleteOne({ email: req.params.email });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Onboarding login (invitation link)
router.post('/admin/login', async (req, res) => {
  const { email, password, token } = req.body;
  if (!email || !password || !token) return res.status(400).json({ message: 'Missing credentials' });
  // Find user by email and token
  const user = await User.findOne({ email, oneTimeToken: token });
  if (!user) return res.status(400).json({ message: 'Invalid or expired invitation link.' });
  if (!user.oneTimeTokenExpires || user.oneTimeTokenExpires < new Date()) {
    return res.status(400).json({ message: 'Invitation link has expired.' });
  }
  const valid = await bcrypt.compare(password, user.pass);
  if (!valid) return res.status(401).json({ message: 'Incorrect default password.' });
  // Clear token
  user.oneTimeToken = undefined;
  user.oneTimeTokenExpires = undefined;
  await user.save();
  // Reload user to get the latest values
  const freshUser = await User.findOne({ email: user.email });
  // Issue JWT
  const tokenJwt = jwt.sign(
    { email: freshUser.email, role: freshUser.role, name: freshUser.name },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
  return res.json({ 
    token: tokenJwt, 
    user: { email: freshUser.email, role: freshUser.role, name: freshUser.name, mustChangePassword: freshUser.mustChangePassword }
  });
});

// Change password (for onboarding/first login)
router.post('/change-password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Both old and new passwords are required.' });
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const valid = await bcrypt.compare(oldPassword, user.pass);
    if (!valid) return res.status(401).json({ message: 'Old password is incorrect.' });
    user.pass = newPassword;
    user.mustChangePassword = false;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error.' });
  }
});

// Test Gmail connection endpoint (superadmin only)
router.post('/test-gmail', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden' });
    
    const isConnected = await testGmailConnection();
    res.json({ 
      success: isConnected, 
      message: isConnected ? 'Gmail connection successful!' : 'Gmail connection failed - check server logs for details'
    });
  } catch (err) {
    console.error('Gmail test error:', err);
    res.status(500).json({ success: false, message: 'Server error during Gmail test' });
  }
});

module.exports = router;