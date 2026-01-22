// Script to create DeliveryRequests for existing delivery orders that don't have them
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const Order = require('../models/Order');
const DeliveryRequest = require('../models/DeliveryRequest');
const Shop = require('../models/Shop');
const User = require('../models/User');
const deliveryAssignmentService = require('../services/deliveryAssignmentService');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

async function fixDeliveryRequests() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to database\n');

    // Find delivery orders without DeliveryRequest (either doesn't exist or is null)
    const ordersWithoutDeliveryRequest = await Order.find({
      orderType: 'delivery',
      $or: [
        { deliveryRequest: { $exists: false } },
        { deliveryRequest: null }
      ]
    })
      .populate('shop', 'shopName shopId phone address coordinates')
      .populate('user', 'name email phone coordinates address shippingAddress');

    console.log(`📋 Found ${ordersWithoutDeliveryRequest.length} delivery orders without DeliveryRequest\n`);

    if (ordersWithoutDeliveryRequest.length === 0) {
      console.log('✅ All delivery orders already have DeliveryRequests!');
      await mongoose.connection.close();
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const order of ordersWithoutDeliveryRequest) {
      try {
        console.log(`\n📦 Processing Order ${order.orderNumber || order._id.toString()}:`);
        console.log(`   - Shop: ${order.shop?.shopName || 'N/A'}`);
        console.log(`   - User: ${order.user?.name || 'N/A'}`);
        console.log(`   - OrderType: ${order.orderType}`);
        console.log(`   - Status: ${order.status}`);

        const shop = order.shop;
        const user = order.user;

        if (!shop) {
          console.log(`   ❌ Error: Shop not found`);
          errorCount++;
          continue;
        }

        // Calculate delivery distance and coordinates
        let deliveryDistance = order.deliveryFee ? Math.round(order.deliveryFee / 5) : 2; // Rough estimate
        let deliveryCoords = null;

        // Try to get coordinates from user (prefer shippingAddress, then address)
        const userCoords = user?.shippingAddress?.coordinates || user?.coordinates;
        
        if (userCoords && shop.coordinates) {
          deliveryCoords = {
            latitude: userCoords.latitude,
            longitude: userCoords.longitude,
          };
          deliveryDistance = deliveryAssignmentService.calculateDistance(
            shop.coordinates.latitude,
            shop.coordinates.longitude,
            userCoords.latitude,
            userCoords.longitude
          );
          console.log(`   ✅ Using user coordinates: ${deliveryCoords.latitude}, ${deliveryCoords.longitude}`);
          console.log(`   ✅ Calculated distance: ${deliveryDistance.toFixed(2)}km`);
        } else {
          // Default distance if coordinates not available
          deliveryDistance = deliveryDistance || 2;
          console.log(`   ⚠️  No coordinates available, using default distance: ${deliveryDistance}km`);
        }

        // Get contact phone
        const contactPhone = order.phone || user?.phone || shop?.phone || '';
        
        if (!contactPhone) {
          console.log(`   ⚠️  Warning: No contact phone found, using empty string`);
        }

        // Get delivery address
        const deliveryAddress = order.deliveryAddress || 
                                user?.shippingAddress?.address || 
                                user?.address || 
                                '';

        // Create DeliveryRequest
        const deliveryRequest = new DeliveryRequest({
          shop: shop._id,
          order: order._id,
          deliveryAddress: deliveryAddress,
          deliveryCoordinates: deliveryCoords,
          distance: deliveryDistance,
          requestedDeliveryFee: order.deliveryFee || 0,
          riderFee: order.deliveryFee || 0,
          contactPhone: contactPhone,
          priority: (() => {
            // Calculate priority based on distance (shorter = higher priority)
            if (deliveryDistance <= 1) return 10;
            if (deliveryDistance <= 2) return 9;
            if (deliveryDistance <= 3) return 8;
            if (deliveryDistance <= 5) return 7;
            if (deliveryDistance <= 7) return 6;
            if (deliveryDistance <= 10) return 5;
            if (deliveryDistance <= 15) return 4;
            if (deliveryDistance <= 20) return 3;
            if (deliveryDistance <= 30) return 2;
            return 1;
          })(),
          status: 'pending',
          rider: null,
        });

        await deliveryRequest.save();
        console.log(`   ✅ Created DeliveryRequest ${deliveryRequest._id}`);

        // Link to order
        order.deliveryRequest = deliveryRequest._id;
        await order.save();
        console.log(`   ✅ Linked DeliveryRequest to Order`);

        successCount++;

        // Try auto-assignment (optional)
        try {
          const autoAssignResult = await deliveryAssignmentService.autoAssignDelivery(deliveryRequest._id.toString());
          if (autoAssignResult.success) {
            console.log(`   ✅ Auto-assigned to rider: ${autoAssignResult.riderId}`);
          } else {
            console.log(`   ℹ️  Auto-assignment not available (will be available for manual assignment)`);
          }
        } catch (autoAssignError) {
          console.log(`   ℹ️  Auto-assignment skipped (will be available for manual assignment)`);
        }

      } catch (error) {
        console.error(`   ❌ Error processing order ${order.orderNumber || order._id.toString()}:`, error.message);
        console.error(`   Stack:`, error.stack);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully created: ${successCount} DeliveryRequests`);
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

fixDeliveryRequests();
