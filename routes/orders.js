// backend/routes/orders.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Shop = require('../models/Shop');
const FoodMenuItem = require('../models/FoodMenuItem');
const { auth } = require('../middleware/auth');
const deliveryAssignmentService = require('../services/deliveryAssignmentService');
const User = require('../models/User');
const PointTransaction = require('../models/PointTransaction');
const QuestSettings = require('../models/QuestSettings');
const DeliveryRequest = require('../models/DeliveryRequest');

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const { shopId, items, deliveryAddress, phone, notes, paymentMethod, orderType, couponCode } = req.body;
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

    // Determine order type (default to 'dine_in' if not provided)
    const finalOrderType = orderType || 'dine_in';
    
    // Calculate delivery fee based on order type
    let deliveryFee = 0;
    let distance = 0;
    
    if (finalOrderType === 'delivery') {
      // For delivery, calculate fee based on distance from shop to customer
      // Get user's coordinates (if available) - can use coordinates even if address is empty
      const user = await User.findById(userId);
      
      // Validate delivery address - but allow using coordinates if address is empty
      if (!deliveryAddress || deliveryAddress.trim() === '') {
        // If no address but has coordinates, use coordinates
        if (!user || !user.coordinates || !user.coordinates.latitude) {
          return res.status(400).json({
            success: false,
            message: 'กรุณาระบุที่อยู่จัดส่ง หรืออัพเดทตำแหน่งของคุณ',
          });
        }
        // Use user's address if available, otherwise use coordinates
        deliveryAddress = user.address || `ตำแหน่ง: ${user.coordinates.latitude}, ${user.coordinates.longitude}`;
      }
      if (user && user.coordinates && shop.coordinates) {
        // Calculate distance from shop to customer
        distance = deliveryAssignmentService.calculateDistance(
          shop.coordinates.latitude,
          shop.coordinates.longitude,
          user.coordinates.latitude,
          user.coordinates.longitude
        );
        deliveryFee = await deliveryAssignmentService.calculateDeliveryFee(distance);
      } else {
        // Fallback: use shop's default delivery price or calculate from admin settings
        deliveryFee = shop.deliveryPrice || await deliveryAssignmentService.calculateDeliveryFee(2); // Default 2km
      }
    }

    // Service fee has been removed

    // Validate and apply coupon if provided
    let coupon = null;
    let discountAmount = 0;
    let couponUsageFee = 0;
    const Coupon = require('../models/Coupon');
    
    if (couponCode) {
      try {
        coupon = await Coupon.findOne({
          code: couponCode.toUpperCase(),
          userId: userId,
          shopId: shop._id,
          used: false
        });

        if (!coupon) {
          return res.status(400).json({
            success: false,
            message: 'ไม่พบคูปองหรือคูปองถูกใช้แล้ว'
          });
        }

        const now = new Date();
        if (coupon.expiresAt <= now) {
          return res.status(400).json({
            success: false,
            message: 'คูปองหมดอายุแล้ว'
          });
        }

        // Calculate discount
        if (coupon.discountType === 'percentage') {
          discountAmount = (subtotal * coupon.discountValue) / 100;
        } else {
          discountAmount = coupon.discountValue;
        }

        // Check minimum amount requirement for coupon
        const discountPercent = coupon.discountValue;
        let minAmountKey = null;
        if (discountPercent === 5) {
          minAmountKey = 'coupon_min_amount_5';
        } else if (discountPercent === 10) {
          minAmountKey = 'coupon_min_amount_10';
        } else if (discountPercent === 15) {
          minAmountKey = 'coupon_min_amount_15';
        } else if (discountPercent === 20) {
          minAmountKey = 'coupon_min_amount_20';
        }

        if (minAmountKey) {
          const minAmount = await QuestSettings.getSetting(minAmountKey) || 0;
          if (subtotal < minAmount) {
            return res.status(400).json({
              success: false,
              message: `คูปองส่วนลด ${discountPercent}% ต้องมียอดสั่งซื้อขั้นต่ำ ${minAmount.toFixed(0)} บาท (ยอดปัจจุบัน: ${subtotal.toFixed(0)} บาท)`
            });
          }
        }

        // Check if this is first coupon use today (for fee deduction)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayCouponUsage = await Coupon.findOne({
          userId: userId,
          used: true,
          usedAt: {
            $gte: today,
            $lt: tomorrow
          }
        });

        // If first coupon use today, mark for fee deduction after order is created
        if (!todayCouponUsage) {
          const couponFeeSetting = await QuestSettings.getSetting('coupon_usage_fee') || 20;
          couponUsageFee = couponFeeSetting;
        }
      } catch (couponError) {
        console.error('Error processing coupon:', couponError);
        return res.status(400).json({
          success: false,
          message: 'เกิดข้อผิดพลาดในการใช้คูปอง'
        });
      }
    }

    const total = subtotal + deliveryFee - discountAmount;

    console.log(`📦 Creating order:`, {
      userId: userId.toString(),
      shopId: shop._id.toString(),
      shopName: shop.shopName || 'N/A',
      orderType: finalOrderType,
      itemsCount: orderItems.length,
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      total: total,
      deliveryAddress: deliveryAddress || 'N/A',
      phone: phone || 'N/A'
    });

    // Create order
    const order = new Order({
      user: userId,
      shop: shop._id,
      items: orderItems,
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      discountAmount: discountAmount,
      total: total,
      deliveryAddress: deliveryAddress || '',
      phone: phone || '',
      notes: notes || '',
      paymentMethod: paymentMethod || 'cash',
      orderType: finalOrderType,
      // cancelledBy is not set for new orders (will be undefined, which is valid)
      status: 'pending',
      paymentStatus: 'pending',
      coupon: coupon ? coupon._id : null,
    });

    try {
      await order.save();
      console.log(`✅ Order created successfully:`, {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber || 'N/A',
        orderType: order.orderType,
        status: order.status,
        total: order.total,
        discountAmount: discountAmount
      });
    } catch (saveError) {
      console.error(`❌ Error saving order:`, {
        message: saveError.message,
        errors: saveError.errors,
        stack: saveError.stack
      });
      throw saveError;
    }

    // Mark coupon as used if applied
    if (coupon) {
      coupon.used = true;
      coupon.usedAt = new Date();
      coupon.orderId = order._id;
      await coupon.save();
      console.log(`✅ Coupon ${coupon.code} marked as used`);
      
      // If first coupon use today, deduct fee from shop owner
      if (couponUsageFee > 0) {
        try {
          // Get shop with owner populated
          const shopWithOwner = await Shop.findById(shop._id).populate('user');
          const shopOwner = shopWithOwner?.user;
          
          if (!shopOwner) {
            console.warn(`⚠️ Shop ${shop._id} has no owner - skipping coupon usage fee deduction`);
          } else if (shopOwner.points >= couponUsageFee) {
            // Shop owner has enough points - deduct points
            shopOwner.points -= couponUsageFee;
            await shopOwner.save();
            
            // Create point transaction record for shop owner
            const PointTransaction = require('../models/PointTransaction');
            await PointTransaction.create({
              userId: shopOwner._id,
              type: 'deduction',
              amount: -couponUsageFee,
              description: `หักแต้มค่าธรรมเนียมการใช้คูปอง (Order: ${order.orderNumber || order._id.toString().slice(-6)})`,
              relatedId: order._id,
              relatedModel: 'Order',
              remainingPoints: shopOwner.points
            });
            
            console.log(`💰 Deducted ${couponUsageFee} points from shop owner (${shopOwner._id}) for coupon usage fee on Order ${order.orderNumber || order._id.toString().slice(-6)}`);
          } else {
            console.warn(`⚠️ Shop owner (${shopOwner._id}) has insufficient points (${shopOwner.points}/${couponUsageFee}) - but allowing order to proceed`);
            // Note: We don't block the order if shop owner doesn't have enough points
            // This is because the fee is deducted from shop, not customer
          }
        } catch (feeError) {
          console.error('❌ Error deducting coupon usage fee from shop owner:', feeError);
          // Don't fail the order if fee deduction fails
        }
      }
    }

    // If order is delivery, charge shop 5 points and create delivery request
    console.log(`🔍 Checking order type: ${finalOrderType}`);
    if (finalOrderType === 'delivery') {
      console.log(`🚚 Order type is DELIVERY - Charging shop and creating DeliveryRequest...`);
      try {
        // Charge shop owner 5 points for online order
        const shopOrderFee = 5;
        try {
          // Get shop with owner populated
          const shopWithOwner = await Shop.findById(shop._id).populate('user');
          const shopOwner = shopWithOwner?.user;
          
          if (!shopOwner) {
            console.warn(`⚠️ Shop ${shop._id} has no owner - skipping shop order fee deduction`);
          } else if (shopOwner.points >= shopOrderFee) {
            // Shop owner has enough points - deduct points
            shopOwner.points -= shopOrderFee;
            await shopOwner.save();
            
            // Create point transaction record for shop owner
            const PointTransaction = require('../models/PointTransaction');
            await PointTransaction.create({
              userId: shopOwner._id,
              type: 'deduction',
              amount: -shopOrderFee,
              description: `หักแต้มค่าธรรมเนียมคำสั่งซื้อออนไลน์ (Order: ${order.orderNumber || order._id.toString().slice(-6)})`,
              relatedId: order._id,
              relatedModel: 'Order',
              remainingPoints: shopOwner.points
            });
            
            console.log(`💰 Deducted ${shopOrderFee} points from shop owner (${shopOwner._id}) for online order ${order.orderNumber || order._id.toString().slice(-6)}`);
          } else {
            console.warn(`⚠️ Shop owner (${shopOwner._id}) has insufficient points (${shopOwner.points}/${shopOrderFee}) - but allowing order to proceed`);
            // Note: We don't block the order if shop owner doesn't have enough points
          }
        } catch (feeError) {
          console.error('❌ Error deducting shop order fee:', feeError);
          // Don't fail the order if fee deduction fails
        }

        // Create DeliveryRequest for rider assignment
        const user = await User.findById(userId);
        let deliveryDistance = distance;
        let deliveryCoords = null;

        if (user && user.coordinates && shop.coordinates) {
          deliveryCoords = {
            latitude: user.coordinates.latitude,
            longitude: user.coordinates.longitude,
          };
          if (!deliveryDistance) {
            deliveryDistance = deliveryAssignmentService.calculateDistance(
              shop.coordinates.latitude,
              shop.coordinates.longitude,
              user.coordinates.latitude,
              user.coordinates.longitude
            );
          }
        } else {
          // Default distance if coordinates not available
          deliveryDistance = deliveryDistance || 2;
        }

        // Get contact phone from order or user
        const contactPhone = phone || user?.phone || shop?.phone || '';
        
        const deliveryRequest = new DeliveryRequest({
          shop: shop._id,
          order: order._id,
          deliveryAddress: deliveryAddress || '',
          deliveryCoordinates: deliveryCoords,
          distance: deliveryDistance,
          requestedDeliveryFee: deliveryFee,
          riderFee: deliveryFee, // Shop pays rider the same amount customer pays
          contactPhone: contactPhone, // Required field
          priority: (() => {
            // Calculate priority based on distance (shorter = higher priority)
            if (deliveryDistance <= 1) return 10;
            if (deliveryDistance <= 2) return 9;
            if (deliveryDistance <= 3) return 8;
            if (deliveryDistance <= 5) return 7;
            if (deliveryDistance <= 7) return 6;
            if (deliveryDistance <= 10) return 5;
            if (deliveryDistance <= 15) return 4;
            if (deliveryDistance <= 20) return 3;
            if (deliveryDistance <= 30) return 2;
            return 1;
          })(),
          status: 'pending',
          rider: null, // Explicitly set to null to ensure it's not assigned
        });
        
        console.log(`📝 Creating DeliveryRequest with:`, {
          shopId: shop._id,
          orderId: order._id,
          orderNumber: order.orderNumber,
          orderType: finalOrderType,
          deliveryAddress: deliveryAddress || 'N/A',
          distance: deliveryDistance,
          deliveryFee: deliveryFee,
          contactPhone: contactPhone || 'N/A',
          status: 'pending',
          rider: null
        });

        try {
          await deliveryRequest.save();
          console.log(`✅ Created DeliveryRequest ${deliveryRequest._id} for order ${order.orderNumber}`);
          console.log(`   - RequestNumber: ${deliveryRequest.requestNumber || 'N/A'}`);
          console.log(`   - Status: ${deliveryRequest.status}`);
          console.log(`   - Distance: ${deliveryDistance}km`);
          console.log(`   - Priority: ${deliveryRequest.priority}`);
          console.log(`   - Rider: ${deliveryRequest.rider || 'null (pending assignment)'}`);
          console.log(`   - ContactPhone: ${deliveryRequest.contactPhone || 'N/A'}`);
          console.log(`   - DeliveryAddress: ${deliveryRequest.deliveryAddress || 'N/A'}`);
          console.log(`   - ShopId: ${deliveryRequest.shop?.toString() || shop._id.toString()}`);
          console.log(`   - OrderId: ${deliveryRequest.order?.toString() || order._id.toString()}`);
          
          // Verify it was saved correctly
          const savedRequest = await DeliveryRequest.findById(deliveryRequest._id);
          console.log(`   - Verification: Found in DB: ${!!savedRequest}, Status: ${savedRequest?.status || 'N/A'}, Rider: ${savedRequest?.rider || 'null'}`);
        } catch (saveError) {
          console.error('❌ Error saving DeliveryRequest:', saveError);
          console.error('   Error details:', {
            message: saveError.message,
            errors: saveError.errors,
            stack: saveError.stack
          });
          throw saveError; // Re-throw to be caught by outer try-catch
        }

        // Link delivery request to order
        order.deliveryRequest = deliveryRequest._id;
        await order.save();
        console.log(`🔗 Linked DeliveryRequest ${deliveryRequest._id} to Order ${order.orderNumber}`);

        // Verify DeliveryRequest exists in database before auto-assignment
        const verifyRequest = await DeliveryRequest.findById(deliveryRequest._id);
        console.log(`🔍 Verification after save:`, {
          found: !!verifyRequest,
          status: verifyRequest?.status || 'N/A',
          rider: verifyRequest?.rider?.toString() || 'null',
          shop: verifyRequest?.shop?.toString() || 'N/A',
          order: verifyRequest?.order?.toString() || 'N/A'
        });
        
        // Trigger auto-assignment (if enabled)
        try {
          console.log(`🔄 Attempting auto-assignment for DeliveryRequest ${deliveryRequest._id}...`);
          const autoAssignResult = await deliveryAssignmentService.autoAssignDelivery(deliveryRequest._id.toString());
          console.log(`📱 Auto-assignment result:`, autoAssignResult);
          
          // Verify after auto-assignment
          const afterAutoAssign = await DeliveryRequest.findById(deliveryRequest._id);
          console.log(`🔍 After auto-assignment:`, {
            status: afterAutoAssign?.status || 'N/A',
            rider: afterAutoAssign?.rider?.toString() || 'null',
            assignmentMethod: afterAutoAssign?.assignmentMethod || 'N/A'
          });
        } catch (autoAssignError) {
          console.error('⚠️ Auto-assignment failed (will be available for manual assignment):', autoAssignError);
          console.error('   Error:', autoAssignError.message);
          // Continue - rider can manually accept later
        }
        
        // Final check: Count pending delivery requests
        const pendingCount = await DeliveryRequest.countDocuments({ status: 'pending', rider: null });
        console.log(`📊 Total pending delivery requests (rider: null): ${pendingCount}`);
      } catch (deliveryError) {
        console.error('Error creating delivery request:', deliveryError);
        // Don't fail the order if delivery request creation fails
      }
    }

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

    // Debug: Check all orders in database
    const totalOrdersInDB = await Order.countDocuments({});
    const deliveryOrdersCount = await Order.countDocuments({ orderType: 'delivery' });
    const deliveryOrdersWithRequest = await Order.countDocuments({ 
      orderType: 'delivery', 
      deliveryRequest: { $exists: true, $ne: null } 
    });
    
    console.log(`📊 Order Statistics for user ${userId}:`);
    console.log(`   - Total orders in DB: ${totalOrdersInDB}`);
    console.log(`   - Total delivery orders: ${deliveryOrdersCount}`);
    console.log(`   - Delivery orders with DeliveryRequest: ${deliveryOrdersWithRequest}`);
    console.log(`   - User's query:`, query);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('shop', 'shopName shopId')
      .populate('user', 'name email phone')
      .populate({
        path: 'deliveryRequest',
        populate: {
          path: 'rider',
          select: 'name email phone',
          // DeliveryRequest.rider references User directly, not Rider.user
        }
      })
      .populate({
        path: 'delivery',
        populate: {
          path: 'rider',
          select: 'name email phone',
          // Delivery.rider references User directly, not Rider.user
        }
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Order.countDocuments(query);
    
    console.log(`📦 Found ${total} orders for user (returning ${orders.length})`);
    if (orders.length > 0) {
      orders.forEach(order => {
        console.log(`   - Order ${order.orderNumber || order._id}:`, {
          orderType: order.orderType,
          status: order.status,
          hasDeliveryRequest: !!order.deliveryRequest,
          deliveryRequestId: order.deliveryRequest?._id?.toString() || 'null',
          hasDelivery: !!order.delivery,
          deliveryId: order.delivery?._id?.toString() || 'null'
        });
      });
    }

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
 * @route   GET /api/orders/debug/all
 * @desc    Debug: Get all orders in database (for debugging)
 * @access  Private
 */
router.get('/debug/all', auth, async (req, res) => {
  try {
    // Check all orders
    const totalOrders = await Order.countDocuments({});
    const deliveryOrders = await Order.countDocuments({ orderType: 'delivery' });
    const dineInOrders = await Order.countDocuments({ orderType: 'dine_in' });
    
    // Check orders with delivery requests
    const ordersWithDeliveryRequest = await Order.countDocuments({ 
      orderType: 'delivery',
      deliveryRequest: { $exists: true, $ne: null }
    });
    
    // Check delivery requests
    const totalDeliveryRequests = await DeliveryRequest.countDocuments({});
    const pendingDeliveryRequests = await DeliveryRequest.countDocuments({ 
      status: 'pending', 
      rider: null 
    });
    
    // Get sample orders
    const sampleDeliveryOrders = await Order.find({ orderType: 'delivery' })
      .select('_id orderNumber orderType status deliveryRequest delivery createdAt')
      .populate('deliveryRequest', '_id status rider')
      .populate('delivery', '_id status rider')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    console.log(`🔍 DEBUG: Order Statistics:`);
    console.log(`   - Total orders in DB: ${totalOrders}`);
    console.log(`   - Delivery orders: ${deliveryOrders}`);
    console.log(`   - Dine-in orders: ${dineInOrders}`);
    console.log(`   - Delivery orders with DeliveryRequest: ${ordersWithDeliveryRequest}`);
    console.log(`   - Total DeliveryRequests in DB: ${totalDeliveryRequests}`);
    console.log(`   - Pending DeliveryRequests (rider=null): ${pendingDeliveryRequests}`);
    console.log(`   - Sample delivery orders:`, sampleDeliveryOrders.map(o => ({
      id: o._id.toString(),
      orderNumber: o.orderNumber || 'N/A',
      orderType: o.orderType,
      status: o.status,
      hasDeliveryRequest: !!o.deliveryRequest,
      deliveryRequestId: o.deliveryRequest?._id?.toString() || 'null',
      deliveryRequestStatus: o.deliveryRequest?.status || 'N/A',
      deliveryRequestRider: o.deliveryRequest?.rider?.toString() || 'null',
      hasDelivery: !!o.delivery,
      deliveryId: o.delivery?._id?.toString() || 'null',
      createdAt: o.createdAt
    })));
    
    res.json({
      success: true,
      data: {
        totalOrders,
        deliveryOrders,
        dineInOrders,
        ordersWithDeliveryRequest,
        totalDeliveryRequests,
        pendingDeliveryRequests,
        sampleDeliveryOrders: sampleDeliveryOrders.map(o => ({
          id: o._id.toString(),
          orderNumber: o.orderNumber || 'N/A',
          orderType: o.orderType,
          status: o.status,
          hasDeliveryRequest: !!o.deliveryRequest,
          deliveryRequestId: o.deliveryRequest?._id?.toString() || null,
          deliveryRequestStatus: o.deliveryRequest?.status || null,
          deliveryRequestRider: o.deliveryRequest?.rider?.toString() || null,
          hasDelivery: !!o.delivery,
          deliveryId: o.delivery?._id?.toString() || null,
          createdAt: o.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
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
      .populate('coupon', 'code discountType discountValue')
      .populate('deliveryRequest', '_id status rider')
      .populate('delivery', '_id status rider')
      .populate('rider', 'name email phone')
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
      .populate('items.menuItem', 'name price image')
      .populate('coupon', 'code discountType discountValue')
      .populate({
        path: 'deliveryRequest',
        populate: {
          path: 'rider',
          select: 'name email phone',
          // DeliveryRequest.rider references User directly, not Rider.user
        }
      })
      .populate({
        path: 'delivery',
        populate: {
          path: 'rider',
          select: 'name email phone',
          // Delivery.rider references User directly, not Rider.user
        }
      });

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
 * @desc    Cancel order (customer only - no penalty)
 * @access  Private
 */
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id || req.user._id;

    const order = await Order.findById(orderId)
      .populate('deliveryRequest')
      .populate('delivery')
      .populate('shop', 'shopName shopId partnerId user ownerEmail');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำสั่งซื้อ',
      });
    }

    // Check if user owns the order (customer)
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
    order.cancelledBy = 'customer'; // Mark as cancelled by customer (no penalty)
    await order.save();

    // Cancel related delivery request and delivery
    const DeliveryRequest = require('../models/DeliveryRequest');
    const Delivery = require('../models/Delivery');

    // Cancel delivery request if exists
    if (order.deliveryRequest) {
      const deliveryRequest = await DeliveryRequest.findById(order.deliveryRequest);
      if (deliveryRequest && !['completed', 'cancelled'].includes(deliveryRequest.status)) {
        deliveryRequest.status = 'cancelled';
        deliveryRequest.customerCanceled = true;
        await deliveryRequest.save();
        console.log(`✅ Cancelled delivery request ${deliveryRequest._id} due to customer order cancellation`);
      }
    }

    // Cancel delivery if exists
    if (order.delivery) {
      const delivery = await Delivery.findById(order.delivery);
      if (delivery && !['delivered', 'cancelled'].includes(delivery.status)) {
        delivery.status = 'cancelled';
        await delivery.save();
        console.log(`✅ Cancelled delivery ${delivery._id} due to customer order cancellation`);
      }
    }

    // No penalty for customer cancellation
    console.log(`✅ Order ${orderId} cancelled by customer - no penalty applied`);

    // Send notifications to relevant parties
    const notificationService = require('../services/notificationService');
    try {
      // Send notification to customer (confirmation)
      await notificationService.sendOrderCancelledNotification(
        order._id,
        'customer_cancelled'
      );
      
      // Send notification to shop owner
      if (order.shop) {
        const Shop = require('../models/Shop');
        const shopData = await Shop.findById(order.shop).populate('user');
        if (shopData && shopData.user) {
          const shopOwnerId = shopData.user._id || shopData.user;
          await notificationService.sendNotificationToUser(
            shopOwnerId,
            'คำสั่งซื้อถูกยกเลิก ⚠️',
            `คำสั่งซื้อ ${order.orderNumber || order._id} ถูกยกเลิกโดยลูกค้า`,
            {
              type: 'order_cancelled',
              orderId: order._id.toString(),
              orderNumber: order.orderNumber,
              reason: 'customer_cancelled',
              cancelledBy: 'customer'
            }
          );
        }
      }
      
      // Send notification to rider if assigned
      if (order.delivery) {
        const Delivery = require('../models/Delivery');
        const delivery = await Delivery.findById(order.delivery).populate('rider');
        if (delivery && delivery.rider) {
          const riderId = delivery.rider._id || delivery.rider;
          await notificationService.sendNotificationToUser(
            riderId,
            'คำสั่งซื้อถูกยกเลิก ⚠️',
            `คำสั่งซื้อ ${order.orderNumber || order._id} ถูกยกเลิกโดยลูกค้า`,
            {
              type: 'order_cancelled',
              orderId: order._id.toString(),
              orderNumber: order.orderNumber,
              reason: 'customer_cancelled',
              cancelledBy: 'customer'
            }
          );
        }
      }
      
      console.log(`📱 Sent cancellation notifications for order ${order.orderNumber || order._id}`);
    } catch (notifError) {
      console.error(`❌ Error sending cancellation notifications:`, notifError);
      // Don't fail the request if notification fails
    }

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

/**
 * @route   PUT /api/orders/:id/shop-cancel
 * @desc    Cancel order by shop owner (with penalty)
 * @access  Private (Shop owner only)
 */
router.put('/:id/shop-cancel', auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id || req.user._id;

    console.log(`🛒 Shop cancel request for order ${orderId} by user ${userId}`);

    const order = await Order.findById(orderId)
      .populate('shop', 'shopName shopId partnerId user ownerEmail')
      .populate('deliveryRequest')
      .populate('delivery');
    if (!order) {
      console.log(`❌ Order ${orderId} not found`);
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำสั่งซื้อ',
      });
    }
    
    console.log(`📋 Order found:`, {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber || 'N/A',
      status: order.status,
      shopId: order.shop?._id?.toString() || 'N/A',
      shopName: order.shop?.shopName || 'N/A'
    });

    // Check if user is shop owner
    let shop = order.shop;
    if (!shop || !shop.shopName) {
      shop = await Shop.findById(order.shop);
    }

    const userIdStr = userId ? userId.toString() : null;
    const userIdObj = userId ? (mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null) : null;
    
    const partnerIdStr = shop?.partnerId ? shop.partnerId.toString() : null;
    const partnerIdObj = shop?.partnerId ? (mongoose.Types.ObjectId.isValid(shop.partnerId) ? new mongoose.Types.ObjectId(shop.partnerId) : null) : null;
    
    const shopUserIdStr = shop?.user ? shop.user.toString() : null;
    const shopUserIdObj = shop?.user ? (mongoose.Types.ObjectId.isValid(shop.user) ? new mongoose.Types.ObjectId(shop.user) : null) : null;
    
    const userEmail = req.user.email || req.user.userEmail;
    const ownerEmail = shop?.ownerEmail;

    const isOwnerById = 
      (userIdStr && partnerIdStr && userIdStr === partnerIdStr) ||
      (userIdObj && partnerIdObj && userIdObj.equals(partnerIdObj)) ||
      (userIdStr && shopUserIdStr && userIdStr === shopUserIdStr) ||
      (userIdObj && shopUserIdObj && userIdObj.equals(shopUserIdObj));

    const isOwnerByEmail = userEmail && ownerEmail && 
      userEmail.toLowerCase().trim() === ownerEmail.toLowerCase().trim();

    const isShopOwner = shop && (isOwnerById || isOwnerByEmail);

    if (!isShopOwner) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ยกเลิกคำสั่งซื้อนี้',
      });
    }

    // Check if order was already cancelled first (to show friendly message)
    if (order.status === 'cancelled') {
      console.log(`ℹ️ Order ${order.orderNumber || order._id} already cancelled`);
      return res.status(200).json({
        success: true,
        message: 'คำสั่งซื้อนี้ถูกยกเลิกไปแล้ว',
        data: {
          order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            cancelledBy: order.cancelledBy
          }
        }
      });
    }

    // Only allow cancellation if order is pending or confirmed
    if (!['pending', 'confirmed'].includes(order.status)) {
      console.log(`❌ Cannot cancel order ${order.orderNumber || order._id} - status is ${order.status} (not pending/confirmed)`);
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถยกเลิกคำสั่งซื้อที่อยู่ในสถานะ "${order.status}" ได้`,
      });
    }
    
    console.log(`✅ Order ${order.orderNumber || order._id} can be cancelled - proceeding...`);

    // Apply penalty points ONLY to shop owner (the one who cancelled)
    const penaltyPoints = await QuestSettings.getSetting('order_cancel_penalty_points') || 5;
    
    // Get shop owner user
    const shopOwnerUserId = shop.partnerId || shop.user;
    if (shopOwnerUserId && penaltyPoints > 0) {
      const shopOwner = await User.findById(shopOwnerUserId);
      if (shopOwner) {
        // Deduct points ONLY from shop owner (not from rider)
        const currentPoints = shopOwner.points || 0;
        const newPoints = Math.max(0, currentPoints - penaltyPoints);
        shopOwner.points = newPoints;
        await shopOwner.save();

        // Create point transaction
        await PointTransaction.create({
          user: shopOwner._id,
          type: 'deduction',
          amount: penaltyPoints,
          description: `หักแต้มเนื่องจากยกเลิกคำสั่งซื้อ (${order.orderNumber})`,
          remainingPoints: newPoints,
          relatedId: order._id,
          relatedModel: 'Order'
        });

        console.log(`✅ Deducted ${penaltyPoints} points from shop owner ${shopOwner._id} for cancelling order ${orderId} (shop cancelled, only shop owner penalized)`);
      }
    }

    order.status = 'cancelled';
    order.cancelledBy = 'shop'; // Mark as cancelled by shop (with penalty)
    await order.save();

    // Cancel related delivery request and delivery
    const DeliveryRequest = require('../models/DeliveryRequest');
    const Delivery = require('../models/Delivery');

    // Cancel delivery request if exists
    if (order.deliveryRequest) {
      const deliveryRequest = await DeliveryRequest.findById(order.deliveryRequest);
      if (deliveryRequest && !['completed', 'cancelled'].includes(deliveryRequest.status)) {
        deliveryRequest.status = 'cancelled';
        await deliveryRequest.save();
        console.log(`✅ Cancelled delivery request ${deliveryRequest._id} due to shop order cancellation`);
      }
    }

    // Cancel delivery if exists
    if (order.delivery) {
      const delivery = await Delivery.findById(order.delivery);
      if (delivery && !['delivered', 'cancelled'].includes(delivery.status)) {
        delivery.status = 'cancelled';
        await delivery.save();
        console.log(`✅ Cancelled delivery ${delivery._id} due to shop order cancellation`);
      }
    }

    // Send notifications to relevant parties
    const notificationService = require('../services/notificationService');
    try {
      console.log(`📱 Sending cancellation notifications for order ${order.orderNumber || order._id} (shop cancelled)...`);
      
      // Send notification to customer
      const customerNotifResult = await notificationService.sendOrderCancelledNotification(
        order._id,
        'shop_cancelled'
      );
      console.log(`   Customer notification result:`, customerNotifResult);
      
      // Send notification to shop owner (confirmation)
      if (shopOwnerUserId) {
        const shopOwnerNotifResult = await notificationService.sendNotificationToUser(
          shopOwnerUserId,
          'คำสั่งซื้อถูกยกเลิก ⚠️',
          `คำสั่งซื้อ ${order.orderNumber || order._id} ถูกยกเลิก (หัก ${penaltyPoints} แต้ม)`,
          {
            type: 'order_cancelled',
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            reason: 'shop_cancelled',
            cancelledBy: 'shop',
            penaltyPoints: penaltyPoints
          }
        );
        console.log(`   Shop owner notification result:`, shopOwnerNotifResult);
      } else {
        console.log(`   ⚠️ No shop owner user ID found for notification`);
      }
      
      // Send notification to rider if assigned
      if (order.delivery) {
        const Delivery = require('../models/Delivery');
        const delivery = await Delivery.findById(order.delivery).populate('rider');
        if (delivery && delivery.rider) {
          const riderId = delivery.rider._id || delivery.rider;
          const riderNotifResult = await notificationService.sendNotificationToUser(
            riderId,
            'คำสั่งซื้อถูกยกเลิก ⚠️',
            `คำสั่งซื้อ ${order.orderNumber || order._id} ถูกยกเลิกโดยร้านค้า`,
            {
              type: 'order_cancelled',
              orderId: order._id.toString(),
              orderNumber: order.orderNumber,
              reason: 'shop_cancelled',
              cancelledBy: 'shop'
            }
          );
          console.log(`   Rider notification result:`, riderNotifResult);
        } else {
          console.log(`   ℹ️ No rider assigned to delivery ${order.delivery}`);
        }
      } else {
        console.log(`   ℹ️ No delivery assigned to order`);
      }
      
      console.log(`✅ Sent cancellation notifications for order ${order.orderNumber || order._id}`);
    } catch (notifError) {
      console.error(`❌ Error sending cancellation notifications:`, notifError);
      // Don't fail the request if notification fails
    }

    res.json({
      success: true,
      message: `ยกเลิกคำสั่งซื้อสำเร็จ (หัก ${penaltyPoints} แต้ม)`,
      data: order,
    });
  } catch (error) {
    console.error('Error cancelling order by shop:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการยกเลิกคำสั่งซื้อ',
      error: error.message,
    });
  }
});

module.exports = router;
