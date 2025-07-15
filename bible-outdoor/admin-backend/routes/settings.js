const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: mongoose.Schema.Types.Mixed
});
const Setting = mongoose.models.Setting || mongoose.model('Setting', SettingSchema);

// Sunday Service
router.get('/sunday', async (req, res) => {
  let doc = await Setting.findOne({ key: 'sunday' });
  res.json(doc ? doc.value : { youtube: '', live: false });
});
router.put('/sunday', auth, async (req, res) => {
  if (!['superadmin', 'supereditor'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  let doc = await Setting.findOneAndUpdate(
    { key: 'sunday' },
    { value: req.body },
    { upsert: true, new: true }
  );
  res.json(doc.value);
});

// Donation Settings
router.get('/donation', async (req, res) => {
  let doc = await Setting.findOne({ key: 'donation' });
  res.json(doc ? doc.value : { paypal: '', mpesa: '', message: '' });
});
router.put('/donation', auth, async (req, res) => {
  if (!['superadmin', 'supereditor'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  let doc = await Setting.findOneAndUpdate(
    { key: 'donation' },
    { value: req.body },
    { upsert: true, new: true }
  );
  res.json(doc.value);
});

// Site Settings
router.get('/site', async (req, res) => {
  let doc = await Setting.findOne({ key: 'site' });
  // Always return these fields, even if doc is missing or fields are missing
  const value = doc ? doc.value : {};
  res.json({
    pastor: value.pastor || "",
    phone: value.phone || "",
    email: value.email || "",
    address: value.address || "",
    tiktok: value.tiktok || "",
    facebook: value.facebook || "",
    youtube: value.youtube || "",
    title: value.title || "",
    location: value.location || "",
    footer: value.footer || "",
    favicon: value.favicon || ""
  });
});
router.put('/site', auth, async (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden' });
  let doc = await Setting.findOneAndUpdate(
    { key: 'site' },
    { value: req.body },
    { upsert: true, new: true }
  );
  res.json(doc.value);
});

module.exports = router;
module.exports = router;
