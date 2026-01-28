# Webhook Testing Guide

## Quick Test Methods

### 1. **Test with cURL (Command Line)**

#### Test the webhook endpoint directly:
```bash
# Test via HTTPS (production URL)
curl -X POST https://thaiquestify.com/api/webhooks/omise \
  -H "Content-Type: application/json" \
  -H "x-omise-signature: test_signature_123" \
  -d '{
    "key": "charge.complete",
    "data": {
      "id": "chrg_test_123456",
      "status": "successful",
      "amount": 10000,
      "currency": "thb"
    }
  }'
```

**Expected Response:**
```json
{"received": true}
```

#### Test locally (if server running on localhost):
```bash
curl -X POST http://127.0.0.1:5000/api/webhooks/omise \
  -H "Content-Type: application/json" \
  -H "x-omise-signature: test_sig" \
  -d '{"key":"charge.complete","data":{"id":"chrg_test","status":"successful"}}'
```

### 2. **Test with Postman**

1. **Create New Request:**
   - Method: `POST`
   - URL: `https://thaiquestify.com/api/webhooks/omise`

2. **Headers:**
   - `Content-Type: application/json`
   - `x-omise-signature: test_signature_123`

3. **Body (raw JSON):**
```json
{
  "key": "charge.complete",
  "data": {
    "id": "chrg_test_123456",
    "status": "successful",
    "amount": 10000,
    "currency": "thb",
    "created": "2026-01-24T10:00:00Z"
  }
}
```

4. **Send Request** - Should return `{"received": true}`

### 3. **Test with Omise Dashboard**

1. Go to **Omise Dashboard** → **Settings** → **Webhooks**
2. Click **"Send Test Webhook"** or **"Test"** button
3. Select event: `charge.complete`
4. Omise will send a test webhook to your configured URL
5. Check your backend logs to see if it was received

### 4. **Test Complete Payment Flow**

#### Step 1: Create a test payment
```bash
# Initiate payment (from frontend or API)
POST /api/points/buy/initiate
{
  "amount": 100,
  "points": 100,
  "paymentMethod": "internet_banking",
  "bank": "scb"
}
```

#### Step 2: Complete payment in Omise test mode
- Use Omise test cards or test internet banking
- Complete the payment flow

#### Step 3: Check webhook
- Omise will automatically send webhook to your endpoint
- Check backend logs for webhook receipt
- Verify points were added to user account

### 5. **Check Backend Logs**

```bash
# If using PM2:
pm2 logs thaiquestify-backend

# If running directly, check console output for:
# 📥 Omise webhook received: charge.complete
# ✅ Payment webhook: Added X points to user Y
```

## Test Scenarios

### Scenario 1: Successful Payment
```bash
curl -X POST https://thaiquestify.com/api/webhooks/omise \
  -H "Content-Type: application/json" \
  -H "x-omise-signature: test_sig" \
  -d '{
    "key": "charge.complete",
    "data": {
      "id": "chrg_test_success",
      "status": "successful",
      "amount": 10000
    }
  }'
```

### Scenario 2: Failed Payment
```bash
curl -X POST https://thaiquestify.com/api/webhooks/omise \
  -H "Content-Type: application/json" \
  -H "x-omise-signature: test_sig" \
  -d '{
    "key": "charge.complete",
    "data": {
      "id": "chrg_test_failed",
      "status": "failed",
      "amount": 10000
    }
  }'
```

### Scenario 3: Test with Real Transaction ID
1. Create a real test transaction:
```bash
POST /api/points/buy/initiate
{
  "amount": 100,
  "points": 100,
  "paymentMethod": "internet_banking",
  "bank": "scb"
}
```

2. Note the `chargeId` from response

3. Simulate webhook with that charge ID:
```bash
curl -X POST https://thaiquestify.com/api/webhooks/omise \
  -H "Content-Type: application/json" \
  -d "{
    \"key\": \"charge.complete\",
    \"data\": {
      \"id\": \"YOUR_CHARGE_ID_FROM_STEP_1\",
      \"status\": \"successful\",
      \"amount\": 10000
    }
  }"
```

4. Check if points were added to user account

## Verification Checklist

- [ ] Webhook endpoint returns `200 OK` status
- [ ] Response contains `{"received": true}`
- [ ] Backend logs show webhook received
- [ ] Transaction status updated (if transaction exists)
- [ ] Points added to user (if payment successful)
- [ ] No errors in backend logs

## Troubleshooting

### Issue: "404 Not Found"
- **Check:** Nginx configuration is correct
- **Check:** Backend server is running
- **Check:** Route is mounted correctly in server.js

### Issue: "500 Internal Server Error"
- **Check:** Backend logs for error details
- **Check:** Database connection
- **Check:** PointTransaction model has correct fields

### Issue: Webhook received but points not added
- **Check:** Transaction exists with matching `chargeId`
- **Check:** Transaction status is `pending`
- **Check:** User exists and is valid
- **Check:** Backend logs for any errors

### Issue: Webhook not received from Omise
- **Check:** Webhook URL in Omise dashboard is correct
- **Check:** Server is accessible from internet (not localhost)
- **Check:** HTTPS is working (Omise requires HTTPS)
- **Check:** Firewall allows incoming connections

## Testing Tools

### Online Webhook Testing Services:
- **Webhook.site**: https://webhook.site (for testing webhook delivery)
- **RequestBin**: https://requestbin.com (for inspecting webhook payloads)

### Test with ngrok (for local testing):
```bash
# Install ngrok
# Create tunnel to local server
ngrok http 5000

# Use ngrok URL in Omise dashboard:
# https://your-ngrok-url.ngrok.io/api/webhooks/omise
```

## Expected Webhook Payload from Omise

```json
{
  "object": "event",
  "id": "evnt_test_5xxx",
  "livemode": false,
  "location": "/events/evnt_test_5xxx",
  "key": "charge.complete",
  "created": "2026-01-24T10:00:00Z",
  "data": {
    "object": "charge",
    "id": "chrg_test_5xxx",
    "livemode": false,
    "location": "/charges/chrg_test_5xxx",
    "amount": 10000,
    "currency": "thb",
    "status": "successful",
    "created": "2026-01-24T10:00:00Z"
  }
}
```

## Quick Test Script

Save this as `test-webhook.sh`:

```bash
#!/bin/bash

WEBHOOK_URL="https://thaiquestify.com/api/webhooks/omise"

echo "Testing Omise webhook..."
echo "URL: $WEBHOOK_URL"
echo ""

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-omise-signature: test_signature" \
  -d '{
    "key": "charge.complete",
    "data": {
      "id": "chrg_test_'$(date +%s)'",
      "status": "successful",
      "amount": 10000,
      "currency": "thb"
    }
  }' \
  -w "\n\nHTTP Status: %{http_code}\n"

echo ""
echo "✅ Test complete!"
```

Run: `chmod +x test-webhook.sh && ./test-webhook.sh`
