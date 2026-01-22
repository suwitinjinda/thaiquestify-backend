// backend/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Shop = require('../models/Shop'); // ADD THIS IMPORT
const PointTransaction = require('../models/PointTransaction');
const QuestSettings = require('../models/QuestSettings');
const { auth } = require('../middleware/auth');

// Get all users (Admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user profile (GET /api/users/me)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-__v')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        photo: user.photo,
        phone: user.phone,
        address: user.address || '',
        district: user.district || '',
        province: user.province || '',
        coordinates: user.coordinates || null,
        shippingAddress: user.shippingAddress || null,
        bankAccount: user.bankAccount || null,
        userType: user.userType,
        points: user.points || 0,
        streakStats: user.streakStats || {},
        socialStats: user.socialStats || {},
        achievements: user.achievements || [],
        integrations: {
          tiktok: user.integrations?.tiktok ? {
            connectedAt: user.integrations.tiktok.connectedAt,
            displayName: user.integrations.tiktok.displayName,
            username: user.integrations.tiktok.displayName
          } : null
        },
        isEmailVerified: user.isEmailVerified,
        partnerId: user.partnerId || null,
        partnerCode: user.partnerCode || null,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
});

// Update current user profile (PUT /api/users/me)
router.put('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    console.log('📝 Updating user profile:', userId);
    console.log('📦 Update data:', Object.keys(updateData));

    // Build update object with allowed fields
    const allowedFields = {
      name: updateData.name,
      phone: updateData.phone,
      photo: updateData.photo,
      address: updateData.address,
      district: updateData.district,
      province: updateData.province,
    };

    // Handle coordinates
    if (updateData.latitude !== undefined && updateData.longitude !== undefined) {
      allowedFields['coordinates.latitude'] = updateData.latitude;
      allowedFields['coordinates.longitude'] = updateData.longitude;
    }

    // Handle bankAccount
    if (updateData.bankAccount) {
      if (updateData.bankAccount.accountName !== undefined) {
        allowedFields['bankAccount.accountName'] = updateData.bankAccount.accountName;
      }
      if (updateData.bankAccount.accountNumber !== undefined) {
        allowedFields['bankAccount.accountNumber'] = updateData.bankAccount.accountNumber;
      }
      if (updateData.bankAccount.bankName !== undefined) {
        allowedFields['bankAccount.bankName'] = updateData.bankAccount.bankName;
      }
      if (updateData.bankAccount.bankBranch !== undefined) {
        allowedFields['bankAccount.bankBranch'] = updateData.bankAccount.bankBranch;
      }
    }

    // Remove undefined fields
    Object.keys(allowedFields).forEach(key => {
      if (allowedFields[key] === undefined) {
        delete allowedFields[key];
      }
    });

    // Update timestamp
    allowedFields.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: allowedFields },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ User profile updated successfully');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        photo: user.photo,
        address: user.address,
        district: user.district,
        province: user.province,
        coordinates: user.coordinates,
        shippingAddress: user.shippingAddress,
        bankAccount: user.bankAccount,
        userType: user.userType,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user profile',
      error: error.message
    });
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Users can only view their own profile unless they're admin
    if (req.user.userType !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, photo, userType } = req.body;

    // Users can only update their own profile unless they're admin
    if (req.user.userType !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only admin can change userType
    const updateData = { name, photo };
    if (req.user.userType === 'admin' && userType) {
      updateData.userType = userType;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: 'Error updating user', error: error.message });
  }
});

