// scripts/checkAcceptedDelivery.js - Check if delivery was created after accepting
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const Delivery = require('../models/Delivery');
const DeliveryRequest = require('../models/DeliveryRequest');
const Order = require('../models/Order');
const Rider = require('../models/Rider');
const User = require('../models/User');
const Shop = require('../models/Shop');

async function checkAcceptedDelivery() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all riders
    const riders = await Rider.find({ status: 'active' })
      .populate('user', 'name email')
      .lean();

    console.log(`👥 Found ${riders.length} active riders\n`);

    for (const rider of riders) {
      const riderUserId = rider.user?._id || rider.user;
      
      console.log('='.repeat(60));
      console.log(`🔍 Checking rider: ${rider.riderCode || rider._id}`);
      console.log(`   - User ID: ${riderUserId?.toString() || 'N/A'}`);
      console.log(`   - User Name: ${rider.user?.name || 'N/A'}`);
      console.log('');

      // Check deliveries assigned to this rider (by User ID)
      const deliveries = await Delivery.find({
        rider: riderUserId
      })
        .populate('order', 'orderNumber status')
        .populate('shop', 'shopName')
        .sort({ createdAt: -1 })
        .lean();

      console.log(`📦 Deliveries assigned to this rider: ${deliveries.length}`);
      
      if (deliveries.length > 0) {
        deliveries.forEach((delivery, index) => {
          console.log(`\n   ${index + 1}. Delivery: ${delivery._id}`);
          console.log(`      - Order: ${delivery.order?.orderNumber || 'N/A'}`);
          console.log(`      - Shop: ${delivery.shop?.shopName || 'N/A'}`);
          console.log(`      - Status: ${delivery.status}`);
          console.log(`      - Rider (User ID): ${delivery.rider?.toString() || 'null'}`);
          console.log(`      - Created: ${new Date(delivery.createdAt).toISOString()}`);
        });
      } else {
        console.log(`   ⚠️ No deliveries found for this rider`);
      }

      // Check delivery requests accepted by this rider
      const acceptedRequests = await DeliveryRequest.find({
        rider: riderUserId,
        status: { $in: ['accepted', 'in_progress'] }
      })
        .populate('order', 'orderNumber status')
        .populate('shop', 'shopName')
        .sort({ acceptedAt: -1 })
        .lean();

      console.log(`\n📋 Delivery requests accepted by this rider: ${acceptedRequests.length}`);
      
      if (acceptedRequests.length > 0) {
        acceptedRequests.forEach((request, index) => {
          console.log(`\n   ${index + 1}. Request: ${request.requestNumber || request._id}`);
          console.log(`      - Order: ${request.order?.orderNumber || 'N/A'}`);
          console.log(`      - Shop: ${request.shop?.shopName || 'N/A'}`);
          console.log(`      - Status: ${request.status}`);
          console.log(`      - Rider (User ID): ${request.rider?.toString() || 'null'}`);
          console.log(`      - Accepted At: ${request.acceptedAt ? new Date(request.acceptedAt).toISOString() : 'N/A'}`);
        });
      }

      // Check pending delivery requests (should not have rider)
      const pendingRequests = await DeliveryRequest.find({
        status: 'pending',
        rider: null
      })
        .populate('order', 'orderNumber status')
        .populate('shop', 'shopName')
        .sort({ createdAt: -1 })
        .lean();

      console.log(`\n⏳ Pending delivery requests (no rider): ${pendingRequests.length}`);
      
      if (pendingRequests.length > 0) {
        pendingRequests.forEach((request, index) => {
          console.log(`\n   ${index + 1}. Request: ${request.requestNumber || request._id}`);
          console.log(`      - Order: ${request.order?.orderNumber || 'N/A'}`);
          console.log(`      - Shop: ${request.shop?.shopName || 'N/A'}`);
          console.log(`      - Status: ${request.status}`);
          console.log(`      - Created: ${new Date(request.createdAt).toISOString()}`);
        });
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
checkAcceptedDelivery();
