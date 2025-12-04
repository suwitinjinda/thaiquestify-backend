// server/scripts/simple-seed.js
require('dotenv').config();
const mongoose = require('mongoose');

const simpleSeed = async () => {
  try {
    console.log('🚀 Starting simple seed...');
    
    // Connect
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // ใช้ mongoose connection โดยตรง
    const db = mongoose.connection.db;
    
    // สร้าง partner อย่างง่าย
    const partnersCollection = db.collection('partners');
    const partner = await partnersCollection.insertOne({
      shopName: "Test Cafe Simple",
      category: "Coffee",
      address: "456 Simple Street",
      contact: { email: "simple@cafe.com", phone: "0822222222" },
      createdAt: new Date()
    });
    
    console.log('✅ Partner created:', partner.insertedId);
    
    // สร้าง quest อย่างง่าย - ต้องมี qrCode
    const questsCollection = db.collection('quests');
    const quest = await questsCollection.insertOne({
      title: "Simple Test Quest",
      description: "ภารกิจทดสอบอย่างง่าย",
      partnerId: partner.insertedId,
      reward: "10% OFF",
      points: 10,
      qrCode: `simple-quest-${Date.now()}-${Math.random()}`, // เพิ่ม qrCode
      isActive: true,
      createdAt: new Date()
    });
    
    console.log('✅ Quest created:', quest.insertedId);
    console.log('🎉 Simple seed completed!');
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Simple seed failed:', error.message);
    process.exit(1);
  }
};

simpleSeed();