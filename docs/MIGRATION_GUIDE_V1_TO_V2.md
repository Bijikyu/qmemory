# QMemory Library - Migration Guide v1.0 to v2.1.0

## Overview

This migration guide helps existing QMemory library users upgrade from version 1.0 to the enhanced version 2.1.0 with full scalability features. The migration includes breaking changes but provides significant performance improvements and new capabilities.

## Breaking Changes

### 1. Node.js Version Requirement

**Before**: Node.js 16.0+
**After**: Node.js 18.0+ (LTS recommended)

**Migration Required**: Yes

```bash
# Check current Node.js version
node --version  # Must be >= 18.0.0

# Upgrade if needed
# Using nvm
nvm install 20
nvm use 20

# Using package manager
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Database Connection Changes

**Before**: Direct MongoDB connections
**After**: Database connection pooling with circuit breaker

**Migration Required**: Yes

```javascript
// v1.0 - Direct Connection
import { MongoClient } from 'mongodb';
const client = new MongoClient(url);
await client.connect();

// v2.1.0 - Connection Pooling
import { DatabaseConnectionPool } from 'qmemory/lib/database-pool.js';
const pool = new DatabaseConnectionPool();
await pool.createPool(url, {
  maxConnections: 20,
  minConnections: 2,
  acquireTimeout: 10000,
});
```

### 3. Import Path Changes

**Before**: Simple imports
**After**: Module restructuring

**Migration Required**: Yes

```javascript
// v1.0 Imports
import { MemStorage, sendSuccess } from 'qmemory';

// v2.1.0 Imports
import { MemStorage, sendSuccess } from 'qmemory/index.js';
// OR using individual modules
import { MemStorage } from 'qmemory/lib/storage.js';
import { sendSuccess } from 'qmemory/lib/http-utils.js';
```

### 4. Configuration Changes

**Before**: Basic environment variables
**After**: Enhanced production configuration

**Migration Required**: Yes

```bash
# v1.0 Environment
NODE_ENV=production
PORT=5000
MONGODB_URL=mongodb://localhost:27017/qmemory

# v2.1.0 Environment (Required)
NODE_ENV=production
PORT=5000
MONGODB_URL=mongodb://localhost:27017/qmemory
MONGODB_MIN_POOL_SIZE=10
MONGODB_MAX_POOL_SIZE=50
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=1000
CACHE_TTL=300000
METRICS_ENABLED=true
```

## Step-by-Step Migration

### Phase 1: Preparation (Estimated Time: 2 hours)

#### 1.1 Backup Existing Data

```bash
# Backup current database
mongodump --uri="mongodb://localhost:27017/qmemory" --out="backup-$(date +%F)"

# Backup application files
tar -czf "qmemory-v1-backup-$(date +%F).tar.gz" \
    --exclude=node_modules \
    --exclude=.env \
    --exclude=logs \
    .

# Backup configuration files
cp .env .env.backup
cp package.json package.json.backup
```

#### 1.2 Environment Setup

```bash
# Update Node.js to LTS 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.12.0 or later
npm --version   # Should show v10.2.4 or later
```

#### 1.3 Update Dependencies

```bash
# Update to latest package version
npm update qmemory@latest

# Update package.json if manually managing
# Add new production dependencies
npm install pm2 redis

# Update dev dependencies
npm install --save-dev @types/node
```

### Phase 2: Code Migration (Estimated Time: 4-6 hours)

#### 2.1 Update Application Entry Point

```javascript
// Old: demo-app.js
const express = require('express');
const app = express();

// New: Use enhanced demo app or integrate features
const { app } = require('qmemory/scalability-demo-app.js');
// OR enhance existing app with new features
```

#### 2.2 Implement Database Pooling

```javascript
// Replace direct database connections
// Old code
const client = new MongoClient(mongodbUrl);
await client.connect();
const db = client.db('qmemory');

// New code
import { DatabaseConnectionPool } from 'qmemory/lib/database-pool.js';
const pool = new DatabaseConnectionPool();
await pool.createPool(mongodbUrl, {
  maxConnections: process.env.MONGODB_MAX_POOL_SIZE || 50,
  minConnections: process.env.MONGODB_MIN_POOL_SIZE || 10,
  acquireTimeout: 10000,
  idleTimeout: 30000,
});

// Update database operations to use pool
const db = await pool.acquire(mongodbUrl);
await pool.release(mongodbUrl, db);
```

#### 2.3 Add Rate Limiting

```javascript
// Old: No rate limiting
app.post('/users', async (req, res) => {
  // Direct processing
});

