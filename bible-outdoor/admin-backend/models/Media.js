const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  type: { type: String }, // img, video, audio
  title: { type: String },
  date: { type: String },
  data: { type: String },
  public_id: { type: String } // <-- Add this line!
});

module.exports = mongoose.model('Media', mediaSchema);