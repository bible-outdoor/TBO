const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);

async function fixUsers() {
  // Update users: copy gmail to email, then remove gmail
  await User.updateMany(
    { gmail: { $exists: true } },
    [
      { $set: { email: "$gmail" } },
      { $unset: "gmail" }
    ]
  );
  console.log("Users updated.");
  mongoose.disconnect();
}

fixUsers();