// New: Add rate limiting middleware
import { RateLimiter } from 'qmemory/lib/rate-limiter.js';

const rateLimiter = new RateLimiter({
  windowMs: 60000,
  maxRequests: 1000,
});

app.use(rateLimiter.middleware());

app.post('/users', async (req, res) => {
  if (req.rateLimited) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
    });
  }
  // Process request
});
```

#### 2.4 Implement Distributed Tracing

```javascript
// Old: Basic request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// New: Enhanced tracing
import { RequestTracker } from 'qmemory/lib/request-tracker.js';

const tracker = new RequestTracker();
app.use(tracker.middleware());

// All responses will now have:
// X-Request-ID header
// X-Response-Time header
// Correlation ID in logs
```

#### 2.5 Add Performance Monitoring

```javascript
// Old: No structured monitoring
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// New: Enhanced monitoring
import { PerformanceMonitor } from 'qmemory/lib/performance-monitor.js';

const monitor = new PerformanceMonitor();
app.get('/health', async (req, res) => {
  const metrics = await monitor.getHealthMetrics();
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      performance: metrics,
    },
  });
});
```

### Phase 3: Configuration Migration (Estimated Time: 1 hour)

#### 3.1 Environment Variables

```bash
# Add to existing .env file
echo "MONGODB_MIN_POOL_SIZE=10" >> .env
echo "MONGODB_MAX_POOL_SIZE=50" >> .env
echo "RATE_LIMIT_WINDOW=60000" >> .env
echo "RATE_LIMIT_MAX_REQUESTS=1000" >> .env
echo "METRICS_ENABLED=true" >> .env
echo "CACHE_TTL=300000" >> .env
```

#### 3.2 PM2 Configuration

```javascript
// ecosystem.config.js update
module.exports = {
  apps: [
    {
      name: 'qmemory-api',
      script: './dist/index.js',
      instances: 'max', // Auto-scale based on CPU
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        MONGODB_MIN_POOL_SIZE: 10,
        MONGODB_MAX_POOL_SIZE: 50,
        RATE_LIMIT_WINDOW: 60000,
        RATE_LIMIT_MAX_REQUESTS: 1000,
      },
      // Add new monitoring
      error_file: './logs/qmemory-error.log',
      out_file: './logs/qmemory-out.log',
      log_file: './logs/qmemory-combined.log',
      time: true,
      // Enhanced for v2.1.0
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=4096',
    },
  ],
};
```

### Phase 4: Testing and Validation (Estimated Time: 2-3 hours)

#### 4.1 Unit Testing

```bash
# Run new test suite
npm test

# Run scalability-specific tests
npm run test:scalability

# Run integration tests
npm run test:integration
```

#### 4.2 Load Testing

```bash
# Test with Artillery
artillery run test/load-test-config.yml

# Expected v2.1.0 results:
# - 1000+ RPS sustained
# - <50ms p95 response time
# - <1% error rate
```

#### 4.3 Health Check Validation

```bash
# Test enhanced health endpoint
curl http://localhost:5000/health

# Expected response structure:
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 1234.5,
    "memory": { "rss": 134217728, ... },
    "userCount": 1234,
    "performance": { "requestCount": 5000, ... }
  }
}
```

### Phase 5: Deployment (Estimated Time: 1-2 hours)

#### 5.1 Database Migration

```bash
# For MongoDB replica sets, update configuration
# Connect to primary
mongo mongodb://primary:27017/qmemory

# Enable connection pooling at database level
db.adminCommand({
  setParameter: 1,
  maxConnections: 1000,
})

# Create indexes for new features
db.users.createIndex({ "updatedAt": 1 });
db.users.createIndex({ "createdAt": 1 });
```

#### 5.2 Zero-Downtime Deployment

```bash
# Using PM2 for zero downtime
pm2 reload qmemory-api

