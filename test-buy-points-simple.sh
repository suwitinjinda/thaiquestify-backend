#!/bin/bash

# Simple Buy Points Test (No Payment Gateway)
# Usage: ./test-buy-points-simple.sh [JWT_TOKEN] [AMOUNT]

API_URL="https://thaiquestify.com/api"
JWT_TOKEN="${1:-YOUR_JWT_TOKEN_HERE}"
AMOUNT="${2:-100}"
POINTS=$AMOUNT

echo "🧪 Testing Simple Buy Points (No Payment Gateway)..."
echo "Amount: $AMOUNT THB"
echo "Points: $POINTS"
echo ""

if [ "$JWT_TOKEN" = "YOUR_JWT_TOKEN_HERE" ]; then
  echo "❌ Error: Please provide JWT token"
  echo "Usage: ./test-buy-points-simple.sh <JWT_TOKEN> [AMOUNT]"
  exit 1
fi

# Get current points
echo "1️⃣ Getting current user points..."
USER_RESPONSE=$(curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $JWT_TOKEN")
CURRENT_POINTS=$(echo $USER_RESPONSE | jq -r '.user.points // 0')
echo "   Current Points: $CURRENT_POINTS"
echo ""

# Buy points
echo "2️⃣ Buying points..."
BUY_RESPONSE=$(curl -s -X POST "$API_URL/points/buy" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d "{
    \"amount\": $AMOUNT,
    \"points\": $POINTS
  }")

SUCCESS=$(echo $BUY_RESPONSE | jq -r '.success // false')
if [ "$SUCCESS" != "true" ]; then
  echo "   ❌ Failed to buy points"
  echo "   Response: $BUY_RESPONSE"
  exit 1
fi

NEW_BALANCE=$(echo $BUY_RESPONSE | jq -r '.data.newBalance')
POINTS_ADDED=$(echo $BUY_RESPONSE | jq -r '.data.pointsAdded')

echo "   ✅ Points purchased successfully"
echo "   Points Added: $POINTS_ADDED"
echo "   New Balance: $NEW_BALANCE"
echo "   Previous Balance: $CURRENT_POINTS"
echo ""

# Verify
echo "3️⃣ Verifying points..."
USER_RESPONSE=$(curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $JWT_TOKEN")
VERIFIED_POINTS=$(echo $USER_RESPONSE | jq -r '.user.points // 0')

if [ "$VERIFIED_POINTS" = "$NEW_BALANCE" ]; then
  echo "   ✅ Points verified: $VERIFIED_POINTS"
  echo "   ✅ Test PASSED!"
else
  echo "   ❌ Points mismatch!"
  echo "   Expected: $NEW_BALANCE"
  echo "   Actual: $VERIFIED_POINTS"
  echo "   ❌ Test FAILED!"
  exit 1
fi
