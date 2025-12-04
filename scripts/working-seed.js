// server/scripts/working-seed.js
require('dotenv').config();
const mongoose = require('mongoose');

const workingSeed = async () => {
  try {
    console.log('🚀 Starting working seed...');
    
    // Connect with simple options
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // 1. สร้าง partners
    const partners = [
      {
        shopName: "Bluebird Coffee",
        category: "Coffee",
        description: "ร้านกาแฟ specialty coffee",
        address: "อารีย์, กรุงเทพ",
        contact: { email: "info@bluebird.com", phone: "0821112222" },
        createdAt: new Date()
      },
      {
        shopName: "Book & Brew", 
        category: "Bookstore",
        description: "ร้านหนังสือและคาเฟ่",
        address: "สยามสแควร์, กรุงเทพ",
        contact: { email: "hello@bookbrew.com", phone: "0833334444" },
        createdAt: new Date()
      }
    ];
    
    const partnerResults = await db.collection('partners').insertMany(partners);
    console.log('✅ Partners created:', partnerResults.insertedCount);
    
    // 2. สร้าง quests (มี qrCode unique)
    const quests = [
      {
        title: "Coffee Discovery Quest",
        description: "เยี่ยมชมร้านกาแฟและลองเมนูแนะนำ",
        partnerId: partnerResults.insertedIds[0],
        reward: "ส่วนลด 10% สำหรับออเดอร์ต่อไป",
        points: 20,
        qrCode: `quest-coffee-${Date.now()}-1`,
        isActive: true,
        createdAt: new Date()
      },
      {
        title: "Book Lover Adventure",
        description: "หาหนังสือใหม่และแบ่งปันการอ่าน",
        partnerId: partnerResults.insertedIds[1], 
        reward: "ส่วนลด 15% สำหรับหนังสือ",
        points: 25,
        qrCode: `quest-book-${Date.now()}-2`,
        isActive: true,
        createdAt: new Date()
      }
    ];
    
    const questResults = await db.collection('quests').insertMany(quests);
    console.log('✅ Quests created:', questResults.insertedCount);
    
    console.log('🎉 Working seed completed successfully!');
    console.log('📊 Total:', partnerResults.insertedCount + questResults.insertedCount, 'documents created');
    
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    
  } catch (error) {
    console.error('❌ Working seed failed:', error.message);
    
    // Close connection if open
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    process.exit(1);
  }
};

workingSeed();