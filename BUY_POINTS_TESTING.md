# Buy Points Testing Guide

## Overview
This guide shows how to test the complete buy points flow with Omise payment gateway integration.

## Test Flow

### Step 1: Get Conversion Rate
First, check the current point conversion rate:

```bash
curl -X GET https://thaiquestify.com/api/v2/admin/settings/point-conversion-rate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rate": 1
  }
}
```
*Note: Rate of 1 means 1 THB = 1 Point*

### Step 2: Initiate Payment (Buy Points)

#### Option A: Using cURL
```bash
curl -X POST https://thaiquestify.com/api/points/buy/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 100,
    "points": 100,
    "paymentMethod": "internet_banking",
    "bank": "scb"
  }'
```

#### Option B: Using Frontend
1. Open your app
2. Go to Profile → Payment Methods (วิธีการชำระเงิน)
3. Click "Buy Point"
4. Enter amount (e.g., 100 THB)
5. Select bank (e.g., SCB)
6. Click "Buy"

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "chargeId": "chrg_test_5xxx",
    "authorizeUri": "https://pay.omise.co/offsites/ofsp_test_xxx/pay",
    "status": "pending",
    "amount": 100,
    "points": 100
  },
  "message": "Payment initiated"
}
```

### Step 3: Complete Payment

#### For Internet Banking:
1. **Redirect user to `authorizeUri`** from Step 2
2. User logs into their bank account
3. User completes payment
4. User is redirected back to your app

#### For Test Mode (Development):
- Use Omise test credentials
- Test cards: `4242424242424242` (success)
- Test internet banking: Use Omise test mode

### Step 4: Verify Payment

#### Option A: Automatic (Webhook)
- Omise sends webhook to `/api/webhooks/omise`
- Points automatically added
- User receives notification

#### Option B: Manual Verification
```bash
curl -X GET https://thaiquestify.com/api/points/buy/verify/TRANSACTION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "transactionId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "pointsAdded": 100,
    "newBalance": 600,
    "status": "completed"
  },
  "message": "Payment successful"
}
```

### Step 5: Check User Points
```bash
curl -X GET https://thaiquestify.com/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Check the `points` field in the response.

## Complete Test Script

Save as `test-buy-points.sh`:

```bash
#!/bin/bash

# Configuration
API_URL="https://thaiquestify.com/api"
JWT_TOKEN="YOUR_JWT_TOKEN_HERE"
AMOUNT=100
POINTS=100
BANK="scb"

echo "🧪 Testing Buy Points Flow..."
echo ""

# Step 1: Get conversion rate
echo "1️⃣ Getting conversion rate..."
RATE_RESPONSE=$(curl -s -X GET "$API_URL/v2/admin/settings/point-conversion-rate")
echo "Rate: $(echo $RATE_RESPONSE | jq -r '.data.rate')"
echo ""

# Step 2: Initiate payment
echo "2️⃣ Initiating payment..."
INIT_RESPONSE=$(curl -s -X POST "$API_URL/points/buy/initiate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d "{
    \"amount\": $AMOUNT,
    \"points\": $POINTS,
    \"paymentMethod\": \"internet_banking\",
    \"bank\": \"$BANK\"
  }")

TRANSACTION_ID=$(echo $INIT_RESPONSE | jq -r '.data.transactionId')
CHARGE_ID=$(echo $INIT_RESPONSE | jq -r '.data.chargeId')
AUTHORIZE_URI=$(echo $INIT_RESPONSE | jq -r '.data.authorizeUri')

echo "Transaction ID: $TRANSACTION_ID"
echo "Charge ID: $CHARGE_ID"
echo "Authorize URI: $AUTHORIZE_URI"
echo ""
echo "⚠️  Complete payment at: $AUTHORIZE_URI"
echo "   Then run: ./test-buy-points-verify.sh $TRANSACTION_ID"
```

## Testing with Frontend

### 1. Login to App
- Use your test user account
- Get JWT token from login response

### 2. Navigate to Payment Screen
- Profile → Payment Methods (วิธีการชำระเงิน)
- You should see:
  - Current points balance
  - "Buy Point" section
  - Quick buy options (100, 500, 1000 THB)
  - Custom amount input

### 3. Select Amount
- Click quick buy button OR
- Enter custom amount
- System calculates points based on conversion rate

### 4. Select Payment Method
- Choose bank (SCB, KBank, BBL, etc.)
- Click "Buy" or "Confirm"

### 5. Complete Payment
- Redirected to bank login
- Complete payment
- Redirected back to app

