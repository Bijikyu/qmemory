# QMemory Library - Migration Guide to v1.0.2

## Overview

This migration guide helps existing QMemory library users upgrade from version 1.0 to the current `v1.0.2` release with refreshed scalability features. The migration covers the security-by-default enforcement updates, observability improvements, and configuration adjustments that ship with this release.

## Breaking Changes

### 1. Node.js Version Requirement

**Before**: Node.js 16.x
**After**: Node.js 18.x or higher

**Migration Required**: Yes—this release takes advantage of modern ESM support and platform APIs introduced in Node 18.

```bash
# Verify runtime version
node --version  # Should be >= 18.0.0
```

### 2. Database Connection Pooling

**Before**: Per-request `MongoClient` instances
**After**: Shared connection pool via `DatabaseConnectionPool`

**Migration Required**: Yes—use the pool to enforce user ownership and resiliency in production workloads.

```javascript
import { DatabaseConnectionPool } from '@bijikyu/qmemory/lib/database-pool.js';

const pool = new DatabaseConnectionPool();
await pool.createPool(process.env.MONGODB_URI || 'mongodb://localhost:27017/qmemory', {
  maxConnections: Number(process.env.DEFAULT_POOL_MAX_CONNECTIONS || 20),
  minConnections: Number(process.env.DEFAULT_POOL_MIN_CONNECTIONS || 5),
  acquireTimeout: Number(process.env.DEFAULT_POOL_ACQUIRE_TIMEOUT || 10000),
  idleTimeout: Number(process.env.DEFAULT_POOL_IDLE_TIMEOUT || 300000),
});

const connection = await pool.acquireConnection(process.env.MONGODB_URI!);
await pool.releaseConnection(process.env.MONGODB_URI!, connection);
```

### 3. Module Imports & Entry Point

The library still exports everything through the barrel entry point (`index.js`), but the runtime now ships as ESM, so explicit `.js` file extensions or direct `lib/` imports are required for Node consumers.

```javascript
// Preferred: barrel exports via package entry point
import { MemStorage, sendSuccess } from '@bijikyu/qmemory';

// Explicit file imports also work
import { MemStorage } from '@bijikyu/qmemory/lib/storage.js';
import { sendSuccess } from '@bijikyu/qmemory/lib/http-utils.js';
```

### 4. Security & Observability

#### Rate Limiting & Security Middleware

`setupSecurity` now applies a `BasicRateLimiter` that respects `RATE_LIMIT_WINDOW` and `RATE_LIMIT_MAX` (default 15 min / 100 requests). Callers can also instantiate `BasicRateLimiter` directly when custom limits are required.

```javascript
import express from 'express';
import { setupSecurity, BasicRateLimiter } from '@bijikyu/qmemory/lib/security-middleware.js';

const app = express();
setupSecurity(app);

// Custom limiter for public endpoints
const heavyEndpointLimiter = new BasicRateLimiter(60000, 1000);
app.use('/public', heavyEndpointLimiter.middleware());
```

#### Request Tracing & Logging

Responses now include a `requestId` via the shared `http-response-factory` and `logging-utils` so observability spans remain correlated. `ENABLE_REQUEST_ID`, `ENABLE_CORS`, and `LOG_LEVEL` control runtime behavior.

```javascript
import { sendSuccess } from '@bijikyu/qmemory/lib/http-utils.js';
import { logFunctionEntry, logFunctionExit } from '@bijikyu/qmemory/lib/logging-utils.js';
import { generateUniqueId } from '@bijikyu/qmemory/lib/common-patterns.js';

app.get('/posts/:id', (req, res) => {
  const requestId = req.get('X-Request-ID') ?? generateUniqueId();
  res.set('X-Request-ID', requestId);
  logFunctionEntry('getPost', { requestId, id: req.params.id });

  // ... perform work ...

  logFunctionExit('getPost', { requestId, status: 'completed' });
  sendSuccess(res, 'Post retrieved', { requestId });
});
```

#### Performance Monitoring

Use `PerformanceMonitor` to capture system, request, and database metrics; `getMiddleware()` can be attached globally while `getHealthCheck()` provides a rich health payload.

