// routes/privacy.js - Privacy Policy and Data Deletion endpoints for Facebook App Review

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Privacy Policy Page (HTML) - Serve from public folder
router.get('/privacy-policy', (req, res) => {
  const filePath = path.join(__dirname, '../public/privacy-policy.html');
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  
  // Fallback to inline HTML if file doesn't exist
  const html = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Privacy Policy - ThaiQuestify</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
          padding: 20px;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #1877F2;
          margin-bottom: 30px;
          font-size: 32px;
          border-bottom: 3px solid #1877F2;
          padding-bottom: 15px;
        }
        h2 {
          color: #1877F2;
          margin-top: 30px;
          margin-bottom: 15px;
          font-size: 24px;
        }
        h3 {
          color: #555;
          margin-top: 20px;
          margin-bottom: 10px;
          font-size: 18px;
        }
        p {
          margin-bottom: 15px;
          text-align: justify;
        }
        ul, ol {
          margin-left: 30px;
          margin-bottom: 15px;
        }
        li {
          margin-bottom: 8px;
        }
        .last-updated {
          color: #666;
          font-style: italic;
          margin-bottom: 20px;
        }
        .contact-info {
          background: #f0f4ff;
          padding: 20px;
          border-radius: 8px;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Privacy Policy - ThaiQuestify</h1>
        <p class="last-updated">Last Updated: January 12, 2025</p>

        <h2>1. Introduction</h2>
        <p>
          ThaiQuestify ("we", "our", or "us") is committed to protecting your privacy. 
          This Privacy Policy explains how we collect, use, disclose, and safeguard your 
          information when you use our mobile application and services.
        </p>

        <h2>2. Information We Collect</h2>
        
        <h3>2.1 Information You Provide</h3>
        <ul>
          <li><strong>Account Information:</strong> Name, email address, profile picture when you connect via Google or Facebook</li>
          <li><strong>Location Data:</strong> GPS coordinates when you use location-based features</li>
          <li><strong>Quest Data:</strong> Your quest participation, check-ins, and rewards</li>
        </ul>

        <h3>2.2 Information from Third-Party Services</h3>
        <ul>
          <li><strong>Google Account:</strong> Name, email, profile picture (if you connect Google)</li>
          <li><strong>Facebook Account:</strong> Name, email, profile picture, public posts (if you connect Facebook)</li>
          <li><strong>TikTok Account:</strong> Username, follower count, video count (if you connect TikTok)</li>
        </ul>

        <h3>2.3 Automatically Collected Information</h3>
        <ul>
          <li>Device information (device type, operating system)</li>
          <li>Usage data (features used, timestamps)</li>
          <li>Location data (when you enable location services)</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve our services</li>
          <li>Process and manage quests and rewards</li>
          <li>Verify check-ins and quest completion</li>
          <li>Send notifications about quests and rewards</li>
          <li>Respond to your inquiries and provide customer support</li>
          <li>Detect and prevent fraud or abuse</li>
        </ul>

        <h2>4. Data Sharing and Disclosure</h2>
        <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
        <ul>
          <li><strong>With Your Consent:</strong> When you connect third-party services (Google, Facebook, TikTok)</li>
          <li><strong>Service Providers:</strong> With trusted third-party services that help us operate our app</li>
          <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
        </ul>

        <h2>5. Data Security</h2>
        <p>
          We implement appropriate technical and organizational security measures to protect your 
          personal information. However, no method of transmission over the internet is 100% secure, 
          and we cannot guarantee absolute security.
        </p>

        <h2>6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal information</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Disconnect third-party integrations at any time</li>
          <li>Opt-out of certain data collection</li>
        </ul>

        <h2>7. Data Retention</h2>
        <p>
          We retain your personal information for as long as necessary to provide our services 
          and fulfill the purposes described in this policy. When you delete your account, 
          we will delete your personal information in accordance with our data deletion policy.
        </p>

        <h2>8. Third-Party Services</h2>
        <p>
          Our app integrates with third-party services (Google, Facebook, TikTok). These services 
          have their own privacy policies. We encourage you to review their privacy policies.
        </p>

        <h2>9. Children's Privacy</h2>
        <p>
          Our services are not intended for children under 13 years of age. We do not knowingly 
          collect personal information from children under 13.
        </p>

        <h2>10. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes 
          by posting the new Privacy Policy on this page and updating the "Last Updated" date.
        </p>

        <h2>11. Contact Us</h2>
        <div class="contact-info">
          <p><strong>ThaiQuestify</strong></p>
          <p>Email: <a href="mailto:munmun_back@hotmail.com">munmun_back@hotmail.com</a></p>
          <p>Website: <a href="https://thaiquestify.com">https://thaiquestify.com</a></p>
        </div>

        <h2>12. Data Deletion</h2>
        <p>
          To request deletion of your data, please visit: 
          <a href="https://thaiquestify.com/facebook/data-deletion">https://thaiquestify.com/facebook/data-deletion</a>
        </p>
        <p>
          You can also disconnect third-party integrations (Google, Facebook, TikTok) directly 
          from within the app settings.
        </p>
        <p>
          <strong>Facebook Data Deletion:</strong> If you connected via Facebook, you can request 
          data deletion through Facebook's settings. Our data deletion callback URL is:
          <br>
          <code style="background: #f5f5f5; padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 5px;">
            https://thaiquestify.com/facebook/data-deletion-callback
          </code>
        </p>
      </div>
    </body>
    </html>
  `;

  res.set('Content-Type', 'text/html; charset=UTF-8');
  res.status(200).send(html);
});

// Data Deletion Request Page (HTML)
router.get('/data-deletion', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Data Deletion Request - ThaiQuestify</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
          padding: 20px;
        }
        .container {
          max-width: 700px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #1877F2;
          margin-bottom: 20px;
          font-size: 28px;
        }
        .info-box {
          background: #f0f4ff;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #1877F2;
        }
        .steps {
          margin: 20px 0;
        }
        .steps ol {
          margin-left: 30px;
          margin-top: 10px;
        }
        .contact-info {
          background: #fff3cd;
          padding: 20px;
          border-radius: 8px;
          margin-top: 30px;
          border-left: 4px solid #ffc107;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Data Deletion Request</h1>
        
        <div class="info-box">
          <p><strong>How to Delete Your Data from ThaiQuestify</strong></p>
          <p>You can delete your data from ThaiQuestify in the following ways:</p>
        </div>

        <h2>Method 1: Delete from the App</h2>
        <div class="steps">
          <ol>
            <li>Open the ThaiQuestify app</li>
            <li>Go to Settings or Profile section</li>
            <li>Find "Delete Account" or "Remove Data" option</li>
            <li>Follow the instructions to delete your account and data</li>
          </ol>
        </div>

        <h2>Method 2: Disconnect Third-Party Integrations</h2>
        <div class="steps">
          <p>You can disconnect your connected accounts:</p>
          <ol>
            <li><strong>Google:</strong> Go to Settings → Disconnect Google</li>
            <li><strong>Facebook:</strong> Go to Settings → Disconnect Facebook</li>
            <li><strong>TikTok:</strong> Go to Settings → Disconnect TikTok</li>
          </ol>
          <p>Disconnecting will remove the associated data from our system.</p>
        </div>

        <h2>Method 3: Contact Us</h2>
        <div class="contact-info">
          <p><strong>Email us at:</strong></p>
          <p><a href="mailto:munmun_back@hotmail.com">munmun_back@hotmail.com</a></p>
          <p>Include the following information:</p>
          <ul style="margin-left: 30px; margin-top: 10px;">
            <li>Your email address or user ID</li>
            <li>Request for data deletion</li>
            <li>Confirmation of identity</li>
          </ul>
          <p style="margin-top: 15px;">We will process your request within 30 days.</p>
        </div>

        <h2>What Data Will Be Deleted?</h2>
        <ul style="margin-left: 30px; margin-top: 10px;">
          <li>Account information (name, email, profile picture)</li>
          <li>Quest participation history</li>
          <li>Location data</li>
          <li>Connected third-party account information</li>
        </ul>

        <p style="margin-top: 30px;">
          <strong>Note:</strong> Some anonymized data may be retained for analytical purposes 
          and cannot be associated with your identity.
        </p>
      </div>
    </body>
    </html>
  `;

  res.set('Content-Type', 'text/html; charset=UTF-8');
  res.status(200).send(html);
});

