# Production Deployment Guide

## Overview

This guide covers deploying the qmemory utility library in production environments with Express.js applications requiring MongoDB document operations, HTTP utilities, and user management.

## Production Checklist

### Environment Setup
- [ ] Node.js 18+ installed
- [ ] MongoDB 4.4+ accessible
- [ ] Environment variables configured
- [ ] SSL/TLS certificates for HTTPS
- [ ] Process manager (PM2/systemd) configured

### Security Configuration
- [ ] MongoDB connection uses authentication
- [ ] Database users have minimal required permissions
- [ ] Connection strings use SSL/TLS
- [ ] No development logging in production
- [ ] Input validation on all API endpoints

### Performance Optimization
- [ ] MongoDB indexes created for user queries
- [ ] Connection pooling configured
- [ ] Error handling includes circuit breakers
- [ ] Monitoring and health checks implemented

## Environment Variables

### Required Production Variables
```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/production-db?ssl=true
NODE_ENV=production

# Optional: Connection Pool Settings
MONGODB_MAX_POOL_SIZE=10
MONGODB_SERVER_SELECTION_TIMEOUT=5000
MONGODB_SOCKET_TIMEOUT=45000
```

### Development Override
```bash
NODE_ENV=development
# MongoDB not required - uses MemStorage automatically
```

## MongoDB Production Setup

### Database Schema Recommendations
```javascript
// User-owned document schema example
const DocumentSchema = new mongoose.Schema({
  username: { type: String, required: true, index: true },
  title: { type: String, required: true },
  content: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index for user ownership + uniqueness
DocumentSchema.index({ username: 1, title: 1 }, { unique: true });
// Performance index for user document listing
DocumentSchema.index({ username: 1, createdAt: -1 });
```

### Connection Configuration
```javascript
const mongoose = require('mongoose');

// Production connection with robust error handling
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10,
  serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT) || 5000,
  socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 45000,
  family: 4 // Use IPv4, skip trying IPv6
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});
```

## Express.js Integration

### Production Server Setup
```javascript
const express = require('express');
const {
  createUserDoc,
  updateUserDoc,
  fetchUserDocOr404,
  deleteUserDocOr404,
  listUserDocs,
  sendNotFound,
  sendConflict,
  sendInternalServerError,
  ensureMongoDB
} = require('qmemory');

const app = express();
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  if (ensureMongoDB(res)) {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  }
  // ensureMongoDB automatically sends 503 if database is down
});

// Document CRUD operations with error handling
app.post('/api/users/:username/documents', async (req, res) => {
  try {
    const doc = await createUserDoc(
      DocumentModel,
      req.params.username,
      req.body,
      { username: req.params.username, title: req.body.title },
      res,
      'Document with this title already exists'
    );
    
    if (!doc) return; // createUserDoc already sent error response
    
    res.status(201).json(doc);
  } catch (error) {
    console.error('Document creation error:', error);
    return sendInternalServerError(res, 'Failed to create document');
  }
});

app.get('/api/users/:username/documents', async (req, res) => {
  try {
    const docs = await listUserDocs(
      DocumentModel, 
      req.params.username,
      { createdAt: -1 }
    );
    res.json(docs);
  } catch (error) {
    console.error('Document listing error:', error);
    return sendInternalServerError(res, 'Failed to retrieve documents');
  }
});

app.get('/api/users/:username/documents/:id', async (req, res) => {
  try {
    const doc = await fetchUserDocOr404(
      DocumentModel,
      req.params.id,
      req.params.username,
      res,
      'Document not found'
    );
    
    if (!doc) return; // fetchUserDocOr404 already sent 404
    
    res.json(doc);
  } catch (error) {
    console.error('Document fetch error:', error);
    return sendInternalServerError(res, 'Failed to retrieve document');
  }
});

app.put('/api/users/:username/documents/:id', async (req, res) => {
  try {
    const doc = await updateUserDoc(
      DocumentModel,
      req.params.id,
      req.params.username,
      req.body,
      { username: req.params.username, title: req.body.title },
      res,
      'Document with this title already exists'
    );
    
    if (!doc) return; // updateUserDoc already sent error response
    
    res.json(doc);
  } catch (error) {
    console.error('Document update error:', error);
    return sendInternalServerError(res, 'Failed to update document');
  }
});

app.delete('/api/users/:username/documents/:id', async (req, res) => {
  try {
    const doc = await deleteUserDocOr404(
      DocumentModel,
      req.params.id,
      req.params.username,
      res,
      'Document not found'
    );
    
    if (!doc) return; // deleteUserDocOr404 already sent 404
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Document deletion error:', error);
    return sendInternalServerError(res, 'Failed to delete document');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Error Handling Strategy

### Database Connection Failures
```javascript
// Circuit breaker pattern for database operations
let dbFailureCount = 0;
const MAX_FAILURES = 5;
const CIRCUIT_RESET_TIME = 60000; // 1 minute

