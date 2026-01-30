/**
 * Image proxy: stream GCP Storage images through the API so the app can load
 * them even when the bucket is private (avoids 403).
 * Only allows URLs for our shop images bucket.
 * Tries GCP Storage API first (works with private bucket when server has credentials), then axios.
 */
const express = require('express');
const axios = require('axios');
const router = express.Router();

const BUCKET_NAME = process.env.GCP_BUCKET_NAME || 'thaiquestify-shop-images';
const ALLOWED_PREFIX = `https://storage.googleapis.com/${BUCKET_NAME}/`;

function getFilePathFromUrl(decoded) {
  if (!decoded.startsWith(ALLOWED_PREFIX)) return null;
  return decoded.slice(ALLOWED_PREFIX.length).replace(/\?.*$/, '').trim();
}

router.get('/', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, message: 'Missing url query' });
    }
    const decoded = decodeURIComponent(url.trim());
    if (!decoded.startsWith(ALLOWED_PREFIX)) {
      return res.status(403).json({ success: false, message: 'URL not allowed' });
    }

    const filePath = getFilePathFromUrl(decoded);
    const ext = (decoded.replace(/\?.*$/, '').split('.').pop() || '').toLowerCase();
    const contentType = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' }[ext] || 'image/jpeg';

    if (filePath) {
      try {
        const { Storage } = require('@google-cloud/storage');
        const storage = new Storage(
          process.env.GCP_SERVICE_ACCOUNT_KEY ? { credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY) } :
            process.env.GOOGLE_APPLICATION_CREDENTIALS ? { keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS } : {}
        );
        const bucket = storage.bucket(BUCKET_NAME);
        const file = bucket.file(filePath);
        const [exists] = await file.exists().catch(() => [false]);
        if (exists) {
          const readStream = file.createReadStream();
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          readStream.pipe(res);
          return;
        }
      } catch (gcpErr) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Image proxy GCP stream failed, trying direct fetch:', gcpErr.message);
        }
      }
    }

    const response = await axios.get(decoded, {
      responseType: 'stream',
      timeout: 15000,
      maxRedirects: 3,
      validateStatus: (status) => status === 200,
    });
    const ct = response.headers['content-type'] || contentType;
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    response.data.pipe(res);
  } catch (err) {
    if (err.response?.status) {
      return res.status(err.response.status).json({ success: false, message: 'Upstream error' });
    }
    console.warn('Image proxy error:', err.message);
    res.status(502).json({ success: false, message: 'Failed to load image' });
  }
});

module.exports = router;
