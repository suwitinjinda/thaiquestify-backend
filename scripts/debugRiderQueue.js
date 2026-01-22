// scripts/debugRiderQueue.js - Debug why rider doesn't see orders in queue
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const DeliveryRequest = require('../models/DeliveryRequest');
const Rider = require('../models/Rider');
const Order = require('../models/Order');
const Shop = require('../models/Shop');
const deliveryAssignmentService = require('../services/deliveryAssignmentService');

async function debugRiderQueue() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all active riders
    const riders = await Rider.find({
      status: 'active',
      isAvailable: true
    })
      .populate('user', 'name email')
      .lean();

    console.log(`👥 Found ${riders.length} active and available riders\n`);

    // Get pending delivery requests
    const pendingRequests = await DeliveryRequest.find({
      status: 'pending',
      rider: null
    })
      .populate('shop', 'shopName shopId coordinates')
      .populate('order', 'orderNumber status orderType')
      .lean();

    console.log(`📦 Found ${pendingRequests.length} pending delivery requests\n`);

    for (const rider of riders) {
      console.log('='.repeat(60));
      console.log(`🔍 Checking rider: ${rider.riderCode || rider._id}`);
      console.log(`   - User: ${rider.user?.name || 'N/A'}`);
      console.log(`   - Status: ${rider.status}`);
      console.log(`   - IsAvailable: ${rider.isAvailable}`);
      console.log(`   - Has coordinates: ${!!(rider.coordinates?.latitude)}`);
      console.log(`   - Coordinates: lat=${rider.coordinates?.latitude || 'N/A'}, lng=${rider.coordinates?.longitude || 'N/A'}`);
      console.log(`   - Service radius: ${rider.serviceRadius}km`);
      console.log(`   - RejectedBy: ${rider.user?._id?.toString() || rider.user?.toString() || 'N/A'}`);
      console.log('');

      if (!rider.coordinates || !rider.coordinates.latitude) {
        console.log(`   ❌ Rider has no coordinates - cannot see orders\n`);
        continue;
      }

      // Check each pending request
      for (const request of pendingRequests) {
        console.log(`   📋 Checking request: ${request.requestNumber || request._id}`);
        console.log(`      - Order: ${request.order?.orderNumber || 'N/A'}`);
        console.log(`      - Shop: ${request.shop?.shopName || 'N/A'}`);
        console.log(`      - Status: ${request.status}`);
        console.log(`      - Rider: ${request.rider?.toString() || 'null'}`);
        console.log(`      - RejectedBy: ${request.rejectedBy?.map(id => id.toString()).join(', ') || '[]'}`);
        
        // Check if rejected by this rider
        const rejectedBy = request.rejectedBy || [];
        const isRejected = rejectedBy.some(rejectedId => {
          const rejectedIdStr = rejectedId.toString();
          const riderUserId = rider.user?._id?.toString() || rider.user?.toString();
          return rejectedIdStr === riderUserId;
        });
        
        console.log(`      - Is rejected by this rider: ${isRejected ? 'YES ❌' : 'NO ✅'}`);
        
        if (isRejected) {
          console.log(`      ⚠️ SKIPPED: Request was rejected by this rider\n`);
          continue;
        }

        // Check shop coordinates
        if (!request.shop || !request.shop.coordinates) {
          console.log(`      ⚠️ SKIPPED: Shop has no coordinates\n`);
          continue;
        }

        if (!request.shop.coordinates.latitude || !request.shop.coordinates.longitude) {
          console.log(`      ⚠️ SKIPPED: Shop coordinates are invalid\n`);
          continue;
        }

        // Calculate distance
        const distanceToShop = deliveryAssignmentService.calculateDistance(
          rider.coordinates.latitude,
          rider.coordinates.longitude,
          request.shop.coordinates.latitude,
          request.shop.coordinates.longitude
        );

        const totalDistance = distanceToShop + (request.distance || 0);

        console.log(`      - Distance to shop: ${distanceToShop.toFixed(2)}km`);
        console.log(`      - Shop to customer: ${request.distance || 0}km`);
        console.log(`      - Total distance: ${totalDistance.toFixed(2)}km`);
        console.log(`      - Service radius: ${rider.serviceRadius}km`);
        console.log(`      - Within radius: ${totalDistance <= rider.serviceRadius ? 'YES ✅' : 'NO ❌'}`);

        if (totalDistance > rider.serviceRadius) {
          console.log(`      ⚠️ SKIPPED: Outside service radius (${totalDistance.toFixed(2)}km > ${rider.serviceRadius}km)\n`);
          continue;
        }

        console.log(`      ✅ SHOULD BE VISIBLE to this rider\n`);
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
debugRiderQueue();