// Delete user (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user stats (Admin only)
router.get('/stats/overview', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ userType: 'customer' });
    const totalPartners = await User.countDocuments({ partnerId: { $exists: true, $ne: null } });
    const totalShops = await User.countDocuments({ userType: 'shop' });
    const totalAdmins = await User.countDocuments({ userType: 'admin' });

    res.json({
      totalUsers,
      totalCustomers,
      totalPartners,
      totalShops,
      totalAdmins
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/public/all', async (req, res) => {
  try {
    console.log('🔓 Public access - fetching all users for login screen');

    const users = await User.find()
      .select('-password -__v')
      .sort({ userType: 1, name: 1 });

    console.log(`✅ Found ${users.length} users for login screen`);

    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('❌ Error fetching users for login:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

/**
 * GET /api/users/settings/public
 * Get public settings that users can access (no auth required)
 */
router.get('/settings/public', async (req, res) => {
  try {
    const publicSettings = [
      'point_to_baht_rate',
      'shop_checkin_points',
      'daily_checkin_points',
      'coupon_expiry_days',
      'daily_quest_50_points_enabled',
      'daily_quest_50_points_cost',
      'daily_quest_50_points_discount',
      'daily_quest_100_points_enabled',
      'daily_quest_100_points_cost',
      'daily_quest_100_points_discount',
      'coupon_min_amount_5',
      'coupon_min_amount_10',
      'coupon_min_amount_15',
      'coupon_min_amount_20'
    ];

    const settings = await QuestSettings.find({
      key: { $in: publicSettings },
      isActive: true
    }).lean();

    const settingsMap = {};
    settings.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });

    // Helper to get number value or fallback (handles 0 as valid value)
    const getNumberValue = (key, fallback) => {
      const value = settingsMap[key];
      if (value === null || value === undefined) return fallback;
      const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
      return isNaN(numValue) ? fallback : numValue;
    };

    // Helper to get boolean value or fallback
    const getBooleanValue = (key, fallback) => {
      const value = settingsMap[key];
      if (value === null || value === undefined) return fallback;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);
    };

    const dailyCheckInPoints = getNumberValue('daily_checkin_points', null);
    const shopCheckInPoints = getNumberValue('shop_checkin_points', null);

    res.json({
      success: true,
      data: {
        point_to_baht_rate: getNumberValue('point_to_baht_rate', 1),
        shop_checkin_points: shopCheckInPoints !== null ? shopCheckInPoints : (dailyCheckInPoints !== null ? dailyCheckInPoints : 10),
        daily_checkin_points: dailyCheckInPoints !== null ? dailyCheckInPoints : (shopCheckInPoints !== null ? shopCheckInPoints : 10),
        coupon_expiry_days: getNumberValue('coupon_expiry_days', 1),
        daily_quest_50_points_enabled: getBooleanValue('daily_quest_50_points_enabled', true),
        daily_quest_50_points_cost: getNumberValue('daily_quest_50_points_cost', 50),
        daily_quest_50_points_discount: getNumberValue('daily_quest_50_points_discount', 5),
        daily_quest_100_points_enabled: getBooleanValue('daily_quest_100_points_enabled', true),
        daily_quest_100_points_cost: getNumberValue('daily_quest_100_points_cost', 100),
        daily_quest_100_points_discount: getNumberValue('daily_quest_100_points_discount', 10),
        coupon_min_amount_5: getNumberValue('coupon_min_amount_5', 50),
        coupon_min_amount_10: getNumberValue('coupon_min_amount_10', 500),
        coupon_min_amount_15: getNumberValue('coupon_min_amount_15', 1000),
        coupon_min_amount_20: getNumberValue('coupon_min_amount_20', 50000)
      }
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: {
        point_to_baht_rate: 1, // Default fallback
        shop_checkin_points: 10, // Default fallback
        daily_checkin_points: 10, // Default fallback
        coupon_expiry_days: 1, // Default fallback
        daily_quest_50_points_enabled: true, // Default fallback
        daily_quest_50_points_cost: 50, // Default fallback
        daily_quest_50_points_discount: 5, // Default fallback
        daily_quest_100_points_enabled: true, // Default fallback
        daily_quest_100_points_cost: 100, // Default fallback
        daily_quest_100_points_discount: 10, // Default fallback
        coupon_min_amount_5: 50, // Default fallback
        coupon_min_amount_10: 500, // Default fallback
        coupon_min_amount_15: 1000, // Default fallback
        coupon_min_amount_20: 50000 // Default fallback
      }
    });
  }
});

// ตรวจสอบอีเมลที่มีอยู่
router.get('/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    console.log(email)

    const user = await User.findOne({ email: email.toLowerCase() });

    res.json({
      success: true,
      exists: !!user,
      user: user ? {
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        phone: user.phone,
        isActive: user.isActive
      } : null
    });

  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// อัพเดทบทบาทผู้ใช้
router.put('/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { userType, updatedAt } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        userType: userType,
        updatedAt: updatedAt || new Date()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType
      }
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// สร้างผู้ใช้ใหม่
router.post('/register', async (req, res) => {
  try {
    const { name, email, userType, phone, password } = req.body;

    // ตรวจสอบว่าอีเมลมีอยู่แล้วหรือไม่
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // สร้างผู้ใช้ใหม่
    const user = new User({
      name,
      email: email.toLowerCase(),
      userType,
      phone,
      password, // ใน production ควร hash password
      isActive: true
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user profile
router.get('/:userId/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Convert shopCheckInStats Map to object for JSON serialization
    const userData = user.toObject();
    if (userData.shopCheckInStats) {
      userData.shopCheckInStats = Object.fromEntries(userData.shopCheckInStats);
      console.log(`📊 Profile response - shopCheckInStats:`, userData.shopCheckInStats);
    } else {
      console.log(`📊 Profile response - no shopCheckInStats found`);
    }

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's shops (for shop owners)
router.get('/:userId/shops', auth, async (req, res) => {
  try {
    const shops = await Shop.find({
      user: req.params.userId,
      isDeleted: { $ne: true }
    })
      .select('shopId shopName province status registeredAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: shops
    });
  } catch (error) {
    console.error('Get user shops error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user profile
/**
 * @route   PUT /api/users/notification-token
 * @desc    Update user's push notification token
 * @access  Private
 */
/**
 * @route   GET /api/users/notification-token/status
 * @desc    Check user's notification token status
 * @access  Private
 */
router.get('/notification-token/status', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId).select('notificationToken notificationTokenUpdatedAt email name');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้'
      });
    }

    const hasToken = !!user.notificationToken;
    const { Expo } = require('expo-server-sdk');
    const isValidToken = hasToken && Expo.isExpoPushToken(user.notificationToken);

    res.json({
      success: true,
      data: {
        hasToken,
        isValidToken,
        tokenUpdatedAt: user.notificationTokenUpdatedAt || null,
        tokenPreview: user.notificationToken ? user.notificationToken.substring(0, 30) + '...' : null
      }
    });
  } catch (error) {
    console.error('Error checking notification token status:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบ notification token',
      error: error.message
    });
  }
});

router.put('/notification-token', auth, async (req, res) => {
  try {
    const { notificationToken } = req.body;
    const userId = req.user.id || req.user._id;

    console.log(`📱 Notification token update request from user ${userId}`);
    console.log(`   Token received: ${notificationToken ? notificationToken.substring(0, 30) + '...' : 'null'}`);

    if (!notificationToken) {
      console.log(`   ❌ No token provided`);
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ notification token'
      });
    }

    // Validate Expo push token format (starts with ExponentPushToken or Expon)
    const isValidExpoToken = /^(ExponentPushToken|ExpoPushToken)[A-Za-z0-9_-]+$/.test(notificationToken);
    if (!isValidExpoToken) {
      console.log(`   ❌ Invalid token format: ${notificationToken.substring(0, 30)}...`);
      return res.status(400).json({
        success: false,
        message: 'รูปแบบ notification token ไม่ถูกต้อง'
      });
    }

    console.log(`   ✅ Token format is valid`);

    const user = await User.findByIdAndUpdate(
      userId,
      {
        notificationToken,
        notificationTokenUpdatedAt: new Date()
      },
      { new: true }
    );

    if (!user) {
      console.log(`   ❌ User not found: ${userId}`);
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้'
      });
    }

    console.log(`   ✅ Notification token updated for user ${userId} (${user.email || 'N/A'})`);

    res.json({
      success: true,
      message: 'อัปเดต notification token สำเร็จ',
      data: {
        userId: user._id,
        notificationTokenUpdated: true,
        hasToken: true
      }
    });
  } catch (error) {
    console.error('Error updating notification token:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดต notification token',
      error: error.message
    });
  }
});

