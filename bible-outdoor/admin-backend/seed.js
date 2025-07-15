// seed.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const yargs = require('yargs');
const User = require('./models/User');

const argv = yargs
  .option('email', {
    describe: 'User email',
    demandOption: true,
    type: 'string'
  })
  .option('password', {
    describe: 'User password',
    demandOption: true,
    type: 'string'
  })
  .option('name', {
    describe: 'Full name',
    demandOption: true,
    type: 'string'
  })
  .option('role', {
    describe: 'User role',
    demandOption: true,
    choices: ['superadmin', 'admin', 'editor', 'viewer'],
    type: 'string'
  })
  .help()
  .argv;

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const hashed = await bcrypt.hash(argv.password, 10);

    const updated = await User.findOneAndUpdate(
      { email: argv.email },
      {
        $set: {
          pass: hashed,
          name: argv.name,
          role: argv.role,
          status: "Active"
        }
      },
      { upsert: true, new: true } // create if not found
    );

    console.log(`✅ User "${updated.email}" has been added or updated.`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    mongoose.disconnect();
  }
}

seed();
