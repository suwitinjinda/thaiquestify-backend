// backend/routes/auth.js - ADD THESE ROUTES
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Mock login - No password validation
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('🔐 Mock login attempt for:', email);
    
    // Find user by email (no password check)
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ User found:', user.name, user.userType);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        userType: user.userType 
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        partnerCode: user.partnerCode,
        phone: user.phone,
        photo: user.photo
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Get all users for mock login (NEW ROUTE)
router.get('/mock-users', async (req, res) => {
  try {
    console.log('📋 Fetching all users for mock login...');
    
    const users = await User.find({}).select('-password -__v');
    
    console.log(`✅ Found ${users.length} users`);
    
    res.json({
      success: true,
      data: users.map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        partnerCode: user.partnerCode,
        phone: user.phone,
        photo: user.photo,
        isActive: user.isActive
      }))
    });

  } catch (error) {
    console.error('❌ Error fetching mock users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
});

// Quick login by user type
router.post('/quick-login', async (req, res) => {
  try {
    const { userType } = req.body;
    
    console.log('🚀 Quick login for:', userType);
    
    // Find any user with the specified type
    const user = await User.findOne({ userType, isActive: true });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No ${userType} user found`
      });
    }

    console.log('✅ Quick login user:', user.name, user.userType);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        userType: user.userType 
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: `Quick login as ${userType} successful`,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        partnerCode: user.partnerCode,
        phone: user.phone,
        photo: user.photo
      }
    });

  } catch (error) {
    console.error('❌ Quick login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during quick login'
    });
  }
});

// Test token verification
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        partnerCode: user.partnerCode
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Token is invalid'
    });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude passwords
    console.log("getuser")
    console.log(users)
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

module.exports = router;