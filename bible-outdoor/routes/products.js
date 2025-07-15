const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
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

// Get all products (public)
router.get('/', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// Add product (superadmin or supereditor)
router.post('/', auth, upload.single('image'), async (req, res) => {
  if (!['superadmin', 'supereditor'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  try {
    let imageUrl = '', imagePublicId = '';
    if (req.file) {
      const result = await uploadMediaFromBuffer(req.file.buffer, 'image', 'products');
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }
    const { name, price, desc, date } = req.body;
    const product = await Product.create({ name, price, desc, date, imageUrl, imagePublicId });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Edit product (superadmin or supereditor)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  if (!['superadmin', 'supereditor'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    let imageUrl = product.imageUrl;
    let imagePublicId = product.imagePublicId;
    // If new image uploaded, replace old one
    if (req.file) {
      if (imagePublicId) await deleteMedia(imagePublicId, 'image');
      const result = await uploadMediaFromBuffer(req.file.buffer, 'image', 'products');
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }
    const { name, price, desc, date } = req.body;
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, desc, date, imageUrl, imagePublicId },
      { new: true }
    );
    res.json({ success: true, product: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete product (superadmin or supereditor)
router.delete('/:id', auth, async (req, res) => {
  if (!['superadmin', 'supereditor'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.imagePublicId) await deleteMedia(product.imagePublicId, 'image');
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;