```javascript
import { PerformanceMonitor } from '@bijikyu/qmemory/lib/performance/performance-monitor.js';

const monitor = new PerformanceMonitor();
app.use(monitor.getMiddleware());

app.get('/health', (req, res) => {
  const health = monitor.getHealthCheck();
  sendSuccess(res, 'Health check', health);
});
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
npm update @bijikyu/qmemory@latest

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
const { app } = require('@bijikyu/qmemory/scalability-demo-app.js');
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
import { DatabaseConnectionPool } from '@bijikyu/qmemory/lib/database-pool.js';

const pool = new DatabaseConnectionPool();
const mongodbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/qmemory';
await pool.createPool(mongodbUrl, {
  maxConnections: Number(process.env.DEFAULT_POOL_MAX_CONNECTIONS || 20),
  minConnections: Number(process.env.DEFAULT_POOL_MIN_CONNECTIONS || 5),
  acquireTimeout: Number(process.env.DEFAULT_POOL_ACQUIRE_TIMEOUT || 10000),
  idleTimeout: Number(process.env.DEFAULT_POOL_IDLE_TIMEOUT || 300000),
});

const connection = await pool.acquireConnection(mongodbUrl);
await pool.releaseConnection(mongodbUrl, connection);
```

#### 2.3 Add Rate Limiting

```javascript
// Old: No rate limiting
app.post('/users', async (req, res) => {
  // Direct processing
});

// New: Add rate limiting middleware
import { setupSecurity, BasicRateLimiter } from '@bijikyu/qmemory/lib/security-middleware.js';

setupSecurity(app); // Applies BasicRateLimiter with RATE_LIMIT_WINDOW and RATE_LIMIT_MAX

const customLimiter = new BasicRateLimiter(Number(process.env.RATE_LIMIT_WINDOW || 60000), Number(process.env.RATE_LIMIT_MAX || 1000));

app.post('/users', customLimiter.middleware(), async (req, res) => {
  // Process request with custom headers already set by the limiter
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
import { sendSuccess } from '@bijikyu/qmemory/lib/http-utils.js';
import { logFunctionEntry, logFunctionExit } from '@bijikyu/qmemory/lib/logging-utils.js';
import { generateUniqueId } from '@bijikyu/qmemory/lib/common-patterns.js';

app.use((req, res, next) => {
  const requestId = req.get('X-Request-ID') ?? generateUniqueId();
  res.set('X-Request-ID', requestId);
  (req as any).requestId = requestId;
  next();
});

app.get('/posts/:id', async (req, res) => {
  logFunctionEntry('getPost', { requestId: req.get('X-Request-ID'), id: req.params.id });

  // ... fetch data ...

  logFunctionExit('getPost', { requestId: req.get('X-Request-ID'), status: 'success' });
  sendSuccess(res, 'Post retrieved', { requestId: req.get('X-Request-ID') });
});
```

#### 2.5 Add Performance Monitoring

```javascript
// Old: No structured monitoring
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// New: Enhanced monitoring
import { PerformanceMonitor } from '@bijikyu/qmemory/lib/performance-monitor.js';

const monitor = new PerformanceMonitor();
app.get('/health', async (req, res) => {
  const health = monitor.getHealthCheck();
  sendSuccess(res, 'Service health', health);
});
```

### Phase 3: Configuration Migration (Estimated Time: 1 hour)

#### 3.1 Environment Variables

