// backend/routes/points.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const PointTransaction = require('../models/PointTransaction');
const CashReward = require('../models/CashReward');
const { auth } = require('../middleware/auth');
const paymentService = require('../services/paymentService');

/**
 * POST /api/points/buy/initiate
 * Initiate point purchase with payment gateway (iBanking, etc.)
 * This endpoint creates a payment charge and returns redirect URL
 */
router.post('/buy/initiate', auth, async (req, res) => {
  try {
    const { amount, points, paymentMethod, bank } = req.body;

    if (!amount || amount <= 0 || !points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount and points must be positive numbers'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create pending transaction record
    const pendingTransaction = await PointTransaction.create({
      userId: user._id,
      type: 'buy',
      amount: points,
      description: `ซื้อ Point ${points.toLocaleString()} ด้วยเงิน ${amount.toLocaleString()} บาท (รอการชำระเงิน)`,
      status: 'pending',
      relatedModel: 'PointPurchase',
      metadata: {
        amountPaid: amount,
        purchaseAmount: amount, // For notification
        pointsReceived: points,
        paymentMethod: paymentMethod || 'internet_banking',
        bank: bank
      }
    });

    try {
      // Create payment charge
      // Use web redirect page that will redirect to deep link (better browser handling)
      // This allows the browser to close properly after redirecting to app
      // Get base URL from request headers (more reliable than env vars)
      const protocol = req.protocol || (req.headers['x-forwarded-proto'] || 'https');
      const host = req.get('host') || req.headers.host || 'thaiquestify.com';
      const baseUrl = `${protocol}://${host}`;
      const returnUri = `${baseUrl}/api/points/payment/callback?transactionId=${pendingTransaction._id}`;
      console.log('🔗 Return URI for payment:', returnUri);
      let charge;

      if ((paymentMethod === 'internet_banking' || paymentMethod === 'mobile_banking') && bank) {
        // Use mobile banking for all banks (more widely supported than internet banking)
        // Internet banking is deprecated/not available in many cases
        charge = await paymentService.createMobileBankingCharge(amount, bank, returnUri);
      } else if (paymentMethod && bank) {
        // For other methods (credit card, etc.)
        charge = await paymentService.createCharge(amount, paymentMethod, returnUri);
      } else {
        throw new Error('Payment method and bank are required');
      }

      // Store charge ID in transaction (ensure metadata exists)
      if (!pendingTransaction.metadata) {
        pendingTransaction.metadata = {};
      }
      pendingTransaction.metadata.chargeId = charge.id;
      await pendingTransaction.save();

      console.log(`✅ Payment initiated: transaction=${pendingTransaction._id}, charge=${charge.id}, authorizeUri=${charge.authorize_uri || 'N/A'}`);

      return res.json({
        success: true,
        data: {
          transactionId: pendingTransaction._id,
          chargeId: charge.id,
          authorizeUri: charge.authorize_uri, // For internet banking redirect
          status: charge.status,
          amount: amount,
          points: points
        },
        message: 'Payment initiated'
      });
    } catch (paymentError) {
      // If payment gateway is not configured, return error
      pendingTransaction.status = 'failed';
      await pendingTransaction.save();

      // Provide more specific error messages
      let errorMessage = 'Payment gateway not available. Please contact support or use manual payment.';
      if (paymentError.message && paymentError.message.includes('not supported')) {
        errorMessage = paymentError.message;
      } else if (paymentError.message && paymentError.message.includes('no longer available')) {
        errorMessage = 'Payment method not available. Please try a different bank or payment method.';
      }

      return res.status(503).json({
        success: false,
        message: errorMessage,
        error: paymentError.message
      });
    }
  } catch (error) {
    console.error('Error initiating payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate payment',
      error: error.message
    });
  }
});

/**
 * GET /api/points/buy/verify/:transactionId
 * Verify payment status after user returns from bank
 */