// Facebook Data Deletion Callback Endpoint
// This endpoint is called by Facebook when a user requests data deletion
// Reference: https://developers.facebook.com/docs/apps/delete-user-data
router.post('/data-deletion-callback', async (req, res) => {
  console.log('🔔 [DEBUG] ============================================');
  console.log('🔔 [DEBUG] Facebook Data Deletion Callback Received');
  console.log('🔔 [DEBUG] ============================================');
  console.log('   Method:', req.method);
  console.log('   Headers:', JSON.stringify(req.headers, null, 2));
  console.log('   Body:', JSON.stringify(req.body, null, 2));
  console.log('🔔 [DEBUG] ============================================');

  const { signed_request } = req.body;

  if (!signed_request) {
    console.error('❌ [DEBUG] Missing signed_request parameter');
    return res.status(400).json({
      error: 'Missing signed_request parameter'
    });
  }

  // Parse signed_request (Facebook sends data in signed_request format)
  // Format: base64url(header).base64url(payload)
  try {
    const parts = signed_request.split('.');
    if (parts.length !== 2) {
      throw new Error('Invalid signed_request format');
    }

    // Decode payload (we don't need to verify signature for this use case)
    const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
    const data = JSON.parse(payload);

    console.log('🔔 [DEBUG] Parsed signed_request:', JSON.stringify(data, null, 2));

    const userId = data.user_id;
    const confirmationCode = data.confirmation_code || `DEL_${Date.now()}`;

    if (!userId) {
      console.error('❌ [DEBUG] Missing user_id in signed_request');
      return res.status(400).json({
        error: 'Missing user_id in signed_request'
      });
    }

    // Find user by Facebook user ID
    const User = require('../models/User');
    const user = await User.findOne({
      'integrations.facebook.userId': userId
    });

    if (user) {
      console.log('✅ [DEBUG] User found for Facebook ID:', userId);
      console.log('   User ID:', user._id);
      console.log('   Email:', user.email);
      console.log('   Name:', user.name);

      // Delete Facebook integration data
      if (user.integrations?.facebook) {
        const oldFacebookData = { ...user.integrations.facebook };
        user.integrations.facebook = {
          connectedAt: null,
          userId: null,
          name: null,
          email: null,
          avatarUrl: null,
          profileUrl: null,
          accessToken: null,
          expiresAt: null,
          scope: null,
          accountType: null,
          stats: null,
          lastStatsUpdate: null,
        };
        await user.save();
        console.log('✅ [DEBUG] Facebook integration data deleted');
        console.log('   Old data:', JSON.stringify(oldFacebookData, null, 2));
      }

      // Return confirmation code to Facebook
      const response = {
        url: `https://thaiquestify.com/facebook/data-deletion?confirmation_code=${confirmationCode}`,
        confirmation_code: confirmationCode
      };

      console.log('✅ [DEBUG] Returning response to Facebook:', JSON.stringify(response, null, 2));

      return res.status(200).json(response);
    } else {
      console.log('⚠️ [DEBUG] User not found for Facebook ID:', userId);
      console.log('   This may mean the user has already deleted their data or never connected Facebook');

      // Return confirmation code even if user not found (user might have already deleted)
      const response = {
        url: `https://thaiquestify.com/facebook/data-deletion?confirmation_code=${confirmationCode}`,
        confirmation_code: confirmationCode
      };

      return res.status(200).json(response);
    }
  } catch (error) {
    console.error('❌ [DEBUG] Error processing data deletion callback:', error);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);

    return res.status(500).json({
      error: 'Failed to process data deletion request',
      message: error.message
    });
  }
});

