/**
 * Activity Logs Routes
 * Provides role-based access to activity logs
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ActivityLog = require('../models/ActivityLog');
const logger = require('../utils/logger');

/**
 * Middleware to check user role
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.userType)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

/**
 * GET /api/v2/activity-logs/my
 * Get current user's activity logs (for customer/regular users)
 */
router.get('/my', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, category, action, status, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
    
    if (category) query.category = category;
    if (action) query.action = action;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('relatedEntities.jobId', 'title')
      .populate('relatedEntities.questId', 'name')
      .populate('relatedEntities.shopId', 'shopName')
      .lean();

    const total = await ActivityLog.countDocuments(query);

    logger.activity('activity_logs_viewed', {
      userId: req.user._id,
      category: 'user',
      metadata: { filters: query, page, limit },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching user activity logs', {
      userId: req.user._id,
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message
    });
  }
});

/**
 * GET /api/v2/activity-logs/shop
 * Get shop-related activity logs (for shop owners)
 */
router.get('/shop', auth, checkRole(['shop', 'admin']), async (req, res) => {
  try {
    const { page = 1, limit = 50, action, status, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    const query = { category: 'shop' };
    
    // If user is shop owner (not admin), filter by their shops
    if (req.user.userType === 'shop') {
      // Get shop IDs owned by user (you may need to query Shop model)
      const Shop = require('../models/Shop');
      const userShops = await Shop.find({ 
        ownerEmail: req.user.email 
      }).select('_id');
      const shopIds = userShops.map(s => s._id);
      
      query['relatedEntities.shopId'] = { $in: shopIds };
    }

    if (action) query.action = action;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .populate('relatedEntities.shopId', 'shopName')
      .lean();

    const total = await ActivityLog.countDocuments(query);

    logger.activity('shop_activity_logs_viewed', {
      userId: req.user._id,
      category: 'shop',
      metadata: { filters: query },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching shop activity logs', {
      userId: req.user._id,
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shop activity logs',
      error: error.message
    });
  }
});

/**
 * GET /api/v2/activity-logs/partner
 * Get partner-related activity logs (for partners)
 */
router.get('/partner', auth, checkRole(['partner', 'admin']), async (req, res) => {
  try {
    const { page = 1, limit = 50, action, status, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    const query = { 
      $or: [
        { category: 'shop' }, // Partner manages shops
        { action: { $regex: 'partner', $options: 'i' } }
      ]
    };
    
    // If user is partner (not admin), filter by their activities
    if (req.user.userType === 'partner') {
      query.userId = req.user._id;
    }

    if (action) query.action = action;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .populate('relatedEntities.shopId', 'shopName')
      .lean();

    const total = await ActivityLog.countDocuments(query);

    logger.activity('partner_activity_logs_viewed', {
      userId: req.user._id,
      category: 'system',
      metadata: { filters: query },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching partner activity logs', {
      userId: req.user._id,
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch partner activity logs',
      error: error.message
    });
  }
});

/**
 * GET /api/v2/activity-logs/admin
 * Get all activity logs (admin only)
 */
router.get('/admin', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 100, 
      category, 
      action, 
      status, 
      userId,
      startDate, 
      endDate 
    } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    
    if (category) query.category = category;
    if (action) query.action = action;
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Fetch all logs without any user filtering - admin should see ALL users
    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'userId',
        select: 'name email userType photo',
        options: { lean: true }
      })
      .populate('relatedEntities.jobId', 'title')
      .populate('relatedEntities.questId', 'name')
      .populate('relatedEntities.shopId', 'shopName')
      .lean();

    const total = await ActivityLog.countDocuments(query);

    // Get statistics
    const stats = await ActivityLog.getStats({
      startDate,
      endDate
    });

    logger.activity('admin_activity_logs_viewed', {
      userId: req.user._id,
      category: 'admin',
      metadata: { filters: query },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: logs,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching admin activity logs', {
      userId: req.user._id,
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin activity logs',
      error: error.message
    });
  }
});

/**
 * GET /api/v2/activity-logs/stats
 * Get activity statistics (based on user role)
 */
router.get('/stats', auth, async (req, res) => {
  try {
    let stats = {};
    const { startDate, endDate } = req.query;

    const filters = { startDate, endDate };

    // User-specific stats
    if (req.user.userType === 'customer') {
      filters.userId = req.user._id;
      stats = await ActivityLog.getStats(filters);
    }
    // Shop owner stats
    else if (req.user.userType === 'shop') {
      const Shop = require('../models/Shop');
      const userShops = await Shop.find({ 
        ownerEmail: req.user.email 
      }).select('_id');
      const shopIds = userShops.map(s => s._id);
      
      stats = await ActivityLog.aggregate([
        {
          $match: {
            'relatedEntities.shopId': { $in: shopIds },
            ...(startDate || endDate ? {
              createdAt: {
                ...(startDate ? { $gte: new Date(startDate) } : {}),
                ...(endDate ? { $lte: new Date(endDate) } : {})
              }
            } : {})
          }
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            successCount: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
            failedCount: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
          }
        },
        { $sort: { count: -1 } }
      ]);
    }
    // Partner stats
    else if (req.user.userType === 'partner') {
      filters.userId = req.user._id;
      stats = await ActivityLog.getStats(filters);
    }
    // Admin stats (all activities)
    else if (req.user.userType === 'admin') {
      stats = await ActivityLog.getStats(filters);
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching activity stats', {
      userId: req.user._id,
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity statistics',
      error: error.message
    });
  }
});

module.exports = router;
