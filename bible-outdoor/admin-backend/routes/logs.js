const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const auth = require('../middleware/auth');

// Get all logs (superadmin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden' });
    const logs = await Log.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add log (any admin action)
router.post('/', auth, async (req, res) => {
  try {
    const { user, role, action, details, timestamp } = req.body;
    const log = await Log.create({ user, role, action, details, timestamp: timestamp || new Date() });
    res.json({ success: true, log });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear all logs (superadmin only)
router.delete('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden' });
    await Log.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/activitylog/clear (for frontend compatibility)
router.post('/clear', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden' });
    await Log.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;