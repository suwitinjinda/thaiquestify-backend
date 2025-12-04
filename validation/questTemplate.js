const createTemplateValidation = {
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(10).max(500).required(),
  type: Joi.string().valid('social_media', 'website_visit', 'content_creation', 'product_review', 'location_checkin').required(),
  instructions: Joi.string().min(20).max(2000).required(),
  verificationMethod: Joi.string().valid('screenshot', 'manual_review', 'link_click', 'api_verification', 'location_verification').required(),
  rewardPoints: Joi.number().integer().min(0).max(1000).required(),
  rewardAmount: Joi.number().min(0).max(1000).required(),
  category: Joi.string().min(2).max(50).required(),
  estimatedTime: Joi.number().integer().min(1).max(120).default(5),
  tags: Joi.array().items(Joi.string().min(1).max(20)),
  requiredData: Joi.object().default({})  // ADD this line
};