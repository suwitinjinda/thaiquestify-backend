// services/paymentService.js
// Payment gateway service for automating point purchases and withdrawals

// Omise SDK - Install with: npm install omise
const omise = require('omise')({
  publicKey: process.env.OMISE_PUBLIC_KEY,
  secretKey: process.env.OMISE_SECRET_KEY,
  omiseVersion: process.env.OMISE_API_VERSION || '2019-05-29'
});

/**
 * Create a charge for buying points
 * @param {number} amount - Amount in THB
 * @param {string} source - Payment source (token, internet_banking, etc.)
 * @param {string} returnUri - Return URL after payment
 * @returns {Promise} Omise charge object
 */
async function createCharge(amount, source, returnUri) {
  try {
    const charge = await omise.charges.create({
      amount: Math.round(amount * 100), // Convert to satang
      currency: 'thb',
      source: source,
      return_uri: returnUri,
      description: `Buy Points - ${amount} THB`
    });
    return charge;
  } catch (error) {
    console.error('Omise charge error:', error);
    throw error;
  }
}

/**
 * Get charge status
 * @param {string} chargeId - Omise charge ID
 * @returns {Promise} Charge object with status
 */
async function getChargeStatus(chargeId) {
  try {
    const charge = await omise.charges.retrieve(chargeId);
    return charge;
  } catch (error) {
    console.error('Omise retrieve error:', error);
    throw error;
  }
}

/**
 * Create internet banking charge
 * Note: Omise only supports 2 banks for internet banking:
 * - internet_banking_bay (Bank of Ayudhya/Krungsri)
 * - internet_banking_bbl (Bangkok Bank)
 * 
 * For other banks, use mobile banking instead
 * @param {number} amount - Amount in THB
 * @param {string} bank - Bank code (bay, bbl for internet banking)
 * @param {string} returnUri - Return URL
 * @returns {Promise} Charge object with authorize_uri
 */
async function createInternetBankingCharge(amount, bank, returnUri) {
  try {
    // Map bank codes to Omise source types
    const bankTypeMap = {
      'bay': 'internet_banking_bay',
      'bbl': 'internet_banking_bbl',
    };

    const sourceType = bankTypeMap[bank.toLowerCase()];
    if (!sourceType) {
      throw new Error(`Internet banking not supported for ${bank}. Supported banks: bay (Krungsri), bbl (Bangkok Bank)`);
    }

    const charge = await omise.charges.create({
      amount: Math.round(amount * 100),
      currency: 'thb',
      source: {
        type: sourceType,
        amount: Math.round(amount * 100)
      },
      return_uri: returnUri,
      description: `Buy Points - ${amount} THB`
    });
    return charge;
  } catch (error) {
    console.error('Omise internet banking error:', error);
    throw error;
  }
}

/**
 * Create mobile banking charge
 * Mobile banking supports more banks than internet banking
 * @param {number} amount - Amount in THB
 * @param {string} bank - Bank code (scb, kbank, bbl, bay, ktb)
 * @param {string} returnUri - Return URL
 * @returns {Promise} Charge object with authorize_uri
 */
async function createMobileBankingCharge(amount, bank, returnUri) {
  try {
    // Map bank codes to Omise mobile banking source types
    const bankTypeMap = {
      'scb': 'mobile_banking_scb',      // SCB Easy
      'kbank': 'mobile_banking_kbank',   // K PLUS
      'bbl': 'mobile_banking_bbl',       // Bualuang mBanking
      'bay': 'mobile_banking_bay',       // KMA (Krungsri)
      'ktb': 'mobile_banking_ktb',       // KTB NEXT
    };

    const sourceType = bankTypeMap[bank.toLowerCase()];
    if (!sourceType) {
      throw new Error(`Mobile banking not supported for ${bank}. Supported banks: scb, kbank, bbl, bay, ktb`);
    }

    const charge = await omise.charges.create({
      amount: Math.round(amount * 100),
      currency: 'thb',
      source: {
        type: sourceType,
        amount: Math.round(amount * 100)
      },
      return_uri: returnUri,
      description: `Buy Points - ${amount} THB`
    });
    return charge;
  } catch (error) {
    console.error('Omise mobile banking error:', error);
    // Provide more detailed error information
    if (error.code === 'bad_request' && error.message && error.message.includes('no longer available')) {
      throw new Error(`Mobile banking (${sourceType}) is not available. This payment method may not be enabled in your Omise account. Please contact Omise support or use a different bank.`);
    }
    throw error;
  }
}

