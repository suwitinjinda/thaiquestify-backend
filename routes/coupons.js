// routes/coupons.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const QuestSettings = require('../models/QuestSettings');
const Shop = require('../models/Shop');
const UserQuest = require('../models/UserQuest');
const Quest = require('../models/Quest');
const PointTransaction = require('../models/PointTransaction');
const { auth } = require('../middleware/auth');

/**
 * POST /coupons/redeem
 * Redeem coupon using points
 */
router.post('/redeem', auth, async (req, res) => {
  try {
    const { shopId, couponType } = req.body; // couponType: '50' or '100'
    const userId = req.user.id;

    console.log(`🔍 Coupon redemption request:`, { shopId, couponType, userId });

    if (!shopId) {
      console.log(`   ❌ Missing shopId`);
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุร้านค้า'
      });
    }

    // Validate shopId format and existence
    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      console.log(`   ❌ Invalid shopId format: ${shopId}`);
      return res.status(400).json({
        success: false,
        message: 'รหัสร้านค้าไม่ถูกต้อง'
      });
    }

    // Check if shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      console.log(`   ❌ Shop not found: ${shopId}`);
      return res.status(404).json({
        success: false,
        message: 'ไม่พบร้านค้า'
      });
    }

    // Check if user has completed a check-in quest for this shop today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find check-in quests for this shop (location_checkin type)
    const checkInQuests = await Quest.find({
      shopId: shopId,
      type: 'location_checkin',
      status: 'active'
    });

    if (checkInQuests.length > 0) {
      console.log(`   🔍 Found ${checkInQuests.length} check-in quest(s) for this shop`);
      
      // Check if user has completed any check-in quest for this shop today
      const todayCheckIn = await UserQuest.findOne({
        userId: userId,
        questId: { $in: checkInQuests.map(q => q._id) },
        status: 'completed',
        completedAt: {
          $gte: today,
          $lt: tomorrow
        }
      });

      if (!todayCheckIn) {
        console.log(`   ❌ User has not completed check-in quest for this shop today`);
        return res.status(400).json({
          success: false,
          message: 'กรุณาทำเควสเช็คอินสำหรับร้านนี้ก่อนแลกคูปอง'
        });
      }
      console.log(`   ✅ User has completed check-in quest today (completedAt: ${todayCheckIn.completedAt})`);
    } else {
      console.log(`   ℹ️ No check-in quests found for this shop, allowing coupon redemption`);
    }

    if (!couponType || !['50', '100'].includes(couponType)) {
      console.log(`   ❌ Invalid couponType: ${couponType}`);
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุประเภทคูปอง (50 หรือ 100 แต้ม)'
      });
    }

    // Get settings
    const enabledKey = couponType === '50' 
      ? 'daily_quest_50_points_enabled' 
      : 'daily_quest_100_points_enabled';
    const costKey = couponType === '50'
      ? 'daily_quest_50_points_cost'
      : 'daily_quest_100_points_cost';
    const discountKey = couponType === '50'
      ? 'daily_quest_50_points_discount'
      : 'daily_quest_100_points_discount';

    console.log(`🔍 Checking coupon redemption: shopId=${shopId}, couponType=${couponType}, enabledKey=${enabledKey}`);
    
    const enabled = await QuestSettings.getSetting(enabledKey);
    console.log(`   enabled setting: ${enabled} (type: ${typeof enabled})`);
    
    // Check if setting exists and is explicitly false (default to true if not set)
    if (enabled === false) {
      console.log(`   ❌ Quest explicitly disabled: ${enabled}`);
      return res.status(400).json({
        success: false,
        message: `Quest แลกคูปอง ${couponType} แต้มถูกปิดใช้งาน`
      });
    }
    
    // If setting doesn't exist (null/undefined), default to enabled
    if (enabled === null || enabled === undefined) {
      console.log(`   ⚠️ Setting not found, defaulting to enabled`);
    }

    const pointsCost = await QuestSettings.getSetting(costKey) || (couponType === '50' ? 50 : 100);
    const discountValue = await QuestSettings.getSetting(discountKey) || (couponType === '50' ? 5 : 10);
    const expiryDays = await QuestSettings.getSetting('coupon_expiry_days') || 1;

    // Check user points
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้'
      });
    }

    if (user.points < pointsCost) {
      return res.status(400).json({
        success: false,
        message: `คุณมีแต้มไม่พอ (${user.points}/${pointsCost} แต้ม)`
      });
    }

    // Generate coupon code
    let couponCode;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      couponCode = Coupon.generateCode();
      const existing = await Coupon.findOne({ code: couponCode });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        success: false,
        message: 'ไม่สามารถสร้างรหัสคูปองได้ กรุณาลองใหม่อีกครั้ง'
      });
    }

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);
    expiresAt.setHours(23, 59, 59, 999); // End of day

    // Create coupon
    const coupon = new Coupon({
      code: couponCode,
      discountType: 'percentage',
      discountValue: discountValue,
      userId: userId,
      shopId: shopId,
      expiresAt: expiresAt
    });

    await coupon.save();

    // Deduct points
    user.points -= pointsCost;
    await user.save();

    // Create PointTransaction record
    // Amount must be negative for deduction (user pays points)
    await PointTransaction.create({
      userId: userId,
      type: 'deduction',
      amount: -pointsCost, // Negative amount for deduction
      description: `แลกคูปองส่วนลด ${discountValue}% สำหรับร้าน ${shop.shopName || shopId} (หัก ${pointsCost} แต้ม)`,
      relatedId: coupon._id,
      relatedModel: 'Coupon',
      remainingPoints: user.points
    });

    console.log(`💰 Point transaction created: -${pointsCost} points deducted for coupon redemption (remaining: ${user.points})`);

    res.json({
      success: true,
      message: `แลกคูปองส่วนลด ${discountValue}% สำเร็จ`,
      data: {
        coupon: coupon,
        remainingPoints: user.points
      }
    });

  } catch (error) {
    console.error('Error redeeming coupon:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการแลกคูปอง'
    });
  }
});

