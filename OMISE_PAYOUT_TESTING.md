# Omise Payout API Testing Guide

## 📋 Overview

ระบบใช้ **Omise Test Mode** สำหรับการทดสอบ Payout API ซึ่ง:
- ✅ **ไม่ใช่ real account** - ไม่มีการโอนเงินจริง
- ✅ **ทดสอบได้เต็มที่** - ทดสอบ API ได้เหมือน production
- ✅ **ไม่เสียค่าใช้จ่าย** - ไม่มี fees จริง
- ✅ **Recipients verify อัตโนมัติ** - ใน test mode verify เร็วกว่า

## 🔑 Current Configuration

จาก `.env`:
```
OMISE_PUBLIC_KEY=pkey_test_66hcwe1vyvupeyckpqd
OMISE_SECRET_KEY=skey_test_66hcwe2bu3j4419kv5c
```

**หมายเหตุ**: Keys เหล่านี้เป็น **test keys** - ใช้สำหรับทดสอบเท่านั้น

## 🧪 Testing Omise Payout API

### Prerequisites

1. **Omise Test Account Balance**
   - ต้องมี balance ใน Omise test account
   - ตรวจสอบได้ที่: https://dashboard.omise.co/test/balance
   - หรือใช้ API: `GET https://api.omise.co/balance`

2. **Test Bank Account**
   - ใช้บัญชีธนาคารจริงหรือ test account ก็ได้
   - ใน test mode Omise จะ verify recipient อัตโนมัติ

### Quick Test Script

```bash
# รัน test script
node scripts/test-omise-payout.js
```

### Manual Testing

ดูรายละเอียดในไฟล์ `OMISE_PAYOUT_TESTING.md`

## ⚠️ Important Notes

1. **Test Balance**: ต้องเติม test balance ใน Omise dashboard
2. **Recipient Verification**: ใน test mode verify อัตโนมัติ
3. **Transfer Status**: pending → sent → paid
4. **Mode**: Test mode = ไม่โอนเงินจริง

## 🚀 Going Live

เมื่อพร้อมใช้ production ต้องเปลี่ยน keys เป็น `pkey_live_` และ `skey_live_`
