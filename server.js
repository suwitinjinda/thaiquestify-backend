// server.js - FINAL CORRECTED VERSION
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const questTemplateRoutes = require('./routes/questTemplates');
const userRoutes = require('./routes/users');
const shopRoutes = require('./routes/shops');
const shopQuestsRoutes = require('./routes/shopQuests');
const partnerRoutes = require('./routes/partners');
const debugRoutes = require('./routes/debug');
const questRoutes = require('./routes/quests');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/quest-templates', questTemplateRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/shop/quests', shopQuestsRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/quests', questRoutes);

// Debug route to see all registered routes
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  
  res.json({
    message: 'Registered routes',
    routes: routes
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Thaiquestify API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint - UPDATED to include partner
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Thaiquestify API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      questTemplates: '/api/quest-templates',
      users: '/api/users',
      shop: '/api/shop',
      shopQuests: '/api/shop/quests',
      partner: '/api/partner', // ADDED
      quests: '/api/quests',
      health: '/api/health',
      debug: '/api/debug'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
  console.log(`👨‍💼 Partner API: http://localhost:${PORT}/api/partner`);
  console.log(`🐛 Debug routes: http://localhost:${PORT}/api/debug/routes`);
});