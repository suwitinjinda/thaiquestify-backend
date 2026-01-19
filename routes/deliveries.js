const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');

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
      query.rider = userId;
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

    const deliveries = await Delivery.find(query)
      .populate('order', 'orderNumber total status')
      .populate('shop', 'shopName shopId phone address coordinates')
      .populate('customer', 'name email phone')
      .populate('rider', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Delivery.countDocuments(query);

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
router.get('/available', auth, async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10 } = req.query;

    // Find pending deliveries
    const deliveries = await Delivery.find({
      status: 'pending',
    })
      .populate('order', 'orderNumber total status')
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
 * @route   GET /api/deliveries/:id
 * @desc    Get delivery by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('order', 'orderNumber items total status')
      .populate('shop', 'shopName shopId phone address coordinates')
      .populate('customer', 'name email phone')
      .populate('rider', 'name email phone');

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการส่ง',
      });
    }

    res.json({
      success: true,
      data: delivery,
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
 * @desc    Accept delivery (rider accepts delivery)
 * @access  Private (rider only)
 */
router.post('/:id/accept', auth, async (req, res) => {
  try {
    const deliveryId = req.params.id;
    const userId = req.user.id || req.user._id;

    const delivery = await Delivery.findById(deliveryId);

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
      .populate('order', 'orderNumber total status')
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
router.put('/:id/status', auth, async (req, res) => {
  try {
    const deliveryId = req.params.id;
    const { status } = req.body;
    const userId = req.user.id || req.user._id;

    const validStatuses = ['picked_up', 'on_the_way', 'delivered', 'cancelled', 'failed'];
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

    // Update status and timestamps
    delivery.status = status;
    if (status === 'picked_up') {
      delivery.pickedUpAt = new Date();
    } else if (status === 'delivered') {
      delivery.deliveredAt = new Date();
      // Update order status
      if (delivery.order) {
        await Order.findByIdAndUpdate(delivery.order, {
          status: 'completed',
        });
      }
    }
    await delivery.save();

    const populatedDelivery = await Delivery.findById(delivery._id)
      .populate('order', 'orderNumber total status')
      .populate('shop', 'shopName shopId phone address coordinates')
      .populate('customer', 'name email phone')
      .populate('rider', 'name email phone');

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

module.exports = router;
