# Omise Transfer API Setup Guide

## ⚠️ Important: Transfer API May Not Be Visible in Dashboard

Omise Transfer/Payout API **อาจไม่แสดงใน Dashboard** แต่สามารถใช้ผ่าน API ได้โดยตรง

## 🔍 How to Check if Transfer API is Available

### Method 1: Test via API

```bash
# Test if you can create a recipient
curl https://api.omise.co/recipients \
  -u skey_test_66hcwe2bu3j4419kv5c: \
  -d "name=Test User" \
  -d "email=test@example.com" \
  -d "type=individual" \
  -d "bank_account[brand]=bbl" \
  -d "bank_account[number]=1234567890" \
  -d "bank_account[name]=Test User"
```

### Method 2: Use Our Test Script

```bash
node scripts/test-omise-payout.js
```

## 📋 Transfer API Requirements

### 1. **Account Type**
- Transfer API อาจต้องใช้ **Business Account** (ไม่ใช่ Personal Account)
- บาง account อาจต้อง verify business documents

### 2. **Region Support**
- Transfer API รองรับใน **Thailand** และ **Japan**
- อาจไม่รองรับในบางประเทศ

### 3. **Activation**
- Transfer API อาจต้อง **เปิดใช้งานแยก** โดยติดต่อ Omise Support
- Email: support@omise.co

## 🚀 How to Enable Transfer API

### Step 1: Contact Omise Support

Send email to **support@omise.co**:

```
Subject: Request to Enable Transfer/Payout API

Hello Omise Support,

I would like to request enabling the Transfer/Payout API for my Omise account.

Account Email: [your-omise-account-email]
Account Type: [Business/Personal]
Use Case: I need to send payouts to bank accounts in Thailand for user withdrawals.

Please let me know:
1. If Transfer API is available for my account
2. What documents/verification is required
3. Any fees or limits

Thank you.
```

### Step 2: Verify Your Account

Omise อาจต้องการ:
- Business registration documents
- Bank account verification
- Business information

### Step 3: Test After Activation

Once enabled, test using:
```bash
node scripts/test-omise-payout.js
```

## 🔄 Alternative: Manual Processing

If Transfer API is not available, you can:

1. **Use Manual Bank Transfer**
   - Admin approves withdrawal
   - Admin transfers money manually via bank
   - Mark as "paid" in system

2. **Use Third-Party Service**
   - PromptPay Business API (if available)
   - SCB Business API
   - Other payment gateways

## 📚 API Endpoints (If Available)

### Recipients API
- `POST /recipients` - Create recipient
- `GET /recipients` - List recipients
- `GET /recipients/:id` - Get recipient
- `PATCH /recipients/:id` - Update recipient

### Transfers API
- `POST /transfers` - Create transfer
- `GET /transfers` - List transfers
- `GET /transfers/:id` - Get transfer

## 🧪 Testing Without Dashboard

Even if you don't see Transfer API in dashboard, you can:

1. **Test via API directly**:
   ```bash
   # Create recipient
   curl https://api.omise.co/recipients \
     -u skey_test_xxx: \
     -d "name=Test" \
     -d "email=test@example.com" \
     -d "type=individual" \
     -d "bank_account[brand]=bbl" \
     -d "bank_account[number]=1234567890" \
     -d "bank_account[name]=Test"
   ```

2. **Use our test script**:
   ```bash
   node scripts/test-omise-payout.js
   ```

## ⚠️ Common Issues

### Issue: "Transfer API not available"
**Solution**: Contact Omise support to enable it

### Issue: "Recipient not verified"
**Solution**: 
- In test mode: Usually auto-verified
- In live mode: May take 1-3 business days

### Issue: "Insufficient balance"
**Solution**: Add balance to Omise account

## 📞 Support

- **Omise Support**: support@omise.co
- **Omise Docs**: https://docs.omise.co/transfers-api
- **Omise Dashboard**: https://dashboard.omise.co

## 💡 Recommendation

If Transfer API is not available or takes time to enable:

1. **Use manual processing** for now
2. **Set up Transfer API** in parallel
3. **Switch to automated** when ready

Our code already supports both:
- `useOmisePayout: true` - Automated via Omise
- `useOmisePayout: false` - Manual processing
