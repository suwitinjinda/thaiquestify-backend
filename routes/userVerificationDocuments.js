// routes/userVerificationDocuments.js
// User routes: upload and get own verification documents
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { uploadVerificationDocument, getSignedUrl } = require('../utils/gcpStorage');

const DOCUMENT_TYPES = {
  ID_CARD: 'id_card',
  BANK_BOOK: 'bank_book',
  FACE_PHOTO: 'face_photo',
};

/**
 * POST /api/user/verification-documents/upload
 * Upload verification document (บัตรประชาชน, หน้าบัญชี, รูปใบหน้า)
 */
router.post('/upload', auth, async (req, res) => {
  try {
    const { documentType, images } = req.body;
    const userId = req.user.id;

    if (!documentType || !['id_card', 'bank_book', 'face_photo'].includes(documentType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid documentType. Must be: id_card, bank_book, or face_photo',
      });
    }

    if (!Array.isArray(images) || images.length === 0 || !images[0]?.data) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Upload to GCP
    const imageData = images[0];
    const imageBuffer = Buffer.from(imageData.data, 'base64');
    const mimeType = imageData.mimeType || 'image/jpeg';
    const docType = documentType.toLowerCase();

    const gcpUrl = await uploadVerificationDocument(imageBuffer, userId, docType, mimeType);
    console.log(`✅ Uploaded ${docType} to GCP: ${gcpUrl}`);

    // Update user's verification document
    const docField = docType === 'id_card' ? 'idCard' : docType === 'bank_book' ? 'bankBook' : 'facePhoto';
    
    // Initialize verificationDocuments if not exists
    if (!user.verificationDocuments) {
      user.verificationDocuments = {
        idCard: { status: 'none' },
        bankBook: { status: 'none' },
        facePhoto: { status: 'none' },
        overallStatus: 'none',
      };
    }

    user.verificationDocuments[docField] = {
      url: gcpUrl,
      status: 'pending',
      uploadedAt: new Date(),
    };

    // Update overall status
    const hasPending = ['idCard', 'bankBook', 'facePhoto'].some(
      (field) => user.verificationDocuments[field]?.status === 'pending' && user.verificationDocuments[field]?.url
    );
    const allApproved = ['idCard', 'bankBook', 'facePhoto'].every(
      (field) => !user.verificationDocuments[field]?.url || user.verificationDocuments[field]?.status === 'approved'
    );
    const hasRejected = ['idCard', 'bankBook', 'facePhoto'].some(
      (field) => user.verificationDocuments[field]?.status === 'rejected' && user.verificationDocuments[field]?.url
    );
    const hasAnyDoc = ['idCard', 'bankBook', 'facePhoto'].some(
      (field) => user.verificationDocuments[field]?.url
    );

    if (allApproved && hasAnyDoc) {
      user.verificationDocuments.overallStatus = 'approved';
    } else if (hasPending) {
      user.verificationDocuments.overallStatus = 'pending';
    } else if (hasRejected) {
      user.verificationDocuments.overallStatus = 'rejected';
    } else if (hasAnyDoc) {
      user.verificationDocuments.overallStatus = 'partial';
    } else {
      user.verificationDocuments.overallStatus = 'none';
    }

    await user.save();

    // Return signed URL for frontend
    const signedUrl = await getSignedUrl(gcpUrl).catch(() => gcpUrl);

    res.json({
      success: true,
      url: signedUrl,
      message: 'Document uploaded successfully',
    });
  } catch (error) {
    console.error('❌ Error uploading verification document:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading document',
      error: error.message,
    });
  }
});

/**
 * GET /api/user/verification-documents
 * Get current user's verification documents and status
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('verificationDocuments');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const docs = user.verificationDocuments || {};
    const result = {};

    // Convert to camelCase for frontend
    if (docs.idCard?.url) {
      try {
        result.idCard = {
          url: await getSignedUrl(docs.idCard.url),
          status: docs.idCard.status || 'none',
        };
      } catch (e) {
        result.idCard = {
          url: docs.idCard.url,
          status: docs.idCard.status || 'none',
        };
      }
    }
    if (docs.bankBook?.url) {
      try {
        result.bankBook = {
          url: await getSignedUrl(docs.bankBook.url),
          status: docs.bankBook.status || 'none',
        };
      } catch (e) {
        result.bankBook = {
          url: docs.bankBook.url,
          status: docs.bankBook.status || 'none',
        };
      }
    }
    if (docs.facePhoto?.url) {
      try {
        result.facePhoto = {
          url: await getSignedUrl(docs.facePhoto.url),
          status: docs.facePhoto.status || 'none',
        };
      } catch (e) {
        result.facePhoto = {
          url: docs.facePhoto.url,
          status: docs.facePhoto.status || 'none',
        };
      }
    }

    result.overallStatus = docs.overallStatus || 'none';

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('❌ Error fetching verification documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching documents',
      error: error.message,
    });
  }
});

module.exports = router;
