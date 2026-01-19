const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');

/**
 * @route   GET /api/v2/wallet/balance
 * @desc    Get wallet balance
 * @access  Private
 */
router.get('/balance', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId).select('cash');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    // Calculate pending withdraw amount
    const pendingWithdraw = await WalletTransaction.aggregate([
      {
        $match: {
          userId: user._id,
          type: 'withdraw',
          status: { $in: ['pending', 'approved'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const pendingAmount = pendingWithdraw.length > 0 ? pendingWithdraw[0].total : 0;
    const availableBalance = Math.max(0, user.cash - pendingAmount);

    res.json({
      success: true,
      data: {
        balance: user.cash || 0,
        currency: 'THB',
        pendingWithdraw: pendingAmount,
        availableBalance: availableBalance
      }
    });
  } catch (error) {
    console.error('❌ Get wallet balance error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงยอดเงิน',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v2/wallet/transactions
 * @desc    Get wallet transactions
 * @access  Private
 */
router.get('/transactions', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { page = 1, limit = 50, type, status } = req.query;

    const query = { userId };
    if (type) query.type = type;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const transactions = await WalletTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await WalletTransaction.countDocuments(query);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Get wallet transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงประวัติรายการ',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v2/wallet/deposit
 * @desc    Create deposit request
 * @access  Private
 */
router.post('/deposit', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { amount, method = 'bank_transfer', description = 'ฝากเงิน' } = req.body;

    // Validation
    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'จำนวนเงินฝากขั้นต่ำ 100 บาท'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    // Create pending transaction
    const transaction = await WalletTransaction.create({
      userId,
      type: 'deposit',
      amount,
      balanceBefore: user.cash || 0,
      balanceAfter: user.cash || 0, // Will update after approval
      status: 'pending',
      method,
      description
    });

    res.status(201).json({
      success: true,
      message: 'สร้างคำขอฝากเงินสำเร็จ รอการอนุมัติจากผู้ดูแลระบบ',
      data: {
        transactionId: transaction._id,
        amount,
        status: 'pending',
        method
      }
    });
  } catch (error) {
    console.error('❌ Create deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างคำขอฝากเงิน',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v2/wallet/withdraw
 * @desc    Create withdraw request
 * @access  Private
 */
router.post('/withdraw', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { amount, method = 'bank_transfer', bankAccount, description = 'ถอนเงิน' } = req.body;

    // Validation
    if (!amount || amount < 500) {
      return res.status(400).json({
        success: false,
        message: 'จำนวนเงินถอนขั้นต่ำ 500 บาท'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    // Check available balance
    const pendingWithdraw = await WalletTransaction.aggregate([
      {
        $match: {
          userId: user._id,
          type: 'withdraw',
          status: { $in: ['pending', 'approved'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const pendingAmount = pendingWithdraw.length > 0 ? pendingWithdraw[0].total : 0;
    const availableBalance = Math.max(0, (user.cash || 0) - pendingAmount);

    if (amount > availableBalance) {
      return res.status(400).json({
        success: false,
        message: `ยอดเงินไม่เพียงพอ (ยอดคงเหลือ: ${availableBalance} บาท)`
      });
    }

    // Validate bank account for bank transfer
    if (method === 'bank_transfer' && (!bankAccount || !bankAccount.accountNumber || !bankAccount.accountName || !bankAccount.bankName)) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุข้อมูลบัญชีธนาคารให้ครบถ้วน'
      });
    }

    // Create pending transaction
    const transaction = await WalletTransaction.create({
      userId,
      type: 'withdraw',
      amount,
      balanceBefore: user.cash || 0,
      balanceAfter: user.cash || 0, // Will update after approval
      status: 'pending',
      method,
      description,
      bankAccount: bankAccount || {}
    });

    res.status(201).json({
      success: true,
      message: 'สร้างคำขอถอนเงินสำเร็จ รอการอนุมัติจากผู้ดูแลระบบ',
      data: {
        transactionId: transaction._id,
        amount,
        status: 'pending',
        processingTime: '1-3 business days'
      }
    });
  } catch (error) {
    console.error('❌ Create withdraw error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างคำขอถอนเงิน',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v2/wallet/commission
 * @desc    Process commission (system only)
 * @access  Private (system/internal)
 */
router.post('/commission', auth, async (req, res) => {
  try {
    const { userId, amount, type, jobId, description } = req.body;

    // Validation
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ครบถ้วน'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    const balanceBefore = user.cash || 0;
    const balanceAfter = Math.max(0, balanceBefore - amount);

    // Update user cash
    user.cash = balanceAfter;
    await user.save();

    // Create transaction
    const transaction = await WalletTransaction.create({
      userId,
      type: 'commission',
      amount,
      balanceBefore,
      balanceAfter,
      status: 'completed',
      method: 'system',
      description: description || `ค่าคอมมิชชัน${type ? ` - ${type}` : ''}`,
      relatedEntity: {
        jobId: jobId || null
      }
    });

    res.json({
      success: true,
      message: 'หักค่าคอมมิชชันสำเร็จ',
      data: {
        transactionId: transaction._id,
        balanceAfter
      }
    });
  } catch (error) {
    console.error('❌ Process commission error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการหักค่าคอมมิชชัน',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v2/wallet/deposit/:transactionId/confirm
 * @desc    Confirm deposit (admin only)
 * @access  Private (admin)
 */
router.post('/deposit/:transactionId/confirm', adminAuth, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { referenceId, notes } = req.body;
    const adminId = req.user.id || req.user._id;

    const transaction = await WalletTransaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบรายการฝากเงิน'
      });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'รายการนี้ไม่สามารถยืนยันได้'
      });
    }

    const user = await User.findById(transaction.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    // Update user cash
    const balanceBefore = user.cash || 0;
    const balanceAfter = balanceBefore + transaction.amount;
    user.cash = balanceAfter;
    await user.save();

    // Update transaction
    transaction.status = 'completed';
    transaction.balanceAfter = balanceAfter;
    transaction.referenceId = referenceId || '';
    transaction.processedBy = adminId;
    transaction.processedAt = new Date();
    if (notes) transaction.metadata.notes = notes;
    await transaction.save();

    res.json({
      success: true,
      message: 'ยืนยันการฝากเงินสำเร็จ',
      data: {
        transactionId: transaction._id,
        balanceAfter
      }
    });
  } catch (error) {
    console.error('❌ Confirm deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการยืนยันการฝากเงิน',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v2/wallet/withdraw/:transactionId/approve
 * @desc    Approve withdraw (admin only)
 * @access  Private (admin)
 */
router.post('/withdraw/:transactionId/approve', adminAuth, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const adminId = req.user.id || req.user._id;

    const transaction = await WalletTransaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบรายการถอนเงิน'
      });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'รายการนี้ไม่สามารถอนุมัติได้'
      });
    }

    const user = await User.findById(transaction.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    // Check balance
    if ((user.cash || 0) < transaction.amount) {
      return res.status(400).json({
        success: false,
        message: 'ยอดเงินไม่เพียงพอ'
      });
    }

    // Update user cash
    const balanceBefore = user.cash || 0;
    const balanceAfter = balanceBefore - transaction.amount;
    user.cash = balanceAfter;
    await user.save();

    // Update transaction
    transaction.status = 'approved';
    transaction.balanceAfter = balanceAfter;
    transaction.processedBy = adminId;
    transaction.processedAt = new Date();
    await transaction.save();

    res.json({
      success: true,
      message: 'อนุมัติการถอนเงินสำเร็จ',
      data: {
        transactionId: transaction._id,
        balanceAfter
      }
    });
  } catch (error) {
    console.error('❌ Approve withdraw error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอนุมัติการถอนเงิน',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v2/wallet/withdraw/:transactionId/reject
 * @desc    Reject withdraw (admin only)
 * @access  Private (admin)
 */
router.post('/withdraw/:transactionId/reject', adminAuth, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id || req.user._id;

    const transaction = await WalletTransaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบรายการถอนเงิน'
      });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'รายการนี้ไม่สามารถปฏิเสธได้'
      });
    }

    // Update transaction
    transaction.status = 'rejected';
    transaction.processedBy = adminId;
    transaction.processedAt = new Date();
    transaction.rejectionReason = reason || '';
    await transaction.save();

    res.json({
      success: true,
      message: 'ปฏิเสธการถอนเงินสำเร็จ',
      data: {
        transactionId: transaction._id
      }
    });
  } catch (error) {
    console.error('❌ Reject withdraw error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการปฏิเสธการถอนเงิน',
      error: error.message
    });
  }
});

module.exports = router;
