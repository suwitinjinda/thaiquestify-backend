// Script to fix DeliveryRequest status from cancelled to pending
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const DeliveryRequest = require('../models/DeliveryRequest');
const Shop = require('../models/Shop');
const User = require('../models/User');
const deliveryAssignmentService = require('../services/deliveryAssignmentService');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

async function fixDeliveryRequestStatus() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to database\n');

    // Find cancelled DeliveryRequests
    const cancelledRequests = await DeliveryRequest.find({ status: 'cancelled' })
      .populate('shop', 'shopName shopId coordinates')
      .populate('order', 'orderNumber');

    console.log(`📋 Found ${cancelledRequests.length} cancelled DeliveryRequests\n`);

    if (cancelledRequests.length === 0) {
      console.log('✅ No cancelled DeliveryRequests to fix!');
      await mongoose.connection.close();
      return;
    }

    let fixedCount = 0;
    let errorCount = 0;

    for (const request of cancelledRequests) {
      try {
        console.log(`\n📦 Processing DeliveryRequest ${request.requestNumber || request._id.toString()}:`);
        console.log(`   - Order: ${request.order?.orderNumber || 'N/A'}`);
        console.log(`   - Shop: ${request.shop?.shopName || 'N/A'}`);
        console.log(`   - Current Status: ${request.status}`);
        console.log(`   - Current Distance: ${request.distance}km`);
        console.log(`   - Current Rider: ${request.rider || 'null'}`);

        // Get order to find user
        const Order = require('../models/Order');
        const order = await Order.findById(request.order)
          .populate('user', 'name coordinates shippingAddress');

        if (!order || !order.user) {
          console.log(`   ⚠️  Order or user not found, skipping`);
          errorCount++;
          continue;
        }

        const shop = request.shop;
        const user = order.user;

        // Fix distance if it's invalid (too large)
        let distance = request.distance;
        let deliveryCoords = request.deliveryCoordinates;

        // Try to recalculate distance if coordinates are available
        const userCoords = user.shippingAddress?.coordinates || user.coordinates;
        
        if (userCoords && shop?.coordinates && userCoords.latitude && userCoords.longitude) {
          deliveryCoords = {
            latitude: userCoords.latitude,
            longitude: userCoords.longitude,
          };
          distance = deliveryAssignmentService.calculateDistance(
            shop.coordinates.latitude,
            shop.coordinates.longitude,
            userCoords.latitude,
            userCoords.longitude
          );
          console.log(`   ✅ Recalculated distance: ${distance.toFixed(2)}km`);
        } else if (distance > 100) {
          // If distance is unreasonably large, use default
          distance = 2;
          console.log(`   ⚠️  Distance too large, using default: ${distance}km`);
        }

        // Update status to pending and fix distance/coordinates
        request.status = 'pending';
        request.distance = distance;
        if (deliveryCoords) {
          request.deliveryCoordinates = deliveryCoords;
        }
        request.rider = null; // Ensure no rider is assigned

        await request.save();
        console.log(`   ✅ Fixed: Status changed to 'pending', Distance: ${distance.toFixed(2)}km`);
        fixedCount++;

      } catch (error) {
        console.error(`   ❌ Error processing DeliveryRequest ${request._id.toString()}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully fixed: ${fixedCount} DeliveryRequests`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));

    // Final check
    const pendingDeliveryRequests = await DeliveryRequest.countDocuments({ 
      status: 'pending', 
      rider: null 
    });
    console.log(`\n📊 Total pending DeliveryRequests (rider=null): ${pendingDeliveryRequests}`);
    console.log('   → Riders can now see and accept these in "คิวงาน" (Queue) tab\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixDeliveryRequestStatus();
