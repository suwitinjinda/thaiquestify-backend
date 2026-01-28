// services/notificationService.js - Push notification service for delivery assignments
const User = require('../models/User');
const { Expo } = require('expo-server-sdk');
// Lazy load notificationHelper functions to avoid circular dependency
// (notificationHelper imports from this file)

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Send push notification to user using Expo Push Notifications
 */
async function sendNotificationToUser(userId, title, body, data = {}) {
  try {
    // Get user's notification token
    const user = await User.findById(userId);
    if (!user || !user.notificationToken) {
      console.log(`⚠️ User ${userId} has no notification token`);
      return { success: false, reason: 'no_token' };
    }

    // Validate Expo push token
    if (!Expo.isExpoPushToken(user.notificationToken)) {
      console.log(`⚠️ Invalid Expo push token for user ${userId}: ${user.notificationToken}`);
      return { success: false, reason: 'invalid_token' };
    }

    // Create the message
    const messages = [{
      to: user.notificationToken,
      sound: 'default',
      title,
      body,
      data: {
        ...data,
        userId: userId.toString()
      },
      priority: 'high',
      channelId: 'default'
    }];

    // Send the notification
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
        return { success: false, error: error.message };
      }
    }

    // Check for errors in tickets
    const errors = [];
    tickets.forEach((ticket, index) => {
      if (ticket.status === 'error') {
        errors.push({
          index,
          error: ticket.message || 'Unknown error',
          details: ticket.details
        });
      }
    });

    if (errors.length > 0) {
      console.error('❌ Push notification errors:', errors);
      return { success: false, errors };
    }

    console.log(`✅ Notification sent successfully to user ${userId}:`, { title, body, ticketCount: tickets.length });
    return { success: true, tickets };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send delivery assignment notification to riders
 */
