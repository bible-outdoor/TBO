const express = require('express');
const router = express.Router();
const Testimony = require('../models/Testimony');
const auth = require('../middleware/auth');

// Get all testimonies (admin: see all, public: only approved)
router.get('/', auth, async (req, res) => {
  // Only superadmin/supereditor can see all, others see only approved
  if (['superadmin', 'supereditor'].includes(req.user.role)) {
    const testimonies = await Testimony.find().sort({ date: -1 });
    return res.json(testimonies);
  } else {
    const testimonies = await Testimony.find({ approved: true }).sort({ date: -1 });
    return res.json(testimonies);
  }
});

// Public route for homepage (only approved)
router.get('/public', async (req, res) => {
  const testimonies = await Testimony.find({ approved: true }).sort({ date: -1 });
  res.json(testimonies);
});

// Add a testimony (public, or you can add auth if needed)
router.post('/', async (req, res) => {
  const { name, message } = req.body;
  const testimony = await Testimony.create({ name, message });
  res.json({ success: true, testimony });
});

// Approve a testimony (admin only)
router.put('/:id/approve', auth, async (req, res) => {
  if (!['superadmin', 'supereditor'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  const testimony = await Testimony.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
  res.json({ success: true, testimony });
});

// Delete a testimony (admin only)
router.delete('/:id', auth, async (req, res) => {
  if (!['superadmin', 'supereditor'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  await Testimony.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
