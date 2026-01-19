// backend/routes/orders.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Shop = require('../models/Shop');
const FoodMenuItem = require('../models/FoodMenuItem');
const { auth } = require('../middleware/auth');

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const { shopId, items, deliveryAddress, phone, notes, paymentMethod } = req.body;
    const userId = req.user.id || req.user._id;

    // Validate required fields
    if (!shopId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุร้านค้าและรายการสินค้า',
      });
    }

    // Find shop
    let shop;
    if (mongoose.Types.ObjectId.isValid(shopId) && shopId.length === 24) {
      shop = await Shop.findById(shopId);
    } else {
      shop = await Shop.findOne({ shopId: shopId });
    }

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบร้านค้า',
      });
    }

    // Validate and calculate order items
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const menuItem = await FoodMenuItem.findById(item.menuItemId || item._id);
      
      if (!menuItem) {
        return res.status(400).json({
          success: false,
          message: `ไม่พบเมนู: ${item.name || item.menuItemId}`,
        });
      }

      if (menuItem.shop.toString() !== shop._id.toString()) {
        return res.status(400).json({
          success: false,
          message: `เมนู ${menuItem.name} ไม่ได้อยู่ในร้านนี้`,
        });
      }

      if (!menuItem.isAvailable || menuItem.isDeleted) {
        return res.status(400).json({
          success: false,
          message: `เมนู ${menuItem.name} ไม่พร้อมจำหน่าย`,
        });
      }

      const quantity = item.quantity || 1;
      const price = menuItem.price;
      const itemSubtotal = price * quantity;

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: price,
        quantity: quantity,
        subtotal: itemSubtotal,
      });

      subtotal += itemSubtotal;
    }

    // Calculate delivery fee
    const deliveryFee = shop.deliveryPrice || 0;
    const total = subtotal + deliveryFee;

    // Create order
    const order = new Order({
      user: userId,
      shop: shop._id,
      items: orderItems,
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      total: total,
      deliveryAddress: deliveryAddress || '',
      phone: phone || '',
      notes: notes || '',
      paymentMethod: paymentMethod || 'cash',
      status: 'pending',
      paymentStatus: 'pending',
    });

    await order.save();
    await order.populate('shop', 'shopName shopId');
    await order.populate('user', 'name email');

    res.status(201).json({
      success: true,
      message: 'สั่งอาหารสำเร็จ',
      data: order,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสั่งอาหาร',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/orders
 * @desc    Get user's orders
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { status, limit = 20, page = 1 } = req.query;

    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('shop', 'shopName shopId')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/orders/shop/:shopId
 * @desc    Get orders for a specific shop (shop owner only)
 * @access  Private
 */
router.get('/shop/:shopId', auth, async (req, res) => {
  try {
    const shopId = req.params.shopId;
    const userId = req.user.id || req.user._id;
    const { status, limit = 20, page = 1 } = req.query;

    // Find shop
    let shop;
    if (mongoose.Types.ObjectId.isValid(shopId) && shopId.length === 24) {
      shop = await Shop.findById(shopId);
    } else {
      shop = await Shop.findOne({ shopId: shopId });
    }

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบร้านค้า',
      });
    }

    // Check if user is shop owner
    // Try multiple ways to match: partnerId, user field, and ownerEmail
    const userIdStr = userId ? userId.toString() : null;
    const userIdObj = userId ? (mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null) : null;
    
    const partnerIdStr = shop.partnerId ? shop.partnerId.toString() : null;
    const partnerIdObj = shop.partnerId ? (mongoose.Types.ObjectId.isValid(shop.partnerId) ? new mongoose.Types.ObjectId(shop.partnerId) : null) : null;
    
    const shopUserIdStr = shop.user ? shop.user.toString() : null;
    const shopUserIdObj = shop.user ? (mongoose.Types.ObjectId.isValid(shop.user) ? new mongoose.Types.ObjectId(shop.user) : null) : null;
    
    const userEmail = req.user.email || req.user.userEmail;
    const ownerEmail = shop.ownerEmail;

    // Check ownership by ID (both string and ObjectId comparison)
    const isOwnerById = 
      (userIdStr && partnerIdStr && userIdStr === partnerIdStr) ||
      (userIdObj && partnerIdObj && userIdObj.equals(partnerIdObj)) ||
      (userIdStr && shopUserIdStr && userIdStr === shopUserIdStr) ||
      (userIdObj && shopUserIdObj && userIdObj.equals(shopUserIdObj));

    // Check ownership by email
    const isOwnerByEmail = userEmail && ownerEmail && 
      userEmail.toLowerCase().trim() === ownerEmail.toLowerCase().trim();

    const isShopOwner = isOwnerById || isOwnerByEmail;

    console.log('🔍 Shop owner check:', {
      shopId: shop.shopId,
      shopName: shop.shopName,
      userId: userIdStr,
      partnerId: partnerIdStr,
      shopUserId: shopUserIdStr,
      userEmail: userEmail,
      ownerEmail: ownerEmail,
      isOwnerById: isOwnerById,
      isOwnerByEmail: isOwnerByEmail,
      isShopOwner: isShopOwner
    });

    if (!isShopOwner) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์เข้าถึงคำสั่งซื้อของร้านนี้',
      });
    }

    const query = { shop: shop._id };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('shop', 'shopName shopId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching shop orders:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id || req.user._id;

    const order = await Order.findById(orderId)
      .populate('shop', 'shopName shopId phone')
      .populate('user', 'name email phone')
      .populate('items.menuItem', 'name price image');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำสั่งซื้อ',
      });
    }

    // Check if user owns the order or is shop owner
    const isOwner = order.user._id.toString() === userId.toString();
    
    // Fetch shop with all fields
    let shop = order.shop;
    if (!shop || typeof shop === 'string' || !shop.shopName) {
      shop = await Shop.findById(order.shop);
    }
    
    // Try multiple ways to match: partnerId, user field, and ownerEmail
    const userIdStr = userId ? userId.toString() : null;
    const userIdObj = userId ? (mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null) : null;
    
    const partnerIdStr = shop?.partnerId ? shop.partnerId.toString() : null;
    const partnerIdObj = shop?.partnerId ? (mongoose.Types.ObjectId.isValid(shop.partnerId) ? new mongoose.Types.ObjectId(shop.partnerId) : null) : null;
    
    const shopUserIdStr = shop?.user ? shop.user.toString() : null;
    const shopUserIdObj = shop?.user ? (mongoose.Types.ObjectId.isValid(shop.user) ? new mongoose.Types.ObjectId(shop.user) : null) : null;
    
    const userEmail = req.user.email || req.user.userEmail;
    const ownerEmail = shop?.ownerEmail;

    // Check ownership by ID (both string and ObjectId comparison)
    const isOwnerById = 
      (userIdStr && partnerIdStr && userIdStr === partnerIdStr) ||
      (userIdObj && partnerIdObj && userIdObj.equals(partnerIdObj)) ||
      (userIdStr && shopUserIdStr && userIdStr === shopUserIdStr) ||
      (userIdObj && shopUserIdObj && userIdObj.equals(shopUserIdObj));

    // Check ownership by email
    const isOwnerByEmail = userEmail && ownerEmail && 
      userEmail.toLowerCase().trim() === ownerEmail.toLowerCase().trim();

    const isShopOwner = shop && (isOwnerById || isOwnerByEmail);

    if (!isOwner && !isShopOwner) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status (shop owner only)
 * @access  Private
 */
