const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, pass, confirmPassword } = req.body;
    if (!name || !email || !pass || !confirmPassword)
      return res.status(400).json({ success: false, message: 'All fields required' });
    if (pass !== confirmPassword)
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    if (pass.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ success: false, message: 'Email already registered' });
    const user = new User({ name, email, pass });
    await user.save();
    const token = jwt.sign(
      { email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );
    res.status(201).json({ success: true, token, user: { email: user.email, role: user.role, name: user.name } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

router.get('/protected', auth, (req, res) => {
  // Only accessible if JWT is valid
  res.json({ message: "You are authenticated!", user: req.user });
});

router.post('/login', async (req, res) => {
  const { email, pass } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });
  if (!(await bcrypt.compare(pass, user.pass))) return res.status(401).json({ success: false, message: "Invalid credentials" });
  if (user.status !== "Active") return res.status(403).json({ success: false, message: "Account inactive" });

  const token = jwt.sign(
    { email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
  res.json({ success: true, token, user: { email: user.email, role: user.role, name: user.name, mustChangePassword: user.mustChangePassword } });
});

// Get current user info (protected)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: { email: user.email, role: user.role, name: user.name } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;