# Omise Payment Methods - Current Status

## Issue: "type is no longer available"

This error occurs when trying to use payment methods that are:
1. **Not enabled in your Omise account**
2. **Deprecated by Omise**
3. **Not available in test mode**

## Current Implementation

### Internet Banking
- **Status**: ⚠️ **May not be available**
- **Supported Banks**:
  - `internet_banking_bay` - Bank of Ayudhya (Krungsri)
  - `internet_banking_bbl` - Bangkok Bank
- **Note**: These may not be enabled in your Omise test account

### Mobile Banking (Recommended)
- **Status**: ✅ **More widely supported**
- **Supported Banks**:
  - `mobile_banking_scb` - SCB Easy
  - `mobile_banking_kbank` - K PLUS (Kasikorn)
  - `mobile_banking_bbl` - Bualuang mBanking
  - `mobile_banking_bay` - KMA (Krungsri)
  - `mobile_banking_ktb` - KTB NEXT

## Solution

The code now uses **mobile banking by default** for all banks, as it's more widely supported.

## How to Enable Payment Methods in Omise

**Note**: The "Capabilities" section may not be visible in all Omise accounts. Payment methods are typically enabled by contacting Omise support.

### Method 1: Contact Omise Support (Recommended)

1. **Send an email to**: support@omise.co
2. **Request to enable**:
   - Mobile Banking (for SCB, KBank, BBL, Krungsri, KTB)
   - Internet Banking (if needed)
   - PromptPay (if needed)
3. **Include in your request**:
   - Your Omise account email
   - Which payment methods you need
   - Your use case (e.g., "Accepting payments for point purchases")

### Method 2: Check Dashboard Settings

1. **Go to Omise Dashboard**: https://dashboard.omise.co
2. **Check these sections**:
   - **Settings → General** - Check for payment method options
   - **Settings → Third Party Integrations** - May show enabled payment gateways
   - **Transactions → Charges** - Try creating a test charge to see available methods
3. **If "Capabilities" is not visible**: This is normal - contact support instead

### Method 3: Test Available Methods

You can test which payment methods are available by:
1. Creating a test charge via API
2. Checking which source types work
3. Reviewing error messages for unavailable methods

## Test Mode Limitations

Some payment methods may not be available in **test mode**. You may need to:
1. Contact Omise support to enable specific payment methods
2. Use production mode (requires account verification)
3. Use alternative payment methods that are available

## Current Code Behavior

- **All banks** → Uses mobile banking
- **Automatic fallback** → If one method fails, tries another
- **Error messages** → Clear feedback about which payment method failed

## Next Steps

1. **Check Omise Dashboard** → Verify which payment methods are enabled
2. **Contact Omise Support** → Request to enable mobile banking for your account
3. **Test with different banks** → Try SCB, KBank, BBL, etc.
4. **Check test vs production** → Some methods only work in production mode

## Alternative: Use PromptPay

If mobile banking is not available, consider using **PromptPay**:
- More widely available
- QR code scanning
- Works with most Thai banks
