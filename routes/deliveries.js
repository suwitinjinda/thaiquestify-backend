const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const Delivery = require('../models/Delivery');
const DeliveryRequest = require('../models/DeliveryRequest');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');
const deliveryAssignmentService = require('../services/deliveryAssignmentService');
const { createDeliveryStatusNotification, createRiderEarningsNotification } = require('../utils/notificationHelper');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/deliveries/'); // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `delivery-${req.params.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น'), false);
    }
  }
});

/**
 * @route   GET /api/deliveries
 * @desc    Get all deliveries (with filters)
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const {
      status,
      rider,
      shop,
      customer,
      page = 1,
      limit = 20,
    } = req.query;

    const userId = req.user.id || req.user._id;
    const query = {};

    // If user is rider, show only their deliveries
    if (req.user.userType === 'rider' || req.query.myDeliveries === 'true') {
      // Use riderCode for easier querying, but also support rider (User ID) for backward compatibility
      const Rider = require('../models/Rider');
      const rider = await Rider.findOne({ user: userId });

      console.log(`🔍 Querying deliveries for rider:`, {
        userId: userId.toString(),
        hasRider: !!rider,
        riderId: rider?._id?.toString() || 'N/A',
        riderCode: rider?.riderCode || 'N/A'
      });

      if (rider && rider.riderCode) {
        // Query by riderCode OR rider (User ID) to support both new and old deliveries
        query.$or = [
          { riderCode: rider.riderCode },
          { rider: userId }
        ];
        console.log(`✅ Query set to riderCode: ${rider.riderCode} OR rider (User ID): ${userId.toString()}`);
      } else if (rider) {
        // Fallback to User ID if riderCode is not available
        query.rider = userId;
        console.log(`✅ Query set to rider (User ID): ${userId.toString()} (no riderCode)`);
      } else {
        // If no rider found, use invalid ID to return empty results
        const invalidId = new mongoose.Types.ObjectId();
        query.rider = invalidId;
        console.log(`❌ No rider found for user ${userId.toString()}, using invalid ID to return empty results`);
      }
    }

    // If user is shop owner, show only their shop deliveries
    if (req.user.userType === 'partner' || req.query.myShopDeliveries === 'true') {
      // Will need to check shop ownership
      if (shop) {
        query.shop = shop;
      }
    }

    // If user is customer, show only their deliveries
    if (req.query.myOrders === 'true') {
      query.customer = userId;
    }

    if (status) query.status = status;
    if (rider) query.rider = rider;
    if (shop) query.shop = shop;
    if (customer) query.customer = customer;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Log query details for debugging
    console.log(`🔍 Delivery query:`, JSON.stringify(query, null, 2));

    const deliveries = await Delivery.find(query)
      .populate('order', 'orderNumber subtotal total status')
      .populate('shop', 'shopName shopId phone address coordinates')
      .populate('customer', 'name email phone')
      .populate('rider', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Delivery.countDocuments(query);

    console.log(`📦 Found ${total} deliveries matching query (returning ${deliveries.length})`);
    if (deliveries.length > 0) {
      console.log(`✅ Sample delivery:`, {
        deliveryId: deliveries[0]._id?.toString() || 'N/A',
        orderNumber: deliveries[0].order?.orderNumber || 'N/A',
        riderCode: deliveries[0].riderCode || 'N/A',
        riderId: deliveries[0].rider?._id?.toString() || deliveries[0].rider?.toString() || 'null',
        riderName: deliveries[0].rider?.name || 'N/A',
        status: deliveries[0].status || 'N/A'
      });
    } else if (query.$or || query.rider || query.riderCode) {
      // If querying by rider but no results, check all deliveries
      console.log(`⚠️ No deliveries found for rider. Checking all deliveries in database...`);
      const allDeliveriesCount = await Delivery.countDocuments({});
      console.log(`   Total deliveries in DB: ${allDeliveriesCount}`);
      if (allDeliveriesCount > 0) {
        const sampleDelivery = await Delivery.findOne({}).populate('rider', 'name email phone');
        if (sampleDelivery) {
          console.log(`   Sample delivery from DB:`, {
            deliveryId: sampleDelivery._id.toString(),
            riderCode: sampleDelivery.riderCode || 'N/A',
            riderId: sampleDelivery.rider?._id?.toString() || sampleDelivery.rider?.toString() || 'null',
            riderName: sampleDelivery.rider?.name || 'N/A',
            status: sampleDelivery.status
          });
          if (query.$or) {
            console.log(`   🔍 Query: $or=${JSON.stringify(query.$or)}`);
          } else if (query.riderCode) {
            console.log(`   🔍 Query riderCode: ${query.riderCode}, Sample riderCode: ${sampleDelivery.riderCode || 'N/A'}`);
          } else if (query.rider) {
            console.log(`   🔍 Query rider: ${query.rider.toString()}, Sample rider: ${(sampleDelivery.rider?._id || sampleDelivery.rider || 'null').toString()}`);
          }
        }
      }
    }

    res.json({
      success: true,
      data: deliveries,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการส่ง',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/deliveries/available
 * @desc    Get available deliveries for riders
 * @access  Private (rider only)
 */
/**
 * @route   POST /api/deliveries/calculate-fee
 * @desc    Calculate delivery fee based on distance
 * @access  Private
 */
router.post('/calculate-fee', auth, async (req, res) => {
  try {
    const { distance } = req.body;

    if (!distance || distance < 0) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุระยะทาง',
      });
    }

    const deliveryFee = await deliveryAssignmentService.calculateDeliveryFee(distance);

    res.json({
      success: true,
      data: {
        distance: distance,
        deliveryFee: deliveryFee,
      },
    });
  } catch (error) {
    console.error('Error calculating delivery fee:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการคำนวณค่าจัดส่ง',
      error: error.message,
    });
  }
});

