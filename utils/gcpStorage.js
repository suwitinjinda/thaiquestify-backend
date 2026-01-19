// backend/utils/gcpStorage.js
// GCP Storage utility for uploading shop images

// Note: You need to install @google-cloud/storage:
// npm install @google-cloud/storage

const { Storage } = require('@google-cloud/storage');

// Initialize GCP Storage
// Options for authentication:
// 1. Use GOOGLE_APPLICATION_CREDENTIALS (path to service account key JSON file)
// 2. Use GCP_SERVICE_ACCOUNT_KEY (JSON string of service account credentials)
// 3. Use Application Default Credentials (if running on GCP)

function getStorageConfig() {
  const config = {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  };

  // Option 1: Use service account key from JSON string (recommended for serverless/containers)
  if (process.env.GCP_SERVICE_ACCOUNT_KEY) {
    try {
      const credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY);
      config.credentials = credentials;
      console.log('✅ Using GCP credentials from GCP_SERVICE_ACCOUNT_KEY');
    } catch (error) {
      console.error('❌ Error parsing GCP_SERVICE_ACCOUNT_KEY:', error);
      throw new Error('Invalid GCP_SERVICE_ACCOUNT_KEY format. Must be valid JSON string.');
    }
  }
  // Option 2: Use key file path
  else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    config.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    console.log('✅ Using GCP credentials from key file:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
  }
  // Option 3: Use Application Default Credentials (if running on GCP)
  else {
    console.log('⚠️  No GCP credentials found. Using Application Default Credentials (if available on GCP environment).');
    console.log('   For local development, set either:');
    console.log('   - GOOGLE_APPLICATION_CREDENTIALS (path to service account key file), or');
    console.log('   - GCP_SERVICE_ACCOUNT_KEY (JSON string of service account credentials)');
  }

  return config;
}

const storage = new Storage(getStorageConfig());

const BUCKET_NAME = process.env.GCP_BUCKET_NAME || 'thaiquestify-shop-images';

/**
 * Upload image to GCP bucket
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {String} fileName - File name (should include path like 'shops/shopId_image1.jpg')
 * @param {String} mimeType - MIME type (e.g., 'image/jpeg')
 * @returns {Promise<String>} Public URL of uploaded image
 */
async function uploadImage(imageBuffer, fileName, mimeType = 'image/jpeg') {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(fileName);

    // Upload file (without ACL - bucket uses Uniform bucket-level access)
    await file.save(imageBuffer, {
      metadata: {
        contentType: mimeType,
      },
      // Note: Removed 'public: true' and makePublic() because bucket uses Uniform bucket-level access
      // If bucket IAM policy allows public read, files will be accessible automatically
    });

    // Return public URL (assuming bucket IAM allows public read)
    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`;
    console.log(`✅ Image uploaded to GCP: ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    console.error('❌ Error uploading image to GCP:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Upload multiple images (up to 3)
 * @param {Array<{buffer: Buffer, mimeType: String}>} images - Array of image objects
 * @param {String} shopId - Shop ID for folder structure
 * @returns {Promise<Array<String>>} Array of public URLs
 */
async function uploadShopImages(images, shopId) {
  try {
    const uploadPromises = images.map((image, index) => {
      const fileName = `shops/${shopId}/image_${index + 1}_${Date.now()}.${getFileExtension(image.mimeType)}`;
      return uploadImage(image.buffer, fileName, image.mimeType);
    });

    const urls = await Promise.all(uploadPromises);
    console.log(`✅ Uploaded ${urls.length} images for shop ${shopId}`);
    
    return urls;
  } catch (error) {
    console.error('❌ Error uploading shop images:', error);
    throw error;
  }
}

/**
 * Get file extension from MIME type
 */
function getFileExtension(mimeType) {
  const extensions = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return extensions[mimeType] || 'jpg';
}

/**
 * Generate a signed URL for accessing a file (valid for 1 year)
 * @param {String} fileUrl - Full URL or file path
 * @returns {Promise<String>} Signed URL
 */
async function getSignedUrl(fileUrl) {
  try {
    if (!fileUrl || typeof fileUrl !== 'string') {
      console.warn('⚠️ Invalid fileUrl provided to getSignedUrl:', fileUrl);
      return fileUrl;
    }

    // Extract file path from URL
    let fileName;
    if (fileUrl.includes(`${BUCKET_NAME}/`)) {
      // URL contains bucket name: https://storage.googleapis.com/thaiquestify/shops/...
      fileName = fileUrl.split(`${BUCKET_NAME}/`)[1];
    } else if (fileUrl.includes('storage.googleapis.com/')) {
      // Full GCS URL: https://storage.googleapis.com/bucket-name/path
      const parts = fileUrl.split('storage.googleapis.com/')[1];
      fileName = parts.split('/').slice(1).join('/'); // Remove bucket name, keep path
    } else if (fileUrl.startsWith('shops/')) {
      // Already a path: shops/shopId/image.jpg
      fileName = fileUrl;
    } else {
      // Assume it's already a file path
      fileName = fileUrl;
    }

    if (!fileName) {
      console.warn('⚠️ Could not extract fileName from URL:', fileUrl);
      return fileUrl;
    }

    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(fileName);

    // Check if file exists (optional, but helps with debugging)
    const [exists] = await file.exists();
    if (!exists) {
      console.warn(`⚠️ File does not exist in bucket: ${fileName}`);
      return fileUrl; // Return original URL if file doesn't exist
    }

    // Generate signed URL valid for 1 year
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year from now
    });

    console.log(`✅ Generated signed URL for: ${fileName.substring(0, 50)}...`);
    return signedUrl;
  } catch (error) {
    console.error('❌ Error generating signed URL:', error);
    console.error('   URL:', fileUrl);
    // Return original URL if signed URL generation fails
    return fileUrl;
  }
}

/**
 * Generate signed URLs for multiple image URLs
 * @param {Array<String>} imageUrls - Array of image URLs
 * @returns {Promise<Array<String>>} Array of signed URLs
 */
async function getSignedUrls(imageUrls) {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return [];
  }

  try {
    const signedUrlPromises = imageUrls.map(url => getSignedUrl(url));
    const signedUrls = await Promise.all(signedUrlPromises);
    console.log(`✅ Generated ${signedUrls.length} signed URLs`);
    return signedUrls;
  } catch (error) {
    console.error('❌ Error generating signed URLs:', error);
    return imageUrls; // Return original URLs if generation fails
  }
}

/**
 * Delete image from GCP bucket
 * @param {String} fileUrl - Full URL or file path
 */
async function deleteImage(fileUrl) {
  try {
    // Extract file path from URL
    const fileName = fileUrl.includes(BUCKET_NAME) 
      ? fileUrl.split(`${BUCKET_NAME}/`)[1]
      : fileUrl;

    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(fileName);

    await file.delete();
    console.log(`✅ Deleted image from GCP: ${fileName}`);
  } catch (error) {
    console.error('❌ Error deleting image from GCP:', error);
    // Don't throw error for delete operations
  }
}

module.exports = {
  uploadImage,
  uploadShopImages,
  deleteImage,
  getSignedUrl,
  getSignedUrls,
};