### 6. Verify Points Added
- Check points balance updated
- See transaction in history
- Receive notification (if implemented)

## Test Scenarios

### Scenario 1: Successful Purchase (100 THB)
```bash
# 1. Initiate
POST /api/points/buy/initiate
{
  "amount": 100,
  "points": 100,
  "paymentMethod": "internet_banking",
  "bank": "scb"
}

# 2. Complete payment in Omise test mode

# 3. Verify
GET /api/points/buy/verify/{transactionId}

# Expected: Points added, status = "completed"
```

### Scenario 2: Failed Payment
```bash
# 1. Initiate payment
# 2. Cancel or fail payment in bank
# 3. Check transaction status = "failed"
# 4. Points NOT added
```

### Scenario 3: Large Amount (1000 THB)
```bash
POST /api/points/buy/initiate
{
  "amount": 1000,
  "points": 1000,
  "paymentMethod": "internet_banking",
  "bank": "kbank"
}
```

### Scenario 4: Custom Amount
```bash
POST /api/points/buy/initiate
{
  "amount": 250,
  "points": 250,
  "paymentMethod": "internet_banking",
  "bank": "bbl"
}
```

## Testing Without Payment Gateway (Simple Mode)

For quick testing without actual payment:

```bash
# Direct buy (no payment verification)
POST /api/points/buy
{
  "amount": 100,
  "points": 100
}
```

**Note:** This endpoint directly adds points without payment. Use only for testing!

## Verification Checklist

After testing, verify:

- [ ] Conversion rate fetched correctly
- [ ] Payment initiated successfully
- [ ] `authorizeUri` returned (for redirect)
- [ ] Transaction created with status "pending"
- [ ] Payment completed in bank/Omise
- [ ] Webhook received (check logs)
- [ ] Points added to user account
- [ ] Transaction status updated to "completed"
- [ ] User balance increased correctly

## Troubleshooting

### Issue: "Payment gateway not configured"
- **Solution:** Check `.env` has Omise keys
- **Solution:** Restart backend server
- **Solution:** Verify `paymentService.js` is enabled

### Issue: "Invalid bank code"
- **Solution:** Use valid bank codes: `scb`, `kbank`, `bbl`, `bay`, `tmb`, etc.
- **Check:** `SUPPORTED_BANKS` in `paymentService.js`

### Issue: Payment initiated but no redirect
- **Check:** `authorizeUri` in response
- **Check:** Frontend redirects user to `authorizeUri`
- **Check:** Omise test mode is enabled

### Issue: Payment completed but points not added
- **Check:** Webhook is configured in Omise dashboard
- **Check:** Webhook URL is correct
- **Check:** Backend logs for webhook receipt
- **Check:** Transaction exists with matching `chargeId`
- **Check:** Manually verify: `GET /api/points/buy/verify/{transactionId}`

### Issue: "Insufficient points" error
- **Check:** User has enough points for withdrawal (different endpoint)
- **Note:** Buy points adds points, doesn't require existing points

## Test Data

### Test User
- Email: Your test user email
- JWT Token: Get from login response

### Test Amounts
- Small: 100 THB = 100 Points
- Medium: 500 THB = 500 Points
- Large: 1000 THB = 1000 Points
- Custom: Any amount

### Test Banks
- `scb` - Siam Commercial Bank
- `kbank` - Kasikorn Bank
- `bbl` - Bangkok Bank
- `bay` - Bank of Ayudhya
- `tmb` - TMB Bank

## Quick Test Commands

```bash
# 1. Get conversion rate
curl https://thaiquestify.com/api/v2/admin/settings/point-conversion-rate

# 2. Buy points (simple - no payment)
curl -X POST https://thaiquestify.com/api/points/buy \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "points": 100}'

# 3. Buy points (with payment gateway)
curl -X POST https://thaiquestify.com/api/points/buy/initiate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "points": 100, "paymentMethod": "internet_banking", "bank": "scb"}'

# 4. Verify payment
curl https://thaiquestify.com/api/points/buy/verify/TRANSACTION_ID \
  -H "Authorization: Bearer TOKEN"

# 5. Check user points
curl https://thaiquestify.com/api/users/me \
  -H "Authorization: Bearer TOKEN"
```

## Next Steps

1. ✅ Test with small amount first (100 THB)
2. ✅ Verify points added correctly
3. ✅ Test with different banks
4. ✅ Test failed payment scenario
5. ✅ Test webhook automatic confirmation
6. ✅ Test frontend integration
7. ✅ Go live with production Omise keys
