# Payment Gateway Integration Guide for Thailand

## Overview
This document outlines options for automating point purchases and withdrawals using iBanking/payment gateways in Thailand.

## Payment Options for Thailand

### 1. **Omise** (Recommended for Thailand)
- **Best for**: Credit/Debit cards, Internet Banking, PromptPay
- **Website**: https://www.omise.co
- **Features**:
  - Supports all major Thai banks (SCB, KBank, BBL, etc.)
  - Internet Banking integration
  - PromptPay QR code support
  - Credit/Debit card support
  - Webhook support for payment confirmation
- **Fees**: ~2.9% + 10 THB per transaction
- **Documentation**: https://docs.omise.co

### 2. **2C2P**
- **Best for**: Internet Banking, Credit Cards
- **Website**: https://www.2c2p.com
- **Features**:
  - All major Thai banks
  - Internet Banking redirect
  - Credit/Debit cards
- **Fees**: Contact for pricing
- **Documentation**: https://developer.2c2p.com

### 3. **PromptPay API** (Bank-specific)
- **Best for**: Direct bank integration
- **Note**: Requires direct partnership with banks (SCB, KBank, etc.)
- **Complexity**: High - requires bank approval and integration

### 4. **TrueMoney Wallet**
- **Best for**: Mobile wallet payments
- **Website**: https://truemoney.com
- **Features**: Mobile wallet, QR code payments

### 5. **Rabbit LINE Pay**
- **Best for**: LINE users
- **Features**: Integrated with LINE app

## Recommended Approach: Omise Integration

### Why Omise?
1. **Easiest Integration**: Well-documented Node.js SDK
2. **Comprehensive**: Supports all payment methods
3. **Webhook Support**: Automatic payment confirmation
4. **Thai-focused**: Built for Thai market

### Implementation Steps

#### Step 1: Install Omise SDK
```bash
npm install omise
```

#### Step 2: Environment Variables
Add to `.env`:
```env
OMISE_PUBLIC_KEY=pkey_test_xxxxx
OMISE_SECRET_KEY=skey_test_xxxxx
OMISE_API_VERSION=2019-05-29
```

#### Step 3: Create Payment Service
Create `/services/paymentService.js`:

```javascript
const omise = require('omise')({
  publicKey: process.env.OMISE_PUBLIC_KEY,
  secretKey: process.env.OMISE_SECRET_KEY,
  omiseVersion: process.env.OMISE_API_VERSION
});

/**
 * Create a charge for buying points
 * @param {number} amount - Amount in THB
 * @param {string} source - Payment source (token, internet_banking, etc.)
 * @param {string} returnUri - Return URL after payment
 * @returns {Promise} Omise charge object
 */
async function createCharge(amount, source, returnUri) {
  try {
    const charge = await omise.charges.create({
      amount: Math.round(amount * 100), // Convert to satang
      currency: 'thb',
      source: source,
      return_uri: returnUri,
      description: `Buy Points - ${amount} THB`
    });
    return charge;
  } catch (error) {
    console.error('Omise charge error:', error);
    throw error;
  }
}

/**
 * Get charge status
 * @param {string} chargeId - Omise charge ID
 * @returns {Promise} Charge object with status
 */
async function getChargeStatus(chargeId) {
  try {
    const charge = await omise.charges.retrieve(chargeId);
    return charge;
  } catch (error) {
    console.error('Omise retrieve error:', error);
    throw error;
  }
}

/**
 * Create internet banking charge
 * @param {number} amount - Amount in THB
 * @param {string} bank - Bank code (scb, kbank, bbl, etc.)
 * @param {string} returnUri - Return URL
 * @returns {Promise} Charge object with authorize_uri
 */
async function createInternetBankingCharge(amount, bank, returnUri) {
  try {
    const charge = await omise.charges.create({
      amount: Math.round(amount * 100),
      currency: 'thb',
      source: {
        type: 'internet_banking_' + bank, // e.g., 'internet_banking_scb'
        amount: Math.round(amount * 100)
      },
      return_uri: returnUri,
      description: `Buy Points - ${amount} THB`
    });
    return charge;
  } catch (error) {
    console.error('Omise internet banking error:', error);
    throw error;
  }
}

module.exports = {
  createCharge,
  getChargeStatus,
  createInternetBankingCharge
};
```

#### Step 4: Update Points Route for Payment
Update `/routes/points.js`:

