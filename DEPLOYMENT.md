# Deployment Guide

## Overview

This Node.js utility library is ready for deployment as an npm package or for integration into Express.js applications. The library provides MongoDB document operations, HTTP utilities, in-memory storage, and logging capabilities.

## Prerequisites

### Required Dependencies
- Node.js 18+ or 20+
- MongoDB 4.4+ (for production use)
- Mongoose 7.0+

### Development Dependencies
- Jest for testing
- Coverage reporting tools

## Deployment Options

### 1. NPM Package Publication

To publish this library to npm:

```bash
# Ensure you're logged into npm
npm login

# Publish the package
npm publish
```

**Package Information:**
- Name: `qmemory`
- Version: `1.0.0`
- Main entry: `index.js`

### 2. Direct Integration

To integrate into an existing Express.js application:

```bash
# Clone or copy the lib directory
cp -r lib/ your-project/
cp index.js your-project/

# Install dependencies
npm install mongoose
```

## Environment Configuration

### Required Environment Variables

For production deployments using MongoDB:

```bash
# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/your-database
# or
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Optional: Node environment
NODE_ENV=production
```

### Development Environment

For development using in-memory storage:

```bash
NODE_ENV=development
```

## Usage Examples

### Basic Integration

```javascript
const { 
  createUniqueDoc, 
  findUserDoc, 
  sendNotFound, 
  MemStorage 
} = require('qmemory');

// Express.js route example
app.post('/api/users/:username/documents', async (req, res) => {
  try {
    const doc = await createUniqueDoc(
      DocumentModel, 
      req.params.username, 
      req.body,
      { title: req.body.title } // uniqueness check
    );
    
    if (!doc) {
      return sendConflict(res, 'Document with this title already exists');
    }
    
    res.status(201).json(doc);
  } catch (error) {
    return sendInternalServerError(res, 'Failed to create document');
  }
});
```

### Development vs Production

```javascript
// Automatic environment detection
const storage = require('qmemory').storage;

if (process.env.NODE_ENV === 'development') {
  // Uses MemStorage automatically
  const user = storage.createUser('testuser', { displayName: 'Test User' }); // align with API expectation
} else {
  // Uses MongoDB document operations
  const user = await createUniqueDoc(UserModel, 'testuser', { displayName: 'Test User' });
}
```

## Health Checks

### Database Connectivity

```javascript
const { ensureMongoDB } = require('qmemory');

// Health check endpoint
app.get('/health', (req, res) => {
  if (ensureMongoDB(res)) {
    res.json({ status: 'healthy', database: 'connected' });
  }
  // ensureMongoDB automatically sends 503 if database is down
});
```

### Memory Storage Status

```javascript
const { storage } = require('qmemory');

app.get('/health/storage', (req, res) => {
  res.json({
    status: 'healthy',
    userCount: storage.getAllUsers().length,
    storageType: 'memory'
  });
});
```

## Performance Considerations

### MongoDB Optimization

1. **Indexes**: Ensure proper indexing for user ownership queries
```javascript
// Recommended indexes for user-owned documents
DocumentSchema.index({ username: 1, createdAt: -1 });
DocumentSchema.index({ username: 1, title: 1 }, { unique: true });
```

2. **Connection Pooling**: Configure Mongoose connection options
```javascript
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

### Memory Storage Limitations

- **Development Only**: MemStorage is volatile and resets on restart
- **Memory Usage**: No built-in limits - monitor for memory leaks
- **Concurrency**: Not thread-safe for high-concurrency scenarios

## Monitoring and Logging

### Production Logging

The library automatically adjusts logging based on `NODE_ENV`:

- **Development**: Verbose console logging with entry/exit traces
- **Production**: Error-level logging only

### Custom Logging Integration

```javascript
const { logFunctionEntry, logFunctionExit } = require('qmemory');

function yourFunction(params) {
  logFunctionEntry('yourFunction', params);
  
  // Your logic here
  const result = processData(params);
  
  logFunctionExit('yourFunction', result);
  return result;
}
```

## Security Considerations

### User Ownership Validation

All document operations enforce user ownership:

```javascript
// This will only return documents owned by 'alice'
const docs = await listUserDocs(DocumentModel, 'alice');

// This will only update documents owned by 'alice'  
const updated = await updateUserDoc(DocumentModel, docId, 'alice', updates);
```

### Input Sanitization

HTTP utilities automatically sanitize messages:

```javascript
// Whitespace is trimmed, null/undefined get fallbacks
sendNotFound(res, '  Resource not found  '); // Cleaned automatically
sendConflict(res, null); // Gets default message
```

## Testing in Production

### Smoke Tests

```bash
# Run full test suite
npm test

# Run specific test categories
npm run test:unit
npm run test:integration

# Generate coverage report
npm run test:coverage
```

### Integration Testing

```javascript
// Test with real MongoDB connection
const mongoose = require('mongoose');
const { createUniqueDoc } = require('qmemory');

// Connect to test database
await mongoose.connect(process.env.TEST_MONGODB_URI);

// Run integration tests
const doc = await createUniqueDoc(TestModel, 'testuser', { data: 'test' });
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failures**
   - Check `MONGODB_URI` environment variable
   - Verify network connectivity
   - Check MongoDB server status

2. **Memory Storage Unexpected Behavior**
   - Remember it's volatile - data resets on restart
   - Check for memory leaks in development
   - Ensure proper error handling

3. **HTTP Utility Errors**
   - Verify Express response object is valid
   - Check for proper error handling in routes

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
NODE_ENV=development npm start
```

This will enable detailed function entry/exit logging for all operations.