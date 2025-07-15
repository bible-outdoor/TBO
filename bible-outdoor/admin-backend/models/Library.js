const mongoose = require('mongoose');

const librarySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String }, // pdf, video, audio, image, etc.
  cover: { type: String }, // cover image URL (optional)
  file: { type: String },  // main file URL (Cloudinary)
  public_id: { type: String }, // Cloudinary public_id for main file
  cover_public_id: { type: String }, // Cloudinary public_id for cover image (optional)
  date: { type: String }
});

module.exports = mongoose.model('Library', librarySchema);