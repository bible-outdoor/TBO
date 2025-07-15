const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');

// Public endpoint: anyone can log a donation (no auth)
router.post('/', async (req, res) => {
  const { date, type, amount, from, purpose } = req.body;
  if (!type || !amount) return res.status(400).json({ message: 'Missing required fields' });
  try {
    const donation = await Donation.create({ date: date || new Date().toISOString(), type, amount, from, purpose });
    res.json({ success: true, donation });
  } catch (err) {
    res.status(500).json({ message: 'Failed to log donation' });
  }
});

// Public GET: anyone can fetch all donations (for debugging or public logs)
router.get('/', async (req, res) => {
  try {
    const donations = await Donation.find();
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch donations' });
  }
});

module.exports = router;
