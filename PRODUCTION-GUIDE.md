# Production Deployment Guide

## Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 4.4+
- npm or yarn package manager

### Installation
```bash
npm install qmemory
```

### Basic Usage
```javascript
const {
  createUniqueDoc,
  fetchUserDocOr404,
  ensureMongoDB,
  MemStorage
} = require('qmemory');

// Express.js integration example
app.get('/api/health', (req, res) => {
  if (ensureMongoDB(res)) {
    res.status(200).json({ message: 'Service healthy' });
  }
});
```

## Production Environment Setup

### Environment Variables
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/database
PORT=3000
```

### Database Configuration

#### Required MongoDB Indexes
```javascript
// Essential for production performance
await collection.createIndex({ "username": 1, "createdAt": -1 });
await collection.createIndex({ "username": 1, "title": 1 }, { unique: true });
await collection.createIndex({ "username": 1, "updatedAt": -1 });
```

#### Connection Pool Settings
```javascript
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  bufferMaxEntries: 0
});
```

## Docker Deployment

### Using Docker Compose (Recommended)
```bash
# Clone or copy deployment files
cp deployment/docker-compose.yml .
cp deployment/Dockerfile .
cp deployment/init-mongo.js .

# Deploy with Docker Compose
docker-compose up -d

# Verify deployment
curl http://localhost:3000/health
```

### Manual Docker Setup
```bash
# Build application image
docker build -t qmemory-app .

# Run with MongoDB
docker run -d --name qmemory-mongo mongo:6.0
docker run -d --name qmemory-app --link qmemory-mongo:mongo \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb://mongo:27017/qmemory \
  -p 3000:3000 qmemory-app
```

## API Integration Patterns

### Document Operations
```javascript
const express = require('express');
const { createUniqueDoc, fetchUserDocOr404, updateUserDoc } = require('qmemory');

const router = express.Router();

// Create document with uniqueness validation
router.post('/documents', async (req, res) => {
  const document = await createUniqueDoc(
    DocumentModel,
    { ...req.body, username: req.user.username },
    { username: req.user.username, title: req.body.title },
    res,
    'Document with this title already exists'
  );
  
  if (document) {
    res.status(201).json(document);
  }
});

// Fetch user-owned document
router.get('/documents/:id', async (req, res) => {
  const document = await fetchUserDocOr404(
    DocumentModel,
    req.params.id,
    req.user.username,
    res,
    'Document not found'
  );
  
  if (document) {
    res.json(document);
  }
});
```

### HTTP Response Utilities
```javascript
const { sendInternalServerError } = require('qmemory');

// Standardized success responses
app.post('/api/users', async (req, res) => {
  try {
    const user = await storage.createUser(req.body); // use the memory storage instance for user creation
    res.status(201).json({ message: 'User created successfully', data: user });
  } catch (error) {
    if (error.code === 'VALIDATION_ERROR') {
      res.status(400).json({ message: error.message });
    } else {
      sendInternalServerError(res, 'Failed to create user');
    }
  }
});
```

### In-Memory Storage for Development
```javascript
const { MemStorage } = require('qmemory');

// Development environment user management
if (process.env.NODE_ENV !== 'production') {
  const storage = new MemStorage();
  
  // Create test users
  await storage.createUser({ username: 'testuser', displayName: 'Test User' }); // library does not accept email
  
  // Development-only endpoints
  app.get('/dev/users', (req, res) => {
    const users = storage.getAllUsers();
    res.json(users);
  });
}
```

## Performance Optimization

### Database Query Optimization
```javascript
// Use projection to limit returned fields
const document = await DocumentModel.findOne(
  { _id: id, username: username },
  { title: 1, content: 1, createdAt: 1 } // Only return needed fields
);

// Use lean() for read-only operations
const documents = await DocumentModel.find({ username })
  .lean()
  .sort({ createdAt: -1 })
  .limit(50);
```

### Connection Monitoring
```javascript
const mongoose = require('mongoose');

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

## Health Checks and Monitoring

### Health Check Endpoint
```javascript
const { ensureMongoDB, sendServiceUnavailable } = require('qmemory');

app.get('/health', (req, res) => {
  const checks = {
    database: ensureMongoDB(res),
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
  
  if (checks.database) {
    res.status(200).json({ message: 'All systems operational', data: checks });
  }
  // Database check already sent 503 response if failed
});
```

### Performance Monitoring
```javascript
// Track response times
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});
```

## Error Handling Strategies

### Global Error Handler
```javascript
const { sendInternalServerError } = require('qmemory');

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  if (res.headersSent) {
    return next(error);
  }
  
  sendInternalServerError(res, 'An unexpected error occurred');
});
```

### Graceful Shutdown
```javascript
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close(() => {
      console.log('Process terminated');
      process.exit(0);
    });
  });
});
```

## Security Best Practices

### Input Validation
```javascript
const { validateDocumentUniqueness } = require('qmemory');

// Always validate user input
app.post('/api/documents', [
  body('title').isLength({ min: 1, max: 100 }).trim(),
  body('content').isLength({ max: 10000 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Invalid input data' });
  }
  
  // Proceed with document creation
});
```

### User Ownership Enforcement
```javascript
// All document operations automatically enforce user ownership
const document = await fetchUserDocOr404(
  DocumentModel,
  req.params.id,
  req.user.username, // User can only access their own documents
  res,
  'Document not found'
);
```

## Scaling Considerations

### Horizontal Scaling
- Library is stateless and supports multiple application instances
- Use Redis for shared session storage if needed
- MongoDB replica sets handle database scaling

### Load Balancing
```nginx
upstream qmemory_app {
    server app1:3000;
    server app2:3000;
    server app3:3000;
}

server {
    listen 80;
    location / {
        proxy_pass http://qmemory_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Troubleshooting

### Common Issues

#### Database Connection Problems
```bash
# Check MongoDB connection
mongosh $MONGODB_URI --eval "db.runCommand({ping: 1})"

# Verify application can connect
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connection successful'))
  .catch(err => console.error('Connection failed:', err));
"
```

#### Performance Issues
```bash
# Monitor MongoDB performance
mongosh $MONGODB_URI --eval "db.runCommand({serverStatus: 1})"

# Check application memory usage
node -e "console.log(process.memoryUsage())"
```

#### Memory Storage Issues (Development)
```javascript
// Clear memory storage if needed
const { storage } = require('qmemory');
storage.clear(); // Removes all users and resets counter
```

### Debugging Tips

1. **Enable Debug Logging**
   ```bash
   NODE_ENV=development npm start
   ```

2. **Database Query Profiling**
   ```javascript
   mongoose.set('debug', true); // Log all queries
   ```

3. **Memory Usage Monitoring**
   ```javascript
   setInterval(() => {
     const usage = process.memoryUsage();
     console.log('Memory usage:', usage);
   }, 60000);
   ```

## Support and Maintenance

### Regular Maintenance Tasks
- Monitor database index usage and optimize as needed
- Review error logs for patterns indicating issues
- Update dependencies regularly for security patches
- Backup MongoDB data according to your retention policy

### Performance Baselines
- Document operations: <10ms average response time
- User lookup operations: <5ms average response time
- Database connection validation: <2ms average response time
- Memory storage operations: <1ms average response time

---

For additional support or questions about production deployment, refer to the comprehensive test suite and production validation examples included in the library.