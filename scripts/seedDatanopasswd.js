// backend/scripts/seedDataNoPassword.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Shop = require('../models/Shop');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Shop.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create test users WITHOUT passwords
    const testUsers = [
      {
        name: 'Admin User',
        email: 'admin@thaiquestify.com',
        // NO PASSWORD FIELD
        userType: 'admin',
        partnerCode: null,
        phone: '0812345678',
        isActive: true
      },
      {
        name: 'Jane Partner',
        email: 'partner@gmail.com',
        // NO PASSWORD FIELD  
        userType: 'partner',
        partnerCode: 'PARTNER001',
        phone: '0898765432',
        isActive: true
      },
      {
        name: 'Shop Owner',
        email: 'shop@example.com',
        // NO PASSWORD FIELD
        userType: 'shop',
        partnerCode: null,
        phone: '0822334455',
        isActive: true
      },
      {
        name: 'John Customer',
        email: 'customer@example.com',
        // NO PASSWORD FIELD
        userType: 'customer',
        partnerCode: null,
        phone: '0833445566',
        isActive: true
      }
    ];

    const createdUsers = await User.insertMany(testUsers);
    console.log('👥 Created test users without passwords');

    // Create test shops
    const testShops = [
      {
        shopId: '123456',
        partnerId: createdUsers[1]._id, // Jane Partner
        partnerCode: 'PARTNER001',
        shopName: 'ร้านกาแฟน่านฟ้า',
        shopType: 'Restaurant/Cafe',
        province: 'เชียงใหม่',
        district: 'เมืองเชียงใหม่',
        address: '123 ถนนนิมมานเหมินท์',
        phone: '053-123-456',
        businessHours: '08:00 - 20:00',
        description: 'ร้านกาแฟสวยในเชียงใหม่',
        status: 'active',
        registeredAt: new Date(),
        approvedAt: new Date(),
        approvedBy: createdUsers[0]._id, // Admin User
        settings: {
          commissionRate: 10,
          autoApproveQuests: false
        }
      },
      {
        shopId: '654321',
        partnerId: createdUsers[1]._id, // Jane Partner
        partnerCode: 'PARTNER001',
        shopName: 'ร้านข้าวซอยป้าเล็ก',
        shopType: 'Restaurant/Cafe',
        province: 'เชียงใหม่',
        district: 'ศรีภูมิ',
        address: '456 ถนนราชดำเนิน',
        phone: '053-987-654',
        businessHours: '09:00 - 18:00',
        description: 'ร้านข้าวซอยชื่อดัง',
        status: 'pending',
        registeredAt: new Date(),
        settings: {
          commissionRate: 10,
          autoApproveQuests: false
        }
      }
    ];

    await Shop.insertMany(testShops);
    console.log('🏪 Created test shops');

    console.log('✅ Seed data completed successfully!');
    console.log('\n📋 Test Users Created (No Passwords):');
    createdUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.userType}`);
    });

    process.exit(0);

  } catch (error) {
    console.error('❌ Seed data error:', error);
    process.exit(1);
  }
}

seedData();