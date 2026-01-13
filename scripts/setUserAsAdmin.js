// backend/scripts/setUserAsAdmin.js
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function setUserAsAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get email from command line argument
    const email = process.argv[2];
    if (!email) {
      console.error('❌ Please provide an email address as argument');
      console.log('Usage: node scripts/setUserAsAdmin.js <email>');
      process.exit(1);
    }

    // Find and update user
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { userType: 'admin' },
      { new: true }
    );

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    console.log(`✅ Successfully set user "${user.name}" (${user.email}) as admin`);
    console.log(`   User ID: ${user._id}`);
    console.log(`   User Type: ${user.userType}`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setUserAsAdmin();
