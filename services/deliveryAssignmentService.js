const DeliveryRequest = require('../models/DeliveryRequest');
const Delivery = require('../models/Delivery');
const Rider = require('../models/Rider');
const Order = require('../models/Order');
const QuestSettings = require('../models/QuestSettings');
const PointTransaction = require('../models/PointTransaction');
const PointSystem = require('../models/PointSystem');
const User = require('../models/User');
const notificationService = require('./notificationService');
const mongoose = require('mongoose');

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

/**
 * Calculate priority based on distance (shorter = higher priority)
 */
function calculatePriority(distance) {
  // Inverse: shorter distance = higher priority number (1-10)
  if (distance <= 1) return 10;
  if (distance <= 2) return 9;
  if (distance <= 3) return 8;
  if (distance <= 5) return 7;
  if (distance <= 7) return 6;
  if (distance <= 10) return 5;
  if (distance <= 15) return 4;
  if (distance <= 20) return 3;
  if (distance <= 30) return 2;
  return 1;
}

/**
 * Get admin setting value
 */
async function getSetting(key, defaultValue = null) {
  try {
    const setting = await QuestSettings.findOne({ key, isActive: true });
    return setting ? setting.value : defaultValue;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Calculate delivery fee based on distance
 * - 1-2 km: minimum fee
 * - Over 2 km: minimum fee + (distance - base_km) * fee_per_km
 */
async function calculateDeliveryFee(distance) {
  const minimumFee = await getSetting('delivery_minimum_fee', 20);
  const baseKm = await getSetting('delivery_distance_base_km', 2);
  const feePerKm = await getSetting('delivery_fee_per_km', 5);

  if (distance <= baseKm) {
    return minimumFee;
  }

  const extraKm = distance - baseKm;
  const extraFee = extraKm * feePerKm;
  return minimumFee + extraFee;
}

/**
 * Calculate total price for customer (food cost + rider cost)
 */
async function calculateTotalPrice(foodCost, distance) {
  const riderCost = await calculateDeliveryFee(distance);
  return foodCost + riderCost;
}

/**
 * Get rider's current active deliveries count
 * @param {string} riderId - Can be either Rider document ID or User ID
 */
async function getRiderActiveDeliveriesCount(riderId) {
  try {
    // If riderId is a Rider document ID, get the User ID first
    let userId = riderId;
    const Rider = require('../models/Rider');
    const rider = await Rider.findById(riderId);
    if (rider && rider.user) {
      userId = rider.user._id || rider.user;
    }

    // Delivery.rider references User, so query with User ID
    const count = await Delivery.countDocuments({
      rider: userId,
      status: { $in: ['assigned', 'picked_up', 'on_the_way'] }
    });
    return count;
  } catch (error) {
    // If error, try direct query (in case riderId is already User ID)
    try {
      const count = await Delivery.countDocuments({
        rider: riderId,
        status: { $in: ['assigned', 'picked_up', 'on_the_way'] }
      });
      return count;
    } catch (err) {
      console.error('Error getting rider active deliveries:', err);
      return 0;
    }
  }
}

/**
 * Score rider for assignment
 */
function scoreRider(rider, distanceToShop, totalDistance, shopCoordinates) {
  // Base score from distance (closer = higher score)
  const distanceScore = Math.max(0, 100 - (distanceToShop * 10));

  // Total distance score (shorter route = higher score)
  const routeScore = Math.max(0, 100 - (totalDistance * 5));

  // Rating score (if available)
  const ratingScore = (rider.rating || 0) * 10;

  // Availability score (less busy = higher score)
  const availabilityScore = 50; // Base availability score

  const totalScore = distanceScore + routeScore + ratingScore + availabilityScore;

  return {
    rider,
    score: totalScore,
    distanceToShop,
    totalDistance
  };
}

/**
 * Find available riders for delivery request
 */
async function findAvailableRiders(deliveryRequest) {
  try {
    // Get settings
    const maxConcurrentDeliveries = await getSetting('rider_max_concurrent_deliveries', 2);
    const notifyCount = await getSetting('delivery_notify_riders_count', 3);

    // Get shop coordinates
    const shop = await require('../models/Shop').findById(deliveryRequest.shop);
    if (!shop || !shop.coordinates) {
      throw new Error('Shop coordinates not found');
    }

    // Find available riders
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const availableRiders = await Rider.find({
      isAvailable: true,
      status: 'active',
      lastLocationUpdate: { $gte: fiveMinutesAgo },
      coordinates: { $exists: true, $ne: null }
    }).populate('user', 'name email phone');

    // Filter riders by service radius and active deliveries
    const ridersWithScores = [];

    for (const rider of availableRiders) {
      // Check active deliveries count
      const activeCount = await getRiderActiveDeliveriesCount(rider._id);
      if (activeCount >= maxConcurrentDeliveries) {
        continue; // Skip if at max capacity
      }

      // Check if rider has coordinates
      if (!rider.coordinates || !rider.coordinates.latitude || !rider.coordinates.longitude) {
        continue;
      }

      // Calculate distance from rider to shop
      const distanceToShop = calculateDistance(
        rider.coordinates.latitude,
        rider.coordinates.longitude,
        shop.coordinates.latitude,
        shop.coordinates.longitude
      );

      // Calculate total distance (rider -> shop -> customer)
      const distanceToCustomer = deliveryRequest.distance;
      const totalDistance = distanceToShop + distanceToCustomer;

      // Check if within service radius
      if (totalDistance > rider.serviceRadius) {
        continue; // Skip if outside service radius
      }

      // Score rider
      const scored = scoreRider(rider, distanceToShop, totalDistance, shop.coordinates);
      ridersWithScores.push(scored);
    }

    // Sort by score (highest first) and return top N
    ridersWithScores.sort((a, b) => b.score - a.score);
    return ridersWithScores.slice(0, notifyCount);

  } catch (error) {
    console.error('Error finding available riders:', error);
    throw error;
  }
}

/**
 * Auto assign delivery request
 */
async function autoAssignDelivery(deliveryRequestId) {
  try {
    const deliveryRequest = await DeliveryRequest.findById(deliveryRequestId)
      .populate('shop', 'shopName coordinates')
      .populate('order');

    if (!deliveryRequest) {
      throw new Error('Delivery request not found');
    }

    if (deliveryRequest.status !== 'pending') {
      throw new Error('Delivery request is not pending');
    }

    // Calculate priority
    deliveryRequest.priority = calculatePriority(deliveryRequest.distance);
    await deliveryRequest.save();

    // Set timeout first (before finding riders) to ensure expiresAt is always set
    const timeoutSeconds = await getSetting('delivery_assignment_timeout', 120);
    const timeoutAt = new Date(Date.now() + timeoutSeconds * 1000);

    console.log(`⏰ Setting expiresAt for delivery request ${deliveryRequestId}:`, {
      timeoutSeconds,
      timeoutAt: timeoutAt.toISOString(),
      timeoutAtLocal: timeoutAt.toLocaleString('th-TH'),
      now: new Date().toISOString(),
      diffSeconds: Math.floor((timeoutAt - new Date()) / 1000),
      diffMinutes: Math.floor((timeoutAt - new Date()) / 1000 / 60)
    });

    // Update expiresAt in delivery request (set it early to ensure it's always set)
    deliveryRequest.expiresAt = timeoutAt;

    // Find available riders
    const availableRiders = await findAvailableRiders(deliveryRequest);

    if (availableRiders.length === 0) {
      // No riders available - keep request as pending for manual assignment
      // Don't cancel immediately, let it wait for riders to become available
      console.log(`⚠️ No available riders found for delivery request ${deliveryRequestId}`);
      console.log(`   Keeping request as pending for manual assignment or when riders become available`);
      console.log(`   ExpiresAt set to: ${timeoutAt.toISOString()} (${timeoutSeconds} seconds from now)`);

      // Save expiresAt even when no riders available
      await deliveryRequest.save();

      return {
        success: false,
        reason: 'no_available_riders',
        message: 'No available riders found - request will remain pending for manual assignment',
        requestStatus: 'pending' // Keep as pending
      };
    }

    // Update assignment attempt
    deliveryRequest.assignmentAttempts += 1;
    deliveryRequest.lastAssignmentAttempt = new Date();

    // Save with expiresAt
    await deliveryRequest.save();

    // Store notified riders to avoid sending duplicate notifications
    const notifiedRiderIds = availableRiders.map(r => {
      const riderUserId = r.rider?.user?._id || r.rider?.user || null;
      return riderUserId;
    }).filter(id => id !== null);

    // Add to notifiedRiders array (avoid duplicates)
    if (!deliveryRequest.notifiedRiders) {
      deliveryRequest.notifiedRiders = [];
    }
    notifiedRiderIds.forEach(riderId => {
      const exists = deliveryRequest.notifiedRiders.some(id =>
        id.toString() === riderId.toString()
      );
      if (!exists) {
        deliveryRequest.notifiedRiders.push(riderId);
      }
    });
    await deliveryRequest.save();

    // Send notifications to riders
    const notificationResult = await notificationService.sendDeliveryAssignmentNotifications(
      availableRiders,
      deliveryRequest
    );
    console.log('📱 Notification result:', notificationResult);
    console.log(`   ExpiresAt set to: ${timeoutAt.toISOString()} (${timeoutSeconds} seconds from now)`);
    console.log(`   Notified ${notifiedRiderIds.length} riders:`, notifiedRiderIds.map(id => id.toString()));

    // Helper function to handle timeout and retry
    const handleTimeout = async (requestId, attemptNumber) => {
      try {
        const request = await DeliveryRequest.findById(requestId)
          .populate('shop', 'coordinates')
          .populate('order');

        if (!request || request.status !== 'pending' || request.rider) {
          return; // Already assigned or cancelled
        }

        const maxRetryAttempts = await getSetting('delivery_max_retry_attempts', 3);
        const timeoutSeconds = await getSetting('delivery_assignment_timeout', 120);

        console.log(`⏰ Delivery request ${requestId} timeout (attempt ${attemptNumber}/${maxRetryAttempts}) - trying to find another rider...`);

        // Check if we've exceeded max retry attempts
        if (attemptNumber >= maxRetryAttempts) {
          console.log(`⚠️ Max retry attempts (${maxRetryAttempts}) reached - cancelling order`);

          request.status = 'cancelled';
          request.cancellationReason = `no_rider_response_after_${maxRetryAttempts}_attempts`;
          await request.save();

          // Cancel the associated order
          if (request.order) {
            const Order = require('../models/Order');
            const Delivery = require('../models/Delivery');

            const order = await Order.findById(request.order);
            if (order && !['completed', 'cancelled'].includes(order.status)) {
              order.status = 'cancelled';
              order.cancelledBy = 'system';
              order.notes = order.notes ? `${order.notes}\n[Auto-cancelled: No rider response after ${maxRetryAttempts} attempts]` : `[Auto-cancelled: No rider response after ${maxRetryAttempts} attempts]`;
              await order.save();
              console.log(`✅ Cancelled order ${order.orderNumber} due to max retry attempts`);
            }

            // Cancel related delivery if exists
            if (order && order.delivery) {
              const delivery = await Delivery.findById(order.delivery);
              if (delivery && !['completed', 'cancelled', 'delivered'].includes(delivery.status)) {
                delivery.status = 'cancelled';
                await delivery.save();
                console.log(`✅ Cancelled delivery ${delivery._id} due to max retry attempts`);
              }
            }
          }
          return;
        }

        // Try to find another rider (excluding already notified and rejected ones)
        const remainingRiders = await findAvailableRiders(request);

        // Filter out riders who have already been notified or rejected
        const notifiedRiders = request.notifiedRiders || [];
        const rejectedBy = request.rejectedBy || [];

        const newAvailableRiders = remainingRiders.filter(r => {
          const riderUserId = r.rider?.user?._id || r.rider?.user || null;
          if (!riderUserId) return false;

          // Exclude if already notified
          const alreadyNotified = notifiedRiders.some(notifiedId =>
            notifiedId.toString() === riderUserId.toString()
          );
          if (alreadyNotified) return false;

          // Exclude if already rejected
          const alreadyRejected = rejectedBy.some(rejectedId =>
            rejectedId.toString() === riderUserId.toString()
          );
          if (alreadyRejected) return false;

          return true;
        });

        if (newAvailableRiders.length > 0) {
          // Found new riders - send notifications
          console.log(`✅ Found ${newAvailableRiders.length} new available riders (excluding ${notifiedRiders.length} notified, ${rejectedBy.length} rejected) - sending notifications...`);

          request.assignmentAttempts += 1;
          request.lastAssignmentAttempt = new Date();
          request.expiresAt = new Date(Date.now() + timeoutSeconds * 1000); // Reset timeout

          // Store new notified riders
          const newNotifiedRiderIds = newAvailableRiders.map(r => {
            const riderUserId = r.rider?.user?._id || r.rider?.user || null;
            return riderUserId;
          }).filter(id => id !== null);

          newNotifiedRiderIds.forEach(riderId => {
            const exists = notifiedRiders.some(id =>
              id.toString() === riderId.toString()
            );
            if (!exists) {
              notifiedRiders.push(riderId);
            }
          });
          request.notifiedRiders = notifiedRiders;
          await request.save();

          // Send notifications to new riders
          await notificationService.sendDeliveryAssignmentNotifications(
            newAvailableRiders,
            request
          );

          console.log(`   Notified ${newNotifiedRiderIds.length} new riders:`, newNotifiedRiderIds.map(id => id.toString()));

          // Set another timeout for next retry
          setTimeout(() => {
            handleTimeout(requestId, attemptNumber + 1);
          }, timeoutSeconds * 1000);

        } else {
          // No new riders available - cancel order
          console.log(`⚠️ No new available riders found (${notifiedRiders.length} notified, ${rejectedBy.length} rejected) - cancelling order`);

          request.status = 'cancelled';
          request.cancellationReason = 'no_new_rider_available_after_timeout';
          await request.save();

          // Cancel the associated order
          if (request.order) {
            const Order = require('../models/Order');
            const Delivery = require('../models/Delivery');

            const order = await Order.findById(request.order);
            if (order && !['completed', 'cancelled'].includes(order.status)) {
              order.status = 'cancelled';
              order.cancelledBy = 'system';
              order.notes = order.notes ? `${order.notes}\n[Auto-cancelled: No new rider available]` : '[Auto-cancelled: No new rider available]';
              await order.save();
              console.log(`✅ Cancelled order ${order.orderNumber} due to no new available riders`);
            }

            // Cancel related delivery if exists
            if (order && order.delivery) {
              const delivery = await Delivery.findById(order.delivery);
              if (delivery && !['completed', 'cancelled', 'delivered'].includes(delivery.status)) {
                delivery.status = 'cancelled';
                await delivery.save();
                console.log(`✅ Cancelled delivery ${delivery._id} due to no new available riders`);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in timeout handler:', error);
      }
    };

    // Start timeout handler
    setTimeout(() => {
      handleTimeout(deliveryRequestId, 1);
    }, timeoutSeconds * 1000);

    return {
      success: true,
      ridersNotified: availableRiders.length,
      riders: availableRiders.map(r => ({
        riderId: r.rider._id,
        name: r.rider.user?.name || 'Unknown',
        distanceToShop: r.distanceToShop.toFixed(2),
        totalDistance: r.totalDistance.toFixed(2),
        score: r.score.toFixed(2)
      })),
      message: `Notifications sent to ${availableRiders.length} riders`,
      timeoutSeconds
    };

  } catch (error) {
    console.error('Error in auto assign:', error);
    throw error;
  }
}

/**
 * Manual assign delivery request to specific rider
 */
async function manualAssignDelivery(deliveryRequestId, riderId, assignedBy) {
  try {
    const deliveryRequest = await DeliveryRequest.findById(deliveryRequestId)
      .populate('shop')
      .populate('order');

    if (!deliveryRequest) {
      throw new Error('Delivery request not found');
    }

    if (deliveryRequest.status !== 'pending') {
      throw new Error('Delivery request is not pending');
    }

    // Check rider
    const rider = await Rider.findById(riderId).populate('user');
    if (!rider || rider.status !== 'active') {
      throw new Error('Rider not found or not active');
    }

    // Check if rider is available
    if (!rider.isAvailable) {
      throw new Error('Rider is not available');
    }

    // Check active deliveries
    const maxConcurrent = await getSetting('rider_max_concurrent_deliveries', 2);
    const activeCount = await getRiderActiveDeliveriesCount(riderId);
    if (activeCount >= maxConcurrent) {
      throw new Error(`Rider already has ${activeCount} active deliveries (max: ${maxConcurrent})`);
    }

    // Assign to rider
    // Store both User ID (for reference) and riderCode (for easier querying)
    const riderUserId = rider.user?._id || rider.user;
    const riderCode = rider.riderCode;

    if (!riderCode) {
      throw new Error(`Rider ${rider._id} does not have a riderCode`);
    }

    deliveryRequest.rider = riderUserId;
    deliveryRequest.riderCode = riderCode;
    deliveryRequest.status = 'accepted';
    deliveryRequest.acceptedAt = new Date();
    deliveryRequest.assignmentMethod = 'manual';
    await deliveryRequest.save();

    console.log(`✅ Updated DeliveryRequest (manual):`, {
      requestId: deliveryRequest._id.toString(),
      riderUserId: riderUserId?.toString() || 'N/A',
      riderCode: riderCode || 'N/A',
      riderId: rider._id.toString(),
      status: 'accepted'
    });

    // Calculate delivery fee and total price
    const deliveryFee = deliveryRequest.requestedDeliveryFee || await calculateDeliveryFee(deliveryRequest.distance);
    // Use subtotal (food cost only), not total (which includes delivery fee)
    const foodCost = deliveryRequest.order?.subtotal || 0;
    // Total price should match order.total (which is subtotal + deliveryFee - discountAmount)
    // Use order.total as the source of truth
    const totalPrice = deliveryRequest.order?.total || await calculateTotalPrice(foodCost, deliveryRequest.distance);

    // Create Delivery record
    // Store both User ID (for reference) and riderCode (for easier querying)
    const delivery = new Delivery({
      order: deliveryRequest.order._id,
      shop: deliveryRequest.shop._id,
      customer: deliveryRequest.order.customer || deliveryRequest.order.user,
      rider: riderUserId, // User ID for reference
      riderCode: riderCode, // Rider Code for easier querying
      deliveryAddress: deliveryRequest.deliveryAddress,
      deliveryCoordinates: deliveryRequest.deliveryCoordinates,
      shopCoordinates: deliveryRequest.shop.coordinates,
      distance: deliveryRequest.distance,
      deliveryFee: deliveryFee,
      riderFee: deliveryFee, // Rider gets the delivery fee
      totalPrice: totalPrice, // Total price customer pays
      foodCost: foodCost, // Food cost (subtotal)
      contactPhone: deliveryRequest.contactPhone,
      notes: deliveryRequest.notes,
      status: 'assigned',
      assignedAt: new Date(),
      isReassignment: deliveryRequest.isReassignment || false,
      reassignmentFee: deliveryRequest.reassignmentFee || 0
    });
    await delivery.save();

    // Link Delivery to Order
    if (deliveryRequest.order) {
      const Order = require('../models/Order');
      await Order.findByIdAndUpdate(deliveryRequest.order._id, {
        delivery: delivery._id,
        rider: rider.user?._id || rider.user
      });
      console.log(`✅ Linked Delivery ${delivery._id} to Order ${deliveryRequest.order._id} (manual assignment)`);
    }

    return {
      success: true,
      delivery,
      deliveryRequest,
      rider: {
        _id: rider._id,
        name: rider.user?.name,
        phone: rider.user?.phone
      }
    };

  } catch (error) {
    console.error('Error in manual assign:', error);
    throw error;
  }
}

/**
 * Rider accepts delivery request
 */
async function acceptDelivery(deliveryRequestId, riderId) {
  try {
    console.log(`🚀 acceptDelivery called:`, {
      deliveryRequestId: deliveryRequestId.toString(),
      riderId: riderId.toString()
    });

    const deliveryRequest = await DeliveryRequest.findById(deliveryRequestId)
      .populate('shop')
      .populate('order');

    console.log(`📋 DeliveryRequest found:`, {
      requestId: deliveryRequest?._id?.toString() || 'NOT FOUND',
      status: deliveryRequest?.status || 'N/A',
      orderId: deliveryRequest?.order?._id?.toString() || 'N/A',
      shopId: deliveryRequest?.shop?._id?.toString() || 'N/A',
      currentRider: deliveryRequest?.rider?.toString() || 'null'
    });

    if (!deliveryRequest) {
      throw new Error('Delivery request not found');
    }

    if (deliveryRequest.status !== 'pending') {
      console.log(`⚠️ Delivery request is not pending, status: ${deliveryRequest.status}`);
      throw new Error('Delivery request is not pending');
    }

    // Check rider
    const rider = await Rider.findById(riderId).populate('user');
    console.log(`👤 Rider found:`, {
      riderId: rider?._id?.toString() || 'NOT FOUND',
      riderCode: rider?.riderCode || 'N/A',
      status: rider?.status || 'N/A',
      isAvailable: rider?.isAvailable || false,
      userId: rider?.user?._id?.toString() || rider?.user?.toString() || 'N/A',
      userName: rider?.user?.name || 'N/A'
    });

    if (!rider || rider.status !== 'active' || !rider.isAvailable) {
      console.log(`❌ Rider not available:`, {
        exists: !!rider,
        status: rider?.status || 'N/A',
        isAvailable: rider?.isAvailable || false
      });
      throw new Error('Rider not available');
    }

    // Check active deliveries
    const maxConcurrent = await getSetting('rider_max_concurrent_deliveries', 2);
    const activeCount = await getRiderActiveDeliveriesCount(riderId);
    if (activeCount >= maxConcurrent) {
      throw new Error(`Rider already has ${activeCount} active deliveries (max: ${maxConcurrent})`);
    }

    // Use fee from order creation (road distance when GOOGLE_MAPS_API_KEY set); fallback recalc from request.distance
    const deliveryFee = deliveryRequest.requestedDeliveryFee ?? deliveryRequest.riderFee ?? await calculateDeliveryFee(deliveryRequest.distance);
    // Use subtotal (food cost only), not total (which includes delivery fee)
    const foodCost = deliveryRequest.order?.subtotal || 0;
    // Total price should match order.total (which is subtotal + deliveryFee - discountAmount)
    const totalPrice = deliveryRequest.order?.total || await calculateTotalPrice(foodCost, deliveryRequest.distance);

    // Get customer
    const customerId = deliveryRequest.order?.customer || deliveryRequest.order?.user;
    const customer = await User.findById(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Get settings
    const customerPaysFoodAndRiderCost = await getSetting('customer_pays_food_and_rider_cost', true);
    const shopNoCostFee = await getSetting('shop_no_cost_fee', true);

    // Customer pays: food cost + rider cost (if enabled)
    // No point deduction from customer when ordering (removed as per user request)
    console.log(`ℹ️ Customer order - no point deduction applied`);

    // Assign to rider
    // Store both User ID (for reference) and riderCode (for easier querying)
    const riderUserId = rider.user?._id || rider.user;
    const riderCode = rider.riderCode;

    if (!riderCode) {
      throw new Error(`Rider ${rider._id} does not have a riderCode`);
    }

    deliveryRequest.rider = riderUserId;
    deliveryRequest.riderCode = riderCode;
    deliveryRequest.status = 'accepted';
    deliveryRequest.acceptedAt = new Date();
    deliveryRequest.assignmentMethod = 'auto';
    await deliveryRequest.save();

    console.log(`✅ Updated DeliveryRequest:`, {
      requestId: deliveryRequest._id.toString(),
      riderUserId: riderUserId?.toString() || 'N/A',
      riderCode: riderCode || 'N/A',
      riderId: rider._id.toString(),
      status: 'accepted'
    });

    // Send notification to rider
    if (rider) {
      await notificationService.sendDeliveryAssignedNotification(deliveryRequest, rider);
    }

    // Create Delivery record
    // Store both User ID (for reference) and riderCode (for easier querying)

    console.log(`🔑 Setting rider for Delivery:`, {
      riderId: rider._id.toString(),
      riderCode: riderCode || 'N/A',
      riderUserId: riderUserId?.toString() || 'N/A',
      userIdFromRider: rider.user?._id?.toString() || rider.user?.toString() || 'N/A'
    });

    if (!riderUserId) {
      throw new Error(`Cannot create Delivery: Rider ${rider._id} (code: ${riderCode || 'N/A'}) does not have associated User`);
    }

    const delivery = new Delivery({
      order: deliveryRequest.order._id,
      shop: deliveryRequest.shop._id,
      customer: customerId,
      rider: riderUserId, // User ID for reference
      riderCode: riderCode, // Rider Code for easier querying
      deliveryAddress: deliveryRequest.deliveryAddress,
      deliveryCoordinates: deliveryRequest.deliveryCoordinates,
      shopCoordinates: deliveryRequest.shop.coordinates,
      distance: deliveryRequest.distance,
      deliveryFee: deliveryFee,
      riderFee: deliveryFee, // Rider gets the delivery fee
      totalPrice: totalPrice, // Total price customer pays
      foodCost: foodCost,
      contactPhone: deliveryRequest.contactPhone,
      notes: deliveryRequest.notes,
      status: 'assigned',
      assignedAt: new Date(),
      isReassignment: deliveryRequest.isReassignment || false,
      reassignmentFee: deliveryRequest.reassignmentFee || 0,
      // Shop doesn't pay cost/fee if enabled
      shopPaidPoints: shopNoCostFee ? 0 : (deliveryRequest.shopPayPoints || 0),
    });

    console.log(`📝 Creating Delivery record:`, {
      orderId: deliveryRequest.order._id?.toString() || 'N/A',
      shopId: deliveryRequest.shop._id?.toString() || 'N/A',
      customerId: customerId.toString(),
      riderUserId: (rider.user?._id || rider.user)?.toString() || 'N/A',
      riderId: rider._id.toString(),
      status: 'assigned',
      deliveryFee: deliveryFee,
      totalPrice: totalPrice
    });

    try {
      await delivery.save();
      console.log(`✅ Delivery record created successfully: ${delivery._id}`);
      console.log(`   - Rider (User ID): ${delivery.rider?.toString() || 'null'}`);
      console.log(`   - Status: ${delivery.status}`);
      console.log(`   - Order: ${delivery.order?.toString() || 'N/A'}`);
    } catch (saveError) {
      console.error(`❌ Error saving Delivery record:`, {
        message: saveError.message,
        errors: saveError.errors,
        stack: saveError.stack
      });
      throw saveError;
    }

    // Link Delivery to Order
    if (deliveryRequest.order) {
      const Order = require('../models/Order');
      await Order.findByIdAndUpdate(deliveryRequest.order._id, {
        delivery: delivery._id,
        rider: rider.user?._id || rider.user
      });
      console.log(`✅ Linked Delivery ${delivery._id} to Order ${deliveryRequest.order._id}`);
    }

    // No point transaction update needed (point deduction removed)

    return {
      success: true,
      delivery,
      deliveryRequest
    };

  } catch (error) {
    console.error('Error accepting delivery:', error);
    throw error;
  }
}

/**
 * Handle rider cancel after accepting
 */
async function handleRiderCancel(deliveryId, riderId, reason) {
  try {
    const delivery = await Delivery.findById(deliveryId)
      .populate('order')
      .populate('rider');

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    if (delivery.rider.toString() !== riderId.toString()) {
      throw new Error('Not authorized to cancel this delivery');
    }

    // Check if customer or shop canceled
    const order = await Order.findById(delivery.order);
    const customerCanceled = order && (order.status === 'cancelled' && order.cancelledBy === 'customer');
    const shopCanceled = order && (order.status === 'cancelled' && order.cancelledBy === 'shop');

    // Get settings
    const reassignmentFee = await getSetting('reassignment_fee', 0);

    // No penalty points for rider cancel (removed as per user request)
    console.log(`ℹ️ Rider cancelled delivery - no penalty points applied`);

    // Mark as reassignment
    delivery.isReassignment = true;
    delivery.previousRider = delivery.rider;
    delivery.reassignmentFee = reassignmentFee;
    delivery.status = 'cancelled';
    await delivery.save();

    // Cancel related order and delivery request
    const Order = require('../models/Order');
    const DeliveryRequest = require('../models/DeliveryRequest');

    // Cancel order if exists
    if (delivery.order) {
      const order = await Order.findById(delivery.order);
      if (order && !['completed', 'cancelled'].includes(order.status)) {
        order.status = 'cancelled';
        order.cancelledBy = 'rider'; // Mark as cancelled by rider (with penalty)
        await order.save();
        console.log(`✅ Cancelled order ${order._id} due to delivery cancellation`);
      }
    }

    // Cancel delivery request
    const deliveryRequest = await DeliveryRequest.findOne({ order: delivery.order });
    if (deliveryRequest) {
      if (!customerCanceled) {
        // If rider canceled (not customer), mark for reassignment
        deliveryRequest.rider = null;
        deliveryRequest.status = 'pending';
        deliveryRequest.assignmentAttempts += 1;
        deliveryRequest.reassignmentFee = reassignmentFee;
        deliveryRequest.riderCanceled = true;
        deliveryRequest.riderCancelReason = reason || '';
        deliveryRequest.customerCanceled = false;
        await deliveryRequest.save();

        // Re-assign (if auto assignment enabled)
        const autoAssignEnabled = await getSetting('delivery_auto_assign_enabled', true);
        if (autoAssignEnabled) {
          await autoAssignDelivery(deliveryRequest._id);
        }
      } else {
        // If customer already canceled, cancel the request too
        deliveryRequest.status = 'cancelled';
        deliveryRequest.customerCanceled = true;
        await deliveryRequest.save();
        console.log(`✅ Cancelled delivery request ${deliveryRequest._id} due to customer cancellation`);
      }
    }

    return {
      success: true,
      penaltyApplied: !customerCanceled && !shopCanceled && penaltyPoints > 0,
      penaltyPoints: !customerCanceled && !shopCanceled ? penaltyPoints : 0,
      reassignmentFee
    };

  } catch (error) {
    console.error('Error handling rider cancel:', error);
    throw error;
  }
}

/**
 * Handle rider pickup (shop pays rider)
 */
async function handleRiderPickup(deliveryId) {
  try {
    const delivery = await Delivery.findById(deliveryId)
      .populate('shop')
      .populate('rider');

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    if (delivery.status !== 'assigned') {
      throw new Error('Delivery must be assigned before pickup');
    }

    // Shop payment to rider has been removed (as per user request)
    console.log(`ℹ️ Rider picked up order - no points payment applied`);

    // Update delivery status
    delivery.status = 'picked_up';
    delivery.pickedUpAt = new Date();
    delivery.shopPaidPoints = 0; // No payment
    await delivery.save();

    // Send notification to shop
    await notificationService.sendPickupNotification(delivery, delivery.shop);

    return {
      success: true,
      paymentPoints: 0, // No payment
      delivery
    };

  } catch (error) {
    console.error('Error handling rider pickup:', error);
    throw error;
  }
}

/**
 * Check and cancel delivery requests that have been pending for more than 10 minutes
 * This ensures orders are cancelled if no rider accepts within 10 minutes
 * Also handles expired requests (expiresAt < now) that are still pending
 */
async function checkAndCancelOldPendingRequests() {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
    const now = new Date();

    // Find delivery requests that:
    // 1. Status is still 'pending'
    // 2. No rider assigned (rider is null)
    // 3. Either: Created more than 10 minutes ago OR expired (expiresAt < now)
    const oldPendingRequests = await DeliveryRequest.find({
      status: 'pending',
      rider: null,
      $or: [
        { createdAt: { $lt: tenMinutesAgo } }, // Created more than 10 minutes ago
        { expiresAt: { $lt: now, $ne: null } } // Expired but still pending
      ]
    })
      .populate('order')
      .populate('shop');

    if (oldPendingRequests.length === 0) {
      return {
        success: true,
        cancelled: 0,
        message: 'No old pending requests found'
      };
    }

    const DEBUG_CRON = process.env.DEBUG_CRON === '1';
    const Order = require('../models/Order');
    const Delivery = require('../models/Delivery');
    let cancelledCount = 0;

    for (const request of oldPendingRequests) {
      try {
        // Update delivery request status
        request.status = 'cancelled';
        request.cancellationReason = 'no_rider_response_after_10_minutes';
        await request.save();

        if (request.order) {
          const orderId = request.order._id || request.order;
          const order = await Order.findById(orderId);
          if (!order) {
            if (DEBUG_CRON) console.error(`❌ Order not found: ${orderId}`);
            continue;
          }

          if (!['completed', 'cancelled'].includes(order.status)) {
            order.status = 'cancelled';
            order.cancelledBy = 'system';
            order.notes = order.notes
              ? `${order.notes}\n[Auto-cancelled: No rider response after 10 minutes]`
              : '[Auto-cancelled: No rider response after 10 minutes]';
            await order.save();
            if (DEBUG_CRON) console.log(`✅ Cancelled order ${order.orderNumber || order._id} - no rider response`);

            try {
              await notificationService.sendOrderCancelledNotification(
                order._id,
                'no_rider_response_after_10_minutes'
              );
            } catch (notifError) {
              console.error(`❌ Error sending cancellation notification:`, notifError);
            }

            // Cancel related delivery if exists
            if (order.delivery) {
              const delivery = await Delivery.findById(order.delivery);
              if (delivery && !['completed', 'cancelled', 'delivered'].includes(delivery.status)) {
                delivery.status = 'cancelled';
                await delivery.save();
                console.log(`✅ Cancelled delivery ${delivery._id} - no rider response after 10 minutes`);
              }
            }
          }
        } else if (DEBUG_CRON) {
          console.error(`❌ Request ${request._id} has no order`);
        }

        cancelledCount++;
      } catch (error) {
        console.error(`❌ Error cancelling delivery request ${request._id}:`, error);
      }
    }

    if (cancelledCount > 0) {
      console.log(`✅ Delivery timeout: cancelled ${cancelledCount} request(s)`);
    }

    return {
      success: true,
      cancelled: cancelledCount,
      message: `Cancelled ${cancelledCount} delivery request(s)`
    };

  } catch (error) {
    console.error('❌ Error checking old pending requests:', error);
    throw error;
  }
}

/**
 * Check and cancel orders for delivery requests that are cancelled/expired but order is not cancelled
 * This is a cleanup function to ensure consistency
 */
async function checkAndCancelOrdersForCancelledRequests() {
  try {
    const Order = require('../models/Order');
    const Delivery = require('../models/Delivery');

    // Find delivery requests that are cancelled or expired but order is not cancelled
    const cancelledRequests = await DeliveryRequest.find({
      status: { $in: ['cancelled', 'expired'] },
      order: { $exists: true, $ne: null }
    })
      .populate('order')
      .lean();

    if (cancelledRequests.length === 0) {
      return {
        success: true,
        cancelled: 0,
        message: 'No cancelled/expired requests with active orders found'
      };
    }

    const DEBUG_CRON = process.env.DEBUG_CRON === '1';
    let cancelledCount = 0;
    let alreadyCancelledCount = 0;
    let alreadyCompletedCount = 0;
    let noOrderCount = 0;

    for (const request of cancelledRequests) {
      try {
        if (!request.order) {
          if (DEBUG_CRON) console.log(`⚠️ Request ${request._id} has no order`);
          noOrderCount++;
          continue;
        }

        const orderId = request.order._id || request.order;
        const order = await Order.findById(orderId);

        if (!order) {
          if (DEBUG_CRON) console.log(`⚠️ Order not found: ${orderId}`);
          continue;
        }

        if (order.status === 'cancelled') {
          alreadyCancelledCount++;
          continue;
        }

        if (order.status === 'completed') {
          alreadyCompletedCount++;
          continue;
        }

        if (!['completed', 'cancelled'].includes(order.status)) {
          order.status = 'cancelled';
          order.cancelledBy = 'system';
          const cancellationReason = request.status === 'expired'
            ? 'Delivery request expired'
            : 'Delivery request cancelled';
          order.notes = order.notes
            ? `${order.notes}\n[Auto-cancelled: ${cancellationReason}]`
            : `[Auto-cancelled: ${cancellationReason}]`;
          await order.save();

          if (DEBUG_CRON) console.log(`✅ Cancelled order ${order.orderNumber || order._id} - ${cancellationReason}`);

          if (order.delivery) {
            const delivery = await Delivery.findById(order.delivery);
            if (delivery && !['completed', 'cancelled', 'delivered'].includes(delivery.status)) {
              delivery.status = 'cancelled';
              await delivery.save();
            }
          }

          try {
            await notificationService.sendOrderCancelledNotification(
              order._id,
              request.status === 'expired' ? 'delivery_request_expired' : 'delivery_request_cancelled'
            );
          } catch (notifError) {
            console.error(`❌ Error sending cancellation notification:`, notifError);
          }

          cancelledCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing request ${request._id}:`, error);
      }
    }

    if (cancelledCount > 0) {
      console.log(`✅ Cancelled requests cleanup: ${cancelledCount} order(s) cancelled`);
    }

    return {
      success: true,
      cancelled: cancelledCount,
      alreadyCancelled: alreadyCancelledCount,
      alreadyCompleted: alreadyCompletedCount,
      noOrder: noOrderCount,
      message: `Cancelled ${cancelledCount} order(s)`
    };

  } catch (error) {
    console.error('❌ Error checking cancelled requests:', error);
    throw error;
  }
}

module.exports = {
  calculateDistance,
  calculatePriority,
  calculateDeliveryFee,
  calculateTotalPrice,
  findAvailableRiders,
  autoAssignDelivery,
  manualAssignDelivery,
  acceptDelivery,
  handleRiderCancel,
  handleRiderPickup,
  getRiderActiveDeliveriesCount,
  checkAndCancelOldPendingRequests,
  checkAndCancelOrdersForCancelledRequests
};