/**
 * Verify webhook signature (security)
 * Note: Omise doesn't currently send webhook signatures in headers.
 * This function implements HMAC-SHA256 verification for future compatibility
 * and for other payment gateways that may use signatures.
 * 
 * For Omise, we recommend verifying webhooks by making an API call to
 * verify the event status independently (see verifyWebhookEvent below).
 * 
 * @param {string} signature - Webhook signature from header (x-omise-signature)
 * @param {string|Buffer} payload - Raw request body (must be raw bytes, not parsed JSON)
 * @param {string} secretKey - Secret key for HMAC (defaults to OMISE_SECRET_KEY)
 * @returns {boolean|null} True if valid, false if invalid, null if signature not provided or can't verify
 */
function verifyWebhookSignature(signature, payload, secretKey = null) {
  // If no signature provided, return null (not an error - just not verified)
  if (!signature) {
    return null;
  }

  // If no secret key, can't verify
  const key = secretKey || process.env.OMISE_SECRET_KEY;
  if (!key) {
    console.warn('⚠️ Cannot verify webhook signature: No secret key provided');
    return null;
  }

  try {
    const crypto = require('crypto');
    
    // Convert payload to buffer if it's a string
    const payloadBuffer = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');
    
    // Compute HMAC-SHA256 signature (try both hex and base64 formats)
    const computedHex = crypto
      .createHmac('sha256', key)
      .update(payloadBuffer)
      .digest('hex');
    
    const computedBase64 = crypto
      .createHmac('sha256', key)
      .update(payloadBuffer)
      .digest('base64');
    
    // Try to match signature in hex format
    try {
      const signatureBuffer = Buffer.from(signature, 'hex');
      const computedBuffer = Buffer.from(computedHex, 'hex');
      if (signatureBuffer.length === computedBuffer.length) {
        const isValid = crypto.timingSafeEqual(signatureBuffer, computedBuffer);
        if (isValid) {
          return true;
        }
      }
    } catch (e) {
      // Signature might not be hex, try base64
    }
    
    // Try to match signature in base64 format
    try {
      const signatureBuffer = Buffer.from(signature, 'base64');
      const computedBuffer = Buffer.from(computedBase64, 'base64');
      if (signatureBuffer.length === computedBuffer.length) {
        const isValid = crypto.timingSafeEqual(signatureBuffer, computedBuffer);
        if (isValid) {
          return true;
        }
      }
    } catch (e) {
      // Signature might not be base64 either
    }
    
    // Try direct string comparison (some systems send plain hex/base64 strings)
    if (signature === computedHex || signature === computedBase64) {
      return true;
    }
    
    // Signature doesn't match
    console.warn('⚠️ Webhook signature does not match');
    return false;
  } catch (error) {
    console.error('❌ Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Verify webhook event by making API call (Omise recommended approach)
 * This is the recommended way to verify Omise webhooks - make an API call
 * to verify the event status independently.
 * 
 * @param {Object} event - Webhook event object
 * @returns {Promise<boolean>} True if event is valid
 */
async function verifyWebhookEvent(event) {
  try {
    if (!event || !event.key || !event.data) {
      return false;
    }

    // For charge events, verify by retrieving the charge
    if (event.key.startsWith('charge.')) {
      const chargeId = event.data.id;
      if (chargeId) {
        const charge = await getChargeStatus(chargeId);
        // Verify the charge exists and status matches
        return charge && charge.id === chargeId;
      }
    }

    // For transfer events, verify by retrieving the transfer
    if (event.key.startsWith('transfer.')) {
      const transferId = event.data.id;
      if (transferId) {
        const transfer = await getTransferStatus(transferId);
        // Verify the transfer exists
        return transfer && transfer.id === transferId;
      }
    }

    // For other event types, we can't easily verify via API
    // Return true but log that we're trusting the webhook
    console.log(`ℹ️ Webhook event ${event.key} - cannot verify via API, trusting webhook`);
    return true;
  } catch (error) {
    console.error('❌ Webhook event verification error:', error);
    return false;
  }
}

/**
 * Create or get Omise recipient for bank account
 * @param {Object} bankAccount - Bank account details
 * @param {string} bankAccount.accountName - Account holder name
 * @param {string} bankAccount.accountNumber - Account number
 * @param {string} bankAccount.bankName - Bank name (scb, bbl, kbank, etc.)
 * @param {string} email - User email
 * @param {string} taxId - Tax ID (optional, for corporation)
 * @returns {Promise} Omise recipient object
 */
async function createOrGetRecipient(bankAccount, email, taxId = null) {
  try {
    // Map bank names to Omise bank codes
    const bankCodeMap = {
      'scb': 'scb',
      'bbl': 'bbl',
      'bangkok bank': 'bbl',
      'kbank': 'kbank',
      'kasikorn': 'kbank',
      'bay': 'bay',
      'krungsri': 'bay',
      'ktb': 'ktb',
      'krung thai': 'ktb',
      'tmb': 'tmb',
      'thanachart': 'tmb',
      'ttb': 'ttb',
      'tisco': 'ttb',
      'uob': 'uob',
      'cimb': 'cimb',
      'ghb': 'ghb',
      'gsb': 'gsb',
    };

    const bankCode = bankCodeMap[bankAccount.bankName?.toLowerCase()] || 'bbl';
    
    // Check if recipient already exists (by email and account number)
    // Also check by name and account number in case email differs
    const recipients = await omise.recipients.list();
    
    // Try to find existing recipient by multiple criteria
    let existingRecipient = recipients.data.find(
      r => r.email === email && 
           r.bank_account?.number === bankAccount.accountNumber
    );
    
    // If not found by email+account, try by name+account
    if (!existingRecipient) {
      existingRecipient = recipients.data.find(
        r => r.name === bankAccount.accountName && 
             r.bank_account?.number === bankAccount.accountNumber
      );
    }
    
    // If existing recipient found (regardless of verification status), return it
    if (existingRecipient) {
      console.log(`✅ Found existing Omise recipient: ${existingRecipient.id} (verified: ${existingRecipient.verified}, active: ${existingRecipient.active})`);
      return existingRecipient;
    }

    // No existing recipient found - create new one
    console.log(`📝 Creating new Omise recipient for ${email} (${bankAccount.accountName})`);
    const recipient = await omise.recipients.create({
      name: bankAccount.accountName,
      email: email,
      type: taxId ? 'corporation' : 'individual',
      tax_id: taxId,
      bank_account: {
        brand: bankCode,
        number: bankAccount.accountNumber,
        name: bankAccount.accountName
      },
      description: `Withdrawal recipient for ${email}`
    });

    console.log(`✅ Created new Omise recipient: ${recipient.id}`);
    return recipient;
  } catch (error) {
    console.error('Omise recipient error:', error);
    throw error;
  }
}

/**
 * Check and handle recipient status (verify/activate if needed)
 * @param {string} recipientId - Omise recipient ID
 * @returns {Promise} Recipient object with status info
 */
async function checkRecipientStatus(recipientId) {
  try {
    const recipient = await omise.recipients.retrieve(recipientId);
    
    const status = {
      id: recipient.id,
      name: recipient.name,
      email: recipient.email,
      verified: recipient.verified,
      active: recipient.active,
      verifiedAt: recipient.verified_at,
      activatedAt: recipient.activated_at,
      failureCode: recipient.failure_code,
      canReceiveTransfers: recipient.verified && recipient.active,
      issues: []
    };

    if (!recipient.verified) {
      status.issues.push('Recipient is not verified. Omise needs to verify the bank account.');
    }

    if (!recipient.active) {
      status.issues.push('Recipient is not active. The recipient account is inactive.');
    }

    if (recipient.failure_code) {
      status.issues.push(`Recipient creation failed: ${recipient.failure_code}`);
    }

    return status;
  } catch (error) {
    console.error('Omise check recipient status error:', error);
    throw error;
  }
}

/**
 * Manually verify a recipient (for testing or manual verification)
 * Note: This endpoint is available in Omise API
 * @param {string} recipientId - Omise recipient ID
 * @returns {Promise} Updated recipient object
 */
async function verifyRecipient(recipientId) {
  try {
    const recipient = await omise.recipients.verify(recipientId);
    console.log(`✅ Recipient ${recipientId} verified manually`);
    return recipient;
  } catch (error) {
    console.error('Omise verify recipient error:', error);
    throw error;
  }
}

/**
 * Create payout for withdrawal (Omise Payout API)
 * @param {number} amount - Amount in THB
 * @param {string} recipientId - Omise recipient ID
 * @returns {Promise} Transfer object
 */
async function createPayout(amount, recipientId) {
  try {
    // Check recipient status first
    const recipient = await omise.recipients.retrieve(recipientId);
    
    if (!recipient.verified) {
      throw new Error('Recipient is not verified. Please verify the bank account first.');
    }

    if (!recipient.active) {
      throw new Error('Recipient is not active.');
    }

    // Create transfer
    const transfer = await omise.transfers.create({
      amount: Math.round(amount * 100), // Convert to satang
      recipient: recipientId
    });

    // Log transfer details for debugging
    console.log(`📤 Omise transfer created: ${transfer.id}, status: ${transfer.status || 'undefined'}, paid: ${transfer.paid || false}, sent: ${transfer.sent || false}, sendable: ${transfer.sendable || false}`);

    // For test mode: mark as sent immediately if requested
    if (markAsSent && process.env.OMISE_SECRET_KEY && process.env.OMISE_SECRET_KEY.includes('_test_')) {
      try {
        const markedTransfer = await markTransferAsSent(transfer.id);
        console.log(`✅ Test mode: Marked transfer ${transfer.id} as sent immediately`);
        return markedTransfer;
      } catch (markError) {
        console.warn(`⚠️ Could not mark transfer as sent:`, markError.message);
        // Return original transfer if marking fails
        return transfer;
      }
    }
    
    return transfer;
  } catch (error) {
    console.error('Omise payout error:', error);
    throw error;
  }
}

/**
 * Get transfer status
 * @param {string} transferId - Omise transfer ID
 * @returns {Promise} Transfer object with status
 */
async function getTransferStatus(transferId) {
  try {
    const transfer = await omise.transfers.retrieve(transferId);
    return transfer;
  } catch (error) {
    console.error('Omise transfer retrieve error:', error);
    throw error;
  }
}

/**
 * Get Omise balance
 * @returns {Promise} Balance object
 */
async function getBalance() {
  try {
    const balance = await omise.balance.retrieve();
    return balance;
  } catch (error) {
    console.error('Omise balance error:', error);
    throw error;
  }
}

/**
 * Mark a transfer as sent (test mode only)
 * Uses Omise API endpoint directly via HTTP request
 * @param {string} transferId - Omise transfer ID
 * @returns {Promise} Updated transfer object
 */
async function markTransferAsSent(transferId) {
  try {
    // Only allow in test mode
    if (process.env.OMISE_SECRET_KEY && !process.env.OMISE_SECRET_KEY.includes('_test_')) {
      throw new Error('mark_as_sent is only available in test mode');
    }

    // Use HTTP request to call Omise API endpoint
    const https = require('https');
    const url = require('url');
    
    const apiUrl = url.parse(`https://api.omise.co/transfers/${transferId}/mark_as_sent`);
    const auth = Buffer.from(`${process.env.OMISE_SECRET_KEY}:`).toString('base64');

    return new Promise((resolve, reject) => {
      const options = {
        hostname: apiUrl.hostname,
        path: apiUrl.path,
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Omise-Version': process.env.OMISE_API_VERSION || '2019-05-29'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const transfer = JSON.parse(data);
              console.log(`✅ Marked transfer ${transferId} as sent`);
              resolve(transfer);
            } catch (parseError) {
              reject(new Error(`Failed to parse response: ${parseError.message}`));
            }
          } else {
            reject(new Error(`Omise API error: ${res.statusCode} - ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  } catch (error) {
    console.error('Omise mark transfer as sent error:', error);
    throw error;
  }
}

/**
 * Mark a transfer as paid (test mode only)
 * Uses Omise API endpoint directly via HTTP request
 * @param {string} transferId - Omise transfer ID
 * @returns {Promise} Updated transfer object
 */
async function markTransferAsPaid(transferId) {
  try {
    // Only allow in test mode
    if (process.env.OMISE_SECRET_KEY && !process.env.OMISE_SECRET_KEY.includes('_test_')) {
      throw new Error('mark_as_paid is only available in test mode');
    }

    // Use HTTP request to call Omise API endpoint
    const https = require('https');
    const url = require('url');
    
    const apiUrl = url.parse(`https://api.omise.co/transfers/${transferId}/mark_as_paid`);
    const auth = Buffer.from(`${process.env.OMISE_SECRET_KEY}:`).toString('base64');

    return new Promise((resolve, reject) => {
      const options = {
        hostname: apiUrl.hostname,
        path: apiUrl.path,
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Omise-Version': process.env.OMISE_API_VERSION || '2019-05-29'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const transfer = JSON.parse(data);
              console.log(`✅ Marked transfer ${transferId} as paid`);
              resolve(transfer);
            } catch (parseError) {
              reject(new Error(`Failed to parse response: ${parseError.message}`));
            }
          } else {
            reject(new Error(`Omise API error: ${res.statusCode} - ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  } catch (error) {
    console.error('Omise mark transfer as paid error:', error);
    throw error;
  }
}

/**
 * Get recipient information including bank account details
 * @param {string} recipientId - Omise recipient ID
 * @returns {Promise} Recipient object with bank account info
 */
async function getRecipientInfo(recipientId) {
  try {
    const recipient = await omise.recipients.retrieve(recipientId);
    return recipient;
  } catch (error) {
    console.error('Omise get recipient error:', error);
    throw error;
  }
}

/**
 * Get bank account information from recipient
 * @param {string} recipientId - Omise recipient ID
 * @returns {Promise} Bank account object with formatted info
 */
async function getRecipientBankAccount(recipientId) {
  try {
    const recipient = await omise.recipients.retrieve(recipientId);
    
    if (!recipient.bank_account) {
      throw new Error('Recipient does not have bank account information');
    }

    // Map bank codes to bank names
    const bankNameMap = {
      'scb': 'SCB (Siam Commercial Bank)',
      'bbl': 'Bangkok Bank',
      'kbank': 'Kasikorn Bank',
      'bay': 'Krungsri (Bank of Ayudhya)',
      'ktb': 'Krung Thai Bank',
      'tmb': 'TMB Thanachart Bank',
      'ttb': 'Tisco Bank',
      'uob': 'UOB',
      'cimb': 'CIMB Thai',
      'ghb': 'Government Housing Bank',
      'gsb': 'Government Savings Bank',
    };

    const bankAccount = recipient.bank_account;
    const bankName = bankNameMap[bankAccount.brand] || bankAccount.brand;

    return {
      recipientId: recipient.id,
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      recipientType: recipient.type,
      verified: recipient.verified,
      active: recipient.active,
      bankAccount: {
        brand: bankAccount.brand,
        bankName: bankName,
        accountNumber: bankAccount.number,
        accountName: bankAccount.name,
        lastDigits: bankAccount.number ? bankAccount.number.slice(-4) : null,
      },
      metadata: {
        description: recipient.description,
        createdAt: recipient.created_at,
        verifiedAt: recipient.verified_at,
      }
    };
  } catch (error) {
    console.error('Omise get recipient bank account error:', error);
    throw error;
  }
}

/**
 * Supported banks for internet banking (Omise only supports 2)
 */
const INTERNET_BANKING_BANKS = {
  bay: 'Bank of Ayudhya (Krungsri)',
  bbl: 'Bangkok Bank',
};

/**
 * Supported banks for mobile banking (more options)
 */
const MOBILE_BANKING_BANKS = {
  scb: 'SCB Easy',
  kbank: 'K PLUS (Kasikorn)',
  bbl: 'Bualuang mBanking',
  bay: 'KMA (Krungsri)',
  ktb: 'KTB NEXT',
};

/**
 * All supported banks (combines internet and mobile banking)
 */
const SUPPORTED_BANKS = {
  ...INTERNET_BANKING_BANKS,
  ...MOBILE_BANKING_BANKS,
};

module.exports = {
  createCharge,
  getChargeStatus,
  createInternetBankingCharge,
  createMobileBankingCharge,
  verifyWebhookSignature,
  verifyWebhookEvent,
  createPayout,
  markTransferAsSent,
  markTransferAsPaid,
  createOrGetRecipient,
  getRecipientInfo,
  getRecipientBankAccount,
  getTransferStatus,
  getBalance,
  checkRecipientStatus,
  verifyRecipient,
  SUPPORTED_BANKS,
  INTERNET_BANKING_BANKS,
  MOBILE_BANKING_BANKS,
};
