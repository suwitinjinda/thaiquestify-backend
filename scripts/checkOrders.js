// Script to check orders in database
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const Order = require('../models/Order');
const DeliveryRequest = require('../models/DeliveryRequest');
const Delivery = require('../models/Delivery');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

async function checkOrders() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to database\n');

    // Check all orders
    const totalOrders = await Order.countDocuments({});
    const deliveryOrders = await Order.countDocuments({ orderType: 'delivery' });
    const dineInOrders = await Order.countDocuments({ orderType: 'dine_in' });
    
    console.log('📊 ORDER STATISTICS:');
    console.log('   - Total orders in DB:', totalOrders);
    console.log('   - Delivery orders:', deliveryOrders);
    console.log('   - Dine-in orders:', dineInOrders);
    console.log('');

    // Check orders with delivery requests
    const ordersWithDeliveryRequest = await Order.countDocuments({ 
      orderType: 'delivery',
      deliveryRequest: { $exists: true, $ne: null }
    });
    
    const ordersWithoutDeliveryRequest = deliveryOrders - ordersWithDeliveryRequest;
    
    console.log('📦 DELIVERY ORDERS:');
    console.log('   - Delivery orders with DeliveryRequest:', ordersWithDeliveryRequest);
    console.log('   - Delivery orders WITHOUT DeliveryRequest:', ordersWithoutDeliveryRequest);
    console.log('');

    // Check DeliveryRequests
    const totalDeliveryRequests = await DeliveryRequest.countDocuments({});
    const pendingDeliveryRequests = await DeliveryRequest.countDocuments({ 
      status: 'pending', 
      rider: null 
    });
    const acceptedDeliveryRequests = await DeliveryRequest.countDocuments({ 
      status: 'accepted'
    });
    
    const deliveryRequestStatus = await DeliveryRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    console.log('🚚 DELIVERY REQUEST STATISTICS:');
    console.log('   - Total DeliveryRequests in DB:', totalDeliveryRequests);
    console.log('   - Pending DeliveryRequests (rider=null):', pendingDeliveryRequests);
    console.log('   - Accepted DeliveryRequests:', acceptedDeliveryRequests);
    console.log('   - Status breakdown:', deliveryRequestStatus.map(s => `${s._id}: ${s.count}`).join(', ') || 'none');
    console.log('');

    // Check Deliveries
    const totalDeliveries = await Delivery.countDocuments({});
    const pendingDeliveries = await Delivery.countDocuments({ status: 'pending' });
    
    console.log('📬 DELIVERY STATISTICS:');
    console.log('   - Total Deliveries in DB:', totalDeliveries);
    console.log('   - Pending Deliveries:', pendingDeliveries);
    console.log('');

    // Get sample delivery orders
    if (deliveryOrders > 0) {
      console.log('📋 SAMPLE DELIVERY ORDERS:');
      const sampleDeliveryOrders = await Order.find({ orderType: 'delivery' })
        .select('_id orderNumber orderType status deliveryRequest delivery createdAt')
        .populate('deliveryRequest', '_id status rider')
        .populate('delivery', '_id status rider')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      
      sampleDeliveryOrders.forEach((order, index) => {
        console.log(`   ${index + 1}. Order ${order.orderNumber || order._id.toString()}:`);
        console.log(`      - OrderType: ${order.orderType}`);
        console.log(`      - Status: ${order.status}`);
        console.log(`      - Has DeliveryRequest: ${!!order.deliveryRequest}`);
        if (order.deliveryRequest) {
          console.log(`      - DeliveryRequest ID: ${order.deliveryRequest._id.toString()}`);
          console.log(`      - DeliveryRequest Status: ${order.deliveryRequest.status}`);
          console.log(`      - DeliveryRequest Rider: ${order.deliveryRequest.rider?.toString() || 'null'}`);
        } else {
          console.log(`      - ⚠️  NO DELIVERY REQUEST!`);
        }
        console.log(`      - Has Delivery: ${!!order.delivery}`);
        if (order.delivery) {
          console.log(`      - Delivery ID: ${order.delivery._id.toString()}`);
          console.log(`      - Delivery Status: ${order.delivery.status}`);
          console.log(`      - Delivery Rider: ${order.delivery.rider?.toString() || 'null'}`);
        }
        console.log(`      - Created: ${order.createdAt}`);
        console.log('');
      });
    } else {
      console.log('⚠️  NO DELIVERY ORDERS FOUND IN DATABASE!');
      console.log('   This means no delivery orders have been created yet.');
      console.log('   Please create a delivery order (orderType: "delivery") first.');
      console.log('');
    }

    // Get sample DeliveryRequests
    if (totalDeliveryRequests > 0) {
      console.log('🚚 SAMPLE DELIVERY REQUESTS:');
      const sampleDeliveryRequests = await DeliveryRequest.find({})
        .select('_id requestNumber status rider shop order distance priority createdAt')
        .populate('shop', 'shopName shopId')
        .populate('order', 'orderNumber orderType')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      
      sampleDeliveryRequests.forEach((req, index) => {
        console.log(`   ${index + 1}. DeliveryRequest ${req.requestNumber || req._id.toString()}:`);
        console.log(`      - Status: ${req.status}`);
        console.log(`      - Rider: ${req.rider?.toString() || 'null (pending)'}`);
        console.log(`      - Shop: ${req.shop?.shopName || 'N/A'} (${req.shop?.shopId || 'N/A'})`);
        console.log(`      - Order: ${req.order?.orderNumber || 'N/A'} (${req.order?.orderType || 'N/A'})`);
        console.log(`      - Distance: ${req.distance}km`);
        console.log(`      - Priority: ${req.priority}`);
        console.log(`      - Created: ${req.createdAt}`);
        console.log('');
      });
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(60));
    
    if (deliveryOrders === 0) {
      console.log('❌ No delivery orders found in database.');
      console.log('   → Action: Create a delivery order (orderType: "delivery")');
    } else if (ordersWithoutDeliveryRequest > 0) {
      console.log(`⚠️  Found ${ordersWithoutDeliveryRequest} delivery orders WITHOUT DeliveryRequest!`);
      console.log('   → Issue: DeliveryRequest was not created for these orders');
      console.log('   → Action: Check order creation flow');
    } else if (pendingDeliveryRequests === 0) {
      console.log('⚠️  No pending DeliveryRequests (rider=null) found!');
      console.log('   → Possible reasons:');
      console.log('      - All DeliveryRequests already have riders assigned');
      console.log('      - No delivery orders created');
    } else {
      console.log(`✅ Found ${pendingDeliveryRequests} pending DeliveryRequests ready for riders!`);
      console.log('   → Riders can accept these in "คิวงาน" (Queue) tab');
    }
    
    console.log('='.repeat(60));

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkOrders();