```javascript
const paymentService = require('../services/paymentService');

/**
 * POST /api/points/buy/initiate
 * Initiate point purchase with payment gateway
 */
router.post('/buy/initiate', auth, async (req, res) => {
  try {
    const { amount, points, paymentMethod, bank } = req.body;

    // Validate
    if (!amount || amount <= 0 || !points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount and points must be positive numbers'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Create pending transaction record
    const pendingTransaction = await PointTransaction.create({
      userId: user._id,
      type: 'buy',
      amount: points,
      description: `ซื้อ Point ${points.toLocaleString()} ด้วยเงิน ${amount.toLocaleString()} บาท (รอการชำระเงิน)`,
      status: 'pending',
      metadata: {
        amountPaid: amount,
        pointsReceived: points,
        paymentMethod: paymentMethod,
        bank: bank
      }
    });

    // Create payment charge
    let charge;
    const returnUri = `${process.env.FRONTEND_URL}/payment/callback?transactionId=${pendingTransaction._id}`;

    if (paymentMethod === 'internet_banking') {
      charge = await paymentService.createInternetBankingCharge(amount, bank, returnUri);
    } else {
      // For other methods (credit card, etc.)
      charge = await paymentService.createCharge(amount, paymentMethod, returnUri);
    }

    // Store charge ID in transaction
    pendingTransaction.metadata.chargeId = charge.id;
    await pendingTransaction.save();

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

    // Check payment status with Omise
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
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});
```

#### Step 5: Webhook Handler (Recommended)
Create `/routes/webhooks.js`:

```javascript
const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const PointTransaction = require('../models/PointTransaction');
const User = require('../models/User');

/**
 * POST /api/webhooks/omise
 * Handle Omise webhook events
 */
router.post('/omise', async (req, res) => {
  try {
    const event = req.body;

    // Verify webhook signature (important for security)
    // const signature = req.headers['x-omise-signature'];
    // Verify signature here...

    if (event.key === 'charge.complete') {
      const charge = event.data;

      // Find transaction by charge ID
      const transaction = await PointTransaction.findOne({
        'metadata.chargeId': charge.id
      });

      if (transaction && charge.status === 'successful') {
        // Add points to user
        const user = await User.findById(transaction.userId);
        if (user) {
          user.points = (user.points || 0) + transaction.amount;
          await user.save();

          transaction.status = 'completed';
          transaction.description = transaction.description.replace('(รอการชำระเงิน)', '(ชำระเงินสำเร็จ)');
          await transaction.save();

          console.log(`✅ Payment webhook: Added ${transaction.amount} points to user ${user._id}`);
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

Mount in `server.js`:
```javascript
const webhookRoutes = require('./routes/webhooks');
app.use('/api/webhooks', webhookRoutes);
```

## Withdrawal Automation

### Challenge
Most Thai banks **do not offer automated withdrawal APIs** for security reasons. Options:

### Option 1: Manual Processing (Current)
- Admin approves withdrawals manually
- Admin transfers money via iBanking
- Admin marks withdrawal as completed

### Option 2: PromptPay API (If Available)
- Some banks offer PromptPay API for business accounts
- Requires bank partnership
- Can automate transfers up to certain limits

### Option 3: Payment Gateway Payout (Omise)
- Omise offers payout API
- Can transfer to bank accounts
- Requires additional verification
- Fees apply

### Option 4: Third-party Service
- Services like **PromptPay Business API** (if available)
- **SCB Business API** (requires business account)

### Recommended: Hybrid Approach
1. **Small amounts (< 5,000 THB)**: Automated via Omise Payout API
2. **Large amounts**: Manual processing
3. **Daily limit**: Auto-process withdrawals once per day

## Implementation Checklist

### For Buying Points:
- [ ] Sign up for Omise account
- [ ] Get API keys (test and production)
- [ ] Install Omise SDK
- [ ] Create payment service
- [ ] Update buy endpoint to use payment gateway
- [ ] Add webhook handler
- [ ] Test with test cards/banks
- [ ] Update frontend to handle payment flow
- [ ] Add payment method selection UI
- [ ] Handle payment callbacks

### For Withdrawals:
- [ ] Decide on automation level (manual vs automated)
- [ ] If automated: Set up Omise Payout or bank API
- [ ] Add withdrawal processing job/cron
- [ ] Add admin dashboard for withdrawal management
- [ ] Implement security checks (daily limits, etc.)

## Security Considerations

1. **Never store full payment details** - Use tokens
2. **Verify webhook signatures** - Prevent fake webhooks
3. **HTTPS only** - All payment endpoints must use HTTPS
4. **Rate limiting** - Prevent abuse
5. **Transaction logging** - Audit all payment transactions
6. **PCI Compliance** - If handling cards, ensure PCI compliance

## Testing

### Test Cards (Omise):
- Success: `4242424242424242`
- 3D Secure: `4000000000000002`
- Failure: `4000000000000069`

### Test Internet Banking:
- Use Omise test mode
- Simulate bank redirects

## Cost Estimation

- **Omise Fees**: ~2.9% + 10 THB per transaction
- **Withdrawal Fees**: Varies by method (manual: free, automated: ~20-50 THB per transaction)

## Next Steps

1. **Sign up for Omise** (start with test account)
2. **Implement payment service** using code above
3. **Test thoroughly** in sandbox mode
4. **Update frontend** to integrate payment flow
5. **Set up webhooks** for production
6. **For withdrawals**: Decide on manual vs automated approach

## Additional Resources

- Omise Documentation: https://docs.omise.co
- Omise Node.js SDK: https://github.com/omise/omise-node
- 2C2P Documentation: https://developer.2c2p.com
- PromptPay API: Contact banks directly for API access
