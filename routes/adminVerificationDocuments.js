// routes/adminVerificationDocuments.js
// Admin routes: view pending, approve, reject verification documents
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');
const { getSignedUrl } = require('../utils/gcpStorage');
const {
  createVerificationApprovalNotification,
  createVerificationRejectionNotification,
} = require('../utils/notificationHelper');

/**
 * GET /api/admin/verification-documents/pending
 * Admin: Get list of users with pending verification documents
 */
router.get('/pending', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find({
      $or: [
        { 'verificationDocuments.idCard.status': 'pending' },
        { 'verificationDocuments.bankBook.status': 'pending' },
        { 'verificationDocuments.facePhoto.status': 'pending' },
        { 'verificationDocuments.overallStatus': 'pending' },
      ],
    })
      .select('name email phone nationalId bankAccount verificationDocuments')
      .lean();

    const pendingUsers = await Promise.all(
      users.map(async (user) => {
        const docs = user.verificationDocuments || {};
        const verificationDocuments = {};

        if (docs.idCard?.url) {
          try {
            verificationDocuments.idCard = {
              url: await getSignedUrl(docs.idCard.url),
              status: docs.idCard.status,
            };
          } catch (e) {
            verificationDocuments.idCard = {
              url: docs.idCard.url,
              status: docs.idCard.status,
            };
          }
        }
        if (docs.bankBook?.url) {
          try {
            verificationDocuments.bankBook = {
              url: await getSignedUrl(docs.bankBook.url),
              status: docs.bankBook.status,
            };
          } catch (e) {
            verificationDocuments.bankBook = {
              url: docs.bankBook.url,
              status: docs.bankBook.status,
            };
          }
        }
        if (docs.facePhoto?.url) {
          try {
            verificationDocuments.facePhoto = {
              url: await getSignedUrl(docs.facePhoto.url),
              status: docs.facePhoto.status,
            };
          } catch (e) {
            verificationDocuments.facePhoto = {
              url: docs.facePhoto.url,
              status: docs.facePhoto.status,
            };
          }
        }

        const result = {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          nationalId: user.nationalId || null, // เลขบัตรประชาชน
          bankAccount: user.bankAccount || null, // ข้อมูลธนาคาร (accountName, accountNumber, bankName, bankBranch)
          verificationDocuments,
          status: docs.overallStatus || 'none',
        };
        
        // Debug: Log to verify data is included
        if (result.nationalId || result.bankAccount) {
          console.log(`[Admin Verification] User ${result.email}:`, {
            hasNationalId: !!result.nationalId,
            hasBankAccount: !!result.bankAccount,
            bankAccountDetails: result.bankAccount ? {
              accountName: result.bankAccount.accountName,
              accountNumber: result.bankAccount.accountNumber ? '***' + result.bankAccount.accountNumber.slice(-4) : null,
              bankName: result.bankAccount.bankName,
            } : null,
          });
        }
        
        return result;
      })
    );

    res.json({
      success: true,
      data: pendingUsers,
    });
  } catch (error) {
    console.error('❌ Error fetching pending verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending verifications',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/verification-documents/:userId/approve
 * Admin: Approve user's verification documents
 */
router.post('/:userId/approve', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Initialize if not exists
    if (!user.verificationDocuments) {
      user.verificationDocuments = {
        idCard: { status: 'none' },
        bankBook: { status: 'none' },
        facePhoto: { status: 'none' },
        overallStatus: 'none',
      };
    }

    const docs = user.verificationDocuments;
    const now = new Date();

    // Approve all pending documents
    ['idCard', 'bankBook', 'facePhoto'].forEach((field) => {
      if (docs[field]?.status === 'pending' && docs[field]?.url) {
        docs[field].status = 'approved';
        docs[field].reviewedAt = now;
        docs[field].reviewedBy = adminId;
        docs[field].rejectionReason = null;
      }
    });

    // Update overall status
    const allApproved = ['idCard', 'bankBook', 'facePhoto'].every(
      (field) => !docs[field]?.url || docs[field]?.status === 'approved'
    );
    const hasAnyDoc = ['idCard', 'bankBook', 'facePhoto'].some((field) => docs[field]?.url);

    docs.overallStatus = allApproved && hasAnyDoc ? 'approved' : 'partial';
    user.verificationDocuments = docs;

    // If all documents are approved, verify bank account and ensure data is preserved
    if (allApproved && hasAnyDoc) {
      // Ensure bank account info is verified (data should already be set from KYC submission)
      if (user.bankAccount) {
        user.bankAccount.verified = true;
        user.bankAccount.verifiedAt = now;
        user.bankAccount.verifiedBy = adminId;
      }
      
      // Ensure national ID is preserved (should already be set from KYC submission)
      // The national ID is already saved during KYC submission, so we just verify it's there
      if (!user.nationalId) {
        console.warn(`⚠️ User ${userId} approved but nationalId is missing`);
      }
      
      // Create Omise recipient for future withdrawals
      if (user.bankAccount && process.env.OMISE_SECRET_KEY) {
        try {
          const paymentService = require('../services/paymentService');
          
          // Check if recipient already exists
          if (!user.bankAccount.omiseRecipientId) {
            console.log(`📝 Creating Omise recipient for user ${userId}...`);
            
            const recipient = await paymentService.createOrGetRecipient(
              user.bankAccount,
              user.email,
              user.nationalId // Use national ID as tax ID if available
            );
            
            // Store metadata if needed
            if (!user.bankAccount.metadata) {
              user.bankAccount.metadata = {};
            }
          }
          
          // Log recipient status
          console.log(`✅ Omise recipient for user ${userId}: ${recipient.id} (verified: ${recipient.verified}, active: ${recipient.active})`);
          
          // If recipient is not verified/active, log warning but don't fail
          if (!recipient.verified || !recipient.active) {
            console.warn(`⚠️ Omise recipient ${recipient.id} is not ready: verified=${recipient.verified}, active=${recipient.active}`);
            console.warn(`   Recipient will be verified by Omise automatically (usually within 24-48 hours)`);
          }
        } catch (omiseError) {
          console.error(`❌ Failed to create Omise recipient for user ${userId}:`, omiseError.message);
          // Don't fail the approval if Omise fails - admin can create recipient manually later
          // Store error in metadata for reference
          if (!user.bankAccount.metadata) {
            user.bankAccount.metadata = {};
          }
          user.bankAccount.metadata.omiseRecipientError = omiseError.message;
          user.bankAccount.metadata.omiseRecipientErrorAt = new Date();
        }
      } else if (!user.bankAccount) {
        console.warn(`⚠️ User ${userId} approved but no bank account information available for Omise recipient creation`);
      } else if (!process.env.OMISE_SECRET_KEY) {
        console.log(`ℹ️ Omise secret key not configured - skipping recipient creation`);
      }
      
      console.log(`✅ Verification approved for user ${userId}: nationalId=${user.nationalId ? user.nationalId.substring(0, 3) + '***' : 'missing'}, bankVerified=${user.bankAccount?.verified || false}, omiseRecipientId=${user.bankAccount?.omiseRecipientId || 'none'}`);
    }

    await user.save();

    // Send notification to user
    try {
      await createVerificationApprovalNotification(userId);
    } catch (notifError) {
      console.error('⚠️ Failed to send approval notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.json({
      success: true,
      message: 'Verification documents approved',
    });
  } catch (error) {
    console.error('❌ Error approving verification:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving verification',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/verification-documents/:userId/reject
 * Admin: Reject user's verification documents
 */
router.post('/:userId/reject', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = '' } = req.body;
    const adminId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Initialize if not exists
    if (!user.verificationDocuments) {
      user.verificationDocuments = {
        idCard: { status: 'none' },
        bankBook: { status: 'none' },
        facePhoto: { status: 'none' },
        overallStatus: 'none',
      };
    }

    const docs = user.verificationDocuments;
    const now = new Date();

    // Reject all pending documents
    ['idCard', 'bankBook', 'facePhoto'].forEach((field) => {
      if (docs[field]?.status === 'pending' && docs[field]?.url) {
        docs[field].status = 'rejected';
        docs[field].reviewedAt = now;
        docs[field].reviewedBy = adminId;
        docs[field].rejectionReason = reason || 'Document does not meet requirements';
      }
    });

    docs.overallStatus = 'rejected';
    user.verificationDocuments = docs;

    await user.save();

    // Send notification to user
    try {
      await createVerificationRejectionNotification(userId, reason || 'Document does not meet requirements');
    } catch (notifError) {
      console.error('⚠️ Failed to send rejection notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.json({
      success: true,
      message: 'Verification documents rejected',
    });
  } catch (error) {
    console.error('❌ Error rejecting verification:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting verification',
      error: error.message,
    });
  }
});

module.exports = router;