/**
 * GET /coupons/my-coupons
 * Get user's coupons
 */
router.get('/my-coupons', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { shopId, validOnly } = req.query;

    const query = { userId: userId };
    if (shopId) {
      query.shopId = shopId;
    }
    if (validOnly === 'true') {
      query.used = false;
      query.expiresAt = { $gt: new Date() };
    }

    const coupons = await Coupon.find(query)
      .populate('shopId', 'shopName')
      .sort({ createdAt: -1 })
      .lean();

    // Mark validity
    const now = new Date();
    const couponsWithValidity = coupons.map(coupon => ({
      ...coupon,
      isValid: !coupon.used && coupon.expiresAt > now
    }));

    res.json({
      success: true,
      data: couponsWithValidity
    });

  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคูปอง'
    });
  }
});

/**
 * GET /coupons/valid/:shopId
 * Get valid coupons for a specific shop.
 * usedCouponAtShopToday: true ถ้า user ใช้คูปองร้านนี้แล้ววันนี้ (1 ต่อร้านต่อวัน, reset เที่ยงคืน)
 */
router.get('/valid/:shopId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { shopId } = req.params;

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const usedTodayAtShop = await Coupon.findOne({
      userId,
      shopId,
      used: true,
      usedAt: { $gte: today, $lt: endOfToday },
    });

    const coupons = await Coupon.find({
      userId: userId,
      shopId: shopId,
      used: false,
      expiresAt: { $gt: now }
    })
      .populate('shopId', 'shopName')
      .sort({ discountValue: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: coupons,
      usedCouponAtShopToday: !!usedTodayAtShop,
    });

  } catch (error) {
    console.error('Error fetching valid coupons:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคูปอง'
    });
  }
});

/**
 * POST /coupons/validate
 * Validate coupon code
 */
router.post('/validate', auth, async (req, res) => {
  try {
    const { code, shopId } = req.body;
    const userId = req.user.id;

    if (!code || !shopId) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุรหัสคูปองและร้านค้า'
      });
    }

    // 1 คูปองต่อ user ต่อร้าน ต่อวัน (reset หลังเที่ยงคืน)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const usedTodayAtShop = await Coupon.findOne({
      userId,
      shopId,
      used: true,
      usedAt: { $gte: today, $lt: endOfToday },
    });
    if (usedTodayAtShop) {
      return res.status(400).json({
        success: false,
        message: 'ใช้คูปองร้านนี้แล้ววันนี้ ใช้ได้อีกครั้งหลังเที่ยงคืน',
      });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      userId: userId,
      shopId: shopId
    }).populate('shopId', 'shopName');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคูปองนี้'
      });
    }

    if (coupon.used) {
      return res.status(400).json({
        success: false,
        message: 'คูปองนี้ถูกใช้แล้ว'
      });
    }

    const now = new Date();
    if (coupon.expiresAt <= now) {
      return res.status(400).json({
        success: false,
        message: 'คูปองนี้หมดอายุแล้ว'
      });
    }

    res.json({
      success: true,
      data: coupon
    });

  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบคูปอง'
    });
  }
});

module.exports = router;
