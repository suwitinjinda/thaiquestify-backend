/**
 * Notification Helper Utility
 * Provides helper functions to create important notifications based on user roles
 */

const Notification = require('../models/Notification');
// Lazy load notificationService to avoid circular dependency
// (notificationService imports from this file)

/**
 * Safely get notificationService, handling circular dependency
 * Uses a getter pattern to ensure module is fully initialized
 * @returns {Object|null} notificationService or null if not available
 */
function getNotificationService() {
  try {
    const notificationService = require('../services/notificationService');
    // Check if the module is fully initialized by verifying the function exists
    if (notificationService && typeof notificationService.sendNotificationToUser === 'function') {
      return notificationService;
    }
    return null;
  } catch (error) {
    // Silently fail - this is expected during circular dependency resolution
    return null;
  }
}

/**
 * Important notification types for each user role
 */
const IMPORTANT_TYPES_BY_ROLE = {
  admin: ['verification', 'admin', 'approval', 'rejection', 'system'],
  customer: ['verification', 'order', 'payment', 'reward', 'delivery', 'job_status'],
  partner: ['approval', 'rejection', 'shop', 'quest', 'payment', 'job_status'],
  shop: ['order', 'delivery', 'approval', 'rejection', 'payment', 'job_status'],
  rider: ['delivery_assignment', 'delivery_status', 'rider_earnings', 'payment', 'approval', 'rejection', 'job_status'],
};

/**
 * Create an important notification for a user
 * @param {Object} options
 * @param {String} options.userId - User ID to send notification to
 * @param {String} options.type - Notification type
 * @param {String} options.title - Notification title
 * @param {String} options.message - Notification message
 * @param {String} options.priority - Priority: 'low', 'medium', 'high' (default: 'high' for important)
 * @param {Object} options.relatedEntity - Related entity IDs (orderId, userId, etc.)
 * @param {Object} options.metadata - Additional metadata
 * @param {Boolean} options.sendPush - Whether to send push notification (default: true)
 */
async function createImportantNotification({
  userId,
  type,
  title,
  message,
  priority = 'high',
  relatedEntity = {},
  metadata = {},
  sendPush = true,
}) {
  try {
    // Create notification in database
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      priority,
      relatedEntity,
      metadata,
    });

    // Send push notification if requested
    if (sendPush) {
      try {
        // Lazy load to avoid circular dependency
        // Defer to next tick to ensure module is fully initialized
        await new Promise((resolve) => setImmediate(resolve));
        
        const notificationService = getNotificationService();
        if (notificationService) {
          await notificationService.sendNotificationToUser(userId, title, message, {
            notificationId: notification._id.toString(),
            type,
            priority,
          });
        } else {
          // Retry once after a short delay if module wasn't ready
          await new Promise((resolve) => setTimeout(resolve, 10));
          const retryService = getNotificationService();
          if (retryService) {
            await retryService.sendNotificationToUser(userId, title, message, {
              notificationId: notification._id.toString(),
              type,
              priority,
            });
          } else {
            console.warn('⚠️ notificationService.sendNotificationToUser is not available (circular dependency)');
          }
        }
      } catch (pushError) {
        console.error('⚠️ Failed to send push notification:', pushError);
        // Don't fail the whole operation if push fails
      }
    }

    return notification;
  } catch (error) {
    console.error('❌ Error creating important notification:', error);
    throw error;
  }
}

/**
 * Create verification approval notification
 */
async function createVerificationApprovalNotification(userId) {
  return createImportantNotification({
    userId,
    type: 'verification',
    title: '✅ เอกสารยืนยันตัวตนได้รับการอนุมัติ',
    message: 'เอกสารยืนยันตัวตนของคุณได้รับการอนุมัติแล้ว คุณสามารถใช้งานฟีเจอร์ทั้งหมดได้แล้ว',
    priority: 'high',
    metadata: { action: 'approval' },
  });
}

/**
 * Create verification rejection notification
 */
