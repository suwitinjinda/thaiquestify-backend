// server/scripts/test-connection.js
require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
  try {
    console.log('🧪 Testing MongoDB Connection...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Connection Successful!');
    
    // Test basic operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Collections: ${collections.map(c => c.name).join(', ')}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection Failed:', error.message);
    process.exit(1);
  }
};

testConnection();