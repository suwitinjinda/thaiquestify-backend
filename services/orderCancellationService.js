// services/orderCancellationService.js - Auto-cancel orders without rider after 1 day
const DeliveryRequest = require('../models/DeliveryRequest');
const Order = require('../models/Order');

/**
 * Cancel orders that have no rider assigned after 1 day (after midnight of the day)
 * This runs daily to check and cancel aging orders
 */
async function cancelAgingOrders() {
  try {
    console.log('🔄 Starting auto-cancellation of aging orders...');
    
    // Get current date at midnight (start of today)
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    
    // Find orders that:
    // 1. Are delivery type
    // 2. Status is not completed or cancelled
    // 3. Created before today (more than 1 day old)
    // 4. Have no rider assigned
    // 5. Have a deliveryRequest that is still pending
    const oneDayAgo = new Date(todayMidnight);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    console.log(`📅 Checking orders created before: ${oneDayAgo.toISOString()}`);
    
    // Find delivery orders without rider that are older than 1 day
    const agingOrders = await Order.find({
      orderType: 'delivery',
      status: { $nin: ['completed', 'cancelled'] },
      createdAt: { $lt: oneDayAgo },
      rider: null,
      deliveryRequest: { $exists: true, $ne: null }
    })
      .populate('deliveryRequest')
      .lean();
    
    console.log(`📦 Found ${agingOrders.length} aging orders to check`);
    
    let cancelledCount = 0;
    let skippedCount = 0;
    
    for (const order of agingOrders) {
      try {
        // Check if deliveryRequest is still pending
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
        
        // Only cancel if deliveryRequest is still pending (no rider assigned)
        if (deliveryRequest.status === 'pending' && !deliveryRequest.rider) {
          console.log(`🚫 Cancelling order ${order.orderNumber} (created: ${order.createdAt.toISOString()})`);
          
          // Cancel the order
          await Order.findByIdAndUpdate(order._id, {
            status: 'cancelled',
            notes: order.notes ? `${order.notes}\n[Auto-cancelled: No rider accepted within 1 day]` : '[Auto-cancelled: No rider accepted within 1 day]'
          });
          
          // Cancel the delivery request
          await DeliveryRequest.findByIdAndUpdate(deliveryRequest._id, {
            status: 'cancelled',
            cancellationReason: 'Auto-cancelled: No rider accepted within 1 day'
          });
          
          cancelledCount++;
          console.log(`✅ Cancelled order ${order.orderNumber} and deliveryRequest ${deliveryRequest._id}`);
        } else {
          console.log(`⏭️ Order ${order.orderNumber} has rider assigned or already processed, skipping`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing order ${order.orderNumber}:`, error);
        skippedCount++;
      }
    }
    
    console.log(`✅ Auto-cancellation completed:`);
    console.log(`   - Cancelled: ${cancelledCount} orders`);
    console.log(`   - Skipped: ${skippedCount} orders`);
    
    return {
      success: true,
      cancelled: cancelledCount,
      skipped: skippedCount,
      total: agingOrders.length
    };
  } catch (error) {
    console.error('❌ Error in cancelAgingOrders:', error);
    throw error;
  }
}

/**
 * Cancel orders that are created today but no rider accepted (will be cancelled after midnight)
 * This is a helper function to check orders that will be cancelled tomorrow
 */
async function checkOrdersForTomorrowCancellation() {
  try {
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const tomorrowMidnight = new Date(todayMidnight);
    tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);
    
    // Find orders created today that have no rider
    const todayOrders = await Order.find({
      orderType: 'delivery',
      status: { $nin: ['completed', 'cancelled'] },
      createdAt: { $gte: todayMidnight, $lt: tomorrowMidnight },
      rider: null,
      deliveryRequest: { $exists: true, $ne: null }
    })
      .populate('deliveryRequest')
      .countDocuments();
    
    console.log(`📊 Orders created today without rider: ${todayOrders} (will be cancelled after midnight if no rider accepts)`);
    
    return todayOrders;
  } catch (error) {
    console.error('❌ Error in checkOrdersForTomorrowCancellation:', error);
    throw error;
  }
}

module.exports = {
  cancelAgingOrders,
  checkOrdersForTomorrowCancellation
};
