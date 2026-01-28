// routes/webhooks.js
// Webhook handlers for payment gateway callbacks

const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const PointTransaction = require('../models/PointTransaction');
const User = require('../models/User');
const CashReward = require('../models/CashReward');

/**
 * POST /api/webhooks/omise
 * Handle Omise webhook events for payment confirmation
 * 
 * This endpoint receives webhook notifications from Omise when:
 * - Payment is completed
 * - Payment fails
 * - Payment is pending
 * 
 * SECURITY NOTES:
 * 1. Signature verification: Omise doesn't currently send webhook signatures,
 *    but we verify them if provided for future compatibility.
 * 2. API verification: We verify webhook events by making API calls to Omise
 *    to confirm event authenticity (recommended by Omise).
 * 3. For production: Consider using express.raw() middleware specifically for
 *    webhook routes to get raw body bytes for proper signature verification.
 */
router.post('/omise', async (req, res) => {
  try {
    const signature = req.headers['x-omise-signature'] || req.headers['X-Omise-Signature'];
    
    // Body is already parsed by express.json() middleware
    const event = req.body;
    
    if (!event || typeof event !== 'object') {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // Verify webhook signature if provided (for security)
    // Note: Omise doesn't currently send signatures, but we verify for future compatibility
    if (signature) {
      // For signature verification, we need raw body, but Express has already parsed it
      // In production, consider using express.raw() middleware for webhook routes
      // For now, we'll stringify the body (not ideal but better than nothing)
      const rawBody = JSON.stringify(event);
      const isValid = paymentService.verifyWebhookSignature(signature, rawBody);
      
      if (isValid === false) {
        console.error('❌ Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
      
      if (isValid === true) {
        console.log('✅ Webhook signature verified');
      }
    }

    // Verify webhook event via API call (Omise recommended approach)
    // This ensures the event is authentic by making an independent API call
    const isEventValid = await paymentService.verifyWebhookEvent(event);
    if (!isEventValid) {
      console.error('❌ Webhook event verification failed');
      return res.status(400).json({ error: 'Invalid webhook event' });
    }

    console.log('📥 Omise webhook received:', event.key);
    // Only log full event data for debugging (comment out in production)
    // console.log('📥 Event data:', JSON.stringify(event.data, null, 2));

    // Handle charge creation and completion
    if (event.key === 'charge.create' || event.key === 'charge.complete') {
      const charge = event.data;

      console.log(`🔍 Processing charge: ${charge.id}, status: ${charge.status}`);

      // Find transaction by charge ID
      // Try multiple queries to handle race conditions and different storage formats
      let transaction = await PointTransaction.findOne({
        'metadata.chargeId': charge.id,
        status: 'pending'
      });

      // If not found, try searching all pending transactions (in case chargeId format differs)
      if (!transaction) {
        const allPending = await PointTransaction.find({ status: 'pending' }).limit(10);
        console.log(`🔍 Searching ${allPending.length} pending transactions for charge ${charge.id}`);
        console.log(`📋 Pending transaction IDs:`, allPending.map(t => ({ id: t._id.toString(), chargeId: t.metadata?.chargeId })));
        for (const txn of allPending) {
          if (txn.metadata?.chargeId === charge.id) {
            transaction = txn;
            break;
          }
        }
      }

      // Fallback: Extract transaction ID from return_uri
      if (!transaction && charge.return_uri) {
        const returnUriMatch = charge.return_uri.match(/transactionId=([a-f0-9]{24})/i);
        if (returnUriMatch) {
          const transactionId = returnUriMatch[1];
          console.log(`🔍 Trying to find transaction by ID from return_uri: ${transactionId}`);
          transaction = await PointTransaction.findById(transactionId);
          if (transaction) {
            console.log(`✅ Found transaction by ID: ${transaction._id}`);
            // Update transaction with charge ID if missing
            if (!transaction.metadata) {
              transaction.metadata = {};
            }
            if (!transaction.metadata.chargeId) {
              transaction.metadata.chargeId = charge.id;
              await transaction.save();
            }
          }
        }
      }

      // Also try searching by completed status (in case it was already processed)
      if (!transaction) {
        transaction = await PointTransaction.findOne({
          'metadata.chargeId': charge.id
        });
        if (transaction) {
          console.log(`ℹ️ Found transaction but status is: ${transaction.status} (not pending)`);
        }
      }

      if (!transaction) {
        console.warn(`⚠️ Webhook: Transaction not found for charge ${charge.id}`);
        console.log(`📋 Charge details: status=${charge.status}, amount=${charge.amount}, created=${charge.created_at}, return_uri=${charge.return_uri}`);
        // Don't return early - just log and continue (charge might complete later)
        return res.json({ received: true, note: 'Transaction not found - will retry when charge completes' });
      }

      console.log(`✅ Found transaction: ${transaction._id} for charge ${charge.id}`);

      // Only process if charge is successful
      if (charge.status === 'successful') {
        // Check if already processed
        if (transaction.status === 'completed') {
          console.log(`ℹ️ Transaction ${transaction._id} already completed - skipping`);
          return res.json({ received: true, note: 'Transaction already processed' });
        }

        // Payment successful - add points
        const user = await User.findById(transaction.userId);
        if (user) {
          const oldPoints = user.points || 0;
          user.points = oldPoints + transaction.amount;
          await user.save();

          transaction.status = 'completed';
          transaction.description = transaction.description.replace('(รอการชำระเงิน)', '(ชำระเงินสำเร็จ)');
          await transaction.save();

          console.log(`✅ Payment webhook: Added ${transaction.amount} points to user ${user._id} (${oldPoints} → ${user.points})`);

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
        } else {
          console.error(`❌ User not found: ${transaction.userId}`);
        }
      } else if (charge.status === 'failed') {
        transaction.status = 'failed';
        await transaction.save();
        console.log(`❌ Payment webhook: Payment failed for transaction ${transaction._id}`);
      } else {
        console.log(`⏳ Charge ${charge.id} status: ${charge.status} - waiting for completion`);
      }
    } 
    // Handle transfer events (for payouts/withdrawals)
    else if (event.key === 'transfer.create' || event.key === 'transfer.paid' || event.key === 'transfer.sent') {
      const transfer = event.data;
      
      console.log(`🔍 Processing transfer: ${transfer.id}, paid: ${transfer.paid}, sent: ${transfer.sent}, status: ${transfer.status || 'N/A'}`);

      // Find cash reward by Omise transfer ID
      const cashReward = await CashReward.findOne({
        'metadata.omiseTransferId': transfer.id
      });

      if (!cashReward) {
        console.warn(`⚠️ Webhook: Cash reward not found for transfer ${transfer.id}`);
        return res.json({ received: true, note: 'Cash reward not found for this transfer' });
      }

      console.log(`✅ Found cash reward: ${cashReward._id} for transfer ${transfer.id}`);

      // Update transfer status in metadata
      if (!cashReward.metadata) {
        cashReward.metadata = {};
      }
      // Omise transfers use 'paid' and 'sent' boolean fields, not always 'status'
      const transferStatus = transfer.status || (transfer.paid ? 'paid' : transfer.sent ? 'sent' : 'pending');
      cashReward.metadata.transferStatus = transferStatus;
      cashReward.metadata.lastTransferUpdate = new Date();

      // If transfer is paid or sent, deduct points and mark as paid
      const isPaid = transfer.paid === true || transfer.status === 'paid';
      const isSent = transfer.sent === true || transfer.status === 'sent';
      
      if (isPaid || isSent) {
        // Check if points already deducted
        const pointTransaction = await PointTransaction.findOne({
          relatedModel: 'CashReward',
          relatedId: cashReward._id
        });

        if (pointTransaction && pointTransaction.status === 'pending' && pointTransaction.metadata?.waitingForTransfer) {
          // Deduct points now
          const user = await User.findById(cashReward.user);
          if (user) {
            const oldPoints = user.points || 0;
            user.points = oldPoints - cashReward.pointsUsed;
            await user.save();

            // Update PointTransaction
            pointTransaction.amount = -cashReward.pointsUsed;
            pointTransaction.status = 'completed';
            pointTransaction.description = `ถอน Point ${cashReward.pointsUsed.toLocaleString()} (${cashReward.amount.toLocaleString()} บาท) - โอนเงินผ่าน Omise แล้ว`;
            pointTransaction.metadata.waitingForTransfer = false;
            await pointTransaction.save();

            console.log(`✅ Transfer webhook: Deducted ${cashReward.pointsUsed} points from user ${user._id} (${oldPoints} → ${user.points})`);
          }

          // Mark cash reward as paid
          if (cashReward.status === 'approved') {
            cashReward.status = 'paid';
            cashReward.paidAt = new Date();
            await cashReward.save();

            // Send notification to user
            try {
              const { createWithdrawalPaidNotification } = require('../utils/notificationHelper');
              const user = await User.findById(cashReward.user);
              if (user) {
                await createWithdrawalPaidNotification(
                  user._id.toString(),
                  cashReward.amount,
                  cashReward.pointsUsed,
                  cashReward._id.toString(),
                  'omise'
                );
                console.log(`✅ Sent withdrawal paid notification to user ${user._id}`);
              }
            } catch (notifError) {
              console.error('⚠️ Failed to send withdrawal paid notification:', notifError);
            }

            console.log(`✅ Transfer webhook: Marked cash reward ${cashReward._id} as paid`);
          }
        } else {
          console.log(`ℹ️ Points already deducted or transaction not found for cash reward ${cashReward._id}`);
        }
      } else {
        console.log(`⏳ Transfer ${transfer.id} status: ${transferStatus} - waiting for completion`);
      }
    } else {
      console.log(`ℹ️ Webhook event ${event.key} - no action needed`);
    }

    // Always return 200 to acknowledge receipt
    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    // Still return 200 to prevent webhook retries
    res.status(200).json({ 
      received: true, 
      error: error.message || 'Unknown error',
      note: 'Webhook received but processing failed'
    });
  }
});

/**
 * POST /api/webhooks/test
 * Test webhook endpoint (for development)
 */
router.post('/test', async (req, res) => {
  try {
    console.log('Test webhook received:', req.body);
    res.json({ received: true, message: 'Test webhook working' });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
