const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  source: String,
  msgId: String,
  from: String,
  reply: String
});
const Reply = mongoose.model('ContactReply', ReplySchema);

router.get('/', auth, async (req, res) => {
  const replies = await Reply.find();
  res.json(replies);
});
router.post('/', auth, async (req, res) => {
  const reply = await Reply.create(req.body);
  res.json(reply);
});

module.exports = router;