router.put('/:id/status', auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    const userId = req.user.id || req.user._id;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'สถานะไม่ถูกต้อง',
      });
    }

    const order = await Order.findById(orderId).populate('shop', 'shopName shopId partnerId user ownerEmail');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำสั่งซื้อ',
      });
    }

    // If shop is not populated, fetch it separately
    let shop = order.shop;
    if (!shop || !shop.shopName) {
      shop = await Shop.findById(order.shop);
    }

    // Check if user is shop owner
    
    // Try multiple ways to match: partnerId, user field, and ownerEmail
    const userIdStr = userId ? userId.toString() : null;
    const userIdObj = userId ? (mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null) : null;
    
    const partnerIdStr = shop?.partnerId ? shop.partnerId.toString() : null;
    const partnerIdObj = shop?.partnerId ? (mongoose.Types.ObjectId.isValid(shop.partnerId) ? new mongoose.Types.ObjectId(shop.partnerId) : null) : null;
    
    const shopUserIdStr = shop?.user ? shop.user.toString() : null;
    const shopUserIdObj = shop?.user ? (mongoose.Types.ObjectId.isValid(shop.user) ? new mongoose.Types.ObjectId(shop.user) : null) : null;
    
    const userEmail = req.user.email || req.user.userEmail;
    const ownerEmail = shop?.ownerEmail;

    // Check ownership by ID (both string and ObjectId comparison)
    const isOwnerById = 
      (userIdStr && partnerIdStr && userIdStr === partnerIdStr) ||
      (userIdObj && partnerIdObj && userIdObj.equals(partnerIdObj)) ||
      (userIdStr && shopUserIdStr && userIdStr === shopUserIdStr) ||
      (userIdObj && shopUserIdObj && userIdObj.equals(shopUserIdObj));

    // Check ownership by email
    const isOwnerByEmail = userEmail && ownerEmail && 
      userEmail.toLowerCase().trim() === ownerEmail.toLowerCase().trim();

    const isShopOwner = shop && (isOwnerById || isOwnerByEmail);

    console.log('🔍 Update order status - Shop owner check:', {
      orderId: orderId,
      shopId: shop?.shopId,
      shopName: shop?.shopName,
      userId: userIdStr,
      partnerId: partnerIdStr,
      shopUserId: shopUserIdStr,
      userEmail: userEmail,
      ownerEmail: ownerEmail,
      isOwnerById: isOwnerById,
      isOwnerByEmail: isOwnerByEmail,
      isShopOwner: isShopOwner
    });

    if (!isShopOwner) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์แก้ไขคำสั่งซื้อนี้',
      });
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      message: 'อัปเดตสถานะคำสั่งซื้อสำเร็จ',
      data: order,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/orders/:id/cancel
 * @desc    Cancel order (user only)
 * @access  Private
 */
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id || req.user._id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำสั่งซื้อ',
      });
    }

    // Check if user owns the order
    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ยกเลิกคำสั่งซื้อนี้',
      });
    }

    // Only allow cancellation if order is pending or confirmed
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถยกเลิกคำสั่งซื้อที่อยู่ในสถานะนี้ได้',
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'ยกเลิกคำสั่งซื้อสำเร็จ',
      data: order,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการยกเลิกคำสั่งซื้อ',
      error: error.message,
    });
  }
});

module.exports = router;
