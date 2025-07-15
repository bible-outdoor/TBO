const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  date: { type: String },
  type: { type: String },
  amount: { type: Number },
  from: { type: String },
  purpose: { type: String }
});

module.exports = mongoose.model('Donation', donationSchema);