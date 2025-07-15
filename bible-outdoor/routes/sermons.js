const express = require('express');
const router = express.Router();
const Sermon = require('../models/Sermon');
const auth = require('../middleware/auth');

// Get all sermons
router.get('/', async (req, res) => {
  const sermons = await Sermon.find();
  res.json(sermons);
});

// Add sermon (superadmin or supereditor)
router.post('/', auth, async (req, res) => {
  if (!['superadmin', 'supereditor'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  const { type, title, ref, verse, teaching } = req.body;
  const sermon = await Sermon.create({ type, title, ref, verse, teaching });
  res.json({ success: true, sermon });
});

// Edit sermon
router.put('/:id', auth, async (req, res) => {
  if (!['superadmin', 'supereditor'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  const { type, title, ref, verse, teaching } = req.body;
  const sermon = await Sermon.findByIdAndUpdate(req.params.id, { type, title, ref, verse, teaching }, { new: true });
  res.json({ success: true, sermon });
});

// Delete sermon
router.delete('/:id', auth, async (req, res) => {
  if (!['superadmin', 'supereditor'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  await Sermon.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;