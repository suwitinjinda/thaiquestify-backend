# Quick Start: Scalability Optimizations

## 📦 Installation

```bash
cd thaiquestify-backend
npm install compression express-rate-limit
```

## 🚀 Implementation Steps

### 1. Add Compression Middleware

Edit `server.js` and add after CORS:

```javascript
// After line 30 (app.use(cors()))
const compression = require('./middleware/compression');
app.use(compression);
```

### 2. Add Rate Limiting

Edit `server.js` and add after compression:

```javascript
// After compression middleware
const { apiLimiter, authLimiter, uploadLimiter, orderLimiter } = require('./middleware/rateLimiter');

// Apply general API rate limiting
app.use('/api/', apiLimiter);

// Apply strict rate limiting to auth routes
app.use('/api/auth', authLimiter);

// Apply rate limiting to upload routes
app.use('/api/upload', uploadLimiter);
app.use('/api/shops/:id/upload', uploadLimiter);
app.use('/api/tourist-attractions/upload-images', uploadLimiter);

// Apply rate limiting to order creation
app.use('/api/orders', orderLimiter);
```

### 3. Add Database Indexes

```bash
node scripts/add-database-indexes.js
```

This will add all recommended indexes to improve query performance.

## ✅ Verification

After implementing:

1. **Test Compression:**
   ```bash
   curl -H "Accept-Encoding: gzip" -I https://thaiquestify.com/api/shops
   ```
   Should see `Content-Encoding: gzip` in response headers.

2. **Test Rate Limiting:**
   ```bash
   # Make 101 requests quickly
   for i in {1..101}; do curl https://thaiquestify.com/api/shops; done
   ```
   Should get rate limit error after 100 requests.

3. **Check Indexes:**
   ```bash
   # Connect to MongoDB
   mongo
   use thaiquestify
   db.users.getIndexes()
   db.orders.getIndexes()
   ```

## 📊 Expected Performance Improvements

- **API Response Time:** 20-40% faster (with compression)
- **Database Queries:** 50-80% faster (with indexes)
- **Server Load:** Reduced by 30-50% (with rate limiting)
- **Bandwidth Usage:** Reduced by 60-80% (with compression)

## 🔍 Monitoring

Monitor performance with PM2:

```bash
pm2 monit
```

Watch for:
- Response times
- Memory usage
- CPU usage
- Error rates
