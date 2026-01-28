#!/bin/bash

# Buy Points Testing Script
# Usage: ./test-buy-points.sh [JWT_TOKEN] [AMOUNT] [BANK]

API_URL="https://thaiquestify.com/api"
JWT_TOKEN="${1:-YOUR_JWT_TOKEN_HERE}"
AMOUNT="${2:-100}"
POINTS=$AMOUNT
BANK="${3:-scb}"

echo "🧪 Testing Buy Points Flow..."
echo "Amount: $AMOUNT THB"
echo "Points: $POINTS"
echo "Bank: $BANK"
echo ""

if [ "$JWT_TOKEN" = "YOUR_JWT_TOKEN_HERE" ]; then
  echo "❌ Error: Please provide JWT token"
  echo "Usage: ./test-buy-points.sh <JWT_TOKEN> [AMOUNT] [BANK]"
  exit 1
fi

# Step 1: Get conversion rate
echo "1️⃣ Getting conversion rate..."
RATE_RESPONSE=$(curl -s -X GET "$API_URL/v2/admin/settings/point-conversion-rate")
RATE=$(echo $RATE_RESPONSE | jq -r '.data.rate // 1')
echo "   Conversion Rate: 1 Point = $RATE THB"
echo ""

# Step 2: Get current user points
echo "2️⃣ Getting current user points..."
USER_RESPONSE=$(curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $JWT_TOKEN")
CURRENT_POINTS=$(echo $USER_RESPONSE | jq -r '.user.points // 0')
echo "   Current Points: $CURRENT_POINTS"
echo ""

# Step 3: Initiate payment
echo "3️⃣ Initiating payment..."
INIT_RESPONSE=$(curl -s -X POST "$API_URL/points/buy/initiate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d "{
    \"amount\": $AMOUNT,
    \"points\": $POINTS,
    \"paymentMethod\": \"internet_banking\",
    \"bank\": \"$BANK\"
  }")

SUCCESS=$(echo $INIT_RESPONSE | jq -r '.success // false')
if [ "$SUCCESS" != "true" ]; then
  echo "   ❌ Failed to initiate payment"
  echo "   Response: $INIT_RESPONSE"
  exit 1
fi

TRANSACTION_ID=$(echo $INIT_RESPONSE | jq -r '.data.transactionId')
CHARGE_ID=$(echo $INIT_RESPONSE | jq -r '.data.chargeId')
AUTHORIZE_URI=$(echo $INIT_RESPONSE | jq -r '.data.authorizeUri')

echo "   ✅ Payment initiated successfully"
echo "   Transaction ID: $TRANSACTION_ID"
echo "   Charge ID: $CHARGE_ID"
echo "   Authorize URI: $AUTHORIZE_URI"
echo ""
echo "⚠️  Next Steps:"
echo "   1. Complete payment at: $AUTHORIZE_URI"
echo "   2. Or wait for webhook to process automatically"
echo "   3. Verify with: curl -X GET \"$API_URL/points/buy/verify/$TRANSACTION_ID\" -H \"Authorization: Bearer $JWT_TOKEN\""
echo ""
echo "💡 To test without payment, use simple buy endpoint:"
echo "   curl -X POST \"$API_URL/points/buy\" -H \"Authorization: Bearer $JWT_TOKEN\" -H \"Content-Type: application/json\" -d '{\"amount\": $AMOUNT, \"points\": $POINTS}'"
