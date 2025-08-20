const express = require('express');
const router = express.Router();
const Library = require('../models/Library');
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer(); // memory storage
const { uploadMediaFromBuffer, deleteMedia, cloudinary } = require('../utils/cloudinary');

// Get all library items (public)
router.get('/', async (req, res) => {
  const items = await Library.find();
  res.json(items);
});

// Upload new library item (superadmin/supereditor)
router.post('/upload', auth, upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  console.log('Library upload route hit'); // Log when route is hit
  try {
    if (!['superadmin', 'supereditor'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    if (!req.files || !req.files.file) return res.status(400).json({ message: 'No file uploaded' });

    // Upload main file to Cloudinary using auto resource type to support images, videos, audio, and raw files (e.g., PDFs)
    const mainFile = req.files.file[0];
    const isPdfUpload = (mainFile.mimetype && mainFile.mimetype.toLowerCase() === 'application/pdf') ||
                        (mainFile.originalname && mainFile.originalname.toLowerCase().endsWith('.pdf'));
    const resourceTypeForMain = isPdfUpload ? 'raw' : 'auto';
    const fileResult = await uploadMediaFromBuffer(
      mainFile.buffer,
      resourceTypeForMain,
      'library',
      mainFile.originalname // Pass originalname to preserve extension for raw files
    );
    console.log('[Library Upload] main file resource_type=', fileResult.resource_type, 'type=', fileResult.type, 'secure_url=', fileResult.secure_url);
    const fileUrlToSave = fileResult.resource_type === 'raw'
      ? cloudinary.utils.private_download_url(fileResult.public_id, fileResult.format)
      : fileResult.secure_url;

    // Optional: upload cover image
    let coverUrl = '';
    let coverPublicId = '';
    if (req.files.cover && req.files.cover[0]) {
      const coverResult = await uploadMediaFromBuffer(req.files.cover[0].buffer, 'image', 'library_covers');
      coverUrl = coverResult.secure_url;
      coverPublicId = coverResult.public_id;
    }

    const { title, description, type, date } = req.body;
    const item = await Library.create({
      title,
      description,
      type,
      date,
      file: fileUrlToSave,
      public_id: fileResult.public_id,
      cover: coverUrl,
      cover_public_id: coverPublicId
    });

    res.json({ success: true, item });
  } catch (err) {
    console.error('Library upload error:', err); // Log any error
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

// Update library item (with optional file/cover replace)
router.put('/:id', auth, upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  if (!['superadmin', 'supereditor'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  const item = await Library.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Not found' });

  let { title, description, type, date } = req.body;
  let update = { title, description, type, date };

  // Replace main file if new file uploaded
  if (req.files.file && req.files.file[0]) {
    if (item.public_id) {
      // Determine resourceType for deletion based on item.type
      let resourceType = 'image';
      if (item.type === 'video' || item.type === 'audio') resourceType = 'video';
      else if (item.type === 'pdf' || item.type === 'raw') resourceType = 'raw';
      try {
        await deleteMedia(item.public_id, resourceType);
      } catch (err) {
        console.error('Cloudinary delete error:', err.message);
      }
    }
    // Upload replacement using auto resource type to correctly handle any file type
    const newFile = req.files.file[0];
    const isPdfReplacement = (newFile.mimetype && newFile.mimetype.toLowerCase() === 'application/pdf') ||
                             (newFile.originalname && newFile.originalname.toLowerCase().endsWith('.pdf'));
    const resourceTypeForReplacement = isPdfReplacement ? 'raw' : 'auto';
    const fileResult = await uploadMediaFromBuffer(
      newFile.buffer,
      resourceTypeForReplacement,
      'library',
      newFile.originalname // Pass originalname to preserve extension for raw files
    );
    console.log('[Library Update] replacement file resource_type=', fileResult.resource_type, 'type=', fileResult.type, 'secure_url=', fileResult.secure_url);
    update.file = fileResult.resource_type === 'raw'
      ? cloudinary.utils.private_download_url(fileResult.public_id, fileResult.format)
      : fileResult.secure_url;
    update.public_id = fileResult.public_id;
  }

  // Replace cover image if new cover uploaded
  if (req.files.cover && req.files.cover[0]) {
    if (item.cover_public_id) {
      try {
        await deleteMedia(item.cover_public_id, 'image');
      } catch (err) {
        console.error('Cloudinary cover delete error:', err.message);
      }
    }
    const coverResult = await uploadMediaFromBuffer(req.files.cover[0].buffer, 'image', 'library_covers');
    update.cover = coverResult.secure_url;
    update.cover_public_id = coverResult.public_id;
  }

  const updated = await Library.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json({ success: true, item: updated });
});

// Delete library item (and files from Cloudinary)
router.delete('/:id', auth, async (req, res) => {
  if (!['superadmin', 'supereditor'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  const item = await Library.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Not found' });

  // Delete main file from Cloudinary
  if (item.public_id) {
    let resourceType = 'image';
    if (item.type === 'video' || item.type === 'audio') resourceType = 'video';
    else if (item.type === 'pdf' || item.type === 'raw') resourceType = 'raw';
    try {
      await deleteMedia(item.public_id, resourceType);
    } catch (err) {
      console.error('Cloudinary delete error:', err.message);
    }
  }
  // Delete cover image from Cloudinary
  if (item.cover_public_id) {
    try {
      await deleteMedia(item.cover_public_id, 'image');
    } catch (err) {
      console.error('Cloudinary cover delete error:', err.message);
    }
  }
  await Library.findByIdAndDelete(req.params.id);

  res.json({ success: true });
});

module.exports = router;