router.get('/buy/verify/:transactionId', auth, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await PointTransaction.findById(transactionId);

    if (!transaction || transaction.userId.toString() !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (!transaction.metadata?.chargeId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction does not have payment charge ID'
      });
    }

    try {
      // Check payment status with payment gateway
      const charge = await paymentService.getChargeStatus(transaction.metadata.chargeId);

      if (charge.status === 'successful') {
        // Payment successful - add points
        const user = await User.findById(req.user.id);
        user.points = (user.points || 0) + transaction.amount;
        await user.save();

        // Update transaction
        transaction.status = 'completed';
        transaction.description = transaction.description.replace('(รอการชำระเงิน)', '(ชำระเงินสำเร็จ)');
        await transaction.save();

          // Send notification to all admins about point purchase
          try {
            const { createPointPurchaseNotification } = require('../utils/notificationHelper');
            // Get actual amount paid from metadata (should be stored when creating transaction)
            const purchaseAmount = transaction.metadata?.purchaseAmount || transaction.metadata?.amountPaid;
            if (!purchaseAmount) {
              console.warn(`⚠️ No purchase amount found in transaction ${transaction._id} metadata`);
            }
            await createPointPurchaseNotification(
              user._id.toString(),
              user.name,
              user.email,
              purchaseAmount || 0, // Use actual amount, don't estimate
              transaction.amount, // This is points
              transaction._id.toString()
            );
          } catch (notifError) {
            console.error('⚠️ Failed to send point purchase notification to admins:', notifError);
            // Don't fail the transaction if notification fails
          }

        return res.json({
          success: true,
          data: {
            transactionId: transaction._id,
            pointsAdded: transaction.amount,
            newBalance: user.points,
            status: 'completed'
          },
          message: 'Payment successful'
        });
      } else if (charge.status === 'failed') {
        transaction.status = 'failed';
        await transaction.save();

        return res.json({
          success: false,
          message: 'Payment failed',
          status: 'failed'
        });
      } else {
        return res.json({
          success: false,
          message: 'Payment pending',
          status: 'pending'
        });
      }
    } catch (paymentError) {
      return res.status(503).json({
        success: false,
        message: 'Unable to verify payment status',
        error: paymentError.message
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

/**
 * POST /api/points/buy
 * Buy points with money (Simple version - for testing or manual processing)
 * NOTE: This endpoint directly adds points without payment verification.
 * Use /buy/initiate for production with payment gateway.
 */
router.post('/buy', auth, async (req, res) => {
  try {
    const { amount, points } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    if (!points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Points must be a positive number'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add points to user
    user.points = (user.points || 0) + points;
    await user.save();

    // Create point transaction record
    const transaction = await PointTransaction.create({
      userId: user._id,
      type: 'buy',
      amount: points,
      description: `ซื้อ Point ${points.toLocaleString()} ด้วยเงิน ${amount.toLocaleString()} บาท`,
      status: 'completed',
      relatedModel: 'PointPurchase',
      metadata: {
        amountPaid: amount,
        pointsReceived: points,
        purchaseAmount: amount
      }
    });

    // Send notification to all admins about point purchase
    try {
      const { createPointPurchaseNotification } = require('../utils/notificationHelper');
      await createPointPurchaseNotification(
        user._id.toString(),
        user.name,
        user.email,
        amount,
        points,
        transaction._id.toString()
      );
    } catch (notifError) {
      console.error('⚠️ Failed to send point purchase notification to admins:', notifError);
      // Don't fail the transaction if notification fails
    }

    return res.json({
      success: true,
      data: {
        transactionId: transaction._id,
        pointsAdded: points,
        newBalance: user.points,
        amountPaid: amount
      },
      message: 'Points purchased successfully'
    });
  } catch (error) {
    console.error('Error buying points:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to buy points',
      error: error.message
    });
  }
});

/**
 * POST /api/points/withdraw
 * Withdraw points to bank account
 */
router.post('/withdraw', auth, async (req, res) => {
  try {
    const { points, amount } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Points must be a positive number'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has enough points
    if ((user.points || 0) < points) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient points'
      });
    }

    // Check if bank account exists
    if (!user.bankAccount || !user.bankAccount.accountName || !user.bankAccount.accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Bank account information is required'
      });
    }

    // Check if bank account is verified
    if (user.bankAccount.verified !== true) {
      return res.status(400).json({
        success: false,
        message: 'Bank account must be verified before withdrawal'
      });
    }

    // Minimum withdrawal: 100 THB
    const minWithdraw = 100;
    if (amount < minWithdraw) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal amount is ${minWithdraw} THB`
      });
    }

    // Check for pending withdrawals that would reduce available points
    const pendingWithdrawals = await CashReward.find({
      user: user._id,
      status: 'pending'
    });
    const pendingPoints = pendingWithdrawals.reduce((sum, w) => sum + (w.pointsUsed || 0), 0);
    const availablePoints = (user.points || 0) - pendingPoints;
    
    if (availablePoints < points) {
      return res.status(400).json({
        success: false,
        message: `คะแนนไม่พอ (มีคะแนนที่ใช้ได้: ${availablePoints.toLocaleString()}, มีคำขอรอดำเนินการ: ${pendingPoints.toLocaleString()})`
      });
    }

    // NOTE: Points will be deducted when admin approves the withdrawal
    // Do NOT deduct points here - wait for approval

    // Create withdrawal request using CashReward model
    const withdrawalId = `withdraw_${user._id}_${Date.now()}`;
    const rewardName = `ถอน Point ${points.toLocaleString()} เป็นเงินสด ${amount.toLocaleString()} บาท`;
    
    // Validate required fields before creating
    if (!withdrawalId || !rewardName) {
      console.error('Missing required fields for withdrawal:', { withdrawalId, rewardName });
      return res.status(500).json({
        success: false,
        message: 'Failed to create withdrawal: missing required fields'
      });
    }
    
    const withdrawalData = {
      user: user._id,
      rewardId: withdrawalId,
      rewardName: rewardName,
      amount: amount,
      pointsUsed: points,
      status: 'pending',
      requestedAt: new Date(),
      bankAccount: {
        accountName: user.bankAccount.accountName,
        accountNumber: user.bankAccount.accountNumber,
        bankName: user.bankAccount.bankName,
        bankBranch: user.bankAccount.bankBranch
      }
    };
    
    console.log('Creating withdrawal with data:', {
      rewardId: withdrawalData.rewardId,
      rewardName: withdrawalData.rewardName,
      amount: withdrawalData.amount,
      pointsUsed: withdrawalData.pointsUsed
    });
    
    const withdrawal = await CashReward.create(withdrawalData);

    // Create point transaction record (points not deducted yet - will be deducted on approval)
    await PointTransaction.create({
      userId: user._id,
      type: 'withdraw',
      amount: 0, // Will be updated to -points when approved
      description: `คำขอถอน Point ${points.toLocaleString()} (${amount.toLocaleString()} บาท) - รอการอนุมัติ`,
      status: 'pending',
      relatedModel: 'CashReward',
      relatedId: withdrawal._id,
      metadata: {
        amountToReceive: amount,
        pointsWithdrawn: points,
        pendingApproval: true
      }
    });

    // Send notification to all admins about withdrawal request
    try {
      const { createWithdrawalRequestNotification } = require('../utils/notificationHelper');
      await createWithdrawalRequestNotification(
        user._id.toString(),
        user.name,
        user.email,
        amount,
        points,
        withdrawal._id.toString()
      );
    } catch (notifError) {
      console.error('⚠️ Failed to send withdrawal request notification to admins:', notifError);
      // Don't fail the withdrawal request if notification fails
    }

    return res.json({
      success: true,
      data: {
        withdrawalId: withdrawal._id,
        pointsRequested: points, // Changed from pointsDeducted
        amountToReceive: amount,
        status: 'pending',
        bankAccount: {
          bankName: user.bankAccount.bankName,
          accountNumber: user.bankAccount.accountNumber
        }
      },
      message: 'Withdrawal request submitted successfully'
    });
  } catch (error) {
    console.error('Error withdrawing points:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to withdraw points',
      error: error.message
    });
  }
});

/**
 * GET /api/points/withdrawals
 * Get user's withdrawal history
 */
router.get('/withdrawals', auth, async (req, res) => {
  try {
    const withdrawals = await CashReward.find({ user: req.user.id })
      .sort({ requestedAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: withdrawals
    });
  } catch (error) {
    console.error('Error fetching withdrawal history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal history',
      error: error.message
    });
  }
});

/**
 * GET /api/points/history
 * Get user's point transaction history (buy and withdraw)
 */
router.get('/history', auth, async (req, res) => {
  try {
    const { type, limit = 50, page = 1 } = req.query;
    const userId = req.user.id;
    
    // Build query
    const query = { userId };
    
    // Filter by type if provided (buy, withdraw, or both)
    if (type && type !== 'all') {
      query.type = type;
    } else {
      // Default: show both buy and withdraw
      query.type = { $in: ['buy', 'withdraw'] };
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get transactions
    const transactions = await PointTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();
    
    // Get total count for pagination
    const total = await PointTransaction.countDocuments(query);
    
    // Format transactions for response
    const formattedTransactions = transactions.map(tx => ({
      id: tx._id,
      type: tx.type,
      amount: tx.amount,
      points: tx.type === 'buy' ? Math.abs(tx.amount) : Math.abs(tx.amount), // Always positive for display
      description: tx.description,
      status: tx.status,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
      metadata: tx.metadata || {},
      // Additional info based on type
      ...(tx.type === 'buy' && {
        paymentAmount: tx.metadata?.amount || null,
        chargeId: tx.metadata?.chargeId || null,
        bank: tx.metadata?.bank || null
      }),
      ...(tx.type === 'withdraw' && {
        amountToReceive: tx.metadata?.amountToReceive || null,
        pointsWithdrawn: tx.metadata?.pointsWithdrawn || null,
        bankAccount: tx.metadata?.bankAccount || null
      })
    }));
    
    return res.json({
      success: true,
      data: formattedTransactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching point transaction history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history',
      error: error.message
    });
  }
});

/**
 * GET /api/points/payment/callback
 * Web redirect page that receives redirect from Omise and redirects to app deep link
 * This page closes the browser properly after redirecting to the app
 */
router.get('/payment/callback', (req, res) => {
  const { transactionId } = req.query;
  
  if (!transactionId) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
          .error { color: #d32f2f; }
        </style>
      </head>
      <body>
        <h1 class="error">เกิดข้อผิดพลาด</h1>
        <p>ไม่พบข้อมูลการทำรายการ</p>
        <button onclick="window.close()">ปิดหน้าต่าง</button>
      </body>
      </html>
    `);
  }
  
  // Deep link to open the app
  const deepLink = `thaiquestify://payment/callback?transactionId=${transactionId}`;
  
  // HTML page that automatically redirects to deep link
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>กำลังเปิดแอป...</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
        }
        .container {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          max-width: 400px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        h1 {
          margin: 0 0 20px 0;
          font-size: 24px;
        }
        p {
          margin: 10px 0;
          opacity: 0.9;
        }
        .spinner {
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        button {
          margin-top: 20px;
          padding: 12px 24px;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: transform 0.2s;
        }
        button:hover {
          transform: scale(1.05);
        }
        button:active {
          transform: scale(0.95);
        }
        .hidden {
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>✅ ชำระเงินสำเร็จ</h1>
        <div class="spinner"></div>
        <p>กำลังเปิดแอป...</p>
        <p style="font-size: 14px; opacity: 0.8;">กรุณารอสักครู่</p>
        <button id="openAppBtn" class="hidden" onclick="openApp()">เปิดแอป</button>
        <button id="closeBtn" class="hidden" onclick="closeWindow()" style="margin-top: 10px; background: rgba(255, 255, 255, 0.2); color: white;">ปิดหน้าต่าง</button>
      </div>
      
      <script>
        const deepLink = '${deepLink}';
        let redirectAttempted = false;
        
        function openApp() {
          if (redirectAttempted) return;
          redirectAttempted = true;
          
          // Try to open deep link
          window.location.href = deepLink;
          
          // Hide spinner and show buttons after a moment
          setTimeout(() => {
            document.querySelector('.spinner').style.display = 'none';
            document.getElementById('openAppBtn').classList.remove('hidden');
            document.getElementById('closeBtn').classList.remove('hidden');
            document.querySelector('p').textContent = 'หากแอปไม่เปิดอัตโนมัติ กรุณากดปุ่ม "เปิดแอป"';
          }, 2000);
        }
        
        function closeWindow() {
          // Try to close window (works on mobile when opened from app)
          if (window.history.length > 1) {
            window.history.back();
          } else {
            window.close();
          }
        }
        
        // Auto-redirect immediately
        openApp();
        
        // Also try after a short delay (in case first attempt fails)
        setTimeout(() => {
          if (!redirectAttempted) {
            openApp();
          }
        }, 500);
        
        // Show manual button after 3 seconds if still on page
        setTimeout(() => {
          document.querySelector('.spinner').style.display = 'none';
          document.getElementById('openAppBtn').classList.remove('hidden');
          document.getElementById('closeBtn').classList.remove('hidden');
        }, 3000);
      </script>
    </body>
    </html>
  `;
  
  res.set('Content-Type', 'text/html; charset=UTF-8');
  res.send(html);
});

module.exports = router;
