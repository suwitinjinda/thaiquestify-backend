// scripts/fixCancelledOrders.js - Fix orders that should be cancelled when DeliveryRequest is cancelled
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const Order = require('../models/Order');
const DeliveryRequest = require('../models/DeliveryRequest');

async function fixCancelledOrders() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find orders that:
    // 1. Are delivery type
    // 2. Have a deliveryRequest
    // 3. DeliveryRequest status is 'cancelled'
    // 4. Order status is NOT 'cancelled' or 'completed'
    const ordersToFix = await Order.find({
      orderType: 'delivery',
      deliveryRequest: { $exists: true, $ne: null },
      status: { $nin: ['cancelled', 'completed'] }
    })
      .populate('deliveryRequest', 'status cancellationReason')
      .select('orderNumber orderType status notes deliveryRequest createdAt')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📦 Found ${ordersToFix.length} orders to check\n`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const order of ordersToFix) {
      try {
        // Check if deliveryRequest is cancelled
        if (!order.deliveryRequest) {
          console.log(`⚠️ Order ${order.orderNumber} has no deliveryRequest, skipping`);
          skippedCount++;
          continue;
        }

        const deliveryRequest = await DeliveryRequest.findById(order.deliveryRequest);
        
        if (!deliveryRequest) {
          console.log(`⚠️ Order ${order.orderNumber} deliveryRequest not found, skipping`);
          skippedCount++;
          continue;
        }

        // Only fix if deliveryRequest is cancelled
        if (deliveryRequest.status === 'cancelled') {
          const cancellationReason = deliveryRequest.cancellationReason || 'DeliveryRequest was cancelled';
          let cancelNote = '';
          
          // Create appropriate cancellation note based on reason
          if (cancellationReason === 'no_available_riders') {
            cancelNote = '[Auto-cancelled: No available riders]';
          } else if (cancellationReason === 'no_rider_response_timeout') {
            cancelNote = '[Auto-cancelled: No rider response timeout]';
          } else if (cancellationReason.includes('Auto-cancelled')) {
            cancelNote = `[Auto-cancelled: ${cancellationReason.replace('Auto-cancelled: ', '')}]`;
          } else {
            cancelNote = `[Auto-cancelled: ${cancellationReason}]`;
          }

          // Update order
          await Order.findByIdAndUpdate(order._id, {
            status: 'cancelled',
            notes: order.notes ? `${order.notes}\n${cancelNote}` : cancelNote
          });

          console.log(`✅ Fixed order ${order.orderNumber}`);
          console.log(`   - Previous status: ${order.status}`);
          console.log(`   - New status: cancelled`);
          console.log(`   - Cancellation reason: ${cancellationReason}`);
          console.log(`   - Created: ${new Date(order.createdAt).toISOString()}`);
          console.log('');

          fixedCount++;
        } else {
          console.log(`⏭️ Order ${order.orderNumber} deliveryRequest status is '${deliveryRequest.status}', skipping`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing order ${order.orderNumber}:`, error);
        skippedCount++;
      }
    }

    console.log('='.repeat(50));
    console.log('📊 SUMMARY:');
    console.log(`   - Total orders checked: ${ordersToFix.length}`);
    console.log(`   - Fixed: ${fixedCount}`);
    console.log(`   - Skipped: ${skippedCount}`);
    console.log('='.repeat(50));

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
fixCancelledOrders();
