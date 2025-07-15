const mongoose = require('mongoose');

const sermonSchema = new mongoose.Schema({
  type: { type: String }, // Daily, Weekly
  title: { type: String },
  ref: { type: String },
  verse: { type: String },
  teaching: { type: String }
});

module.exports = mongoose.model('Sermon', sermonSchema);