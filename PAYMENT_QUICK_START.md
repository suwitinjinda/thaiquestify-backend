# Payment Gateway Quick Start Guide

## Current Status
✅ **Backend endpoints created** - Ready for payment gateway integration
✅ **Payment service structure** - Placeholder code ready
✅ **Webhook handler** - Ready for Omise webhooks
⏳ **Payment gateway setup** - Needs Omise account and configuration

## Quick Setup Steps

### 1. Sign Up for Omise
1. Go to https://www.omise.co
2. Sign up for an account
3. Get your API keys:
   - **Test keys** (for development)
   - **Live keys** (for production)

### 2. Install Omise SDK
```bash
cd /home/munmunsignal_gmail_com/thaiquestify-backend
npm install omise
```

### 3. Add Environment Variables
Add to `.env`:
```env
OMISE_PUBLIC_KEY=pkey_test_xxxxx
OMISE_SECRET_KEY=skey_test_xxxxx
OMISE_API_VERSION=2019-05-29
FRONTEND_URL=https://thaiquestify.com
```

### 4. Enable Payment Service
Edit `/services/paymentService.js` and uncomment all the Omise code (remove the `/* */` comments).

### 5. Configure Webhook URL in Omise Dashboard
1. Go to Omise Dashboard → Settings → Webhooks
2. Add webhook URL: `https://thaiquestify.com/api/webhooks/omise`
3. Select events: `charge.complete`
4. Copy webhook secret (for signature verification)

### 6. Test the Integration

#### Test Buy Points Flow:
```bash
# 1. Initiate payment
POST /api/points/buy/initiate
{
  "amount": 100,
  "points": 100,
  "paymentMethod": "internet_banking",
  "bank": "scb"
}

# Response includes authorize_uri - redirect user to this URL

# 2. After user completes payment, verify:
GET /api/points/buy/verify/:transactionId

# Or webhook will automatically confirm payment
```

## API Endpoints

### Buy Points (with Payment Gateway)
- **POST** `/api/points/buy/initiate` - Start payment process
- **GET** `/api/points/buy/verify/:transactionId` - Check payment status

### Buy Points (Simple - for testing)
- **POST** `/api/points/buy` - Directly add points (no payment verification)

### Withdraw Points
- **POST** `/api/points/withdraw` - Request withdrawal (manual processing)
- **GET** `/api/points/withdrawals` - Get withdrawal history

### Webhooks
- **POST** `/api/webhooks/omise` - Payment confirmation webhook

## Supported Banks (Internet Banking)

- `scb` - Siam Commercial Bank
- `kbank` - Kasikorn Bank  
- `bbl` - Bangkok Bank
- `bay` - Bank of Ayudhya (Krungsri)
- `tmb` - TMB Bank
- `ktb` - Krung Thai Bank
- `tisco` - Tisco Bank
- `uob` - UOB Bank
- `cimb` - CIMB Thai Bank
- `gsb` - Government Savings Bank
- `ghb` - Government Housing Bank

## Frontend Integration

The frontend needs to:
1. Call `/api/points/buy/initiate` with payment details
2. Redirect user to `authorize_uri` for bank login
3. After redirect, call `/api/points/buy/verify/:transactionId` to check status
4. Or wait for webhook to automatically update (better UX)

## Withdrawal Automation

**Current**: Manual processing (admin approves and transfers)

**Future Options**:
1. **Omise Payout API** - Automated transfers (requires setup)
2. **Bank API** - Direct bank integration (complex, requires partnership)
3. **Hybrid** - Auto for small amounts, manual for large

## Security Checklist

- [ ] Verify webhook signatures in production
- [ ] Use HTTPS for all payment endpoints
- [ ] Store API keys securely (environment variables)
- [ ] Never log full payment details
- [ ] Implement rate limiting
- [ ] Add transaction logging/audit trail

## Testing

### Test Cards (Omise Test Mode):
- Success: `4242424242424242`
- 3D Secure: `4000000000000002`
- Failure: `4000000000000069`

### Test Internet Banking:
- Use Omise test mode
- Simulate bank redirects

## Troubleshooting

### "Payment gateway not configured"
- Install Omise SDK: `npm install omise`
- Add API keys to `.env`
- Uncomment code in `paymentService.js`

### "Webhook not receiving events"
- Check webhook URL in Omise dashboard
- Verify server is accessible (not localhost)
- Check webhook signature verification

### "Payment stuck in pending"
- Check webhook is working
- Manually verify with `/buy/verify/:transactionId`
- Check Omise dashboard for charge status

## Next Steps

1. ✅ Backend endpoints ready
2. ⏳ Set up Omise account
3. ⏳ Configure environment variables
4. ⏳ Test in sandbox mode
5. ⏳ Update frontend to use new endpoints
6. ⏳ Set up webhook URL
7. ⏳ Test end-to-end flow
8. ⏳ Go live with production keys

## Support

- Omise Docs: https://docs.omise.co
- Omise Support: support@omise.co
- Integration Guide: See `PAYMENT_GATEWAY_INTEGRATION.md`
