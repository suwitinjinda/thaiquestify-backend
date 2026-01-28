const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Notification = require('../models/Notification');

/**
 * @route   GET /api/v2/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  let timeoutId = null;
  try {
    const userId = req.user.id || req.user._id;
    const { unread, limit = 50, type } = req.query;

    // Add timeout protection for database queries
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 8000); // 8 second timeout
    });

    const query = { userId };
    if (unread === 'true') {
      query.read = false;
    }
    if (type) {
      query.type = type;
    }

    // Sort by newest first (createdAt descending), then by unread status, then by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    // Race between query and timeout
    const notificationsPromise = Notification.find(query)
      .sort({ 
        createdAt: -1, // Newest first (primary sort)
        read: 1, // Unread first (secondary sort)
        priority: -1 // High priority first (tertiary sort)
      })
      .limit(parseInt(limit))
      .lean();
    
    const notifications = await Promise.race([notificationsPromise, timeoutPromise]);
    
    // Clear timeout if query completed
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    // Custom sort: newest first, then unread, then priority
    const sortedNotifications = notifications.sort((a, b) => {
      // Primary: Sort by date (newest first)
      const dateDiff = new Date(b.createdAt) - new Date(a.createdAt);
      if (dateDiff !== 0) return dateDiff;
      
      // Secondary: Unread first
      if (!a.read && b.read) return -1;
      if (a.read && !b.read) return 1;
      
      // Tertiary: High priority first
      const aPriority = priorityOrder[a.priority] || 2;
      const bPriority = priorityOrder[b.priority] || 2;
      return bPriority - aPriority;
    });

    // Get unread count (with timeout protection)
    const countPromise = Notification.countDocuments({
      userId,
      read: false
    });
    
    const countTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Count timeout')), 5000);
    });
    
    const unreadCount = await Promise.race([countPromise, countTimeoutPromise]).catch(() => {
      // If count times out, return 0 instead of failing
      console.warn('⚠️ Notification count query timed out, returning 0');
      return 0;
    });

    res.json({
      success: true,
      data: sortedNotifications,
      unreadCount
    });
  } catch (error) {
    // Clean up timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    console.error('❌ Get notifications error:', error);
    
    // Handle timeout specifically
    if (error.message === 'Request timeout' || error.message === 'Count timeout') {
      return res.status(504).json({
        success: false,
        message: 'Request timeout - database query took too long',
        error: 'TIMEOUT',
        data: [],
        unreadCount: 0
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงการแจ้งเตือน',
      error: error.message,
      data: [],
      unreadCount: 0
    });
  }
});

/**
 * @route   POST /api/v2/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.post('/:id/read', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการแจ้งเตือน'
      });
    }

    notification.read = true;
    await notification.save();

    res.json({
      success: true,
      message: 'ทำเครื่องหมายว่าอ่านแล้ว',
      data: notification
    });
  } catch (error) {
    console.error('❌ Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v2/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.post('/read-all', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: 'ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว',
      data: {
        updatedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('❌ Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/v2/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการแจ้งเตือน'
      });
    }

    res.json({
      success: true,
      message: 'ลบการแจ้งเตือนสำเร็จ'
    });
  } catch (error) {
    console.error('❌ Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบการแจ้งเตือน',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v2/notifications
 * @desc    Create notification (internal/system use)
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const { userId, type, title, message, priority = 'medium', relatedEntity, scheduledFor } = req.body;

    // Validation
    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ครบถ้วน'
      });
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      priority,
      relatedEntity: relatedEntity || {},
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null
    });

    res.status(201).json({
      success: true,
      message: 'สร้างการแจ้งเตือนสำเร็จ',
      data: notification
    });
  } catch (error) {
    console.error('❌ Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างการแจ้งเตือน',
      error: error.message
    });
  }
});

module.exports = router;
