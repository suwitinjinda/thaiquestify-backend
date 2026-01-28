#!/bin/bash

WEBHOOK_URL="https://thaiquestify.com/api/webhooks/omise"

echo "🧪 Testing Omise webhook..."
echo "URL: $WEBHOOK_URL"
echo ""

RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
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
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS")

echo "Response Body:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""
echo "HTTP Status: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Webhook test PASSED!"
else
  echo "❌ Webhook test FAILED (Status: $HTTP_STATUS)"
fi