```bash
# Core settings
echo "NODE_ENV=production" >> .env
echo "PORT=5000" >> .env
echo "MONGODB_URI=mongodb://localhost:27017/qmemory" >> .env
echo "MONGODB_DB_NAME=qmemory" >> .env

# Connection pooling tuning (defaults provided via DEFAULT_POOL_* vars)
echo "DEFAULT_POOL_MAX_CONNECTIONS=40" >> .env
echo "DEFAULT_POOL_MIN_CONNECTIONS=5" >> .env
echo "DEFAULT_POOL_ACQUIRE_TIMEOUT=10000" >> .env
echo "DEFAULT_POOL_IDLE_TIMEOUT=300000" >> .env
echo "DEFAULT_POOL_HEALTH_CHECK_INTERVAL=60000" >> .env

# Redis cache settings
echo "REDIS_HOST=redis-host" >> .env
echo "REDIS_PORT=6379" >> .env
echo "REDIS_DB=0" >> .env
echo "REDIS_PASSWORD=your-redis-password" >> .env

# Rate limiting / observability
echo "RATE_LIMIT_WINDOW=60000" >> .env
echo "RATE_LIMIT_MAX=1000" >> .env
echo "ENABLE_REQUEST_ID=true" >> .env
echo "ENABLE_PERFORMANCE_MONITORING=true" >> .env
echo "ENABLE_CORS=true" >> .env
echo "LOG_LEVEL=info" >> .env
echo "API_REQUEST_TIMEOUT=30000" >> .env
echo "HEALTH_CHECK_INTERVAL=30000" >> .env
echo "MEMORY_THRESHOLD_WARNING=0.85" >> .env
echo "CPU_THRESHOLD_WARNING=0.8" >> .env
echo "MAX_MEMORY_STORAGE_USERS=10000" >> .env
echo "PERFORMANCE_SAMPLE_RATE=0.1" >> .env

# Optional cloud storage
echo "GCS_BUCKET_NAME=your-bucket" >> .env
echo "GCS_PROJECT_ID=your-project" >> .env
echo "GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json" >> .env
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
        MONGODB_URI: 'mongodb://localhost:27017/qmemory',
        DEFAULT_POOL_MAX_CONNECTIONS: 40,
        DEFAULT_POOL_MIN_CONNECTIONS: 5,
        RATE_LIMIT_WINDOW: 60000,
        RATE_LIMIT_MAX: 1000,
        ENABLE_PERFORMANCE_MONITORING: true,
        ENABLE_REQUEST_ID: true,
        ENABLE_CORS: true,
      },
      // Add new monitoring
      error_file: './logs/qmemory-error.log',
      out_file: './logs/qmemory-out.log',
      log_file: './logs/qmemory-combined.log',
      time: true,
      // Tailored for v1.0.2
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=4096',
    },
  ],
};
```

### Phase 4: Testing and Validation (Estimated Time: 2-3 hours)

#### 4.1 Unit Testing

```bash
# Run all tests
npm test

# Run focused unit suites
npm run test:unit

# Run integration suites
npm run test:integration

# Produce coverage report
npm run test:coverage
```

#### 4.2 Load Testing

```bash
# Test with Artillery
artillery run test/load-test-config.yml

# Expected convergence metrics:
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
Solution: Raise DEFAULT_POOL_MAX_CONNECTIONS or add additional nodes to your MongoDB cluster

# Error: "Connection timeout"
Solution: Increase DEFAULT_POOL_ACQUIRE_TIMEOUT to accommodate longer waits
```

#### 2. Rate Limiting Issues

```bash
# Error: "Rate limit exceeded"
Solution: Increase RATE_LIMIT_MAX or widen RATE_LIMIT_WINDOW via .env, or attach a custom BasicRateLimiter for specific endpoints

# Error: "Rate limit state persists"
Solution: Call destroySecurity() during graceful shutdown or manually destroy the BasicRateLimiter instance before restarting to reset internal counters
```

#### 3. Performance Degradation

```bash
# Error: "Response time increased"
Solution: Review DEFAULT_POOL_MAX_CONNECTIONS, DEFAULT_POOL_MAX_QUERY_TIME, and MongoDB indexes

# Error: "Memory usage high"
Solution: Reduce DEFAULT_POOL_MAX_CONNECTIONS, lower sampling rates (PERFORMANCE_SAMPLE_RATE), or scale vertically with more RAM
```

## Support Resources

### Documentation

- [API Docs](docs/openapi.yaml) - Complete API contract
- [Deployment Guide](docs/PRODUCTION_DEPLOYMENT_GUIDE.md) - Production readiness checklist
- [Architecture Notes](agentRecords/SUMMARY.md) - Design rationale and workflow summaries

### Migration Tools

There is no automated migration script; follow the manual phases above and validate with `npm test` (or `npm run test:integration`, `npm run test:coverage`).

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

This comprehensive migration guide ensures a smooth transition from QMemory v1.0 to v1.0.2 with minimal disruption and maximum performance improvement.
