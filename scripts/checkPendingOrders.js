// scripts/checkPendingOrders.js - Check pending orders at shops
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const Order = require('../models/Order');
const Shop = require('../models/Shop');
const DeliveryRequest = require('../models/DeliveryRequest');
const User = require('../models/User');

async function checkPendingOrders() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all shops
    const shops = await Shop.find({}).select('shopName shopId user').lean();
    console.log(`\n📊 Found ${shops.length} shops\n`);

    // Check pending orders for each shop
    let totalPending = 0;
    let totalPendingDelivery = 0;
    let totalPendingDineIn = 0;

    for (const shop of shops) {
      // Count pending orders
      const pendingOrders = await Order.countDocuments({
        shop: shop._id,
        status: { $in: ['pending', 'confirmed', 'preparing'] }
      });

      // Count pending delivery orders
      const pendingDeliveryOrders = await Order.countDocuments({
        shop: shop._id,
        orderType: 'delivery',
        status: { $in: ['pending', 'confirmed', 'preparing'] }
      });

      // Count pending dine-in orders
      const pendingDineInOrders = await Order.countDocuments({
        shop: shop._id,
        orderType: 'dine_in',
        status: { $in: ['pending', 'confirmed', 'preparing'] }
      });

      // Count delivery orders without rider
      const deliveryOrdersWithoutRider = await Order.countDocuments({
        shop: shop._id,
        orderType: 'delivery',
        status: { $in: ['pending', 'confirmed', 'preparing'] },
        rider: null,
        deliveryRequest: { $exists: true, $ne: null }
      });

      // Get delivery requests for this shop
      const pendingDeliveryRequests = await DeliveryRequest.countDocuments({
        shop: shop._id,
        status: 'pending',
        rider: null
      });

      if (pendingOrders > 0) {
        console.log(`🏪 ${shop.shopName || shop.shopId || 'Unknown Shop'}`);
        console.log(`   - Total pending orders: ${pendingOrders}`);
        console.log(`   - Pending delivery orders: ${pendingDeliveryOrders}`);
        console.log(`   - Pending dine-in orders: ${pendingDineInOrders}`);
        console.log(`   - Delivery orders without rider: ${deliveryOrdersWithoutRider}`);
        console.log(`   - Pending delivery requests: ${pendingDeliveryRequests}`);
        console.log('');
      }

      totalPending += pendingOrders;
      totalPendingDelivery += pendingDeliveryOrders;
      totalPendingDineIn += pendingDineInOrders;
    }

    // Summary
    console.log('='.repeat(50));
    console.log('📊 SUMMARY:');
    console.log(`   - Total shops: ${shops.length}`);
    console.log(`   - Total pending orders: ${totalPending}`);
    console.log(`   - Total pending delivery orders: ${totalPendingDelivery}`);
    console.log(`   - Total pending dine-in orders: ${totalPendingDineIn}`);
    console.log('='.repeat(50));

    // Check all pending delivery requests
    const allPendingDeliveryRequests = await DeliveryRequest.countDocuments({
      status: 'pending',
      rider: null
    });
    console.log(`\n📦 Total pending delivery requests (no rider): ${allPendingDeliveryRequests}`);

    // Get detailed list of pending delivery orders without rider
    const deliveryOrdersWithoutRiderList = await Order.find({
      orderType: 'delivery',
      status: { $in: ['pending', 'confirmed', 'preparing'] },
      rider: null,
      deliveryRequest: { $exists: true, $ne: null }
    })
      .populate('shop', 'shopName shopId')
      .populate('user', 'name email')
      .populate('deliveryRequest', 'status rider cancellationReason customerCanceled riderCanceled riderCancelReason')
      .select('orderNumber orderType status createdAt shop user deliveryRequest')
      .sort({ createdAt: -1 })
      .lean();

    if (deliveryOrdersWithoutRiderList.length > 0) {
      console.log(`\n📋 Detailed list of delivery orders without rider (${deliveryOrdersWithoutRiderList.length}):`);
      deliveryOrdersWithoutRiderList.forEach((order, index) => {
        const createdAt = new Date(order.createdAt);
        const now = new Date();
        const hoursAgo = Math.round((now - createdAt) / (1000 * 60 * 60));
        const daysAgo = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
        
        console.log(`\n   ${index + 1}. Order: ${order.orderNumber}`);
        console.log(`      - Shop: ${order.shop?.shopName || 'N/A'}`);
        console.log(`      - Customer: ${order.user?.name || 'N/A'}`);
        console.log(`      - Status: ${order.status}`);
        console.log(`      - Created: ${createdAt.toISOString()} (${daysAgo} days, ${hoursAgo % 24} hours ago)`);
        console.log(`      - DeliveryRequest: ${order.deliveryRequest?._id || 'N/A'}`);
        console.log(`      - DeliveryRequest Status: ${order.deliveryRequest?.status || 'N/A'}`);
        console.log(`      - Has Rider: ${order.deliveryRequest?.rider ? 'YES' : 'NO'}`);
        if (order.deliveryRequest?.status === 'cancelled') {
          console.log(`      - Cancellation Reason: ${order.deliveryRequest?.cancellationReason || 'N/A'}`);
          console.log(`      - Customer Canceled: ${order.deliveryRequest?.customerCanceled ? 'YES' : 'NO'}`);
          console.log(`      - Rider Canceled: ${order.deliveryRequest?.riderCanceled ? 'YES' : 'NO'}`);
          if (order.deliveryRequest?.riderCancelReason) {
            console.log(`      - Rider Cancel Reason: ${order.deliveryRequest?.riderCancelReason}`);
          }
        }
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
checkPendingOrders();
