const express = require('express');
const router = express.Router();
const Media = require('../models/Media');
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer(); // memory storage
const { uploadMediaFromBuffer, deleteMedia } = require('../utils/cloudinary');

// Get all media (public, no auth)
router.get('/', async (req, res) => {
  const media = await Media.find();
  res.json(media);
});

// Add media (superadmin or supereditor)
router.post('/', auth, async (req, res) => {
  if (!['superadmin', 'supereditor'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  const { type, title, date, data } = req.body;
  const media = await Media.create({ type, title, date, data });
  res.json({ success: true, media });
});

// Edit media (with optional file replace)
router.put('/:id', auth, upload.single('file'), async (req, res) => {
  if (!['superadmin', 'supereditor'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  const media = await Media.findById(req.params.id);
  if (!media) return res.status(404).json({ message: 'Not found' });

  let { type, title, date } = req.body;
  let update = { type, title, date };

  // If a new file is uploaded, replace in Cloudinary
  if (req.file) {
    // Delete old from Cloudinary if exists
    if (media.public_id) {
      let resourceType = 'image';
      if (media.type === 'video' || media.type === 'audio') resourceType = 'video';
      try { await deleteMedia(media.public_id, resourceType); } catch (e) {}
    }
    // Upload new file
    let resourceType = 'auto';
    if (req.file.mimetype.startsWith('image/')) resourceType = 'image';
    else if (req.file.mimetype.startsWith('video/')) resourceType = 'video';
    else if (req.file.mimetype.startsWith('audio/')) resourceType = 'video';
    const result = await uploadMediaFromBuffer(req.file.buffer, resourceType, 'media');
    update.data = result.secure_url;
    update.public_id = result.public_id;
  }

  const updated = await Media.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json({ success: true, media: updated });
});

// Delete media
router.delete('/:id', auth, async (req, res) => {
  if (!['superadmin', 'supereditor'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  const media = await Media.findById(req.params.id);
  if (!media) return res.status(404).json({ message: 'Not found' });

  // Remove from Cloudinary if public_id exists
  if (media.public_id) {
    // Determine resource type for Cloudinary destroy
    let resourceType = 'image';
    if (media.type === 'video' || media.type === 'audio') resourceType = 'video';
    try {
      await deleteMedia(media.public_id, resourceType);
    } catch (err) {
      // Log error but continue with DB delete
      console.error('Cloudinary delete error:', err.message);
    }
  }
  await Media.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Media upload endpoint (superadmin/supereditor)
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  if (!['superadmin', 'supereditor'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  // Determine resource type for Cloudinary
  let resourceType = 'auto';
  if (req.file.mimetype.startsWith('image/')) resourceType = 'image';
  else if (req.file.mimetype.startsWith('video/')) resourceType = 'video';
  else if (req.file.mimetype.startsWith('audio/')) resourceType = 'video'; // Cloudinary treats audio as 'video'

  try {
    const result = await uploadMediaFromBuffer(req.file.buffer, resourceType, 'media');
    // Save to MongoDB
    const { title = '', date = '', type = resourceType } = req.body;
    const media = await Media.create({
      type,
      title,
      date,
      data: result.secure_url,
      public_id: result.public_id
    });
    res.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      media
    });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

module.exports = router;