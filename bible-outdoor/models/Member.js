const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'member' },
  createdAt: { type: Date, default: Date.now },
  verificationCode: { type: String },
  isVerified: { type: Boolean, default: false },
  resetCode: { type: String },
  resetCodeExpires: { type: Date }
});

module.exports = mongoose.model('Member', memberSchema);
