# Omise Recipient Inactive Status - Guide

## Problem
When creating transfers via Omise Payout API, you may encounter recipients with status:
- **Inactive**: Recipient account is not active
- **Not Verified**: Bank account has not been verified by Omise
- **Pending**: Recipient is being processed

## Why Recipients Become Inactive

1. **Automatic Verification Process**: Omise automatically verifies bank accounts, which can take time
2. **Test Mode Limitations**: In test mode, verification may be slower or require manual steps
3. **Bank Account Issues**: 
   - Account not found
   - Name mismatch
   - Bank not supported
4. **Manual Deactivation**: Recipient was manually deactivated in Omise dashboard

## What to Do

### Option 1: Wait for Automatic Verification (Recommended)
- Omise will automatically verify recipients within 24-48 hours
- Check recipient status periodically using the API
- Once verified and active, transfers will work automatically

### Option 2: Manual Verification (Test Mode Only)
For **test mode only**, you can manually verify a recipient:

```javascript
const paymentService = require('./services/paymentService');

// Check recipient status
const status = await paymentService.checkRecipientStatus('recp_test_xxx');
console.log('Recipient status:', status);

// If not verified, manually verify (test mode only)
if (!status.verified) {
  const verified = await paymentService.verifyRecipient('recp_test_xxx');
  console.log('Recipient verified:', verified);
}
```

### Option 3: Check Omise Dashboard
1. Go to [Omise Dashboard](https://dashboard.omise.co)
2. Navigate to **Recipients** section
3. Check recipient status:
   - **Verified** (green badge) = Can receive transfers
   - **Pending** (yellow badge) = Still being verified
   - **Inactive** (grey badge) = Cannot receive transfers

### Option 4: Contact Omise Support
If recipient remains inactive for more than 48 hours:
- Contact [Omise Support](https://www.omise.co/en/contact-us)
- Provide recipient ID and bank account details
- They can help verify or activate the recipient

## Current System Behavior

When a withdrawal is approved:

1. **System checks recipient status** before creating transfer
2. **If recipient is inactive/not verified**:
   - Logs warning but continues with approval
   - Stores recipient status in `cashReward.metadata`
   - Admin can see the issue in the dashboard
3. **If recipient is active and verified**:
   - Creates Omise transfer immediately
   - Points are deducted when transfer completes (via webhook)

## Admin Actions

### Check Recipient Status via API
```javascript
// In admin route or script
const paymentService = require('../services/paymentService');
const status = await paymentService.checkRecipientStatus(recipientId);
console.log('Can receive transfers:', status.canReceiveTransfers);
console.log('Issues:', status.issues);
```

### Manual Processing
If recipient is inactive:
1. Check Omise dashboard for details
2. Wait for automatic verification (24-48 hours)
3. Or manually process the withdrawal (mark as paid manually)
4. Points will be deducted when you mark as paid

## Prevention

To avoid inactive recipients:

1. **Use Real Bank Accounts**: Test mode may have limitations
2. **Verify Account Details**: Ensure bank account name matches exactly
3. **Wait Before First Transfer**: Create recipient, wait 24 hours, then approve withdrawal
4. **Check Status Before Transfer**: Use `checkRecipientStatus()` before creating transfers

## API Endpoints

### Check Recipient Status
```javascript
GET /api/admin/cash-rewards/:id/recipient-status
```

### Manual Verify (Test Mode Only)
```javascript
POST /api/admin/recipients/:id/verify
```

## Notes

- **Production Mode**: Recipients are automatically verified by Omise (usually within 24-48 hours)
- **Test Mode**: Verification may be slower; manual verification is available
- **Active + Verified**: Both must be `true` for transfers to work
- **Failure Codes**: Check `failure_code` field for specific issues:
  - `name_mismatch`: Account name doesn't match
  - `account_not_found`: Bank account not found
  - `bank_not_found`: Bank code not recognized
