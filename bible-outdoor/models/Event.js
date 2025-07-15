const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String },
  host: { type: String },
  desc: { type: String },
  imageUrl: { type: String },      // Cloudinary secure_url
  imagePublicId: { type: String }  // Cloudinary public_id
});

module.exports = mongoose.model('Event', eventSchema);