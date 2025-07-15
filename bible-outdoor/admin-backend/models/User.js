const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  pass: { type: String, required: true },
  role: { type: String, default: 'editor' },
  status: { type: String, default: 'Active' },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  oneTimeToken: { type: String },
  oneTimeTokenExpires: { type: Date },
  mustChangePassword: { type: Boolean, default: false }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('pass')) return next();
  this.pass = await bcrypt.hash(this.pass, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);