async function createVerificationRejectionNotification(userId, reason) {
  return createImportantNotification({
    userId,
    type: 'verification',
    title: '❌ เอกสารยืนยันตัวตนถูกปฏิเสธ',
    message: reason || 'เอกสารยืนยันตัวตนของคุณถูกปฏิเสธ กรุณาตรวจสอบและอัปโหลดใหม่',
    priority: 'high',
    metadata: { action: 'rejection', reason },
  });
}

/**
 * Create verification request notification for admin
 * Notifies all admins when a user submits KYC verification documents
 */
async function createVerificationRequestNotification(submittingUserId, userName, userEmail) {
  const User = require('../models/User');
  
  try {
    // Find all admin users
    const admins = await User.find({ userType: 'admin' }).select('_id').lean();
    
    if (admins.length === 0) {
      console.warn('⚠️ No admin users found to notify about verification request');
      return [];
    }

    const notifications = [];
    const displayName = userName || userEmail || 'ผู้ใช้';
    const notificationTitle = '📋 ขออนุมัติเอกสารยืนยันตัวตน';
    const notificationMessage = `${displayName} ส่งเอกสารยืนยันตัวตนเพื่อขออนุมัติ กรุณาตรวจสอบและอนุมัติ`;

    // Create notification for each admin
    for (const admin of admins) {
      try {
        const notification = await createImportantNotification({
          userId: admin._id.toString(),
          type: 'verification',
          title: notificationTitle,
          message: notificationMessage,
          priority: 'high',
          relatedEntity: { userId: submittingUserId },
          metadata: { 
            action: 'verification_request',
            submittingUserId: submittingUserId.toString(),
            submittingUserName: userName,
            submittingUserEmail: userEmail,
          },
        });
        notifications.push(notification);
      } catch (error) {
        console.error(`❌ Error creating verification request notification for admin ${admin._id}:`, error);
      }
    }

    console.log(`✅ Created ${notifications.length} verification request notification(s) for admin(s)`);
    return notifications;
  } catch (error) {
    console.error('❌ Error creating verification request notifications:', error);
    throw error;
  }
}

/**
 * Create order status notification
 */
async function createOrderNotification(userId, orderId, status, orderNumber) {
  const statusMessages = {
    confirmed: 'คำสั่งซื้อของคุณได้รับการยืนยันแล้ว',
    preparing: 'ร้านค้ากำลังเตรียมอาหารของคุณ',
    ready: 'อาหารพร้อมรับแล้ว',
    picked_up: 'กำลังจัดส่ง',
    delivered: 'จัดส่งสำเร็จแล้ว',
    cancelled: 'คำสั่งซื้อถูกยกเลิก',
  };

  return createImportantNotification({
    userId,
    type: 'order',
    title: `📦 คำสั่งซื้อ #${orderNumber || orderId}`,
    message: statusMessages[status] || `สถานะคำสั่งซื้อ: ${status}`,
    priority: status === 'cancelled' ? 'high' : 'medium',
    relatedEntity: { orderId },
    metadata: { orderStatus: status, orderNumber },
  });
}

/**
 * Create delivery notification
 */
async function createDeliveryNotification(userId, deliveryId, status, deliveryNumber) {
  const statusMessages = {
    assigned: 'มีงานจัดส่งใหม่มอบหมายให้คุณ',
    picked_up: 'คุณได้รับอาหารจากร้านค้าแล้ว',
    on_the_way: 'คุณกำลังจัดส่งอาหาร',
    delivered: 'จัดส่งสำเร็จแล้ว',
    cancelled: 'งานจัดส่งถูกยกเลิก',
  };

  return createImportantNotification({
    userId,
    type: 'delivery',
    title: `🚚 งานจัดส่ง #${deliveryNumber || deliveryId}`,
    message: statusMessages[status] || `สถานะงานจัดส่ง: ${status}`,
    priority: status === 'assigned' ? 'high' : 'medium',
    relatedEntity: { deliveryId },
    metadata: { deliveryStatus: status, deliveryNumber },
  });
}

/**
 * Create admin notification for pending approvals
 */