async function sendDeliveryAssignmentNotifications(riders, deliveryRequest) {
  try {
    const notifications = [];
    
    // Get shop info for notification
    const Order = require('../models/Order');
    const Shop = require('../models/Shop');
    let shopName = 'ร้านค้า';
    let customerAddress = '';
    
    if (deliveryRequest.order) {
      const order = await Order.findById(deliveryRequest.order).populate('shop');
      if (order?.shop) {
        const shop = await Shop.findById(order.shop);
        shopName = shop?.name || shopName;
      }
      customerAddress = order?.deliveryAddress || '';
    }
    
    for (const riderData of riders) {
      const rider = riderData.rider;
      if (!rider.user) continue;

      const userId = rider.user._id || rider.user;
      const title = 'มีงานส่งใหม่! 🚴';
      const body = `งานส่ง ${deliveryRequest.requestNumber} - ระยะทาง ${riderData.totalDistance.toFixed(1)} กม. - ค่าจ้าง ${deliveryRequest.riderFee} ฿`;
      const data = {
        type: 'delivery_assignment',
        deliveryRequestId: deliveryRequest._id.toString(),
        requestNumber: deliveryRequest.requestNumber,
        distance: riderData.totalDistance,
        riderFee: deliveryRequest.riderFee,
        priority: deliveryRequest.priority
      };

      // Send push notification
      const result = await sendNotificationToUser(userId, title, body, data);
      
      // Create database notification
      try {
        // Lazy load to avoid circular dependency
        const { createDeliveryAssignmentNotification } = require('../utils/notificationHelper');
        await createDeliveryAssignmentNotification(
          userId,
          deliveryRequest._id.toString(),
          deliveryRequest.requestNumber,
          riderData.totalDistance,
          deliveryRequest.riderFee,
          shopName,
          customerAddress
        );
      } catch (dbNotifError) {
        console.error('⚠️ Failed to create database notification:', dbNotifError);
        // Don't fail the whole operation if DB notification fails
      }
      
      notifications.push({
        riderId: rider._id,
        userId,
        success: result.success,
        reason: result.reason
      });
    }

    return {
      success: true,
      notifications,
      sent: notifications.filter(n => n.success).length,
      failed: notifications.filter(n => !n.success).length
    };
  } catch (error) {
    console.error('Error sending assignment notifications:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification when delivery is assigned
 */
async function sendDeliveryAssignedNotification(deliveryRequest, rider) {
  try {
    if (!rider.user) return { success: false, reason: 'no_user' };

    const userId = rider.user._id || rider.user;
    const title = 'คุณได้รับงานส่ง! ✅';
    const body = `งานส่ง ${deliveryRequest.requestNumber} ถูกมอบหมายให้คุณแล้ว`;
    const data = {
      type: 'delivery_assigned',
      deliveryRequestId: deliveryRequest._id.toString(),
      requestNumber: deliveryRequest.requestNumber
    };

    // Send push notification
    const result = await sendNotificationToUser(userId, title, body, data);
    
    // Create database notification
    try {
      // Lazy load to avoid circular dependency
      const { createDeliveryStatusNotification } = require('../utils/notificationHelper');
      await createDeliveryStatusNotification(
        userId,
        deliveryRequest.delivery?.toString() || deliveryRequest._id.toString(),
        'assigned',
        deliveryRequest.requestNumber,
        body
      );
    } catch (dbNotifError) {
      console.error('⚠️ Failed to create database notification:', dbNotifError);
    }
    
    return result;
  } catch (error) {
    console.error('Error sending assigned notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to shop when rider picks up
 */
async function sendPickupNotification(delivery, shop) {
  try {
    // Get shop owner
    const Shop = require('../models/Shop');
    const shopData = await Shop.findById(shop).populate('user');
    if (!shopData || !shopData.user) return { success: false, reason: 'no_shop_owner' };

    const userId = shopData.user._id || shopData.user;
    const title = 'Rider รับ Order แล้ว 📦';
    const body = `งานส่ง ${delivery.deliveryNumber} ถูกรับแล้ว`;
    const data = {
      type: 'delivery_picked_up',
      deliveryId: delivery._id.toString(),
      deliveryNumber: delivery.deliveryNumber
    };

    return await sendNotificationToUser(userId, title, body, data);
  } catch (error) {
    console.error('Error sending pickup notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to customer when delivery is on the way
 */
async function sendOnTheWayNotification(delivery, customer) {
  try {
    const userId = customer._id || customer;
    const title = 'Rider กำลังส่งให้คุณ! 🚴';
    const body = `งานส่ง ${delivery.deliveryNumber} กำลังมาถึง`;
    const data = {
      type: 'delivery_on_the_way',
      deliveryId: delivery._id.toString(),
      deliveryNumber: delivery.deliveryNumber
    };

    return await sendNotificationToUser(userId, title, body, data);
  } catch (error) {
    console.error('Error sending on the way notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification when delivery is completed
 */
async function sendDeliveryCompletedNotification(delivery, customer) {
  try {
    const userId = customer._id || customer;
    const title = 'ส่งสำเร็จ! ✅';
    const body = `งานส่ง ${delivery.deliveryNumber} ส่งสำเร็จแล้ว`;
    const data = {
      type: 'delivery_completed',
      deliveryId: delivery._id.toString(),
      deliveryNumber: delivery.deliveryNumber
    };

    return await sendNotificationToUser(userId, title, body, data);
  } catch (error) {
    console.error('Error sending completed notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to customer when order is cancelled due to no rider response
 */
async function sendOrderCancelledNotification(order, reason = 'no_rider_response') {
  try {
    const Order = require('../models/Order');
    const orderData = await Order.findById(order).populate('user');
    
    if (!orderData || !orderData.user) {
      console.log(`⚠️ Order ${order} has no user associated`);
      return { success: false, reason: 'no_user' };
    }

    const userId = orderData.user._id || orderData.user;
    let title, body;
    
    if (reason === 'no_rider_response_after_10_minutes') {
      title = 'คำสั่งซื้อถูกยกเลิก ⚠️';
      body = `คำสั่งซื้อ ${orderData.orderNumber || orderData._id} ถูกยกเลิกเนื่องจากไม่มี Rider มารับงานภายใน 10 นาที`;
    } else if (reason === 'customer_cancelled') {
      title = 'ยกเลิกคำสั่งซื้อสำเร็จ ✅';
      body = `คำสั่งซื้อ ${orderData.orderNumber || orderData._id} ถูกยกเลิกแล้ว`;
    } else if (reason === 'shop_cancelled') {
      title = 'คำสั่งซื้อถูกยกเลิก ⚠️';
      body = `คำสั่งซื้อ ${orderData.orderNumber || orderData._id} ถูกยกเลิกโดยร้านค้า`;
    } else if (reason === 'delivery_request_expired') {
      title = 'คำสั่งซื้อถูกยกเลิก ⚠️';
      body = `คำสั่งซื้อ ${orderData.orderNumber || orderData._id} ถูกยกเลิกเนื่องจากคำขอส่งหมดอายุ`;
    } else if (reason === 'delivery_request_cancelled') {
      title = 'คำสั่งซื้อถูกยกเลิก ⚠️';
      body = `คำสั่งซื้อ ${orderData.orderNumber || orderData._id} ถูกยกเลิกเนื่องจากคำขอส่งถูกยกเลิก`;
    } else {
      title = 'คำสั่งซื้อถูกยกเลิก ⚠️';
      body = `คำสั่งซื้อ ${orderData.orderNumber || orderData._id} ถูกยกเลิก`;
    }
    
    const data = {
      type: 'order_cancelled',
      orderId: orderData._id.toString(),
      orderNumber: orderData.orderNumber,
      reason: reason
    };

    console.log(`📱 Sending order cancelled notification to customer ${userId} for order ${orderData.orderNumber || orderData._id}`);
    const result = await sendNotificationToUser(userId, title, body, data);
    console.log(`   Customer notification result:`, result);
    
    // Also send notification to shop owner if order has shop (only for system cancellations)
    // For customer/shop cancellations, notifications are sent separately in routes
    if (orderData.shop && ['no_rider_response_after_10_minutes', 'delivery_request_expired', 'delivery_request_cancelled'].includes(reason)) {
      try {
        const Shop = require('../models/Shop');
        const shopData = await Shop.findById(orderData.shop).populate('user');
        if (shopData && shopData.user) {
          const shopOwnerId = shopData.user._id || shopData.user;
          const shopTitle = 'คำสั่งซื้อถูกยกเลิก ⚠️';
          let shopBody = '';
          if (reason === 'no_rider_response_after_10_minutes') {
            shopBody = `คำสั่งซื้อ ${orderData.orderNumber || orderData._id} ถูกยกเลิกเนื่องจากไม่มี Rider มารับงานภายใน 10 นาที`;
          } else if (reason === 'delivery_request_expired') {
            shopBody = `คำสั่งซื้อ ${orderData.orderNumber || orderData._id} ถูกยกเลิกเนื่องจากคำขอส่งหมดอายุ`;
          } else {
            shopBody = `คำสั่งซื้อ ${orderData.orderNumber || orderData._id} ถูกยกเลิกเนื่องจากคำขอส่งถูกยกเลิก`;
          }
          const shopData_notif = {
            type: 'order_cancelled',
            orderId: orderData._id.toString(),
            orderNumber: orderData.orderNumber,
            reason: reason
          };
          await sendNotificationToUser(shopOwnerId, shopTitle, shopBody, shopData_notif);
        }
      } catch (shopError) {
        console.error('Error sending notification to shop owner:', shopError);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error sending order cancelled notification:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendNotificationToUser,
  sendDeliveryAssignmentNotifications,
  sendDeliveryAssignedNotification,
  sendPickupNotification,
  sendOnTheWayNotification,
  sendDeliveryCompletedNotification,
  sendOrderCancelledNotification
};