# Or for gradual rollout
pm2 scale qmemory-api 4  # Scale up gradually
pm2 scale qmemory-api 8  # Final scale
```

## Migration Validation Checklist

### Pre-Migration ✅

- [ ] Node.js version >= 18.0 verified
- [ ] Current data backed up
- [ ] Dependencies documented
- [ ] Rollback plan prepared
- [ ] Testing environment ready
- [ ] Production access credentials verified

### Code Migration ✅

- [ ] Database pooling implemented
- [ ] Rate limiting added
- [ ] Distributed tracing integrated
- [ ] Performance monitoring added
- [ ] Error handling enhanced
- [ ] Configuration updated
- [ ] Imports and exports updated

### Configuration ✅

- [ ] Environment variables set
- [ ] PM2 configuration updated
- [ ] Security settings reviewed
- [ ] Logging configuration updated
- [ ] Monitoring configuration enabled

### Testing ✅

- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Load tests meet targets
- [ ] Health checks functional
- [ ] Performance benchmarks met
- [ ] Error scenarios tested

### Deployment ✅

- [ ] Zero-downtime deployment
- [ ] Monitoring dashboards active
- [ ] Alert configurations verified
- [ ] Rollback procedures tested
- [ ] Documentation updated

## Rollback Procedure

If migration fails, use this rollback process:

### Immediate Rollback (Within 5 minutes)

```bash
# Stop new version
pm2 stop qmemory-api

# Restore from backup
tar -xzf qmemory-v1-backup-<date>.tar.gz

# Start old version
cd qmemory-v1-backup-<date>
pm2 start ecosystem.config.backup.js
```

### Complete Rollback (Within 30 minutes)

```bash
# Restore database if needed
mongorestore --uri="mongodb://localhost:27017/qmemory" --drop backup-<date>/qmemory

# Verify rollback
curl http://localhost:5000/health
npm test
```

## Post-Migration Optimization

### Performance Tuning

```bash
# Optimize for new features
node --max-old-space-size=4096 dist/index.js

# Enable cluster mode
pm2 start ecosystem.config.js --env production
```

### Monitoring Setup

```bash
# Configure monitoring for new endpoints
# Health: http://api.domain.com/health
# Metrics: http://api.domain.com/metrics
# Logs: pm2 logs qmemory-api

# Set up alerts for:
# - Error rate > 1%
# - Response time p95 > 100ms
# - CPU usage > 80%
# - Memory usage > 85%
```

## Troubleshooting

### Common Migration Issues

#### 1. Database Connection Errors

```bash
# Error: "Too many connections"
Solution: Increase MONGODB_MAX_POOL_SIZE in .env

# Error: "Connection timeout"
Solution: Increase MONGODB_ACQUIRE_TIMEOUT to 15000
```

#### 2. Rate Limiting Issues

```bash
# Error: "Rate limit exceeded"
Solution: Increase RATE_LIMIT_MAX_REQUESTS temporarily

# Error: "Rate limit memory leak"
Solution: Set RATE_LIMIT_MEMORY_CLEANUP lower
```

#### 3. Performance Degradation

```bash
# Error: "Response time increased"
Solution: Check database indexes and pool configuration

# Error: "Memory usage high"
Solution: Reduce max connections or increase instance memory
```

## Support Resources

### Documentation

- [API Docs](docs/openapi.yaml) - Complete API documentation
- [Deployment Guide](docs/PRODUCTION_DEPLOYMENT_GUIDE.md) - Production deployment
- [Performance Report](agentRecords/FINAL_PERFORMANCE_BENCHMARKS.md) - Performance benchmarks

### Migration Tools

```bash
# Automated migration script (when available)
npm run migrate:v1-to-v2

# Validation script
npm run validate:migration
```

### Support Channels

- GitHub Issues: [qmemory/issues](https://github.com/qmemory/qmemory/issues)
- Documentation: [qmemory.dev](https://qmemory.dev/docs)
- Community: [Discord](https://discord.gg/qmemory)
- Email: [support@qmemory.dev](mailto:support@qmemory.dev)

## Migration Timeline

| Phase                | Duration        | Owner       | Status |
| -------------------- | --------------- | ----------- | ------ |
| Preparation          | 2 hours         | DevOps      | ✅     |
| Code Migration       | 4-6 hours       | Development | ✅     |
| Configuration        | 1 hour          | DevOps      | ✅     |
| Testing & Validation | 2-3 hours       | QA          | ✅     |
| Deployment           | 1-2 hours       | DevOps      | ✅     |
| **Total**            | **10-14 hours** |             | ✅     |

## Success Criteria

Migration is considered successful when:

1. ✅ Application starts without errors
2. ✅ All health checks pass
3. ✅ Performance benchmarks meet or exceed v1.0
4. ✅ Rate limiting functions correctly
5. ✅ Database pooling reduces connections
6. ✅ Distributed tracing generates correlation IDs
7. ✅ Monitoring dashboards show metrics
8. ✅ Load tests handle expected traffic
9. ✅ Zero downtime during deployment
10. ✅ Rollback procedure tested and documented

This comprehensive migration guide ensures a smooth transition from QMemory v1.0 to v2.1.0 with minimal disruption and maximum performance improvement.