async function createAdminPendingApprovalNotification(adminUserId, itemType, itemId, count) {
  const typeLabels = {
    verification: 'เอกสารยืนยันตัวตน',
    shop: 'ร้านค้า',
    partner: 'พาร์ทเนอร์',
    rider: 'ไรเดอร์',
  };

  return createImportantNotification({
    userId: adminUserId,
    type: 'admin',
    title: `⚠️ มี${typeLabels[itemType] || itemType}รอการอนุมัติ`,
    message: `มี${count || 1}รายการ${typeLabels[itemType] || itemType}รอการตรวจสอบและอนุมัติ`,
    priority: 'high',
    relatedEntity: { [itemType + 'Id']: itemId },
    metadata: { itemType, count },
  });
}

/**
 * Create payment notification
 */
async function createPaymentNotification(userId, transactionId, type, amount) {
  const typeMessages = {
    deposit: `เงินฝาก ${amount} บาท สำเร็จ`,
    withdraw: `ถอนเงิน ${amount} บาท`,
    commission: `ได้รับค่าคอมมิชชั่น ${amount} บาท`,
    payment: `ชำระเงิน ${amount} บาท`,
  };

  return createImportantNotification({
    userId,
    type: 'payment',
    title: '💳 การทำธุรกรรม',
    message: typeMessages[type] || `ธุรกรรม ${type}: ${amount} บาท`,
    priority: 'high',
    relatedEntity: { transactionId },
    metadata: { transactionType: type, amount },
  });
}

/**
 * Create reward notification
 */
async function createRewardNotification(userId, rewardType, points, description) {
  return createImportantNotification({
    userId,
    type: 'reward',
    title: '🎁 คุณได้รับรางวัล!',
    message: description || `คุณได้รับ ${points} คะแนนจาก${rewardType}`,
    priority: 'high',
    metadata: { rewardType, points },
  });
}

/**
 * Create quest notification
 */
async function createQuestNotification(userId, questId, status, questName) {
  const statusMessages = {
    available: `มีเควสใหม่: ${questName}`,
    completed: `เควส "${questName}" สำเร็จ!`,
    expired: `เควส "${questName}" หมดอายุแล้ว`,
  };

  return createImportantNotification({
    userId,
    type: 'quest',
    title: '📋 เควส',
    message: statusMessages[status] || `สถานะเควส: ${status}`,
    priority: status === 'available' ? 'high' : 'medium',
    relatedEntity: { questId },
    metadata: { questStatus: status, questName },
  });
}

/**
 * Create delivery assignment notification for rider
 */
async function createDeliveryAssignmentNotification(riderUserId, deliveryRequestId, requestNumber, distance, riderFee, shopName, customerAddress) {
  return createImportantNotification({
    userId: riderUserId,
    type: 'delivery_assignment',
    title: `🚚 งานจัดส่งใหม่ #${requestNumber}`,
    message: `งานส่งจาก ${shopName || 'ร้านค้า'} - ระยะทาง ${distance?.toFixed(1) || 'N/A'} กม. - ค่าจ้าง ${riderFee || 0} ฿`,
    priority: 'high',
    relatedEntity: { deliveryRequestId },
    metadata: {
      requestNumber,
      distance,
      riderFee,
      shopName,
      customerAddress,
    },
  });
}

/**
 * Create delivery status update notification for rider
 */
async function createDeliveryStatusNotification(riderUserId, deliveryId, status, deliveryNumber, message) {
  const statusMessages = {
    assigned: 'งานจัดส่งถูกมอบหมายให้คุณแล้ว',
    picked_up: 'คุณได้รับอาหารจากร้านค้าแล้ว',
    on_the_way: 'คุณกำลังจัดส่งอาหาร',
    delivered: 'จัดส่งสำเร็จแล้ว',
    cancelled: 'งานจัดส่งถูกยกเลิก',
  };

  return createImportantNotification({
    userId: riderUserId,
    type: 'delivery_status',
    title: `📦 สถานะการจัดส่ง #${deliveryNumber || deliveryId}`,
    message: message || statusMessages[status] || `สถานะ: ${status}`,
    priority: status === 'assigned' || status === 'cancelled' ? 'high' : 'medium',
    relatedEntity: { deliveryId },
    metadata: { deliveryStatus: status, deliveryNumber },
  });
}

