/**
 * Scalability Features Integration Tests
 * 
 * Comprehensive test suite for all scalability enhancements implemented
 * in the QMemory library. Tests database pooling, rate limiting,
 * distributed tracing, I/O optimization, and performance monitoring.
 */

import request from 'supertest';
import { describe, beforeAll, afterAll, beforeEach, it, expect, jest } from '@jest/globals';
import { IOOptimizer, ioOptimizer } from '../lib/io-optimizer.js';
import { DatabaseConnectionPool } from '../lib/database-pool.js';

describe('Scalability Features Integration Tests', () => {
  let app: any;
  let optimizer: IOOptimizer;
  let dbPool: DatabaseConnectionPool;

  beforeAll(async () => {
    // Import the enhanced demo app for testing
    app = (await import('../scalability-demo-app.js')).app;
    optimizer = ioOptimizer;
    dbPool = new DatabaseConnectionPool();
    
    // Give time for setup
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  beforeEach(() => {
    // Reset rate limiting and cache before each test
    optimizer.removeAllListeners();
  });

  describe('Database Connection Pooling', () => {
    it('should create and manage database pools', async () => {
      const testUrl = 'mongodb://localhost:27017/test';
      
      // Test pool creation
      await dbPool.createPool(testUrl, {
        maxConnections: 10,
        minConnections: 2,
        acquireTimeout: 5000,
      });

      const pool = dbPool.getPool(testUrl);
      expect(pool).toBeTruthy();

      // Test pool statistics
      const stats = dbPool.getAllStats();
      expect(stats).toBeDefined();
      expect(stats[testUrl]).toBeDefined();
    });

    it('should handle pool cleanup gracefully', async () => {
      const testUrl = 'mongodb://localhost:27017/test-cleanup';
      
      await dbPool.createPool(testUrl);
      const poolExists = dbPool.hasPool(testUrl);
      expect(poolExists).toBe(true);

      await dbPool.removePool(testUrl);
      const poolRemoved = dbPool.hasPool(testUrl);
      expect(poolRemoved).toBe(false);
    });

    it('should provide global health monitoring', async () => {
      const healthStatus = dbPool.performGlobalHealthCheck();
      expect(healthStatus).toBeDefined();
      expect(typeof healthStatus).toBe('object');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits in production mode', async () => {
      // Simulate production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        // Make multiple requests to trigger rate limiting
        const promises = Array(150).fill(null).map(() =>
          request(app).get('/health')
        );

        const results = await Promise.allSettled(promises);
        
        // Check that some requests were rate limited
        const rateLimitedResponses = results.filter(
          result => result.status === 'fulfilled' && result.value.status === 429
        );
        
        expect(rateLimitedResponses.length).toBeGreaterThan(0);
      } finally {
        // Restore original environment
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should allow requests within rate limit', async () => {
      // Make requests within rate limit
      const promises = Array(10).fill(null).map(() =>
        request(app).get('/health')
      );

      const results = await Promise.allSettled(promises);
      const successfulResponses = results.filter(
        result => result.status === 'fulfilled' && result.value.status === 200
      );

      expect(successfulResponses.length).toBeGreaterThan(8);
    });

    it('should include rate limit headers when limited', async () => {
      const response = await request(app)
        .get('/health')
        .set('X-Forwarded-For', '192.168.1.100')
        .expect(429);

      expect(response.headers['x-rate-limit-limit']).toBeDefined();
      expect(response.headers['x-rate-limit-remaining']).toBeDefined();
      expect(response.headers['x-rate-limit-reset']).toBeDefined();
    });
  });

  describe('Distributed Tracing', () => {
    it('should include correlation ID in responses', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-response-time']).toBeDefined();
      expect(typeof response.headers['x-request-id']).toBe('string');
      expect(response.headers['x-request-id']).toMatch(/^req_\d+_[a-z0-9]+$/);
    });

    it('should use consistent correlation ID format', async () => {
      const responses = await Promise.all([
        request(app).get('/health'),
        request(app).get('/metrics'),
        request(app).get('/validation/rules'),
      ]);

      // All responses should have correlation IDs
      responses.forEach(response => {
        expect(response.headers['x-request-id']).toBeDefined();
        expect(response.headers['x-request-id']).toMatch(/^req_\d+_[a-z0-9]+$/);
      });

      // Each should be unique
      const correlationIds = responses.map(r => r.headers['x-request-id']);
      const uniqueIds = new Set(correlationIds);
      expect(uniqueIds.size).toBe(correlationIds.length);
    });
  });

  describe('I/O Optimization', () => {
    it('should queue and process background tasks', (done) => {
      let taskProcessed = false;

      // Listen for task completion
      optimizer.on('taskCompleted', (task) => {
        if (task.type === 'TEST_TASK') {
          taskProcessed = true;
          done();
        }
      });

      // Queue a test task
      const taskId = optimizer.queueTask({
        type: 'TEST_TASK',
        data: { test: 'data' },
        priority: 1,
      });

      expect(taskId).toBeDefined();
      expect(taskId).toMatch(/^task_\d+_[a-z0-9]+$/);
    });

    it('should cache responses with TTL', () => {
      const testData = { key: 'value', timestamp: Date.now() };
      const cacheKey = 'test-cache-key';

      // Cache data
      optimizer.cacheResponse(cacheKey, testData, 5000);

      // Retrieve cached data
      const cached = optimizer.getCachedResponse(cacheKey);

      expect(cached).toBeTruthy();
      expect(cached?.data).toEqual(testData);
      expect(cached?.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('should handle cache expiration', (done) => {
      const testData = { key: 'expire-test' };
      const cacheKey = 'expire-test-key';

      // Cache with very short TTL
      optimizer.cacheResponse(cacheKey, testData, 100);

      // Immediately retrieve (should be cached)
      const cached = optimizer.getCachedResponse(cacheKey);
      expect(cached).toBeTruthy();

      // Wait for expiration
      setTimeout(() => {
        const expired = optimizer.getCachedResponse(cacheKey);
        expect(expired).toBeNull();
        done();
      }, 150);
    });

    it('should batch operations efficiently', async () => {
      const operations = [
        { type: 'BATCH_TEST', data: { id: 1 } },
        { type: 'BATCH_TEST', data: { id: 2 } },
        { type: 'BATCH_TEST', data: { id: 3 } },
      ];

      const results = await optimizer.batchOperations('BATCH_TEST', operations);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(operations.length);
    });
  });

  describe('Performance Monitoring', () => {
    it('should collect comprehensive metrics', async () => {
      const response = await request(app).get('/metrics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const metrics = response.body.data;
      expect(metrics).toHaveProperty('requests');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('performance');
      expect(metrics).toHaveProperty('rateLimiting');

      // Verify metric structure
      expect(metrics.requests.count).toBeGreaterThanOrEqual(0);
      expect(metrics.memory.rss).toBeGreaterThan(0);
      expect(metrics.performance.totalResponseTime).toBeGreaterThanOrEqual(0);
    });

    it('should track performance over time', async () => {
      // Make multiple requests to generate performance data
      await Promise.all([
        request(app).get('/health'),
        request(app).get('/health'),
        request(app).get('/health'),
        request(app).get('/health'),
        request(app).get('/health'),
      ]);

      const metricsResponse = await request(app).get('/metrics');
      const metrics = metricsResponse.body.data;

      // Should have accumulated performance data
      expect(metrics.requests.count).toBeGreaterThan(5);
      expect(metrics.performance.runtimeMs).toBeGreaterThan(0);
      expect(metrics.requests.averageResponseTime).toBeGreaterThan(0);
    });

    it('should include performance data in health checks', async () => {
      const healthResponse = await request(app).get('/health');

      expect(healthResponse.body.success).toBe(true);

      const health = healthResponse.body.data;
      expect(health).toHaveProperty('performance');
      expect(health.performance).toHaveProperty('requestCount');
      expect(health.performance).toHaveProperty('errorRate');
    });
  });

  describe('API Versioning', () => {
    it('should include API version in responses', async () => {
      const response = await request(app).get('/');

      expect(response.body.apiVersion).toBeDefined();
      expect(response.body.apiVersion).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should maintain backward compatibility', async () => {
      // Test that existing endpoints still work
      const userResponse = await request(app).get('/users');
      expect(userResponse.status).toBe(200);
      expect(userResponse.body.data.users).toBeDefined();

      const healthResponse = await request(app).get('/health');
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body.data.status).toBeDefined();
    });
  });

  describe('Enhanced Error Handling', () => {
    it('should provide detailed error responses', async () => {
      const response = await request(app)
        .post('/users')
        .send({}); // Invalid empty user

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBeDefined();
      expect(response.body.error.message).toBeDefined();
    });

    it('should include correlation IDs in error responses', async () => {
      const response = await request(app)
        .post('/users')
        .send({ username: '' }); // Invalid empty username

      expect(response.status).toBe(400);
      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.body.error.requestId).toBeDefined();
    });

    it('should handle duplicate usernames gracefully', async () => {
      // Create a user
      await request(app)
        .post('/users')
        .send({ username: 'duplicate-test', displayName: 'Test User' })
        .expect(200);

      // Try to create the same user again
      const duplicateResponse = await request(app)
        .post('/users')
        .send({ username: 'duplicate-test', displayName: 'Another User' });

      expect(duplicateResponse.status).toBe(400);
      expect(duplicateResponse.body.error.message).toContain('already exists');
    });
  });

  describe('User Management with Enhanced Features', () => {
    it('should create users with validation', async () => {
      const userData = {
        username: 'new-test-user',
        displayName: 'New Test User',
      };

      const response = await request(app)
        .post('/users')
        .send(userData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe(userData.username);
      expect(response.body.data.displayName).toBe(userData.displayName);
      expect(response.body.data.id).toBeDefined();
    });

    it('should validate pagination parameters', async () => {
      // Test invalid page
      const invalidPageResponse = await request(app)
        .get('/users?page=0')
        .expect(400);

      expect(invalidPageResponse.body.error.message).toContain('page');

      // Test invalid limit
      const invalidLimitResponse = await request(app)
        .get('/users?limit=100')
        .expect(400);

      expect(invalidLimitResponse.body.error.message).toContain('limit');
    });

    it('should paginate user lists correctly', async () => {
      // Create test users
      for (let i = 1; i <= 15; i++) {
        await request(app)
          .post('/users')
          .send({
            username: `test-user-${i}`,
            displayName: `Test User ${i}`,
          });
      }

      // Test pagination
      const page1Response = await request(app)
        .get('/users?page=1&limit=5')
        .expect(200);

      expect(page1Response.body.data.users).toHaveLength(5);
      expect(page1Response.body.data.pagination.page).toBe(1);
      expect(page1Response.body.data.pagination.limit).toBe(5);
      expect(page1Response.body.data.pagination.totalPages).toBeGreaterThan(1);
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (app?.server) {
      await new Promise(resolve => {
        app.server.close(resolve);
      });
    }

    if (optimizer) {
      optimizer.shutdown();
    }

    if (dbPool) {
      await dbPool.shutdown();
    }
  });
});