function withCircuitBreaker(operation) {
  return async (...args) => {
    if (dbFailureCount >= MAX_FAILURES) {
      const timeSinceLastFailure = Date.now() - lastFailureTime;
      if (timeSinceLastFailure < CIRCUIT_RESET_TIME) {
        throw new Error('Database circuit breaker open');
      }
      dbFailureCount = 0; // Reset circuit breaker
    }
    
    try {
      const result = await operation(...args);
      dbFailureCount = 0; // Reset on success
      return result;
    } catch (error) {
      dbFailureCount++;
      lastFailureTime = Date.now();
      throw error;
    }
  };
}
```

### Graceful Shutdown
```javascript
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Close database connections
  await mongoose.connection.close();
  
  // Close HTTP server
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});
```

## Monitoring and Observability

### Health Check Implementation
```javascript
app.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: false,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  };
  
  // Database connectivity check
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      health.checks.database = true;
    }
  } catch (error) {
    health.checks.database = false;
    health.status = 'degraded';
  }
  
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

### Performance Metrics
```javascript
// Request duration tracking
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});
```

## Deployment Platforms

### Replit Deployment
```bash
# Configure environment variables in Replit Secrets
MONGODB_URI=your_production_mongodb_uri
NODE_ENV=production

# Deploy using Replit's deployment feature
# The app will automatically serve on port 5000
```

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

USER node

CMD ["node", "server.js"]
```

### PM2 Process Management
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'qmemory-app',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

## Security Best Practices

### Input Validation
```javascript
const { body, param, validationResult } = require('express-validator');

// Validation middleware
const validateDocumentCreation = [
  param('username').isAlphanumeric().isLength({ min: 3, max: 30 }),
  body('title').isString().isLength({ min: 1, max: 200 }).trim(),
  body('content').optional().isString().isLength({ max: 10000 }).trim(),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

app.post('/api/users/:username/documents', validateDocumentCreation, async (req, res) => {
  // Document creation logic
});
```

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const createDocumentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many document creation attempts'
});

app.post('/api/users/:username/documents', createDocumentLimiter, async (req, res) => {
  // Document creation logic
});
```

## Performance Optimization

### Database Indexing Strategy
```javascript
// Essential indexes for production performance
await DocumentModel.collection.createIndex({ username: 1, createdAt: -1 });
await DocumentModel.collection.createIndex({ username: 1, title: 1 }, { unique: true });
await DocumentModel.collection.createIndex({ username: 1, updatedAt: -1 });
```

### Caching Strategy
```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

// Cache frequently accessed documents
app.get('/api/users/:username/documents/:id', async (req, res) => {
  const cacheKey = `doc:${req.params.username}:${req.params.id}`;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return res.json(cached);
  }
  
  const doc = await fetchUserDocOr404(/* ... */);
  if (doc) {
    cache.set(cacheKey, doc);
  }
  
  res.json(doc);
});
```

## Troubleshooting Guide

### Common Issues

#### Database Connection Timeouts
- Check network connectivity to MongoDB
- Verify connection string format
- Increase serverSelectionTimeoutMS if needed
- Check MongoDB server status and logs

#### Memory Usage Growth
- Monitor MemStorage usage in development
- Implement user cleanup for development environments
- Check for memory leaks in application code
- Use production MongoDB for persistent storage

#### Performance Degradation
- Review database query performance with MongoDB profiler
- Check index usage with explain() commands
- Monitor database connection pool utilization
- Implement query result caching where appropriate

### Debugging Tools
```bash
# Enable MongoDB query logging
export DEBUG=mongoose:*

# Enable application debug logging
export NODE_ENV=development

# Monitor database operations
db.setProfilingLevel(2) // In MongoDB shell
```

This production guide ensures reliable deployment with proper error handling, monitoring, and security considerations for real-world usage.