/**
 * Create rider earnings notification
 */
async function createRiderEarningsNotification(riderUserId, amount, type, description) {
  const typeMessages = {
    delivery_completed: `คุณได้รับค่าจ้าง ${amount} บาท จากการจัดส่ง`,
    bonus: `คุณได้รับโบนัส ${amount} บาท`,
    withdrawal: `คุณถอนเงิน ${amount} บาท`,
    commission: `คุณได้รับค่าคอมมิชชั่น ${amount} บาท`,
  };

  return createImportantNotification({
    userId: riderUserId,
    type: 'rider_earnings',
    title: '💰 รายได้ไรเดอร์',
    message: description || typeMessages[type] || `รายได้: ${amount} บาท`,
    priority: 'high',
    metadata: { amount, earningsType: type },
  });
}

/**
 * Create rider approval/rejection notification
 */
async function createRiderStatusNotification(riderUserId, status, reason) {
  if (status === 'approved') {
    return createImportantNotification({
      userId: riderUserId,
      type: 'approval',
      title: '✅ สถานะไรเดอร์ได้รับการอนุมัติ',
      message: 'คุณได้รับการอนุมัติเป็นไรเดอร์แล้ว คุณสามารถรับงานจัดส่งได้แล้ว',
      priority: 'high',
      metadata: { riderStatus: 'approved' },
    });
  } else if (status === 'rejected') {
    return createImportantNotification({
      userId: riderUserId,
      type: 'rejection',
      title: '❌ สถานะไรเดอร์ถูกปฏิเสธ',
      message: reason || 'การสมัครเป็นไรเดอร์ของคุณถูกปฏิเสธ กรุณาติดต่อผู้ดูแลระบบ',
      priority: 'high',
      metadata: { riderStatus: 'rejected', reason },
    });
  }
}

/**
 * Create withdrawal request notification for admin
 * Notifies all admins when a user requests to withdraw points
 */
async function createWithdrawalRequestNotification(userId, userName, userEmail, amount, points, withdrawalId) {
  const User = require('../models/User');
  
  try {
    // Find all admin users
    const admins = await User.find({ userType: 'admin' }).select('_id').lean();
    
    if (admins.length === 0) {
      console.warn('⚠️ No admin users found to notify about withdrawal request');
      return [];
    }

    const notifications = [];
    const displayName = userName || userEmail || 'ผู้ใช้';
    const notificationTitle = '💰 คำขอถอนเงิน';
    const notificationMessage = `${displayName} ขอถอน Point ${points.toLocaleString()} เป็นเงินสด ${amount.toLocaleString()} บาท กรุณาตรวจสอบและอนุมัติ`;

    // Create notification for each admin
    for (const admin of admins) {
      try {
        const notification = await createImportantNotification({
          userId: admin._id.toString(),
          type: 'admin',
          title: notificationTitle,
          message: notificationMessage,
          priority: 'high',
          relatedEntity: { withdrawalId },
          metadata: { 
            action: 'withdrawal_request',
            userId: userId.toString(),
            userName: userName,
            userEmail: userEmail,
            amount: amount,
            points: points,
            withdrawalId: withdrawalId.toString(),
          },
        });
        notifications.push(notification);
      } catch (error) {
        console.error(`❌ Error creating withdrawal request notification for admin ${admin._id}:`, error);
      }
    }

    console.log(`✅ Created ${notifications.length} withdrawal request notification(s) for admin(s)`);
    return notifications;
  } catch (error) {
    console.error('❌ Error creating withdrawal request notifications:', error);
    throw error;
  }
}

/**
 * Create withdrawal approval notification for user
 * Notifies user when their withdrawal request is approved
 */
