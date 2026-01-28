# How to Enable Payment Methods in Omise

## Important: "Capabilities" Section Not Visible

The "Settings → Capabilities" section **may not be visible** in your Omise dashboard. This is normal - payment methods are typically enabled by contacting Omise support directly.

## Step-by-Step Guide

### Step 1: Contact Omise Support

**Email**: support@omise.co

**Subject**: Request to Enable Payment Methods

**Email Template**:
```
Hello Omise Support,

I would like to request enabling the following payment methods for my Omise account:

1. Mobile Banking (for Thai banks: SCB, KBank, BBL, Krungsri, KTB)
2. Internet Banking (if available)
3. PromptPay (if available)

Account Email: [your-omise-account-email]
Use Case: Accepting payments for point purchases in my application

Thank you!
```

### Step 2: Wait for Response

Omise support will:
- Review your request
- Enable the payment methods
- Send you confirmation email
- May require you to accept new terms and conditions

### Step 3: Test Payment Methods

After payment methods are enabled:

1. **Test via API**:
   ```bash
   # Test mobile banking charge
   curl -X POST https://api.omise.co/charges \
     -u skey_test_xxxxx: \
     -d "amount=10000" \
     -d "currency=thb" \
     -d "source[type]=mobile_banking_scb"
   ```

2. **Check available methods**:
   - Try creating a charge with different source types
   - Check which ones work without errors
   - Review error messages for unavailable methods

### Step 4: Update Your Code

Once payment methods are enabled, your existing code should work automatically. The backend already uses:
- Mobile banking by default
- Proper error handling
- Webhook processing

## Alternative: Check Dashboard Settings

While "Capabilities" may not be visible, check these sections:

1. **Settings → General**
   - Look for payment method toggles
   - Check for any configuration options

2. **Settings → Third Party Integrations**
   - May show enabled payment gateways
   - Check for bank integrations

3. **Transactions → Charges**
   - Try creating a test charge
   - See which source types are available
   - Review error messages

## Test Mode vs Production Mode

**Test Mode**:
- Some payment methods may not be available
- Limited bank support
- Use for development only

**Production Mode**:
- Full payment method support
- Requires account verification
- Real payments processed

## Common Issues

### "type is no longer available"
- **Cause**: Payment method not enabled
- **Solution**: Contact Omise support to enable it

### "Payment method not supported"
- **Cause**: Method not available in your account type
- **Solution**: Request enablement or use alternative method

### "Invalid source type"
- **Cause**: Wrong source type name
- **Solution**: Check Omise documentation for correct source types

## Next Steps

1. ✅ **Contact Omise Support** - Request payment method enablement
2. ✅ **Wait for Confirmation** - Receive email from Omise
3. ✅ **Test Payment Flow** - Try buying points in your app
4. ✅ **Monitor Webhooks** - Check that payments are processed correctly

## Support Resources

- **Omise Support**: support@omise.co
- **Omise Documentation**: https://docs.omise.co
- **Omise Dashboard**: https://dashboard.omise.co
