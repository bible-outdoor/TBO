const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  user: { type: String },
  role: { type: String },
  action: { type: String },
  details: { type: String }
});

module.exports = mongoose.model('Log', logSchema);