router.get('/available', auth, async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10 } = req.query;

    // Find pending deliveries
    const deliveries = await Delivery.find({
      status: 'pending',
    })
      .populate('order', 'orderNumber subtotal total status')
      .populate('shop', 'shopName shopId phone address coordinates')
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });

    // If location provided, filter by distance
    let filteredDeliveries = deliveries;
    if (latitude && longitude) {
      filteredDeliveries = deliveries.filter(delivery => {
        if (!delivery.shopCoordinates || !delivery.shopCoordinates.latitude) {
          return false;
        }
        // Simple distance calculation (Haversine formula would be better)
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          delivery.shopCoordinates.latitude,
          delivery.shopCoordinates.longitude
        );
        return distance <= parseFloat(maxDistance);
      });
    }

    res.json({
      success: true,
      data: filteredDeliveries,
    });
  } catch (error) {
    console.error('Error fetching available deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการส่งที่พร้อม',
      error: error.message,
    });
  }
});

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * @route   GET /api/deliveries/available-for-rider
 * @desc    Get available deliveries for rider (within service radius)
 * @access  Private (Rider)
 */
router.get('/available-for-rider', auth, async (req, res) => {
  try {
    const riderId = req.user.id || req.user._id;

    // Get rider info
    const Rider = require('../models/Rider');
    const rider = await Rider.findOne({ user: riderId })
      .populate('user', 'name email phone');

    console.log(`🔍 Checking rider ${riderId}...`);

    if (!rider) {
      console.log(`❌ Rider not found for user ${riderId}`);
      return res.status(403).json({
        success: false,
        message: 'คุณยังไม่ได้สมัครเป็น Rider',
      });
    }

    console.log(`📋 Rider info:`, {
      riderId: rider._id,
      riderCode: rider.riderCode,
      status: rider.status,
      isAvailable: rider.isAvailable,
      hasCoordinates: !!(rider.coordinates && rider.coordinates.latitude),
      serviceRadius: rider.serviceRadius,
    });

    if (rider.status !== 'active' || !rider.isAvailable) {
      console.log(`❌ Rider not available: status=${rider.status}, isAvailable=${rider.isAvailable}`);
      return res.status(403).json({
        success: false,
        message: 'คุณยังไม่ได้เปิดการรับงาน',
      });
    }

    if (!rider.coordinates || !rider.coordinates.latitude) {
      console.log(`❌ Rider has no coordinates`);
      return res.status(400).json({
        success: false,
        message: 'กรุณาอัพเดทตำแหน่งของคุณ',
      });
    }

    // Get pending delivery requests
    // Filter by: status='pending' AND rider is null (not assigned yet)
    // AND not expired (expiresAt is null OR expiresAt > now)
    // AND not rejected by this rider
    const now = new Date();
    const query = {
      status: 'pending',
      rider: null,
      $or: [
        { expiresAt: { $gt: now } }, // Not expired yet
        { expiresAt: null }, // No expiry set
      ],
    };

    // Check rejectedBy separately to avoid query issues
    // Exclude requests rejected by this rider
    const rejectedQuery = {
      ...query,
      rejectedBy: { $ne: riderId },
    };

    // Log query details including rider code
    console.log(`🔍 Query for pending requests:`, {
      status: 'pending',
      rider: null,
      riderCode: rider.riderCode || 'N/A',
      riderId: rider._id.toString(),
      userId: rider.user?._id?.toString() || rider.user?.toString() || 'N/A'
    });

    // First, check total pending requests (for debugging)
    const totalPending = await DeliveryRequest.countDocuments({ status: 'pending' });
    const totalPendingWithNullRider = await DeliveryRequest.countDocuments({ status: 'pending', rider: null });
    const totalAllRequests = await DeliveryRequest.countDocuments({});
    const totalAllStatuses = await DeliveryRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    console.log(`📊 DeliveryRequest Statistics:`);
    console.log(`   - Total in DB: ${totalAllRequests}`);
    console.log(`   - Total pending: ${totalPending}`);
    console.log(`   - Total pending (rider=null): ${totalPendingWithNullRider}`);
    console.log(`   - Status breakdown:`, totalAllStatuses.map(s => `${s._id}: ${s.count}`).join(', '));

    // Get sample of all pending requests (even with rider assigned) for debugging
    if (totalPending > 0) {
      const samplePending = await DeliveryRequest.find({ status: 'pending' })
        .limit(5)
        .select('_id requestNumber status rider shop order rejectedBy')
        .lean();
      console.log(`📋 Sample pending requests:`, samplePending.map(r => ({
        id: r._id.toString(),
        requestNumber: r.requestNumber || 'N/A',
        status: r.status,
        rider: r.rider?.toString() || 'null',
        shop: r.shop?.toString() || 'N/A',
        order: r.order?.toString() || 'N/A',
        rejectedBy: r.rejectedBy?.map(id => id.toString()) || []
      })));
    }

    // First, check and cancel expired requests immediately
    // Use the 'now' variable already declared above
    const expiredRequests = await DeliveryRequest.find({
      status: 'pending',
      rider: null,
      expiresAt: { $lt: now, $ne: null }
    })
      .populate('order')
      .populate('shop')
      .lean();

    if (expiredRequests.length > 0) {
      console.log(`⏰ Found ${expiredRequests.length} expired request(s) - cancelling immediately...`);
      const deliveryAssignmentService = require('../services/deliveryAssignmentService');
      // Cancel expired requests immediately
      for (const expiredRequest of expiredRequests) {
        try {
          const DeliveryRequestModel = require('../models/DeliveryRequest');
          const Order = require('../models/Order');
          const Delivery = require('../models/Delivery');

          // Update delivery request status
          await DeliveryRequestModel.findByIdAndUpdate(expiredRequest._id, {
            status: 'cancelled',
            cancellationReason: 'expired_no_rider_response'
          });

          // Cancel the associated order
          if (expiredRequest.order) {
            const orderId = expiredRequest.order._id || expiredRequest.order;
            const order = await Order.findById(orderId);
            if (order && !['completed', 'cancelled'].includes(order.status)) {
              order.status = 'cancelled';
              order.cancelledBy = 'system';
              order.notes = order.notes
                ? `${order.notes}\n[Auto-cancelled: Delivery request expired]`
                : '[Auto-cancelled: Delivery request expired]';
              await order.save();

              console.log(`✅ Cancelled order ${order.orderNumber || order._id} - delivery request expired`);

              // Send notification
              const notificationService = require('../services/notificationService');
              try {
                const notifResult = await notificationService.sendOrderCancelledNotification(
                  order._id,
                  'delivery_request_expired'
                );
                if (notifResult.success) {
                  console.log(`📱 Sent expiration notification for order ${order.orderNumber || order._id}`);
                } else {
                  console.log(`⚠️ Failed to send expiration notification for order ${order.orderNumber || order._id}: ${notifResult.reason || notifResult.error || 'unknown error'}`);
                }
              } catch (notifError) {
                console.error(`❌ Error sending expiration notification:`, notifError);
              }

              // Cancel related delivery if exists
              if (order.delivery) {
                const delivery = await Delivery.findById(order.delivery);
                if (delivery && !['completed', 'cancelled', 'delivered'].includes(delivery.status)) {
                  delivery.status = 'cancelled';
                  await delivery.save();
                }
              }
            }
          }
        } catch (error) {
          console.error(`❌ Error cancelling expired request ${expiredRequest._id}:`, error);
        }
      }
    }

    // First find all pending requests with null rider
    const allPendingRequests = await DeliveryRequest.find(query)
      .populate('shop', 'shopName shopId phone address coordinates')
      .populate('order', 'orderNumber subtotal total status orderType')
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    console.log(`\n📦 Found ${allPendingRequests.length} pending delivery requests (rider: null) before filtering rejectedBy`);

    // Filter out requests rejected by this rider
    const requests = allPendingRequests.filter(request => {
      const rejectedBy = request.rejectedBy || [];
      const isRejected = rejectedBy.some(rejectedId =>
        rejectedId.toString() === riderId.toString()
      );
      if (isRejected) {
        console.log(`   ⚠️ Request ${request._id} was rejected by this rider`);
      }
      return !isRejected;
    });

    console.log(`   After filtering rejectedBy: ${requests.length} requests available`);
    console.log(`   Query used:`, JSON.stringify(query, null, 2));

    if (requests.length === 0 && allPendingRequests.length > 0) {
      console.log(`   ⚠️ All ${allPendingRequests.length} pending requests were rejected by this rider`);
    }

    if (requests.length === 0) {
      // Check if there are any pending requests at all (even with rider assigned)
      const allPending = await DeliveryRequest.countDocuments({ status: 'pending' });
      const pendingWithRider = await DeliveryRequest.countDocuments({ status: 'pending', rider: { $ne: null } });
      console.log(`   - Total pending requests: ${allPending}`);
      console.log(`   - Pending with rider assigned: ${pendingWithRider}`);
      console.log(`   - Pending without rider: ${totalPendingWithNullRider}`);
    }

    // Log sample request details if any found
    if (requests.length > 0) {
      console.log(`📋 Sample request:`, {
        requestId: requests[0]._id,
        requestNumber: requests[0].requestNumber,
        shop: requests[0].shop?.shopName || 'N/A',
        distance: requests[0].distance,
        priority: requests[0].priority,
        hasShopCoordinates: !!(requests[0].shop?.coordinates?.latitude)
      });
    } else {
      // Log why no requests found
      console.log(`⚠️ No requests found. Possible reasons:`);
      console.log(`   - No pending requests in database`);
      console.log(`   - All pending requests already have riders assigned`);
      console.log(`   - Requests may have different status`);
    }

    // Filter by service radius and calculate distance
    const availableRequests = [];
    const activeCount = await deliveryAssignmentService.getRiderActiveDeliveriesCount(rider._id);
    const maxConcurrent = await require('../models/QuestSettings').findOne({ key: 'rider_max_concurrent_deliveries' });
    const maxDeliveries = maxConcurrent ? maxConcurrent.value : 2;

    if (activeCount >= maxDeliveries) {
      return res.json({
        success: true,
        data: [],
        message: 'คุณมีงานส่งอยู่ครบจำนวนสูงสุดแล้ว',
      });
    }

    for (const request of requests) {
      console.log(`\n🔍 Processing request ${request._id}:`);
      console.log(`   - RequestNumber: ${request.requestNumber || 'N/A'}`);
      console.log(`   - Status: ${request.status}`);
      console.log(`   - Rider: ${request.rider?.toString() || 'null'}`);
      console.log(`   - Shop: ${request.shop?.shopName || 'N/A'} (${request.shop?._id || 'N/A'})`);
      console.log(`   - Has shop coordinates: ${!!(request.shop?.coordinates?.latitude)}`);
      console.log(`   - Request distance: ${request.distance}km`);
      console.log(`   - Rider coordinates: lat=${rider.coordinates?.latitude}, lng=${rider.coordinates?.longitude}`);
      console.log(`   - Rider service radius: ${rider.serviceRadius}km`);

      if (!request.shop || !request.shop.coordinates) {
        console.log(`   ⚠️ SKIPPED: Request ${request._id} has no shop or shop coordinates`);
        continue;
      }

      if (!request.shop.coordinates.latitude || !request.shop.coordinates.longitude) {
        console.log(`   ⚠️ SKIPPED: Request ${request._id} shop coordinates are invalid`);
        continue;
      }

      // Calculate distance from rider to shop
      const distanceToShop = deliveryAssignmentService.calculateDistance(
        rider.coordinates.latitude,
        rider.coordinates.longitude,
        request.shop.coordinates.latitude,
        request.shop.coordinates.longitude
      );

      const totalDistance = distanceToShop + request.distance;

      console.log(`   📍 Distance calculation:`);
      console.log(`      - Rider to shop: ${distanceToShop.toFixed(2)}km`);
      console.log(`      - Shop to customer: ${request.distance}km`);
      console.log(`      - Total distance: ${totalDistance.toFixed(2)}km`);
      console.log(`      - Service radius: ${rider.serviceRadius}km`);
      console.log(`      - Within radius: ${totalDistance <= rider.serviceRadius ? 'YES ✅' : 'NO ❌'}`);

      // Check if request is expired
      const now = new Date();
      const expiresAt = request.expiresAt;
      const isExpired = expiresAt && new Date(expiresAt) < now;

      if (isExpired) {
        console.log(`   ⚠️ SKIPPED: Request ${request._id} has expired (expiresAt: ${expiresAt.toISOString()})`);
        // Don't include expired requests in available list
        // They will be handled by checkAndCancelOldPendingRequests
        continue;
      }

      // Check if within service radius
      if (totalDistance <= rider.serviceRadius) {
        // Calculate delivery fee and total price
        const deliveryFee = await deliveryAssignmentService.calculateDeliveryFee(totalDistance);
        // Use subtotal (food cost only) instead of total (which includes delivery fee)
        const foodCost = request.order?.subtotal || 0;
        // Total price should match order.total (which is subtotal + deliveryFee - discountAmount)
        // Use order.total as the source of truth
        const totalPrice = request.order?.total || (foodCost + deliveryFee);

        // request is already a plain object from .lean(), so we can use it directly
        // Calculate time remaining for debugging
        let timeRemaining = null;
        if (expiresAt) {
          const expiry = new Date(expiresAt);
          const diffSeconds = Math.floor((expiry - now) / 1000);
          const diffMinutes = Math.floor(diffSeconds / 60);
          timeRemaining = { seconds: diffSeconds, minutes: diffMinutes };
        }

        console.log(`   ⏰ Request ${request.requestNumber} expiresAt:`, {
          expiresAt: expiresAt ? expiresAt.toISOString() : 'null',
          timeRemaining: timeRemaining ? `${timeRemaining.minutes}:${String(timeRemaining.seconds % 60).padStart(2, '0')}` : 'N/A',
          timeRemainingSeconds: timeRemaining?.seconds || 'N/A'
        });

        availableRequests.push({
          ...request,
          distanceToShop: distanceToShop.toFixed(2),
          totalDistance: totalDistance.toFixed(2),
          deliveryFee: deliveryFee,
          foodCost: foodCost,
          totalPrice: totalPrice,
          expiresAt: expiresAt, // Include expiresAt for countdown timer
        });
        console.log(`   ✅ ADDED to available requests`);
      } else {
        console.log(`   ❌ SKIPPED: Outside service radius (${totalDistance.toFixed(2)}km > ${rider.serviceRadius}km)`);
      }
    }

    console.log(`✅ Returning ${availableRequests.length} available requests for rider ${riderId}`);

    res.json({
      success: true,
      data: availableRequests,
      rider: {
        activeDeliveries: activeCount,
        maxDeliveries,
        serviceRadius: rider.serviceRadius,
      },
    });
  } catch (error) {
    console.error('Error fetching available deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลงานที่พร้อม',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/deliveries/available-riders
 * @desc    Get available riders for manual assignment
 * @access  Private (Admin)
 */
router.get('/available-riders', auth, adminAuth, async (req, res) => {
  try {
    const { shopLatitude, shopLongitude, maxDistance } = req.query;

    // Get available riders
    const Rider = require('../models/Rider');
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const availableRiders = await Rider.find({
      isAvailable: true,
      status: 'active',
      lastLocationUpdate: { $gte: fiveMinutesAgo },
      coordinates: { $exists: true, $ne: null }
    })
      .populate('user', 'name email phone')
      .lean();

    // Calculate distance and active deliveries for each rider
    const ridersWithInfo = await Promise.all(
      availableRiders.map(async (rider) => {
        const activeCount = await deliveryAssignmentService.getRiderActiveDeliveriesCount(rider._id);
        const maxConcurrent = await require('../models/QuestSettings').findOne({ key: 'rider_max_concurrent_deliveries' });
        const maxDeliveries = maxConcurrent ? maxConcurrent.value : 2;

        let distanceToShop = null;
        if (shopLatitude && shopLongitude && rider.coordinates) {
          distanceToShop = deliveryAssignmentService.calculateDistance(
            parseFloat(shopLatitude),
            parseFloat(shopLongitude),
            rider.coordinates.latitude,
            rider.coordinates.longitude
          );
        }

        return {
          _id: rider._id,
          riderCode: rider.riderCode,
          name: rider.user?.name || 'Unknown',
          phone: rider.user?.phone || '',
          email: rider.user?.email || '',
          isAvailable: rider.isAvailable,
          serviceRadius: rider.serviceRadius,
          coordinates: rider.coordinates,
          activeDeliveries: activeCount,
          maxDeliveries,
          canAcceptMore: activeCount < maxDeliveries,
          distanceToShop: distanceToShop ? distanceToShop.toFixed(2) : null,
          rating: rider.rating || 0,
        };
      })
    );

    // Filter by maxDistance if provided
    let filteredRiders = ridersWithInfo;
    if (maxDistance) {
      filteredRiders = ridersWithInfo.filter(r =>
        r.distanceToShop && parseFloat(r.distanceToShop) <= parseFloat(maxDistance)
      );
    }

    // Sort by distance (if available) or active deliveries
    filteredRiders.sort((a, b) => {
      if (a.distanceToShop && b.distanceToShop) {
        return parseFloat(a.distanceToShop) - parseFloat(b.distanceToShop);
      }
      return a.activeDeliveries - b.activeDeliveries;
    });

    res.json({
      success: true,
      data: filteredRiders,
      count: filteredRiders.length,
    });
  } catch (error) {
    console.error('Error fetching available riders:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล riders',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/deliveries/:id
 * @desc    Get delivery by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('order', 'orderNumber items subtotal total status')
      .populate('shop', 'shopName shopId phone address coordinates')
      .populate('customer', 'name email phone')
      .populate('rider', 'name email phone');

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการส่ง',
      });
    }

    // Convert delivery photo to signed URL if it's from GCP, or full URL if it's local
    let deliveryData = delivery.toObject ? delivery.toObject() : delivery;
    if (deliveryData.deliveryPhoto) {
      if (deliveryData.deliveryPhoto.includes('storage.googleapis.com')) {
        // GCP URL - convert to signed URL
        try {
          const { getSignedUrl } = require('../utils/gcpStorage');
          deliveryData.deliveryPhoto = await getSignedUrl(deliveryData.deliveryPhoto);
          console.log('✅ Generated signed URL for delivery photo');
        } catch (signedUrlError) {
          console.error('❌ Error generating signed URL for delivery photo:', signedUrlError);
          // Continue with original URL if signed URL generation fails
        }
      } else if (deliveryData.deliveryPhoto.startsWith('/uploads/')) {
        // Local path - convert to full URL
        // Use HTTPS if available, otherwise use the request protocol
        const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : req.protocol;
        const baseUrl = `${protocol}://${req.get('host')}`;
        deliveryData.deliveryPhoto = `${baseUrl}${deliveryData.deliveryPhoto}`;
        console.log('✅ Converted local path to full URL:', deliveryData.deliveryPhoto);
      }
    }

    res.json({
      success: true,
      data: deliveryData,
    });
  } catch (error) {
    console.error('Error fetching delivery:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการส่ง',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/deliveries/:id/accept
 * @desc    Accept delivery or delivery request (checks both)
 * @access  Private (rider only)
 */
router.post('/:id/accept', auth, async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.user.id || req.user._id;

    // Check if it's a DeliveryRequest first (most common case)
    const deliveryRequest = await DeliveryRequest.findById(requestId);

    if (deliveryRequest) {
      // This is a DeliveryRequest - handle it
      const Rider = require('../models/Rider');
      const rider = await Rider.findOne({ user: userId });
      if (!rider || rider.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์รับงานส่ง',
        });
      }

      console.log(`🔄 Rider accepting delivery request:`, {
        requestId: requestId,
        riderId: rider._id.toString(),
        riderCode: rider.riderCode || 'N/A',
        userId: userId.toString(),
      });

      const result = await deliveryAssignmentService.acceptDelivery(requestId, rider._id);

      console.log(`✅ Accept delivery result:`, {
        success: result.success,
        deliveryId: result.delivery?._id?.toString() || 'N/A',
        deliveryStatus: result.delivery?.status || 'N/A',
        riderId: result.delivery?.rider?.toString() || 'N/A'
      });

      return res.json({
        success: true,
        message: 'รับงานส่งสำเร็จ',
        data: result.delivery,
      });
    }

    // If not a DeliveryRequest, check if it's a Delivery
    const delivery = await Delivery.findById(requestId);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการส่ง',
      });
    }

    if (delivery.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'การส่งนี้ไม่พร้อมรับงาน',
      });
    }

    // Assign rider
    delivery.rider = userId;
    delivery.status = 'assigned';
    delivery.assignedAt = new Date();
    await delivery.save();

    // Update order status
    if (delivery.order) {
      await Order.findByIdAndUpdate(delivery.order, {
        status: 'delivering',
        rider: userId,
      });
    }

    const populatedDelivery = await Delivery.findById(delivery._id)
      .populate('order', 'orderNumber subtotal total status')
      .populate('shop', 'shopName shopId phone address coordinates')
      .populate('customer', 'name email phone')
      .populate('rider', 'name email phone');

    res.json({
      success: true,
      message: 'รับงานส่งสำเร็จ',
      data: populatedDelivery,
    });
  } catch (error) {
    console.error('Error accepting delivery:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการรับงานส่ง',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/deliveries/:id/status
 * @desc    Update delivery status
 * @access  Private (rider only)
 */
router.put('/:id/status', auth, upload.single('deliveryPhoto'), async (req, res) => {
  try {
    const deliveryId = req.params.id;
    const { status } = req.body;
    const userId = req.user.id || req.user._id;

    const validStatuses = ['heading_to_shop', 'at_shop', 'picked_up', 'on_the_way', 'delivered', 'cancelled', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'สถานะไม่ถูกต้อง',
      });
    }

    const delivery = await Delivery.findById(deliveryId);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการส่ง',
      });
    }

    // Check if user is the assigned rider
    if (delivery.rider && delivery.rider.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์อัปเดตสถานะการส่งนี้',
      });
    }

    // Handle file upload if status is 'delivered' and file is provided
    let deliveryPhotoUrl = null;
    if (status === 'delivered' && req.file) {
      try {
        // Upload to GCP Storage
        const fs = require('fs');
        const path = require('path');

        // Check if GCP is configured
        const hasGCPConfig = process.env.GCP_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_CLOUD_PROJECT_ID;

        if (hasGCPConfig) {
          try {
            const { uploadImage, getSignedUrl } = require('../utils/gcpStorage');

            // Read the uploaded file
            const filePath = req.file.path;
            const imageBuffer = fs.readFileSync(filePath);
            const mimeType = req.file.mimetype || 'image/jpeg';

            // Generate unique filename for GCP
            const deliveryId = req.params.id;
            const fileExtension = path.extname(req.file.originalname) || '.jpg';
            const fileName = `deliveries/${deliveryId}/delivery_photo_${Date.now()}${fileExtension}`;

            // Upload to GCP
            const gcpUrl = await uploadImage(imageBuffer, fileName, mimeType);
            console.log(`✅ Delivery photo uploaded to GCP: ${gcpUrl}`);

            // Store GCP URL in database (not signed URL)
            // Signed URL will be generated when fetching delivery details
            deliveryPhotoUrl = gcpUrl;
            console.log(`✅ Delivery photo GCP URL stored: ${deliveryPhotoUrl}`);

            // Delete local file after upload
            try {
              fs.unlinkSync(filePath);
              console.log(`✅ Local file deleted: ${filePath}`);
            } catch (deleteError) {
              console.warn('⚠️ Could not delete local file:', deleteError);
            }
          } catch (gcpError) {
            console.error('❌ Error uploading delivery photo to GCP:', gcpError);
            // Fallback to local path if GCP upload fails
            deliveryPhotoUrl = `/uploads/deliveries/${req.file.filename}`;
            console.warn('⚠️ Using local file path as fallback');
          }
        } else {
          // No GCP config, use local path
          console.log('⚠️ GCP not configured, using local file path');
          deliveryPhotoUrl = `/uploads/deliveries/${req.file.filename}`;
        }
      } catch (error) {
        console.error('❌ Error handling delivery photo:', error);
        // Fallback to local path if anything fails
        deliveryPhotoUrl = `/uploads/deliveries/${req.file.filename}`;
        console.warn('⚠️ Using local file path as fallback');
      }
    }

    // Update status and timestamps
    delivery.status = status;
    if (status === 'at_shop') {
      // Rider arrived at shop - set pickedUpAt timestamp
      if (!delivery.pickedUpAt) {
        delivery.pickedUpAt = new Date();
      }
    } else if (status === 'picked_up') {
      // Rider picked up food (food is ready)
      delivery.pickedUpAt = new Date();
    } else if (status === 'delivered') {
      delivery.deliveredAt = new Date();
      if (deliveryPhotoUrl) {
        delivery.deliveryPhoto = deliveryPhotoUrl;
      }
      // Update order status (shop delivery fee already deducted when rider accepted + shop confirmed)
      if (delivery.order) {
        await Order.findByIdAndUpdate(delivery.order, { status: 'completed' });
        try {
          const orderForCampaign = await Order.findById(delivery.order).populate('user', 'name').populate('shop', 'shopName').lean();
          if (orderForCampaign) {
            const { processCampaignCompletionsForOrder } = require('../services/campaignCompletionService');
            await processCampaignCompletionsForOrder(orderForCampaign);
          }
        } catch (campaignErr) {
          console.error('Campaign completion on delivery:', campaignErr);
        }
      }
    }
    await delivery.save();

    // Create notifications for status changes
    const populatedDelivery = await Delivery.findById(delivery._id)
      .populate('order', 'orderNumber subtotal total status')
      .populate('shop', 'shopName shopId phone address coordinates')
      .populate('customer', 'name email phone')
      .populate('rider', 'name email phone');

    // Send notifications based on status
    if (delivery.rider && ['picked_up', 'on_the_way', 'delivered', 'cancelled'].includes(status)) {
      try {
        const riderUserId = delivery.rider._id || delivery.rider;
        const statusMessages = {
          picked_up: 'คุณได้รับอาหารจากร้านค้าแล้ว',
          on_the_way: 'คุณกำลังจัดส่งอาหาร',
          delivered: 'จัดส่งสำเร็จแล้ว',
          cancelled: 'งานจัดส่งถูกยกเลิก',
        };

        await createDeliveryStatusNotification(
          riderUserId,
          delivery._id.toString(),
          status,
          delivery.deliveryNumber || delivery._id.toString(),
          statusMessages[status] || `สถานะ: ${status}`
        );
      } catch (notifError) {
        console.error('⚠️ Failed to create delivery status notification:', notifError);
      }
    }

    // If delivered, create earnings notification for rider
    if (status === 'delivered' && delivery.rider) {
      try {
        const riderUserId = delivery.rider._id || delivery.rider;
        const deliveryRequest = await DeliveryRequest.findOne({ delivery: delivery._id });
        const riderFee = deliveryRequest?.riderFee || 0;

        if (riderFee > 0) {
          await createRiderEarningsNotification(
            riderUserId,
            riderFee,
            'delivery_completed',
            `คุณได้รับค่าจ้าง ${riderFee} บาท จากการจัดส่ง #${delivery.deliveryNumber || delivery._id}`
          );
        }
      } catch (earningsNotifError) {
        console.error('⚠️ Failed to create rider earnings notification:', earningsNotifError);
      }
    }

    res.json({
      success: true,
      message: 'อัปเดตสถานะสำเร็จ',
      data: populatedDelivery,
    });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/deliveries/:id/rate
 * @desc    Rate delivery
 * @access  Private (customer only)
 */
