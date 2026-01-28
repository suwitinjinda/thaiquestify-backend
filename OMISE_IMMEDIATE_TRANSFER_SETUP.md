# Omise Immediate Transfer Setup Guide

## Overview

Omise Transfer API does not have a built-in "instant transfer" feature. Transfers will be **pending** if:
- Transferable balance is insufficient
- Funds are "on hold" (waiting for settlement)
- Recipient is not verified/active

## Options for Immediate Transfer

### Option 1: Manual Transfer (Recommended for Production)

**Use the existing `/pay` endpoint** to mark withdrawal as paid manually:

```
POST /api/v2/admin/cash-rewards/:id/pay
```

**Flow:**
1. Admin approves withdrawal
2. System creates Omise transfer (may be pending)
3. Admin transfers money manually via bank
4. Admin clicks "ยืนยันการจ่ายเงิน" in dashboard
5. System deducts points and sends notification to user

**Advantages:**
- Works in both test and production mode
- No dependency on Omise balance
- Full control over transfer timing

### Option 2: Test Mode - Mark as Sent (Test Mode Only)

**For testing purposes**, you can mark a transfer as sent immediately:

```
POST /api/v2/admin/transfers/:id/mark-as-sent
```

**Requirements:**
- Must be in **test mode** (`OMISE_SECRET_KEY` contains `_test_`)
- Transfer must already be created
- Recipient must be verified and active

**Flow:**
1. Admin approves withdrawal
2. System creates Omise transfer (pending)
3. Admin calls `/mark-as-sent` endpoint
4. System marks transfer as sent
5. Points are deducted automatically
6. User receives notification

**Limitations:**
- **Only works in test mode**
- Does not actually transfer money
- For testing/development only

### Option 3: Wait for Transferable Balance

**Automatic processing** when funds become transferable:

1. Admin approves withdrawal
2. System creates Omise transfer (pending)
3. Wait for funds to become transferable (usually end of day)
4. Omise processes transfer automatically
5. Webhook notifies system when transfer completes
6. Points are deducted automatically

**Advantages:**
- Fully automated
- No manual intervention needed

**Disadvantages:**
- Requires waiting for settlement
- Transferable balance must be sufficient

## Setup Instructions

### For Production (Manual Transfer)

No setup needed - use existing `/pay` endpoint:

1. Admin approves withdrawal
2. If transfer is pending → Admin transfers money manually
3. Admin clicks "ยืนยันการจ่ายเงิน"
4. Done!

### For Test Mode (Mark as Sent)

1. Ensure you're using **test keys** (`OMISE_SECRET_KEY` contains `_test_`)
2. When approving withdrawal, you can:
   - Set `markAsSentImmediately: true` in request body (optional)
   - Or call `/mark-as-sent` endpoint after transfer is created

**Example API Call:**
```javascript
// Option A: Mark as sent when approving
POST /api/v2/admin/cash-rewards/:id/approve
{
  "useOmisePayout": true,
  "markAsSentImmediately": true  // Test mode only
}

// Option B: Mark as sent after approval
POST /api/v2/admin/transfers/:transferId/mark-as-sent
```

## Current System Behavior

### When Approving Withdrawal:

1. **Check Transferable Balance:**
   - If insufficient → Send notification to admins
   - Continue with approval (points deducted)
   - Transfer will be pending

2. **Create Omise Transfer:**
   - Uses existing recipient from verification
   - Creates transfer (may be pending)
   - Stores transfer ID in metadata

3. **If Transfer Pending:**
   - Points are NOT deducted yet (waiting for transfer)
   - Admin can:
     - Wait for transferable balance
     - Use manual transfer (`/pay` endpoint)
     - Mark as sent (test mode only)

### When Transfer Completes:

1. **Webhook received** (`transfer.paid` or `transfer.sent`)
2. **Points deducted** automatically
3. **Cash reward marked as paid**
4. **Notification sent** to user

## Balance Types Explained

- **Total Balance**: All funds in Omise account
- **On Hold**: Funds waiting for settlement (not transferable yet)
- **Transferable Balance**: Funds available for immediate transfer
- **Available Balance**: Similar to transferable, but may include pending funds

**Important:** Always check **transferable balance**, not available balance!

## Troubleshooting

### Transfer Stuck in Pending

**Cause:** Transferable balance insufficient

**Solutions:**
1. Wait for funds to become transferable (check "Transferable At" in Omise dashboard)
2. Use manual transfer (`/pay` endpoint)
3. Mark as sent (test mode only)

### "mark_as_sent is only available in test mode"

**Cause:** Trying to use test-only feature in production

**Solution:** Use manual transfer (`/pay` endpoint) instead

### Transfer Created But Not Sent

**Cause:** Recipient not verified/active, or balance insufficient

**Solutions:**
1. Check recipient status in Omise dashboard
2. Verify transferable balance
3. Wait for recipient verification (24-48 hours)
4. Use manual transfer as fallback

## Best Practices

1. **For Production:**
   - Use manual transfer (`/pay` endpoint)
   - Don't rely on automatic Omise transfers
   - Monitor transferable balance regularly

2. **For Testing:**
   - Use `markAsSentImmediately: true` when approving
   - Or use `/mark-as-sent` endpoint
   - Verify webhook handling works correctly

3. **Monitoring:**
   - Check Omise dashboard regularly
   - Monitor transferable balance
   - Set up alerts for pending transfers

## API Endpoints

### Approve Withdrawal (with immediate transfer option)
```
POST /api/v2/admin/cash-rewards/:id/approve
Body: {
  "useOmisePayout": true,
  "markAsSentImmediately": true  // Test mode only
}
```

### Mark Transfer as Sent (test mode)
```
POST /api/v2/admin/transfers/:id/mark-as-sent
```

### Manual Transfer (production)
```
POST /api/v2/admin/cash-rewards/:id/pay
Body: {
  "adminNotes": "Transferred manually via bank"
}
```

## Notes

- **Test Mode:** `mark_as_sent` and `mark_as_paid` are only available in test mode
- **Production:** Use manual transfer for immediate processing
- **Settlement:** Omise typically settles funds at end of day (check "Transferable At" timestamp)
- **Webhooks:** Set up webhook URL in Omise dashboard to receive transfer status updates
