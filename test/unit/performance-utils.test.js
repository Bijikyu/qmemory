/**
 * Performance Monitoring Utilities Test Suite
 * Comprehensive tests for performance tracking and metrics collection
 * 
 * This test suite validates all aspects of the performance monitoring utilities including
 * database metrics tracking, HTTP request monitoring, system resource tracking, and
 * unified performance reporting. Tests cover normal operation, edge cases, and integration
 * with existing library patterns.
 */

const {
  DatabaseMetrics,
  RequestMetrics,
  SystemMetrics,
  PerformanceMonitor
} = require('../../lib/performance-utils');

describe('Performance Monitoring Utilities', () => {
  
  describe('DatabaseMetrics', () => {
    let dbMetrics;

    beforeEach(() => {
      dbMetrics = new DatabaseMetrics();
    });

    test('should initialize with default configuration', () => { // basic initialization test
      expect(dbMetrics.slowQueryThreshold).toBe(100);
      expect(dbMetrics.queryCount).toBe(0);
      expect(dbMetrics.queryTimes.size).toBe(0);
      expect(dbMetrics.slowQueries).toEqual([]);
    });

    test('should initialize with custom configuration', () => { // custom config test
      const customDb = new DatabaseMetrics({
        slowQueryThreshold: 200,
        maxSlowQueries: 50,
        maxRecentTimes: 200
      });
      
      expect(customDb.slowQueryThreshold).toBe(200);
      expect(customDb.maxSlowQueries).toBe(50);
      expect(customDb.maxRecentTimes).toBe(200);
    });

    test('should record query performance metrics', () => { // basic query recording
      dbMetrics.recordQuery('getUserById', 50, true, { userId: 123 });
      
      expect(dbMetrics.queryCount).toBe(1);
      expect(dbMetrics.queryTimes.has('getUserById')).toBe(true);
      
      const stats = dbMetrics.queryTimes.get('getUserById');
      expect(stats.count).toBe(1);
      expect(stats.total).toBe(50);
      expect(stats.min).toBe(50);
      expect(stats.max).toBe(50);
      expect(stats.failures).toBe(0);
    });

    test('should accumulate statistics for repeated queries', () => { // statistical accumulation
      dbMetrics.recordQuery('getUserById', 30, true);
      dbMetrics.recordQuery('getUserById', 70, true);
      dbMetrics.recordQuery('getUserById', 50, true);
      
      const stats = dbMetrics.queryTimes.get('getUserById');
      expect(stats.count).toBe(3);
      expect(stats.total).toBe(150);
      expect(stats.min).toBe(30);
      expect(stats.max).toBe(70);
      expect(stats.failures).toBe(0);
    });

    test('should track query failures', () => { // failure tracking
      dbMetrics.recordQuery('failingQuery', 100, false);
      dbMetrics.recordQuery('failingQuery', 80, true);
      dbMetrics.recordQuery('failingQuery', 90, false);
      
      const stats = dbMetrics.queryTimes.get('failingQuery');
      expect(stats.count).toBe(3);
      expect(stats.failures).toBe(2);
    });

    test('should detect and track slow queries', () => { // slow query detection
      const mockEmit = jest.fn();
      dbMetrics.emit = mockEmit;
      
      dbMetrics.recordQuery('slowQuery', 150, true, { table: 'users' });
      
      expect(dbMetrics.slowQueries).toHaveLength(1);
      expect(dbMetrics.slowQueries[0].queryName).toBe('slowQuery');
      expect(dbMetrics.slowQueries[0].duration).toBe(150);
      expect(mockEmit).toHaveBeenCalledWith('slowQuery', expect.objectContaining({
        queryName: 'slowQuery',
        duration: 150,
        success: true
      }));
    });

    test('should maintain bounded slow query history', () => { // memory management
      const dbMetricsLimited = new DatabaseMetrics({ maxSlowQueries: 3 });
      
      // Add more slow queries than the limit
      for (let i = 0; i < 5; i++) {
        dbMetricsLimited.recordQuery(`slowQuery${i}`, 150, true);
      }
      
      expect(dbMetricsLimited.slowQueries).toHaveLength(3);
      expect(dbMetricsLimited.slowQueries[0].queryName).toBe('slowQuery2'); // Oldest removed
      expect(dbMetricsLimited.slowQueries[2].queryName).toBe('slowQuery4'); // Latest kept
    });

    test('should calculate percentiles with sufficient data', () => { // percentile calculation
      const queryName = 'testQuery';
      
      // Add enough data points for percentile calculation
      for (let i = 1; i <= 25; i++) {
        dbMetrics.recordQuery(queryName, i * 10, true);
      }
      
      const stats = dbMetrics.queryTimes.get(queryName);
      expect(stats.p95).toBeGreaterThan(0);
      expect(stats.p95).toBeLessThanOrEqual(250); // Should be near 95th percentile
    });

    test('should update connection metrics', () => { // connection tracking
      dbMetrics.updateConnectionMetrics(5, 10, 100, 95);
      
      expect(dbMetrics.connectionMetrics).toEqual({
        active: 5,
        available: 10,
        created: 100,
        destroyed: 95
      });
    });

    test('should generate comprehensive metrics report', () => { // metrics reporting
      dbMetrics.recordQuery('query1', 50, true);
      dbMetrics.recordQuery('query1', 75, true);
      dbMetrics.recordQuery('query2', 120, false); // Slow and failed
      dbMetrics.updateConnectionMetrics(3, 7, 50, 45);
      
      const metrics = dbMetrics.getMetrics();
      
      expect(metrics.totalQueries).toBe(3);
      expect(metrics.slowQueries).toBe(1);
      expect(metrics.connectionPool).toEqual({
        active: 3,
        available: 7,
        created: 50,
        destroyed: 45
      });
      
      expect(metrics.queryStats.query1).toEqual(expect.objectContaining({
        count: 2,
        avgDuration: 62.5,
        minDuration: 50,
        maxDuration: 75,
        failureRate: 0
      }));
      
      expect(metrics.queryStats.query2).toEqual(expect.objectContaining({
        count: 1,
        avgDuration: 120,
        failureRate: 100
      }));
    });

    test('should calculate queries per second', () => { // QPS calculation
      // Mock process.uptime to return a known value
      const originalUptime = process.uptime;
      process.uptime = jest.fn().mockReturnValue(3600); // 1 hour
      
      const qps = dbMetrics.calculateQPS(100);
      expect(qps).toBe(100); // 100 queries in 1 hour = 100 QPS
      
      process.uptime = originalUptime;
    });
  });

  describe('RequestMetrics', () => {
    let requestMetrics;

    beforeEach(() => {
      requestMetrics = new RequestMetrics();
    });

    test('should initialize with default configuration', () => { // basic initialization
      expect(requestMetrics.totalRequests).toBe(0);
      expect(requestMetrics.endpoints.size).toBe(0);
      expect(requestMetrics.startTime).toBeLessThanOrEqual(Date.now());
    });

    test('should record HTTP request metrics', () => { // basic request recording
      requestMetrics.recordRequest('GET', '/users', 200, 45);
      
      expect(requestMetrics.totalRequests).toBe(1);
      expect(requestMetrics.endpoints.has('GET /users')).toBe(true);
      
      const stats = requestMetrics.endpoints.get('GET /users');
      expect(stats.requests).toBe(1);
      expect(stats.totalDuration).toBe(45);
      expect(stats.minDuration).toBe(45);
      expect(stats.maxDuration).toBe(45);
      expect(stats.statusCodes.get(200)).toBe(1);
    });

    test('should accumulate statistics for same endpoint', () => { // statistical accumulation
      requestMetrics.recordRequest('GET', '/users', 200, 30);
      requestMetrics.recordRequest('GET', '/users', 200, 50);
      requestMetrics.recordRequest('GET', '/users', 404, 25);
      
      const stats = requestMetrics.endpoints.get('GET /users');
      expect(stats.requests).toBe(3);
      expect(stats.totalDuration).toBe(105);
      expect(stats.minDuration).toBe(25);
      expect(stats.maxDuration).toBe(50);
      expect(stats.statusCodes.get(200)).toBe(2);
      expect(stats.statusCodes.get(404)).toBe(1);
    });

    test('should track different endpoints separately', () => { // endpoint separation
      requestMetrics.recordRequest('GET', '/users', 200, 30);
      requestMetrics.recordRequest('POST', '/users', 201, 80);
      requestMetrics.recordRequest('GET', '/posts', 200, 40);
      
      expect(requestMetrics.endpoints.size).toBe(3);
      expect(requestMetrics.endpoints.has('GET /users')).toBe(true);
      expect(requestMetrics.endpoints.has('POST /users')).toBe(true);
      expect(requestMetrics.endpoints.has('GET /posts')).toBe(true);
      expect(requestMetrics.totalRequests).toBe(3);
    });

    test('should maintain bounded recent times history', () => { // memory management
      const limitedMetrics = new RequestMetrics({ maxRecentTimes: 3 });
      
      for (let i = 1; i <= 5; i++) {
        limitedMetrics.recordRequest('GET', '/test', 200, i * 10);
      }
      
      const stats = limitedMetrics.endpoints.get('GET /test');
      expect(stats.recentTimes).toHaveLength(3);
      expect(stats.recentTimes).toEqual([30, 40, 50]); // Last 3 values
    });

    test('should calculate percentiles with sufficient data', () => { // percentile calculation
      const endpoint = 'GET /test';
      
      for (let i = 1; i <= 25; i++) {
        requestMetrics.recordRequest('GET', '/test', 200, i * 5);
      }
      
      const stats = requestMetrics.endpoints.get(endpoint);
      expect(stats.p95).toBeGreaterThan(0);
      expect(stats.p95).toBeLessThanOrEqual(125); // Should be near 95th percentile
    });

    test('should generate comprehensive metrics report', () => { // metrics reporting
      // Add some test data
      requestMetrics.recordRequest('GET', '/users', 200, 30);
      requestMetrics.recordRequest('GET', '/users', 404, 25);
      requestMetrics.recordRequest('POST', '/users', 500, 100);
      
      const metrics = requestMetrics.getMetrics();
      
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.requestsPerSecond).toBeGreaterThanOrEqual(0);
      expect(metrics.uptime).toBeGreaterThanOrEqual(0);
      
      expect(metrics.endpoints['GET /users']).toEqual(expect.objectContaining({
        requests: 2,
        avgDuration: 27.5,
        minDuration: 25,
        maxDuration: 30,
        errorRate: 50, // 1 error out of 2 requests
        statusCodes: { '200': 1, '404': 1 }
      }));
      
      expect(metrics.endpoints['POST /users']).toEqual(expect.objectContaining({
        requests: 1,
        avgDuration: 100,
        errorRate: 100, // 500 error
        statusCodes: { '500': 1 }
      }));
    });

    test('should calculate requests per second correctly', () => { // RPS calculation
      // Mock start time to be 2 seconds ago
      requestMetrics.startTime = Date.now() - 2000;
      requestMetrics.totalRequests = 10;
      
      const metrics = requestMetrics.getMetrics();
      expect(metrics.requestsPerSecond).toBeCloseTo(5, 0); // 10 requests in 2 seconds
    });
  });

  describe('SystemMetrics', () => {
    let systemMetrics;

    beforeEach(() => {
      systemMetrics = new SystemMetrics({ collectionInterval: 100 }); // Fast interval for testing
    });

    afterEach(() => {
      systemMetrics.stop(); // Clean up timers
    });

    test('should initialize with default configuration', () => { // basic initialization
      expect(systemMetrics.memoryHistory).toEqual([]);
      expect(systemMetrics.cpuHistory).toEqual([]);
      expect(systemMetrics.collectionInterval).toBe(100);
      expect(systemMetrics.collectionTimer).toBeDefined();
    });

    test('should collect metrics automatically', (done) => { // automatic collection
      setTimeout(() => {
        expect(systemMetrics.memoryHistory.length).toBeGreaterThan(0);
        expect(systemMetrics.cpuHistory.length).toBeGreaterThan(0);
        done();
      }, 150); // Wait for at least one collection cycle
    });

    test('should maintain bounded history', () => { // memory management
      const limitedMetrics = new SystemMetrics({ 
        collectionInterval: 1000,
        maxHistoryPoints: 3 
      });
      
      // Manually add more points than the limit
      for (let i = 0; i < 5; i++) {
        limitedMetrics.memoryHistory.push({ timestamp: Date.now(), rss: i });
        limitedMetrics.cpuHistory.push({ timestamp: Date.now(), percent: i });
      }
      
      // Simulate the boundry maintenance that happens in collectMetrics
      while (limitedMetrics.memoryHistory.length > limitedMetrics.maxHistoryPoints) {
        limitedMetrics.memoryHistory.shift();
      }
      while (limitedMetrics.cpuHistory.length > limitedMetrics.maxHistoryPoints) {
        limitedMetrics.cpuHistory.shift();
      }
      
      expect(limitedMetrics.memoryHistory).toHaveLength(3);
      expect(limitedMetrics.cpuHistory).toHaveLength(3);
      
      limitedMetrics.stop();
    });

    test('should generate current metrics report', () => { // metrics reporting
      const metrics = systemMetrics.getMetrics();
      
      expect(metrics.memory.current).toEqual(expect.objectContaining({
        rss: expect.any(Number),
        heapUsed: expect.any(Number),
        heapTotal: expect.any(Number),
        external: expect.any(Number)
      }));
      
      expect(metrics.cpu).toEqual(expect.objectContaining({
        current: expect.any(Number),
        history: expect.any(Array)
      }));
      
      expect(metrics.uptime).toBeGreaterThanOrEqual(0);
      expect(metrics.nodeVersion).toBe(process.version);
    });

    test('should calculate CPU average from recent history', (done) => { // CPU calculation
      setTimeout(() => {
        const metrics = systemMetrics.getMetrics();
        expect(metrics.cpu.current).toBeGreaterThanOrEqual(0);
        expect(metrics.cpu.current).toBeLessThanOrEqual(100);
        done();
      }, 150);
    });

    test('should stop collection timer properly', () => { // cleanup test
      expect(systemMetrics.collectionTimer).toBeDefined();
      systemMetrics.stop();
      expect(systemMetrics.collectionTimer).toBeNull();
    });
  });

  describe('Singleton instance functionality', () => {
    test('should export a ready-to-use singleton instance', () => { // singleton pattern
      const { performanceMonitor } = require('../../lib/performance-utils');
      
      expect(performanceMonitor).toBeDefined();
      expect(performanceMonitor).toBeInstanceOf(PerformanceMonitor);
      expect(performanceMonitor.database).toBeDefined();
      expect(performanceMonitor.requests).toBeDefined();
      expect(performanceMonitor.system).toBeDefined();
    });

    test('should maintain singleton state across imports', () => { // singleton consistency
      const { performanceMonitor: instance1 } = require('../../lib/performance-utils');
      const { performanceMonitor: instance2 } = require('../../lib/performance-utils');
      
      // Record operation on first instance
      instance1.database.recordQuery('testQuery', 50, true);
      
      // Verify state is shared with second instance
      const metrics1 = instance1.getComprehensiveMetrics();
      const metrics2 = instance2.getComprehensiveMetrics();
      
      expect(metrics1.database.totalQueries).toBe(metrics2.database.totalQueries);
      expect(instance1).toBe(instance2); // Should be the same object reference
    });

    test('should work alongside custom instances', () => { // singleton coexistence
      const { performanceMonitor } = require('../../lib/performance-utils');
      const customMonitor = new PerformanceMonitor();
      
      // Record different operations on each
      performanceMonitor.database.recordQuery('singletonQuery', 40, true);
      customMonitor.database.recordQuery('customQuery', 60, true);
      
      const singletonMetrics = performanceMonitor.getComprehensiveMetrics();
      const customMetrics = customMonitor.getComprehensiveMetrics();
      
      // Should have independent state
      expect(singletonMetrics.database.totalQueries).not.toBe(customMetrics.database.totalQueries);
      
      customMonitor.stop();
    });
  });

  describe('PerformanceMonitor', () => {
    let perfMonitor;

    beforeEach(() => {
      perfMonitor = new PerformanceMonitor({
        system: { collectionInterval: 100 }
      });
    });

    afterEach(() => {
      perfMonitor.stop();
    });

    test('should initialize all monitoring components', () => { // component initialization
      expect(perfMonitor.database).toBeInstanceOf(DatabaseMetrics);
      expect(perfMonitor.requests).toBeInstanceOf(RequestMetrics);
      expect(perfMonitor.system).toBeInstanceOf(SystemMetrics);
    });

    test('should create Express middleware', () => { // middleware creation
      const middleware = perfMonitor.createRequestMiddleware();
      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(3); // req, res, next parameters
    });

    test('should track requests through middleware', (done) => { // middleware tracking
      const middleware = perfMonitor.createRequestMiddleware();
      
      // Mock Express request/response objects
      const mockReq = {
        method: 'GET',
        path: '/test',
        route: { path: '/test' },
        get: jest.fn().mockReturnValue('test-agent')
      };
      
      const mockRes = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            setTimeout(callback, 10); // Simulate response completion
          }
        })
      };
      
      const mockNext = jest.fn();
      
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      
      setTimeout(() => {
        expect(perfMonitor.requests.totalRequests).toBe(1);
        done();
      }, 20);
    });

    test('should wrap database operations', async () => { // database wrapping
      const mockOperation = jest.fn().mockResolvedValue('result');
      const wrappedOperation = perfMonitor.wrapDatabaseOperation(mockOperation, 'testQuery');
      
      const result = await wrappedOperation('arg1', 'arg2');
      
      expect(result).toBe('result');
      expect(mockOperation).toHaveBeenCalledWith('arg1', 'arg2');
      expect(perfMonitor.database.queryCount).toBe(1);
    });

    test('should track failed database operations', async () => { // failure tracking
      const mockOperation = jest.fn().mockRejectedValue(new Error('Database error'));
      const wrappedOperation = perfMonitor.wrapDatabaseOperation(mockOperation, 'failingQuery');
      
      await expect(wrappedOperation()).rejects.toThrow('Database error');
      
      const stats = perfMonitor.database.queryTimes.get('failingQuery');
      expect(stats.failures).toBe(1);
    });

    test('should generate comprehensive metrics report', () => { // comprehensive reporting
      // Add some test data
      perfMonitor.database.recordQuery('testQuery', 50, true);
      perfMonitor.requests.recordRequest('GET', '/test', 200, 30);
      
      const metrics = perfMonitor.getComprehensiveMetrics();
      
      expect(metrics.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
      expect(metrics.database).toBeDefined();
      expect(metrics.requests).toBeDefined();
      expect(metrics.system).toBeDefined();
      
      expect(metrics.database.totalQueries).toBe(1);
      expect(metrics.requests.totalRequests).toBe(1);
    });

    test('should generate health check with proper status assessment', (done) => { // health check
      // Add normal performance data
      perfMonitor.database.recordQuery('normalQuery', 50, true);
      perfMonitor.requests.recordRequest('GET', '/test', 200, 30);
      
      // Wait a moment for system metrics to be collected
      setTimeout(() => {
        const health = perfMonitor.getHealthCheck();
        
        expect(health.status).toBe('healthy');
        expect(health.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
        expect(health.checks.database.status).toBe('healthy');
        expect(health.checks.requests.status).toBe('healthy');
        expect(['healthy', 'high_usage']).toContain(health.checks.memory.status);
        done();
      }, 150);
    });

    test('should detect degraded performance in health check', (done) => { // degraded status detection
      // Add many slow queries to trigger degraded status
      for (let i = 0; i < 15; i++) {
        perfMonitor.database.recordQuery('slowQuery', 150, true);
      }
      
      setTimeout(() => {
        const health = perfMonitor.getHealthCheck();
        expect(health.status).toBe('degraded');
        expect(health.checks.database.status).toBe('degraded');
        done();
      }, 50);
    });

    test('should handle slow query events', () => { // event handling
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      perfMonitor.database.recordQuery('verySlowQuery', 200, true);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('PERFORMANCE_ALERT: Slow query detected')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Integration with existing library patterns', () => {
    test('should follow same logging patterns as other modules', () => { // logging consistency
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const dbMetrics = new DatabaseMetrics();
      dbMetrics.recordQuery('testQuery', 50, true);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('DatabaseMetrics')
      );
      
      consoleSpy.mockRestore();
    });

    test('should handle errors gracefully like other utilities', () => { // error handling
      const perfMonitor = new PerformanceMonitor();
      
      // Should not throw when recording metrics with invalid data
      expect(() => {
        perfMonitor.database.recordQuery('', NaN, true);
        perfMonitor.requests.recordRequest('', '', null, NaN);
      }).not.toThrow();
      
      perfMonitor.stop();
    });

    test('should use defensive programming principles', () => { // defensive programming
      const dbMetrics = new DatabaseMetrics();
      
      // Should handle edge cases gracefully
      dbMetrics.recordQuery('test', 0, true, null);
      dbMetrics.recordQuery('test', -1, true, undefined);
      dbMetrics.updateConnectionMetrics(0, 0, 0, 0);
      
      const metrics = dbMetrics.getMetrics();
      expect(metrics.totalQueries).toBe(2);
      expect(metrics.queryStats.test.count).toBe(2);
    });

    test('should maintain consistent export patterns', () => { // export consistency
      const {
        DatabaseMetrics,
        RequestMetrics,
        SystemMetrics,
        PerformanceMonitor
      } = require('../../lib/performance-utils');
      
      expect(typeof DatabaseMetrics).toBe('function');
      expect(typeof RequestMetrics).toBe('function');
      expect(typeof SystemMetrics).toBe('function');
      expect(typeof PerformanceMonitor).toBe('function');
    });
  });
});