async function createWithdrawalApprovalNotification(userId, amount, points, withdrawalId, omiseTransferId = null) {
  try {
    console.log(`📧 Creating withdrawal approval notification for user ${userId}, amount: ${amount}, points: ${points}`);
    
    const message = omiseTransferId 
      ? `คำขอถอน Point ${points.toLocaleString()} เป็นเงินสด ${amount.toLocaleString()} บาท อนุมัติแล้วและโอนเงินผ่าน Omise แล้ว`
      : `คำขอถอน Point ${points.toLocaleString()} เป็นเงินสด ${amount.toLocaleString()} บาท อนุมัติแล้ว รอการโอนเงิน`;

    const notification = await createImportantNotification({
      userId,
      type: 'payment',
      title: '✅ อนุมัติการถอนเงิน',
      message: message,
      priority: 'high',
      relatedEntity: { withdrawalId },
      metadata: { 
        action: 'withdrawal_approved',
        amount: amount,
        points: points,
        withdrawalId: withdrawalId.toString(),
        omiseTransferId: omiseTransferId,
      },
    });
    
    console.log(`✅ Withdrawal approval notification created: ${notification._id}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating withdrawal approval notification:', error);
    throw error;
  }
}

/**
 * Create withdrawal paid notification for user
 * Notifies user when their withdrawal is paid/transferred
 */
async function createWithdrawalPaidNotification(userId, amount, points, withdrawalId, paymentMethod = 'manual') {
  try {
    const methodText = paymentMethod === 'omise' ? 'ผ่าน Omise' : 'ด้วยตนเอง';
    
    return createImportantNotification({
      userId,
      type: 'payment',
      title: '💰 ได้รับเงินแล้ว',
      message: `เงินจำนวน ${amount.toLocaleString()} บาท (จาก Point ${points.toLocaleString()}) ถูกโอนเข้าบัญชีธนาคารแล้ว ${methodText}`,
      priority: 'high',
      relatedEntity: { withdrawalId },
      metadata: { 
        action: 'withdrawal_paid',
        amount: amount,
        points: points,
        withdrawalId: withdrawalId.toString(),
        paymentMethod: paymentMethod,
      },
    });
  } catch (error) {
    console.error('❌ Error creating withdrawal paid notification:', error);
    throw error;
  }
}

/**
 * Create withdrawal rejection notification for user
 * Notifies user when their withdrawal request is rejected
 */
async function createWithdrawalRejectionNotification(userId, amount, points, withdrawalId, reason = null) {
  try {
    console.log(`📧 Creating withdrawal rejection notification for user ${userId}, amount: ${amount}, points: ${points}`);
    
    const reasonText = reason ? ` เหตุผล: ${reason}` : '';
    const message = `คำขอถอน Point ${points.toLocaleString()} เป็นเงินสด ${amount.toLocaleString()} บาท ถูกปฏิเสธ${reasonText}`;

    const notification = await createImportantNotification({
      userId,
      type: 'payment',
      title: '❌ การถอนเงินถูกปฏิเสธ',
      message: message,
      priority: 'high',
      relatedEntity: { withdrawalId },
      metadata: { 
        action: 'withdrawal_rejected',
        amount: amount,
        points: points,
        withdrawalId: withdrawalId.toString(),
        reason: reason,
      },
    });
    
    console.log(`✅ Withdrawal rejection notification created: ${notification._id}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating withdrawal rejection notification:', error);
    throw error;
  }
}

/**
 * Create manual transfer required notification for admins
 * Notifies all admins when a withdrawal requires manual transfer
 */
async function createManualTransferRequiredNotification(userId, userName, userEmail, amount, points, withdrawalId, issues = []) {
  try {
    console.log(`📧 Creating manual transfer required notification for admins - user: ${userName}, amount: ${amount}, points: ${points}`);
    
    const User = require('../models/User');
    const admins = await User.find({ userType: 'admin' }).select('_id');
    
    if (admins.length === 0) {
      console.warn('⚠️ No admin users found to notify');
      return [];
    }

    const issueText = issues.length > 0 ? `\n\nเหตุผล: ${issues.join(', ')}` : '';
    const message = `ผู้ใช้ ${userName} (${userEmail}) ขอถอนเงิน ${amount.toLocaleString()} บาท (${points.toLocaleString()} points) แต่ไม่สามารถโอนเงินผ่าน Omise ได้ เนื่องจาก recipient ยังไม่พร้อม${issueText}\n\nกรุณาโอนเงินด้วยตนเองและกดยืนยันการจ่ายเงินในระบบ`;

    const notifications = await Promise.all(
      admins.map(async (admin) => {
        try {
          return await createImportantNotification({
            userId: admin._id.toString(),
            type: 'admin',
            title: '⚠️ ต้องการโอนเงินด้วยตนเอง',
            message: message,
            priority: 'high',
            relatedEntity: {
              withdrawalId: withdrawalId,
              userId: userId
            },
            metadata: {
              action: 'manual_transfer_required',
              amount: amount,
              points: points,
              userName: userName,
              userEmail: userEmail,
              issues: issues
            },
          });
        } catch (error) {
          console.error(`❌ Error creating manual transfer required notification for admin ${admin._id}:`, error);
          return null;
        }
      })
    );

    const successfulNotifications = notifications.filter(n => n !== null);
    console.log(`✅ Created ${successfulNotifications.length} manual transfer required notification(s) for admin(s)`);
    return successfulNotifications;
  } catch (error) {
    console.error('❌ Error creating manual transfer required notifications:', error);
    throw error;
  }
}

/**
 * Notify shop owner when customer pays (จ่ายเงิน) for dine-in order
 */
async function createOrderCustomerPaidNotification(shopOwnerUserId, orderId, orderNumber, total, customerName) {
  const uid = shopOwnerUserId && (shopOwnerUserId._id ? shopOwnerUserId._id.toString() : shopOwnerUserId.toString());
  if (!uid) return null;
  return createImportantNotification({
    userId: uid,
    type: 'order',
    title: '💵 ลูกค้าจ่ายเงินแล้ว',
    message: `คำสั่งซื้อ #${orderNumber || orderId} ลูกค้า${customerName ? ` ${customerName}` : ''} กดจ่ายเงินแล้ว ${total ? `(${Number(total).toFixed(2)} ฿)` : ''}`,
    priority: 'high',
    metadata: { orderId: orderId?.toString(), orderNumber, total, action: 'customer_paid' },
    sendPush: true,
  });
}

/**
 * Notify customer when shop confirms payment received (ได้รับเงินแล้ว)
 */
async function createOrderPaymentReceivedNotification(customerUserId, orderId, orderNumber, total, shopName) {
  const uid = customerUserId && (customerUserId._id ? customerUserId._id.toString() : customerUserId.toString());
  if (!uid) return null;
  return createImportantNotification({
    userId: uid,
    type: 'order',
    title: '✅ ร้านยืนยันได้รับเงินแล้ว',
    message: `คำสั่งซื้อ #${orderNumber || orderId}${shopName ? ` ${shopName}` : ''} แจ้งได้รับเงินแล้ว${total ? ` ${Number(total).toFixed(2)} ฿` : ''}`,
    priority: 'high',
    metadata: { orderId: orderId?.toString(), orderNumber, total, shopName, action: 'payment_received' },
    sendPush: true,
  });
}

/**
 * Notify shop owner when customer pays (จ่ายเงิน) for multiple dine-in orders – one notification
 * @param {string} shopOwnerUserId
 * @param {Array<{ orderId, orderNumber, total }>} orders
 * @param {string} customerName
 */
async function createOrderCustomerPaidBulkNotification(shopOwnerUserId, orders, customerName) {
  const uid = shopOwnerUserId && (shopOwnerUserId._id ? shopOwnerUserId._id.toString() : shopOwnerUserId.toString());
  if (!uid || !orders || orders.length === 0) return null;
  const count = orders.length;
  const totalSum = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const message = count === 1
    ? `คำสั่งซื้อ #${orders[0].orderNumber || orders[0].orderId} ลูกค้า${customerName ? ` ${customerName}` : ''} กดจ่ายเงินแล้ว (${totalSum.toFixed(2)} ฿)`
    : `ลูกค้า${customerName ? ` ${customerName}` : ''} กดจ่ายเงิน ${count} คำสั่งซื้อ รวม ${totalSum.toFixed(2)} ฿`;
  return createImportantNotification({
    userId: uid,
    type: 'order',
    title: '💵 ลูกค้าจ่ายเงินแล้ว',
    message,
    priority: 'high',
    metadata: {
      orderIds: orders.map((o) => (o.orderId && o.orderId.toString ? o.orderId.toString() : String(o.orderId))),
      count,
      total: totalSum,
      customerName,
      action: 'customer_paid_bulk',
    },
    sendPush: true,
  });
}

/**
 * Notify customer when shop confirms payment received (ได้รับเงินแล้ว) for multiple orders – one notification
 * @param {string} customerUserId
 * @param {Array<{ orderId, orderNumber, total }>} orders
 * @param {string} shopName
 */
async function createOrderPaymentReceivedBulkNotification(customerUserId, orders, shopName) {
  const uid = customerUserId && (customerUserId._id ? customerUserId._id.toString() : customerUserId.toString());
  if (!uid || !orders || orders.length === 0) return null;
  const count = orders.length;
  const totalSum = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const message = count === 1
    ? `คำสั่งซื้อ #${orders[0].orderNumber || orders[0].orderId} ${shopName || 'ร้านค้า'} แจ้งได้รับเงินแล้ว ${totalSum.toFixed(2)} ฿`
    : `${shopName || 'ร้านค้า'} แจ้งได้รับเงิน ${count} คำสั่งซื้อ รวม ${totalSum.toFixed(2)} ฿`;
  return createImportantNotification({
    userId: uid,
    type: 'order',
    title: '✅ ร้านยืนยันได้รับเงินแล้ว',
    message,
    priority: 'high',
    metadata: {
      orderIds: orders.map((o) => (o.orderId && o.orderId.toString ? o.orderId.toString() : String(o.orderId))),
      count,
      total: totalSum,
      shopName,
      action: 'payment_received_bulk',
    },
    sendPush: true,
  });
}

/**
 * Create point purchase notification for admin
 * Notifies all admins when a user successfully purchases points
 */
async function createPointPurchaseNotification(userId, userName, userEmail, amount, points, transactionId) {
  const User = require('../models/User');
  
  try {
    // Find all admin users
    const admins = await User.find({ userType: 'admin' }).select('_id').lean();
    
    if (admins.length === 0) {
      console.warn('⚠️ No admin users found to notify about point purchase');
      return [];
    }

    const notifications = [];
    const displayName = userName || userEmail || 'ผู้ใช้';
    const notificationTitle = '💳 การซื้อ Point';
    // amount = money paid (THB), points = points received
    const notificationMessage = amount > 0 
      ? `${displayName} ซื้อ Point ${points.toLocaleString()} ด้วยเงิน ${amount.toLocaleString()} บาท`
      : `${displayName} ซื้อ Point ${points.toLocaleString()}`;

    // Create notification for each admin
    for (const admin of admins) {
      try {
        const notification = await createImportantNotification({
          userId: admin._id.toString(),
          type: 'admin',
          title: notificationTitle,
          message: notificationMessage,
          priority: 'medium',
          relatedEntity: { transactionId },
          metadata: { 
            action: 'point_purchase',
            userId: userId.toString(),
            userName: userName,
            userEmail: userEmail,
            amount: amount,
            points: points,
            transactionId: transactionId.toString(),
          },
        });
        notifications.push(notification);
      } catch (error) {
        console.error(`❌ Error creating point purchase notification for admin ${admin._id}:`, error);
      }
    }

    console.log(`✅ Created ${notifications.length} point purchase notification(s) for admin(s)`);
    return notifications;
  } catch (error) {
    console.error('❌ Error creating point purchase notifications:', error);
    throw error;
  }
}

/**
 * New job application – notify employer
 */
async function createJobApplicationNewNotification(employerUserId, workerName, jobTitle, jobNumber, jobId, applicationId) {
  return createImportantNotification({
    userId: employerUserId.toString(),
    type: 'job_status',
    title: '📋 มีคนสมัครงานแล้ว',
    message: `${workerName || 'มีผู้สมัคร'} สมัครงาน "${jobTitle || 'งาน'}${jobNumber ? ` (${jobNumber})` : ''}" กรุณาตรวจสอบและดำเนินการ`,
    priority: 'high',
    relatedEntity: { jobId, applicationId },
    metadata: { action: 'job_application_new', jobNumber },
  });
}

/**
 * Job application accepted – notify worker
 */
async function createJobApplicationAcceptedNotification(workerUserId, jobTitle, jobNumber, jobId, applicationId) {
  return createImportantNotification({
    userId: workerUserId.toString(),
    type: 'job_status',
    title: '✅ รับสมัครงานแล้ว',
    message: `คุณได้รับการรับสมัครงาน "${jobTitle || 'งาน'}${jobNumber ? ` (${jobNumber})` : ''}" แล้ว`,
    priority: 'high',
    relatedEntity: { jobId, applicationId },
    metadata: { action: 'job_application_accepted', jobNumber },
  });
}

/**
 * Job application rejected – notify worker
 */
async function createJobApplicationRejectedNotification(workerUserId, jobTitle, jobNumber, jobId, applicationId) {
  return createImportantNotification({
    userId: workerUserId.toString(),
    type: 'job_status',
    title: '❌ การสมัครงานไม่ผ่าน',
    message: `การสมัครงาน "${jobTitle || 'งาน'}${jobNumber ? ` (${jobNumber})` : ''}" ไม่ได้รับการอนุมัติ`,
    priority: 'high',
    relatedEntity: { jobId, applicationId },
    metadata: { action: 'job_application_rejected', jobNumber },
  });
}

/**
 * Job completed – notify worker
 */
async function createJobApplicationCompletedNotification(workerUserId, jobTitle, jobNumber, jobId, applicationId) {
  return createImportantNotification({
    userId: workerUserId.toString(),
    type: 'job_status',
    title: '🎉 งานเสร็จสิ้น',
    message: `งาน "${jobTitle || 'งาน'}${jobNumber ? ` (${jobNumber})` : ''}" ถูกทำเครื่องหมายเสร็จสิ้นแล้ว`,
    priority: 'high',
    relatedEntity: { jobId, applicationId },
    metadata: { action: 'job_completed', jobNumber },
  });
}

/**
 * New job created nearby – notify user within radius
 */
async function createJobNewNearbyNotification(userId, jobTitle, jobNumber, jobId, distanceKm) {
  const distStr = distanceKm != null && Number.isFinite(distanceKm)
    ? ` (ห่างประมาณ ${distanceKm.toFixed(1)} กม.)`
    : '';
  return createImportantNotification({
    userId: userId.toString(),
    type: 'job_status',
    title: '🆕 งานใหม่ใกล้คุณ',
    message: `มีงาน "${jobTitle || 'งาน'}${jobNumber ? ` (${jobNumber})` : ''}" ใกล้คุณ${distStr} — ไปดูได้ที่หางาน`,
    priority: 'medium',
    relatedEntity: { jobId },
    metadata: { action: 'job_new_nearby', jobNumber, distanceKm },
  });
}

module.exports = {
  createImportantNotification,
  createVerificationApprovalNotification,
  createVerificationRejectionNotification,
  createVerificationRequestNotification,
  createOrderNotification,
  createDeliveryNotification,
  createAdminPendingApprovalNotification,
  createPaymentNotification,
  createRewardNotification,
  createQuestNotification,
  createDeliveryAssignmentNotification,
  createDeliveryStatusNotification,
  createRiderEarningsNotification,
  createRiderStatusNotification,
  createWithdrawalRequestNotification,
  createWithdrawalApprovalNotification,
  createWithdrawalPaidNotification,
  createWithdrawalRejectionNotification,
  createManualTransferRequiredNotification,
  createPointPurchaseNotification,
  createOrderCustomerPaidNotification,
  createOrderPaymentReceivedNotification,
  createOrderCustomerPaidBulkNotification,
  createOrderPaymentReceivedBulkNotification,
  createJobApplicationNewNotification,
  createJobApplicationAcceptedNotification,
  createJobApplicationRejectedNotification,
  createJobApplicationCompletedNotification,
  createJobNewNearbyNotification,
  IMPORTANT_TYPES_BY_ROLE,
};
