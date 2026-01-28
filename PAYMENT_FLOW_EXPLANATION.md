# Payment Flow Explanation

## How Internet Banking Payment Works with Omise

### Current Implementation: Internet Banking Redirect

**NO QR Code Scanning Required** ✅

The payment flow is:

1. **User clicks "Buy Points"** in your app
2. **User selects bank** (SCB, KBank, BBL, etc.)
3. **App redirects to Omise payment page** (`authorizeUri`)
4. **User is redirected to bank's website** (not mobile app)
5. **User logs in to internet banking** on the bank's website
6. **User completes payment** on the bank's website
7. **User is redirected back to your app** automatically
8. **Points are added** (via webhook or manual verification)

### Payment Methods Available

#### 1. Internet Banking (Current Implementation)
- **How it works:** Redirect to bank website
- **User action:** Login to bank website, complete payment
- **No mobile app needed:** Works in browser
- **No QR code:** Direct website login

#### 2. PromptPay QR Code (Alternative - Not Currently Implemented)
- **How it works:** Generate QR code, user scans with mobile banking app
- **User action:** Open mobile banking app → Scan QR code → Confirm
- **Mobile app required:** Yes, user's banking app
- **QR code:** Yes, displayed on screen

#### 3. Credit/Debit Card (Available with Omise)
- **How it works:** Enter card details on Omise page
- **User action:** Enter card number, CVV, expiry
- **No mobile app needed:** Works in browser

## Current Flow Diagram

```
User in App
    ↓
Click "Buy Points" (100 THB)
    ↓
Select Bank (e.g., SCB)
    ↓
App calls: POST /api/points/buy/initiate
    ↓
Backend creates Omise charge
    ↓
Returns authorizeUri: https://pay.omise.co/...
    ↓
App redirects user to authorizeUri
    ↓
User sees Omise payment page
    ↓
User clicks "Pay with SCB"
    ↓
User redirected to SCB website
    ↓
User logs in to SCB internet banking
    ↓
User confirms payment (100 THB)
    ↓
SCB processes payment
    ↓
User redirected back to your app
    ↓
Webhook automatically confirms payment
    ↓
Points added to user account ✅
```

## What Users See

### Step 1: In Your App
- User sees: "Buy Points" button
- User enters: Amount (e.g., 100 THB)
- User selects: Bank (SCB, KBank, etc.)

### Step 2: Omise Payment Page
- User sees: Omise payment interface
- Shows: Amount, bank logo
- User clicks: "Pay with [Bank Name]"

### Step 3: Bank Website
- User sees: Bank's login page
- User enters: Username, password (or OTP)
- User confirms: Payment amount
- User clicks: "Confirm Payment"

### Step 4: Back to Your App
- User redirected: Automatically back to app
- User sees: "Payment successful" or "Points added"
- Points: Automatically added to account

## No Mobile Banking App Required

✅ **Users do NOT need to:**
- Open their mobile banking app
- Scan a QR code
- Use their phone's camera
- Switch between apps

✅ **Users only need to:**
- Have internet banking account
- Login to bank website (in browser)
- Complete payment on website

## If You Want QR Code Payment (PromptPay)

If you want to add QR code scanning (PromptPay), you would need to:

1. **Use Omise PromptPay source type:**
```javascript
source: {
  type: 'promptpay',
  amount: Math.round(amount * 100)
}
```

2. **Display QR code in your app**
3. **User scans with mobile banking app**
4. **Payment confirmed automatically**

But this is **NOT currently implemented**. The current implementation uses internet banking redirect.

## Summary

**Question:** Do users need to rescan from iBanking app?

**Answer:** ❌ **NO**

- Users are redirected to bank's **website** (not mobile app)
- Users login to **internet banking website**
- No QR code scanning required
- No mobile banking app needed
- Everything happens in the **browser**

The payment flow is **web-based**, not app-based. Users just need to login to their bank's website and confirm the payment.