router.put('/:userId/profile', auth, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Users can only update their own profile unless they're admin
    if (req.user.userType !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own profile.'
      });
    }

    const updateData = req.body;
    console.log('📝 Updating user profile:', userId);
    console.log('📦 Update data:', Object.keys(updateData));

    // Build update object with allowed fields
    const allowedFields = {
      name: updateData.name,
      phone: updateData.phone,
      photo: updateData.photo,
      address: updateData.address,
      district: updateData.district,
      province: updateData.province,
    };

    // Handle coordinates
    if (updateData.latitude !== undefined && updateData.longitude !== undefined) {
      allowedFields['coordinates.latitude'] = updateData.latitude;
      allowedFields['coordinates.longitude'] = updateData.longitude;
    }

    // Handle bankAccount
    if (updateData.bankAccount) {
      if (updateData.bankAccount.accountName !== undefined) {
        allowedFields['bankAccount.accountName'] = updateData.bankAccount.accountName;
      }
      if (updateData.bankAccount.accountNumber !== undefined) {
        allowedFields['bankAccount.accountNumber'] = updateData.bankAccount.accountNumber;
      }
      if (updateData.bankAccount.bankName !== undefined) {
        allowedFields['bankAccount.bankName'] = updateData.bankAccount.bankName;
      }
      if (updateData.bankAccount.bankBranch !== undefined) {
        allowedFields['bankAccount.bankBranch'] = updateData.bankAccount.bankBranch;
      }
    }

    // Remove undefined fields
    Object.keys(allowedFields).forEach(key => {
      if (allowedFields[key] === undefined) {
        delete allowedFields[key];
      }
    });

    // Update timestamp
    allowedFields.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: allowedFields },
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ User profile updated successfully');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Add this to routes/users.js - User statistics endpoint
router.get('/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('📈 Fetching user stats for:', userId);

    // For now, return default stats since we don't have user quest tracking yet
    const userStats = {
      completedQuests: 0,
      totalPoints: 0,
      rewardsClaimed: 0,
      activeQuests: 0,
      level: 'Beginner',
      rank: 'New Explorer'
    };

    res.json({
      success: true,
      data: userStats
    });
  } catch (error) {
    console.error('❌ Error fetching user stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v2/users/me/points/transactions
 * Get current user's point transactions
 */
router.get('/me/points/transactions', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, type, status, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id || req.user.id };
    
    if (type) query.type = type;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await PointTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('questId', 'name')
      .populate('touristQuestId', 'name')
      .populate({
        path: 'relatedId',
        match: { relatedModel: { $ne: null } },
        select: 'code discountValue discountType shopId orderNumber',
        options: { strictPopulate: false }
      })
      .lean();

    const total = await PointTransaction.countDocuments(query);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user point transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch point transactions',
      error: error.message
    });
  }
});

/**
 * GET /api/v2/users/:userId/points/transactions
 * Get specific user's point transactions (for admins or self)
 */
router.get('/:userId/points/transactions', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id || req.user.id;

    // Only allow if user is admin or viewing their own transactions
    if (req.user.userType !== 'admin' && String(userId) !== String(currentUserId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own transactions.'
      });
    }

    const { page = 1, limit = 50, type, status, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    const query = { userId };
    
    if (type) query.type = type;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await PointTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('questId', 'name')
      .populate('touristQuestId', 'name')
      .populate({
        path: 'relatedId',
        match: { relatedModel: { $ne: null } },
        select: 'code discountValue discountType shopId orderNumber',
        options: { strictPopulate: false }
      })
      .lean();

    const total = await PointTransaction.countDocuments(query);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user point transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch point transactions',
      error: error.message
    });
  }
});

module.exports = router;