router.post('/:id/rate', auth, async (req, res) => {
  try {
    const deliveryId = req.params.id;
    const { score, comment } = req.body;
    const userId = req.user.id || req.user._id;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        message: 'คะแนนต้องอยู่ระหว่าง 1-5',
      });
    }

    const delivery = await Delivery.findById(deliveryId);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการส่ง',
      });
    }

    // Check if user is the customer
    if (delivery.customer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ให้คะแนนการส่งนี้',
      });
    }

    if (delivery.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'สามารถให้คะแนนได้เฉพาะการส่งที่เสร็จสิ้นแล้ว',
      });
    }

    delivery.rating = {
      score,
      comment: comment || '',
      ratedAt: new Date(),
    };
    await delivery.save();

    res.json({
      success: true,
      message: 'ให้คะแนนสำเร็จ',
      data: delivery,
    });
  } catch (error) {
    console.error('Error rating delivery:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการให้คะแนน',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/deliveries/queue
 * @desc    Get delivery queue (pending deliveries)
 * @access  Private (Admin/Shop)
 */
router.get('/queue', auth, async (req, res) => {
  try {
    const {
      status = 'pending',
      shopId,
      sortBy = 'priority',
      page = 1,
      limit = 20,
    } = req.query;

    const query = { status };

    // Filter by shop if provided
    if (shopId) {
      query.shop = shopId;
    }

    // If user is shop owner, show only their shop's requests
    if (req.user.userType === 'partner') {
      const Shop = require('../models/Shop');
      const shops = await Shop.find({ user: req.user.id || req.user._id });
      const shopIds = shops.map(s => s._id);
      query.shop = { $in: shopIds };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let sort = {};

    switch (sortBy) {
      case 'priority':
        sort = { priority: -1, createdAt: -1 };
        break;
      case 'createdAt':
        sort = { createdAt: -1 };
        break;
      case 'distance':
        sort = { distance: 1 };
        break;
      default:
        sort = { priority: -1, createdAt: -1 };
    }

    const requests = await DeliveryRequest.find(query)
      .populate('shop', 'shopName shopId phone address coordinates')
      .populate('order', 'orderNumber subtotal total status')
      .populate('rider', 'name email phone')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    // Use fee from order (requestedDeliveryFee/riderFee = from road distance when API key set); fallback recalc from request.distance
    const requestsWithPricing = await Promise.all(requests.map(async (request) => {
      const requestObj = request.toObject();
      const deliveryFee = (request.requestedDeliveryFee != null ? request.requestedDeliveryFee : request.riderFee) ??
        (request.distance != null ? await deliveryAssignmentService.calculateDeliveryFee(request.distance) : 0);
      const foodCost = request.order?.subtotal || 0;
      const totalPrice = request.order?.total ?? (foodCost + deliveryFee);
      requestObj.deliveryFee = deliveryFee;
      requestObj.foodCost = foodCost;
      requestObj.totalPrice = totalPrice;
      return requestObj;
    }));

    const total = await DeliveryRequest.countDocuments(query);

    res.json({
      success: true,
      data: requestsWithPricing,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching delivery queue:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคิว',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/deliveries/queue/:requestId/assign-auto
 * @desc    Trigger auto assignment for delivery request
 * @access  Private (Admin/Shop)
 */
router.post('/queue/:requestId/assign-auto', auth, async (req, res) => {
  try {
    const { requestId } = req.params;

    const result = await deliveryAssignmentService.autoAssignDelivery(requestId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        ridersNotified: result.ridersNotified,
        riders: result.riders,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        reason: result.reason,
      });
    }
  } catch (error) {
    console.error('Error in auto assignment:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการมอบหมายงานอัตโนมัติ',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/deliveries/queue/:requestId/assign-manual
 * @desc    Manually assign delivery to specific rider
 * @access  Private (Admin)
 */
router.post('/queue/:requestId/assign-manual', auth, adminAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { riderId, assignmentReason } = req.body;

    if (!riderId) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ Rider ID',
      });
    }

    const result = await deliveryAssignmentService.manualAssignDelivery(
      requestId,
      riderId,
      req.user.id || req.user._id
    );

    res.json({
      success: true,
      message: 'มอบหมายงานสำเร็จ',
      data: {
        delivery: result.delivery,
        deliveryRequest: result.deliveryRequest,
        rider: result.rider,
      },
    });
  } catch (error) {
    console.error('Error in manual assignment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการมอบหมายงาน',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/deliveries/:requestId/accept
 * @desc    Rider accepts delivery request
 * @access  Private (Rider)
 */
router.post('/:requestId/accept', auth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const riderId = req.user.id || req.user._id;

    // Verify user is a rider
    const Rider = require('../models/Rider');
    const rider = await Rider.findOne({ user: riderId });
    if (!rider || rider.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์รับงานส่ง',
      });
    }

    console.log(`🔄 Rider accepting delivery request:`, {
      requestId: requestId,
      riderId: rider._id.toString(),
      riderCode: rider.riderCode || 'N/A',
      userId: riderId.toString(),
      riderUserId: rider.user?._id?.toString() || rider.user?.toString() || 'N/A'
    });

    const result = await deliveryAssignmentService.acceptDelivery(requestId, rider._id);

    console.log(`✅ Accept delivery result:`, {
      success: result.success,
      deliveryId: result.delivery?._id?.toString() || 'N/A',
      deliveryStatus: result.delivery?.status || 'N/A',
      riderId: result.delivery?.rider?.toString() || 'N/A'
    });

    res.json({
      success: true,
      message: 'รับงานส่งสำเร็จ',
      data: result.delivery,
    });
  } catch (error) {
    console.error('Error accepting delivery:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการรับงาน',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/deliveries/:requestId/reject
 * @desc    Rider rejects delivery request
 * @access  Private (Rider)
 */
router.post('/:requestId/reject', auth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const riderId = req.user.id || req.user._id;

    // Verify user is a rider
    const Rider = require('../models/Rider');
    const rider = await Rider.findOne({ user: riderId });
    if (!rider || rider.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ปฏิเสธงานส่ง',
      });
    }

    // Find the delivery request
    const deliveryRequest = await DeliveryRequest.findById(requestId);
    if (!deliveryRequest) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบงานส่งที่ต้องการปฏิเสธ',
      });
    }

    // Check if request is still pending
    if (deliveryRequest.status !== 'pending' || deliveryRequest.rider) {
      return res.status(400).json({
        success: false,
        message: 'งานส่งนี้ไม่สามารถปฏิเสธได้ (อาจถูกรับไปแล้ว)',
      });
    }

    // Mark as rejected by this rider (so it won't show again)
    // Add rider's user ID to rejectedBy array if not already there
    // Note: riderId here is User ID (from req.user.id), not Rider ID
    if (!deliveryRequest.rejectedBy) {
      deliveryRequest.rejectedBy = [];
    }
    // Check if this user ID is already in rejectedBy
    const isAlreadyRejected = deliveryRequest.rejectedBy.some(rejectedId =>
      rejectedId.toString() === riderId.toString()
    );
    if (!isAlreadyRejected) {
      deliveryRequest.rejectedBy.push(riderId);
      await deliveryRequest.save();
    }

    console.log(`🚫 Rider rejected delivery request:`, {
      requestId: requestId,
      riderId: rider._id.toString(),
      riderCode: rider.riderCode || 'N/A',
      reason: reason || 'No reason provided',
      requestStatus: deliveryRequest.status,
      requestRider: deliveryRequest.rider || 'null',
      rejectedBy: deliveryRequest.rejectedBy.length
    });

    // Check if there are any other available riders (excluding rejected ones)
    const deliveryAssignmentService = require('../services/deliveryAssignmentService');
    const availableRiders = await deliveryAssignmentService.findAvailableRiders(deliveryRequest);

    // Filter out riders who have already rejected this request
    // rejectedBy contains User IDs, and availableRiders contains objects with { rider, score, ... }
    // where rider.user is populated with User document
    const remainingRiders = availableRiders.filter(r => {
      const rejectedBy = deliveryRequest.rejectedBy || [];
      // r.rider is the Rider document, r.rider.user is the User document (populated)
      const riderUserId = r.rider?.user?._id || r.rider?.user || null;
      if (!riderUserId) return false;
      // Check if this rider's user ID is in rejectedBy array
      return !rejectedBy.some(rejectedId =>
        rejectedId.toString() === riderUserId.toString()
      );
    });

    // If no riders available, cancel order and delivery request
    if (remainingRiders.length === 0) {
      console.log(`⚠️ No available riders left for delivery request ${requestId} - cancelling order and request`);

      const Order = require('../models/Order');
      const Delivery = require('../models/Delivery');

      // Cancel delivery request
      deliveryRequest.status = 'cancelled';
      await deliveryRequest.save();

      // Cancel related order if exists
      if (deliveryRequest.order) {
        const order = await Order.findById(deliveryRequest.order);
        if (order && !['completed', 'cancelled'].includes(order.status)) {
          order.status = 'cancelled';
          await order.save();
          console.log(`✅ Cancelled order ${order._id} due to no available riders`);
        }

        // Cancel delivery if exists
        if (order.delivery) {
          const delivery = await Delivery.findById(order.delivery);
          if (delivery && !['delivered', 'cancelled'].includes(delivery.status)) {
            delivery.status = 'cancelled';
            await delivery.save();
            console.log(`✅ Cancelled delivery ${delivery._id} due to no available riders`);
          }
        }
      }

      return res.json({
        success: true,
        message: 'ปฏิเสธงานส่งสำเร็จ (ไม่มี rider คนอื่น - ยกเลิกคำสั่งซื้ออัตโนมัติ)',
        data: {
          requestId: deliveryRequest._id,
          status: 'cancelled',
          orderCancelled: true,
        },
      });
    }

    res.json({
      success: true,
      message: 'ปฏิเสธงานส่งสำเร็จ',
      data: {
        requestId: deliveryRequest._id,
        status: deliveryRequest.status, // Still pending for other riders
      },
    });
  } catch (error) {
    console.error('Error rejecting delivery:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการปฏิเสธงาน',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/deliveries/:deliveryId/pickup
 * @desc    Rider picks up order (no payment - removed as per user request)
 * @access  Private (Rider)
 */
router.post('/:deliveryId/pickup', auth, async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const riderId = req.user.id || req.user._id;

    // Verify delivery belongs to rider
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการส่ง',
      });
    }

    const Rider = require('../models/Rider');
    const rider = await Rider.findOne({ user: riderId });
    if (delivery.rider.toString() !== rider._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์เข้าถึงงานส่งนี้',
      });
    }

    const result = await deliveryAssignmentService.handleRiderPickup(deliveryId);

    res.json({
      success: true,
      message: 'รับ Order สำเร็จ',
      data: result.delivery,
      paymentPoints: result.paymentPoints,
    });
  } catch (error) {
    console.error('Error in pickup:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการรับ Order',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/deliveries/:deliveryId/cancel
 * @desc    Rider cancels delivery (after accepting)
 * @access  Private (Rider)
 */
router.post('/:deliveryId/cancel', auth, async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { reason } = req.body;
    const riderId = req.user.id || req.user._id;

    // Verify delivery belongs to rider
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการส่ง',
      });
    }

    const Rider = require('../models/Rider');
    const rider = await Rider.findOne({ user: riderId });
    if (delivery.rider.toString() !== rider._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ยกเลิกงานส่งนี้',
      });
    }

    const result = await deliveryAssignmentService.handleRiderCancel(deliveryId, rider._id, reason);

    res.json({
      success: true,
      message: result.penaltyApplied
        ? `ยกเลิกงานส่งสำเร็จ (หัก ${result.penaltyPoints} points)`
        : 'ยกเลิกงานส่งสำเร็จ',
      penaltyApplied: result.penaltyApplied,
      penaltyPoints: result.penaltyPoints,
      reassignmentFee: result.reassignmentFee,
    });
  } catch (error) {
    console.error('Error canceling delivery:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการยกเลิกงาน',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/deliveries/queue/stats
 * @desc    Get delivery queue statistics
 * @access  Private (Admin)
 */
router.get('/queue/stats', auth, adminAuth, async (req, res) => {
  try {
    const pending = await DeliveryRequest.countDocuments({ status: 'pending' });
    const assigned = await DeliveryRequest.countDocuments({ status: 'accepted' });
    const inProgress = await Delivery.countDocuments({ status: { $in: ['picked_up', 'on_the_way'] } });

    // Count available riders
    const Rider = require('../models/Rider');
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const availableRiders = await Rider.countDocuments({
      isAvailable: true,
      status: 'active',
      lastLocationUpdate: { $gte: fiveMinutesAgo },
    });

    res.json({
      success: true,
      stats: {
        pending,
        assigned,
        inProgress,
        availableRiders,
      },
    });
  } catch (error) {
    console.error('Error fetching queue stats:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ',
      error: error.message,
    });
  }
});

module.exports = router;
