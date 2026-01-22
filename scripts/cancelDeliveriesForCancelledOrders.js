// Script to cancel deliveries where the associated order is cancelled
// Usage: node scripts/cancelDeliveriesForCancelledOrders.js

require('dotenv').config();
const mongoose = require('mongoose');
const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const DeliveryRequest = require('../models/DeliveryRequest');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

async function cancelDeliveriesForCancelledOrders() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all deliveries that are not cancelled but have cancelled orders
    const deliveries = await Delivery.find({
      status: { $nin: ['cancelled', 'delivered', 'failed'] }
    }).populate('order');

    console.log(`📦 Found ${deliveries.length} active deliveries to check`);

    let cancelledCount = 0;
    let skippedCount = 0;

    for (const delivery of deliveries) {
      if (!delivery.order) {
        console.log(`⚠️ Delivery ${delivery._id} has no order, skipping...`);
        skippedCount++;
        continue;
      }

      // Check if order is cancelled
      if (delivery.order.status === 'cancelled') {
        console.log(`🔄 Cancelling delivery ${delivery._id} (order ${delivery.order._id} is cancelled)`);
        
        // Update delivery status
        delivery.status = 'cancelled';
        delivery.notes = delivery.notes 
          ? `${delivery.notes}\n[Auto-cancelled: Order was cancelled]`
          : '[Auto-cancelled: Order was cancelled]';
        await delivery.save();

        // Also cancel the associated DeliveryRequest if exists
        if (delivery.order.deliveryRequest) {
          const deliveryRequest = await DeliveryRequest.findById(delivery.order.deliveryRequest);
          if (deliveryRequest && deliveryRequest.status !== 'cancelled') {
            deliveryRequest.status = 'cancelled';
            deliveryRequest.cancellationReason = 'Order was cancelled';
            await deliveryRequest.save();
            console.log(`   ✅ Also cancelled DeliveryRequest ${deliveryRequest._id}`);
          }
        }

        cancelledCount++;
      } else {
        skippedCount++;
      }
    }

    console.log('\n✅ Cancellation completed:');
    console.log(`   - Cancelled: ${cancelledCount} deliveries`);
    console.log(`   - Skipped: ${skippedCount} deliveries`);

    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
cancelDeliveriesForCancelledOrders();