// GET endpoint for data deletion callback (Facebook may use GET for testing)
router.get('/data-deletion-callback', async (req, res) => {
  console.log('🔔 [DEBUG] Facebook Data Deletion Callback (GET)');
  console.log('   Query:', JSON.stringify(req.query, null, 2));

  // Facebook typically uses POST, but handle GET for testing/verification
  return res.status(200).json({
    message: 'Data deletion callback endpoint is active',
    method: 'POST',
    info: 'Please use POST method with signed_request parameter',
    documentation: 'https://developers.facebook.com/docs/apps/delete-user-data'
  });
});

// Terms of Service Page (HTML)
router.get('/terms-of-service', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Terms of Service - ThaiQuestify</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
          padding: 20px;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #1877F2;
          margin-bottom: 30px;
          font-size: 32px;
          border-bottom: 3px solid #1877F2;
          padding-bottom: 15px;
        }
        h2 {
          color: #1877F2;
          margin-top: 30px;
          margin-bottom: 15px;
          font-size: 24px;
        }
        h3 {
          color: #555;
          margin-top: 20px;
          margin-bottom: 10px;
          font-size: 18px;
        }
        p {
          margin-bottom: 15px;
          text-align: justify;
        }
        ul, ol {
          margin-left: 30px;
          margin-bottom: 15px;
        }
        li {
          margin-bottom: 8px;
        }
        .last-updated {
          color: #666;
          font-style: italic;
          margin-bottom: 20px;
        }
        .contact-info {
          background: #f0f4ff;
          padding: 20px;
          border-radius: 8px;
          margin-top: 30px;
        }
        .warning-box {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Terms of Service - ThaiQuestify</h1>
        <p class="last-updated">Last Updated: January 12, 2025</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using ThaiQuestify ("we", "our", "us", or "the Service"), you accept and 
          agree to be bound by the terms and provision of this agreement. If you do not agree to 
          abide by the above, please do not use this service.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          ThaiQuestify is a mobile application that provides location-based quest and reward services. 
          Users can participate in quests, check in at tourist attractions, and earn rewards through 
          various activities and social media engagement.
        </p>

        <h2>3. User Accounts</h2>
        
        <h3>3.1 Account Creation</h3>
        <p>To use certain features of the Service, you must:</p>
        <ul>
          <li>Be at least 13 years of age (or the minimum age in your jurisdiction)</li>
          <li>Provide accurate, current, and complete information</li>
          <li>Maintain and update your information as necessary</li>
          <li>Maintain the security of your account credentials</li>
        </ul>

        <h3>3.2 Account Responsibilities</h3>
        <ul>
          <li>You are responsible for all activities that occur under your account</li>
          <li>You must notify us immediately of any unauthorized use</li>
          <li>You must not share your account credentials with others</li>
          <li>You must not create multiple accounts to circumvent restrictions</li>
        </ul>

        <h2>4. User Conduct</h2>
        
        <h3>4.1 Acceptable Use</h3>
        <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree NOT to:</p>
        <ul>
          <li>Violate any applicable laws or regulations</li>
          <li>Infringe upon the rights of others</li>
          <li>Submit false or misleading information</li>
          <li>Attempt to cheat, manipulate, or exploit the reward system</li>
          <li>Interfere with or disrupt the Service or servers</li>
          <li>Use automated systems or bots to access the Service</li>
          <li>Harass, threaten, or harm other users</li>
          <li>Impersonate any person or entity</li>
        </ul>

        <h3>4.2 Location Services</h3>
        <p>
          The Service uses location data to provide quest check-in features. By enabling location services, 
          you consent to the collection and use of your location data as described in our Privacy Policy.
        </p>

        <h2>5. Quests and Rewards</h2>
        
        <h3>5.1 Quest Participation</h3>
        <ul>
          <li>Quests may have specific requirements and eligibility criteria</li>
          <li>We reserve the right to modify, suspend, or terminate quests at any time</li>
          <li>Quest verification is at our sole discretion</li>
          <li>False or fraudulent quest completions may result in account suspension</li>
        </ul>

        <h3>5.2 Rewards</h3>
        <ul>
          <li>Rewards are subject to availability and may be limited</li>
          <li>Reward values and points are determined by us and may change without notice</li>
          <li>Rewards are non-transferable and may not be exchanged for cash</li>
          <li>We reserve the right to revoke rewards for violations of these Terms</li>
        </ul>

        <h2>6. Third-Party Integrations</h2>
        <p>
          The Service may integrate with third-party services (Google, Facebook, TikTok). By connecting 
          these services, you agree to their respective terms of service and privacy policies. We are 
          not responsible for the practices of third-party services.
        </p>

        <h2>7. Intellectual Property</h2>
        <p>
          The Service and its original content, features, and functionality are owned by ThaiQuestify and 
          are protected by international copyright, trademark, patent, trade secret, and other intellectual 
          property laws. You may not copy, modify, distribute, or create derivative works of the Service 
          without our express written permission.
        </p>

        <h2>8. Content and User Generated Content</h2>
        <ul>
          <li>You retain ownership of content you submit to the Service</li>
          <li>By submitting content, you grant us a license to use, display, and distribute your content</li>
          <li>You represent that you have the right to grant this license</li>
          <li>We reserve the right to remove any content that violates these Terms</li>
        </ul>

        <h2>9. Disclaimers</h2>
        <div class="warning-box">
          <p><strong>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
          EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, 
          FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</strong></p>
        </div>
        <p>We do not warrant that:</p>
        <ul>
          <li>The Service will be uninterrupted, secure, or error-free</li>
          <li>Defects will be corrected</li>
          <li>The Service is free of viruses or other harmful components</li>
        </ul>

        <h2>10. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, THAIQUESTIFY SHALL NOT BE LIABLE FOR ANY INDIRECT, 
          INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, 
          WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER 
          INTANGIBLE LOSSES.
        </p>

        <h2>11. Indemnification</h2>
        <p>
          You agree to indemnify, defend, and hold harmless ThaiQuestify and its officers, directors, 
          employees, and agents from and against any claims, liabilities, damages, losses, and expenses, 
          including reasonable attorneys' fees, arising out of or in any way connected with your access 
          to or use of the Service or violation of these Terms.
        </p>

        <h2>12. Termination</h2>
        <p>
          We may terminate or suspend your account and access to the Service immediately, without prior 
          notice or liability, for any reason, including if you breach these Terms. Upon termination, 
          your right to use the Service will immediately cease.
        </p>

        <h2>13. Changes to Terms</h2>
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
          If a revision is material, we will provide at least 30 days notice prior to any new terms 
          taking effect. What constitutes a material change will be determined at our sole discretion.
        </p>

        <h2>14. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of Thailand, without 
          regard to its conflict of law provisions. Any disputes arising under or in connection with these 
          Terms shall be subject to the exclusive jurisdiction of the courts of Thailand.
        </p>

        <h2>15. Severability</h2>
        <p>
          If any provision of these Terms is found to be unenforceable or invalid, that provision shall 
          be limited or eliminated to the minimum extent necessary so that these Terms shall otherwise 
          remain in full force and effect.
        </p>

        <h2>16. Contact Information</h2>
        <div class="contact-info">
          <p><strong>ThaiQuestify</strong></p>
          <p>Email: <a href="mailto:munmun_back@hotmail.com">munmun_back@hotmail.com</a></p>
          <p>Website: <a href="https://thaiquestify.com">https://thaiquestify.com</a></p>
        </div>

        <h2>17. Entire Agreement</h2>
        <p>
          These Terms constitute the entire agreement between you and ThaiQuestify regarding the use of 
          the Service and supersede all prior agreements and understandings.
        </p>

        <p style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
          By using ThaiQuestify, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
        </p>
      </div>
    </body>
    </html>
  `;

  res.set('Content-Type', 'text/html; charset=UTF-8');
  res.status(200).send(html);
});

module.exports = router;
