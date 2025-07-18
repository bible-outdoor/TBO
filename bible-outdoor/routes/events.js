const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const multer = require('multer');
const { uploadMediaFromBuffer, deleteMedia } = require('../utils/cloudinary');

// Multer config for image upload (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed!'));
  }
});

// Get all events (public)
router.get('/', async (req, res) => {
  const events = await Event.find();
  // Add 'img' property for frontend compatibility
  const eventsWithImg = events.map(event => ({
    ...event.toObject(),
    img: event.imageUrl
  }));
  res.json(eventsWithImg);
});

// Add event (superadmin or supereditor)
router.post('/', auth, upload.single('image'), async (req, res) => {
  if (!['superadmin', 'supereditor', 'editor'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  try {
    let imageUrl = '', imagePublicId = '';
    if (req.file) {
      const result = await uploadMediaFromBuffer(req.file.buffer, 'image', 'events');
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }
    const { title, date, host, desc } = req.body;
    const event = await Event.create({ title, date, host, desc, imageUrl, imagePublicId });
    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Edit event (superadmin or supereditor)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  if (!['superadmin', 'supereditor', 'editor'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Update fields only if present in the request
    if (typeof req.body.title !== "undefined") event.title = req.body.title;
    if (typeof req.body.date !== "undefined") event.date = req.body.date;
    if (typeof req.body.host !== "undefined") event.host = req.body.host;
    if (typeof req.body.desc !== "undefined") event.desc = req.body.desc;

    // Handle image replacement
    if (req.file) {
      if (event.imagePublicId) await deleteMedia(event.imagePublicId, 'image');
      const result = await uploadMediaFromBuffer(req.file.buffer, 'image', 'events');
      event.imageUrl = result.secure_url;
      event.imagePublicId = result.public_id;
    }

    await event.save();
    res.json({ success: true, event });
  } catch (err) {
    console.error(err); // This will help you debug in your server logs
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete event (superadmin or supereditor)
router.delete('/:id', auth, async (req, res) => {
  if (!['superadmin', 'supereditor', 'editor'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.imagePublicId) await deleteMedia(event.imagePublicId, 'image');
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;