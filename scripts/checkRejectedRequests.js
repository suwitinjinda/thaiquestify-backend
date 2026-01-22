// scripts/checkRejectedRequests.js - Check rejected delivery requests
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const DeliveryRequest = require('../models/DeliveryRequest');
const Order = require('../models/Order');
const Shop = require('../models/Shop');

async function checkRejectedRequests() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get pending delivery requests with rejectedBy
    const pendingRequests = await DeliveryRequest.find({
      status: 'pending',
      rider: null,
      rejectedBy: { $exists: true, $ne: [] }
    })
      .populate('shop', 'shopName')
      .populate('order', 'orderNumber status createdAt')
      .lean();

    console.log(`📦 Found ${pendingRequests.length} pending requests that were rejected\n`);

    for (const request of pendingRequests) {
      console.log(`📋 Request: ${request.requestNumber || request._id}`);
      console.log(`   - Order: ${request.order?.orderNumber || 'N/A'}`);
      console.log(`   - Shop: ${request.shop?.shopName || 'N/A'}`);
      console.log(`   - Status: ${request.status}`);
      console.log(`   - Created: ${new Date(request.createdAt).toISOString()}`);
      console.log(`   - RejectedBy: ${request.rejectedBy?.map(id => id.toString()).join(', ') || '[]'}`);
      console.log(`   - Order Status: ${request.order?.status || 'N/A'}`);
      console.log(`   - Order Created: ${request.order?.createdAt ? new Date(request.order.createdAt).toISOString() : 'N/A'}`);
      
      // Check if order is old (more than 1 day)
      if (request.order?.createdAt) {
        const orderAge = new Date() - new Date(request.order.createdAt);
        const daysOld = Math.floor(orderAge / (1000 * 60 * 60 * 24));
        const hoursOld = Math.floor((orderAge % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        console.log(`   - Order Age: ${daysOld} days, ${hoursOld} hours`);
        
        if (daysOld >= 1) {
          console.log(`   ⚠️ Order is more than 1 day old - should be cancelled`);
        }
      }
      console.log('');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
checkRejectedRequests();
