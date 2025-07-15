const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const auth = require('../middleware/auth');

// Get all donations
router.get('/', auth, async (req, res) => {
  const donations = await Donation.find();
  res.json(donations);
});

// Add donation (superadmin or supereditor)
router.post('/', auth, async (req, res) => {
  if (!['superadmin', 'supereditor'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  const { date, type, amount, from, purpose } = req.body;
  const donation = await Donation.create({ date, type, amount, from, purpose });
  res.json({ success: true, donation });
});

// Edit donation
router.put('/:id', auth, async (req, res) => {
  if (!['superadmin', 'supereditor'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  const { date, type, amount, from, purpose } = req.body;
  const donation = await Donation.findByIdAndUpdate(req.params.id, { date, type, amount, from, purpose }, { new: true });
  res.json({ success: true, donation });
});

// Delete donation
router.delete('/:id', auth, async (req, res) => {
  if (!['superadmin', 'supereditor'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  await Donation.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;