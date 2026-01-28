const express = require('express');
const router = express.Router();
const DeliveryRequest = require('../models/DeliveryRequest');
const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const Shop = require('../models/Shop');
const PointTransaction = require('../models/PointTransaction');
const QuestSettings = require('../models/QuestSettings');
const Partner = require('../models/Partner');
const ShopFeeSplitRecord = require('../models/ShopFeeSplitRecord');
const { auth } = require('../middleware/auth');
const mongoose = require('mongoose');

/**
 * @route   GET /api/delivery-requests
 * @desc    Get all delivery requests (with filters)
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const {
      status = 'pending',
      shop,
      rider,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (shop) query.shop = shop;
    if (rider) query.rider = rider;

    // If user is shop owner, show only their requests
    if (req.query.myShopRequests === 'true') {
      // Find user's shops
      const userShops = await Shop.find({
        $or: [
          { partnerId: req.user.id || req.user._id },
          { user: req.user.id || req.user._id },
        ],
      }).select('_id');
      const shopIds = userShops.map(s => s._id);
      query.shop = { $in: shopIds };
    }

    // If user is rider, show only available requests
    if (req.query.available === 'true') {
      query.status = 'pending';
      query.$or = [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: null },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const requests = await DeliveryRequest.find(query)
      .populate('shop', 'shopName shopId phone address coordinates')
      .populate('order', 'orderNumber total status items')
      .populate('rider', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await DeliveryRequest.countDocuments(query);

    res.json({
      success: true,
      data: requests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching delivery requests:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำขอส่ง',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/delivery-requests/:id
 * @desc    Get delivery request by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await DeliveryRequest.findById(req.params.id)
      .populate('shop', 'shopName shopId phone address coordinates')
      .populate('order', 'orderNumber items total status')
      .populate('rider', 'name email phone');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำขอส่ง',
      });
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error('Error fetching delivery request:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำขอส่ง',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/delivery-requests
 * @desc    Create delivery request (shop requests delivery service)
 * @access  Private (shop owner only)
 */
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { orderId, deliveryAddress, deliveryCoordinates, distance, requestedDeliveryFee, riderFee, notes, contactPhone, preferredDeliveryTime } = req.body;

    // Validate order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำสั่งซื้อ',
      });
    }

    // Check if user is shop owner
    const shop = await Shop.findById(order.shop);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบร้านค้า',
      });
    }

    const isShopOwner =
      shop.partnerId?.toString() === userId.toString() ||
      shop.user?.toString() === userId.toString() ||
      (req.user.email && shop.ownerEmail && req.user.email.toLowerCase() === shop.ownerEmail.toLowerCase());

    if (!isShopOwner) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์สร้างคำขอส่งสำหรับร้านนี้',
      });
    }

    // Check if order already has delivery request
    const existingRequest = await DeliveryRequest.findOne({
      order: orderId,
      status: { $in: ['pending', 'accepted', 'in_progress'] },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'คำสั่งซื้อนี้มีคำขอส่งอยู่แล้ว',
      });
    }

    // Get shop coordinates
    const shopCoords = shop.coordinates || {};

    // Create delivery request
    const deliveryRequest = new DeliveryRequest({
      shop: order.shop,
      order: orderId,
      deliveryAddress,
      deliveryCoordinates: deliveryCoordinates || {},
      distance: distance || 0,
      requestedDeliveryFee: requestedDeliveryFee || 0,
      riderFee: riderFee || 0,
      notes: notes || '',
      contactPhone: contactPhone || shop.phone,
      preferredDeliveryTime: preferredDeliveryTime ? new Date(preferredDeliveryTime) : null,
      // expiresAt will be set by deliveryAssignmentService based on admin setting (delivery_assignment_timeout)
      // Don't set default here to avoid overriding the timeout value from admin settings
    });

    await deliveryRequest.save();

    // Update order
    order.deliveryRequest = deliveryRequest._id;
    await order.save();

    const populatedRequest = await DeliveryRequest.findById(deliveryRequest._id)
      .populate('shop', 'shopName shopId phone address coordinates')
      .populate('order', 'orderNumber total status');

    res.status(201).json({
      success: true,
      message: 'สร้างคำขอส่งสำเร็จ',
      data: populatedRequest,
    });
  } catch (error) {
    console.error('Error creating delivery request:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างคำขอส่ง',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/delivery-requests/:id/accept
 * @desc    Accept delivery request (rider accepts)
 * @access  Private (rider only)
 */
router.post('/:id/accept', auth, async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.user.id || req.user._id;

    const request = await DeliveryRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำขอส่ง',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'คำขอส่งนี้ไม่พร้อมรับงาน',
      });
    }

    // Check if expired
    if (request.expiresAt && request.expiresAt < new Date()) {
      request.status = 'expired';
      await request.save();
      
      // Cancel the associated order if not already cancelled
      if (request.order) {
        const order = await Order.findById(request.order);
        if (order && !['completed', 'cancelled'].includes(order.status)) {
          order.status = 'cancelled';
          order.cancelledBy = 'system';
          order.notes = order.notes 
            ? `${order.notes}\n[Auto-cancelled: Delivery request expired]` 
            : '[Auto-cancelled: Delivery request expired]';
          await order.save();
          console.log(`✅ Cancelled order ${order.orderNumber || order._id} - delivery request expired`);
        }
      }
      
      return res.status(400).json({
        success: false,
        message: 'คำขอส่งนี้หมดอายุแล้ว',
      });
    }

    let order = await Order.findById(request.order);
    if (!order) {
      return res.status(404).json({ success: false, message: 'ไม่พบคำสั่งซื้อ' });
    }
    if (order.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'รอร้านยืนยันคำสั่งซื้อก่อน Rider จึงจะรับงานได้',
      });
    }
    if (order.shopDeliveryFeeDeducted) {
      return res.status(400).json({
        success: false,
        message: 'ค่าธรรมเนียมหักแล้ว ไม่สามารถรับงานซ้ำได้',
      });
    }

    const shop = await Shop.findById(request.shop).populate('user');
    if (!shop || !shop.user) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบข้อมูลร้านหรือเจ้าของร้าน',
      });
    }
    const shopOwner = shop.user;
    const fee = (await QuestSettings.getSetting('shop_delivery_order_fee')) || 5;
    if (shopOwner.points < fee) {
      return res.status(400).json({
        success: false,
        message: 'ร้านคะแนนไม่พอ ไม่สามารถให้ Rider รับงานได้',
      });
    }

    shopOwner.points -= fee;
    await shopOwner.save();
    await PointTransaction.create({
      userId: shopOwner._id,
      type: 'deduction',
      amount: -fee,
      description: `ค่าธรรมเนียม Order ส่งที่บ้าน (Order: ${order.orderNumber || order._id})`,
      relatedId: order._id,
      relatedModel: 'Order',
      remainingPoints: shopOwner.points,
    });
    order.shopDeliveryFeeDeducted = true;
    await order.save();

    // Fee split: partner_shop_commission_rate % ของ Fee ให้ Partner, ที่เหลือ Platform. Keep record for stats.
    const rate = shop.partnerId ? ((await QuestSettings.getSetting('partner_shop_commission_rate')) || 20) : 0;
    const partnerShare = Math.round((fee * rate) / 100);
    const platformShare = fee - partnerShare;
    let partnerRef = null;
    if (shop.partnerId && partnerShare > 0) {
      const partner = await Partner.findOne({ userId: shop.partnerId });
      if (partner) {
        partner.pendingCommission = (partner.pendingCommission || 0) + partnerShare;
        await partner.save();
        partnerRef = partner._id;
        console.log(`💰 Fee split: ${fee} pts → Partner ${partnerShare} pts (${rate}%), Platform ${platformShare} pts`);
      }
    }
    await ShopFeeSplitRecord.create({
      shop: shop._id,
      order: order._id,
      feeType: 'delivery',
      feeAmount: fee,
      partnerShare,
      platformShare,
      commissionRatePercent: shop.partnerId ? rate : null,
      partnerId: shop.partnerId || null,
      partnerRef,
      orderNumber: order.orderNumber || '',
      shopName: shop.shopName || '',
    });

    // Assign rider
    request.rider = userId;
    request.status = 'accepted';
    request.acceptedAt = new Date();
    await request.save();

    // Create delivery record (order, shop already fetched)

    const delivery = new Delivery({
      order: request.order,
      shop: request.shop,
      customer: order.user,
      rider: userId,
      deliveryAddress: request.deliveryAddress,
      deliveryCoordinates: request.deliveryCoordinates,
      shopCoordinates: shop.coordinates || {},
      distance: request.distance,
      deliveryFee: request.requestedDeliveryFee,
      riderFee: request.riderFee,
      contactPhone: request.contactPhone,
      notes: request.notes,
      status: 'assigned',
      assignedAt: new Date(),
    });

    await delivery.save();

    // Update order
    order.delivery = delivery._id;
    order.deliveryRequest = request._id;
    order.rider = userId;
    order.status = 'delivering';
    await order.save();

    // Update request
    request.status = 'in_progress';
    request.startedAt = new Date();
    await request.save();

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
    console.error('Error accepting delivery request:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการรับงานส่ง',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/delivery-requests/:id/cancel
 * @desc    Cancel delivery request
 * @access  Private (shop owner or rider)
 */
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.user.id || req.user._id;

    const request = await DeliveryRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำขอส่ง',
      });
    }

    // Check permissions
    const shop = await Shop.findById(request.shop);
    const isShopOwner =
      shop.partnerId?.toString() === userId.toString() ||
      shop.user?.toString() === userId.toString() ||
      (req.user.email && shop.ownerEmail && req.user.email.toLowerCase() === shop.ownerEmail.toLowerCase());

    const isRider = request.rider && request.rider.toString() === userId.toString();

    if (!isShopOwner && !isRider) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ยกเลิกคำขอส่งนี้',
      });
    }

    if (request.status === 'completed' || request.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถยกเลิกคำขอส่งนี้ได้',
      });
    }

    request.status = 'cancelled';
    await request.save();

    // Cancel related order and delivery
    if (request.order) {
      const order = await Order.findById(request.order);
      if (order && !['completed', 'cancelled'].includes(order.status)) {
        order.status = 'cancelled';
        await order.save();
        console.log(`✅ Cancelled order ${order._id} due to delivery request cancellation`);
      }

      // Cancel delivery if exists
      if (order.delivery) {
        const delivery = await Delivery.findById(order.delivery);
        if (delivery && !['delivered', 'cancelled'].includes(delivery.status)) {
          delivery.status = 'cancelled';
          await delivery.save();
          console.log(`✅ Cancelled delivery ${delivery._id} due to delivery request cancellation`);
        }
      }
    }

    res.json({
      success: true,
      message: 'ยกเลิกคำขอส่งสำเร็จ',
    });
  } catch (error) {
    console.error('Error cancelling delivery request:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการยกเลิกคำขอส่ง',
      error: error.message,
    });
  }
});

module.exports = router;
