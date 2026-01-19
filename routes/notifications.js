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
  try {
    const userId = req.user.id || req.user._id;
    const { unread, limit = 50, type } = req.query;

    const query = { userId };
    if (unread === 'true') {
      query.read = false;
    }
    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      userId,
      read: false
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error) {
    console.error('❌ Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงการแจ้งเตือน',
      error: error.message
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
