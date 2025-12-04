// backend/middleware/facebookVerification.js
const axios = require('axios');

const verifyFacebookToken = async (accessToken, userId) => {
  try {
    // Verify token with Facebook
    const response = await axios.get(
      `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
    );
    
    const data = response.data.data;
    
    // Check if token is valid and for the correct user
    if (!data.is_valid || data.user_id !== userId) {
      return { isValid: false, error: 'Invalid Facebook token' };
    }
    
    // Check if token has required permissions
    if (!data.scopes || !data.scopes.includes('pages_show_list')) {
      return { 
        isValid: false, 
        error: 'Missing required permission: pages_show_list' 
      };
    }
    
    return { 
      isValid: true, 
      data: data 
    };
    
  } catch (error) {
    console.error('Facebook token verification error:', error);
    return { 
      isValid: false, 
      error: 'Failed to verify Facebook token' 
    };
  }
};

const verifyUserLikesPage = async (accessToken, pageId) => {
  try {
    // Check if user likes the page
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/me/likes/${pageId}?access_token=${accessToken}`
    );
    
    const data = response.data.data;
    const isFollowing = data && data.length > 0;
    
    return { 
      success: true, 
      isFollowing: isFollowing,
      pageId: pageId
    };
    
  } catch (error) {
    console.error('Facebook page like check error:', error);
    return { 
      success: false, 
      error: 'Failed to check page like status',
      isFollowing: false
    };
  }
};

module.exports = {
  verifyFacebookToken,
  verifyUserLikesPage
};