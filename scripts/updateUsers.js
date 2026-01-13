// Script to manually update users in database
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

async function updateUsers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Update munmunback@gmail.com (admin)
    const adminEmail = 'munmunback@gmail.com';
    const adminUpdate = await User.findOneAndUpdate(
      { email: adminEmail.toLowerCase() },
      {
        $set: {
          userType: 'admin',
          points: 1000
        }
      },
      { new: true }
    );

    if (adminUpdate) {
      console.log(`✅ Updated admin user: ${adminEmail}`);
      console.log(`   - Role: ${adminUpdate.userType}`);
      console.log(`   - Points: ${adminUpdate.points}`);
    } else {
      console.log(`⚠️  Admin user not found: ${adminEmail}`);
    }

    // Update munmunsignal@gmail.com (user)
    const userEmail = 'munmunsignal@gmail.com';
    const userUpdate = await User.findOneAndUpdate(
      { email: userEmail.toLowerCase() },
      {
        $set: {
          userType: 'customer',
          points: 1000
        }
      },
      { new: true }
    );

    if (userUpdate) {
      console.log(`✅ Updated user: ${userEmail}`);
      console.log(`   - Role: ${userUpdate.userType}`);
      console.log(`   - Points: ${userUpdate.points}`);
    } else {
      console.log(`⚠️  User not found: ${userEmail}`);
    }

    console.log('\n✅ User update completed!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating users:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

updateUsers();
