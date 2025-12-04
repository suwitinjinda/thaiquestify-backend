// backend/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Shop = require('../models/Shop'); // ADD THIS IMPORT
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
    const totalPartners = await User.countDocuments({ userType: 'partner' });
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

    res.json({
      success: true,
      data: user
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
router.put('/:userId/profile', auth, async (req, res) => {
  try {
    const { name, phone, photo } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { 
        name,
        phone,
        photo,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
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

module.exports = router;