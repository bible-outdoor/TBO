const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  desc: { type: String },
  date: { type: String },
  imageUrl: { type: String }, // Cloudinary secure_url
  imagePublicId: { type: String } // Cloudinary public_id
});

module.exports = mongoose.model('Product', productSchema);