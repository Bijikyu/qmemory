/**
 * Cache Utilities Tests
 * Comprehensive tests for Redis-based caching with environment-aware behavior
 */

const {
  withCache,
  initializeRedisClient,
  disconnectRedis,
  invalidateCache,
  getCacheStats
} = require('../../lib/cache-utils');

// Mock Redis client for testing
const mockRedisClient = {
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  ping: jest.fn(),
  info: jest.fn(),
  connect: jest.fn(),
  quit: jest.fn(),
  on: jest.fn()
};

// Mock redis module
jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient)
}));

describe('Cache Utils Module', () => {
  let originalNodeEnv;
  
  beforeEach(() => {
    // Store original NODE_ENV
    originalNodeEnv = process.env.NODE_ENV;
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset console methods
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });
  
  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });
  
  describe('withCache function', () => {
    describe('development mode behavior', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development';
      });
      
      test('should bypass cache in development mode', async () => {
        const mockFn = jest.fn().mockResolvedValue('development result');
        
        const result = await withCache('test:key', 300, mockFn);
        
        expect(result).toBe('development result');
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('Cache bypass for key: test:key')
        );
      });
      
      test('should execute function every time without caching in development', async () => {
        const mockFn = jest.fn()
          .mockResolvedValueOnce('first call')
          .mockResolvedValueOnce('second call');
        
        const result1 = await withCache('test:key', 300, mockFn);
        const result2 = await withCache('test:key', 300, mockFn);
        
        expect(result1).toBe('first call');
        expect(result2).toBe('second call');
        expect(mockFn).toHaveBeenCalledTimes(2);
      });
    });
    
    describe('production mode behavior', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
        // Clear module cache and set up Redis client mock
        delete require.cache[require.resolve('../../lib/cache-utils')];
        const cacheUtils = require('../../lib/cache-utils');
        cacheUtils.__setRedisClient(mockRedisClient);
      });
      
      test('should return cached result on cache hit', async () => {
        mockRedisClient.get.mockResolvedValue('"cached result"');
        const mockFn = jest.fn().mockResolvedValue('fresh result');
        
        const result = await withCache('test:key', 300, mockFn);
        
        expect(result).toBe('cached result');
        expect(mockFn).not.toHaveBeenCalled();
        expect(mockRedisClient.get).toHaveBeenCalledWith('test:key');
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('Cache hit for key: test:key')
        );
      });
      
      test('should execute function and cache result on cache miss', async () => {
        mockRedisClient.get.mockResolvedValue(null);
        mockRedisClient.setEx.mockResolvedValue('OK');
        const mockFn = jest.fn().mockResolvedValue({ data: 'fresh result' });
        
        const result = await withCache('test:key', 300, mockFn);
        
        expect(result).toEqual({ data: 'fresh result' });
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockRedisClient.get).toHaveBeenCalledWith('test:key');
        expect(mockRedisClient.setEx).toHaveBeenCalledWith(
          'test:key',
          300,
          '{"data":"fresh result"}'
        );
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('Cache miss for key: test:key')
        );
      });
      
      test('should handle Redis errors gracefully and fallback to function execution', async () => {
        mockRedisClient.get.mockRejectedValue(new Error('Redis connection failed'));
        const mockFn = jest.fn().mockResolvedValue('fallback result');
        
        const result = await withCache('test:key', 300, mockFn);
        
        expect(result).toBe('fallback result');
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining('Redis cache error for key test:key'),
          expect.any(String)
        );
      });
      
      test('should handle JSON parse errors gracefully', async () => {
        mockRedisClient.get.mockResolvedValue('invalid json');
        mockRedisClient.setEx.mockResolvedValue('OK');
        const mockFn = jest.fn().mockResolvedValue('fresh result');
        
        const result = await withCache('test:key', 300, mockFn);
        
        expect(result).toBe('fresh result');
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining('Failed to parse cached data for key test:key'),
          expect.any(String)
        );
      });
      
      test('should continue execution even if caching fails', async () => {
        mockRedisClient.get.mockResolvedValue(null);
        mockRedisClient.setEx.mockRejectedValue(new Error('Cache write failed'));
        const mockFn = jest.fn().mockResolvedValue('result');
        
        const result = await withCache('test:key', 300, mockFn);
        
        expect(result).toBe('result');
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining('Failed to cache result for key test:key'),
          expect.any(String)
        );
      });
    });
    
    describe('input validation', () => {
      test('should throw error for invalid cache key', async () => {
        await expect(withCache('', 300, () => {})).rejects.toThrow(
          'Cache key must be a non-empty string'
        );
        
        await expect(withCache(null, 300, () => {})).rejects.toThrow(
          'Cache key must be a non-empty string'
        );
        
        await expect(withCache('   ', 300, () => {})).rejects.toThrow(
          'Cache key must be a non-empty string'
        );
      });
      
      test('should throw error for invalid TTL', async () => {
        const mockFn = () => {};
        
        await expect(withCache('key', 0, mockFn)).rejects.toThrow(
          'TTL must be a positive number'
        );
        
        await expect(withCache('key', -100, mockFn)).rejects.toThrow(
          'TTL must be a positive number'
        );
        
        await expect(withCache('key', 'invalid', mockFn)).rejects.toThrow(
          'TTL must be a positive number'
        );
      });
      
      test('should throw error for invalid function parameter', async () => {
        await expect(withCache('key', 300, null)).rejects.toThrow(
          'Function parameter must be a callable function'
        );
        
        await expect(withCache('key', 300, 'not a function')).rejects.toThrow(
          'Function parameter must be a callable function'
        );
        
        await expect(withCache('key', 300, 123)).rejects.toThrow(
          'Function parameter must be a callable function'
        );
      });
    });
  });
  
  describe('initializeRedisClient function', () => {
    const redis = require('redis');
    
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });
    
    test('should skip initialization in development mode', async () => {
      process.env.NODE_ENV = 'development';
      
      const result = await initializeRedisClient();
      
      expect(result).toBe(false);
      expect(console.log).toHaveBeenCalledWith(
        '[INFO] Development mode detected, skipping Redis initialization'
      );
      expect(redis.createClient).not.toHaveBeenCalled();
    });
    
    test('should initialize Redis client successfully in production', async () => {
      mockRedisClient.connect.mockResolvedValue();
      
      const result = await initializeRedisClient({
        host: 'localhost',
        port: 6379
      });
      
      expect(result).toBe(true);
      expect(redis.createClient).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'localhost',
          port: 6379
        })
      );
      expect(mockRedisClient.connect).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        '[INFO] Redis cache initialized and ready'
      );
    });
    
    test('should handle Redis connection errors gracefully', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));
      
      const result = await initializeRedisClient();
      
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        '[WARN] Failed to initialize Redis cache, caching will be disabled:',
        'Connection failed'
      );
    });
    
    test('should use environment variables for Redis configuration', async () => {
      process.env.REDIS_HOST = 'redis.example.com';
      process.env.REDIS_PORT = '6380';
      process.env.REDIS_PASSWORD = 'secret';
      process.env.REDIS_DB = '1';
      
      mockRedisClient.connect.mockResolvedValue();
      
      await initializeRedisClient();
      
      expect(redis.createClient).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'redis.example.com',
          port: '6380',
          password: 'secret',
          db: '1'
        })
      );
      
      // Clean up environment variables
      delete process.env.REDIS_HOST;
      delete process.env.REDIS_PORT;
      delete process.env.REDIS_PASSWORD;
      delete process.env.REDIS_DB;
    });
  });
  
  describe('disconnectRedis function', () => {
    test('should disconnect Redis client gracefully', async () => {
      require('../../lib/cache-utils').__setRedisClient(mockRedisClient);
      mockRedisClient.quit.mockResolvedValue();
      
      await disconnectRedis();
      
      expect(mockRedisClient.quit).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        '[INFO] Redis client disconnected gracefully'
      );
    });
    
    test('should handle disconnect errors gracefully', async () => {
      require('../../lib/cache-utils').__setRedisClient(mockRedisClient);
      mockRedisClient.quit.mockRejectedValue(new Error('Disconnect failed'));
      
      await disconnectRedis();
      
      expect(console.warn).toHaveBeenCalledWith(
        '[WARN] Error during Redis disconnect:',
        'Disconnect failed'
      );
    });
    
    test('should handle null client gracefully', async () => {
      require('../../lib/cache-utils').__setRedisClient(null);
      
      await disconnectRedis();
      
      expect(mockRedisClient.quit).not.toHaveBeenCalled();
    });
  });
  
  describe('invalidateCache function', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      require('../../lib/cache-utils').__setRedisClient(mockRedisClient);
    });
    
    test('should skip invalidation in development mode', async () => {
      process.env.NODE_ENV = 'development';
      
      const result = await invalidateCache('test:key');
      
      expect(result).toBe(0);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Cache invalidation skipped: test:key')
      );
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });
    
    test('should delete single cache key', async () => {
      mockRedisClient.del.mockResolvedValue(1);
      
      const result = await invalidateCache('test:key');
      
      expect(result).toBe(1);
      expect(mockRedisClient.del).toHaveBeenCalledWith('test:key');
      expect(console.log).toHaveBeenCalledWith(
        '[DEBUG] Invalidated cache key: test:key'
      );
    });
    
    test('should delete multiple keys using pattern', async () => {
      mockRedisClient.keys.mockResolvedValue(['test:key1', 'test:key2']);
      mockRedisClient.del.mockResolvedValue(2);
      
      const result = await invalidateCache('test:*', true);
      
      expect(result).toBe(2);
      expect(mockRedisClient.keys).toHaveBeenCalledWith('test:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(['test:key1', 'test:key2']);
      expect(console.log).toHaveBeenCalledWith(
        '[DEBUG] Invalidated 2 cache keys matching pattern: test:*'
      );
    });
    
    test('should handle pattern with no matching keys', async () => {
      mockRedisClient.keys.mockResolvedValue([]);
      
      const result = await invalidateCache('test:*', true);
      
      expect(result).toBe(0);
      expect(console.log).toHaveBeenCalledWith(
        '[DEBUG] No cache keys found matching pattern: test:*'
      );
    });
    
    test('should handle Redis errors gracefully', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Delete failed'));
      
      const result = await invalidateCache('test:key');
      
      expect(result).toBe(0);
      expect(console.warn).toHaveBeenCalledWith(
        '[WARN] Failed to invalidate cache test:key:',
        'Delete failed'
      );
    });
  });
  
  describe('getCacheStats function', () => {
    test('should return development mode stats', async () => {
      process.env.NODE_ENV = 'development';
      
      const stats = await getCacheStats();
      
      expect(stats).toMatchObject({
        connected: false,
        environment: 'development',
        redisAvailable: false,
        message: 'Caching disabled in development mode'
      });
    });
    
    test('should return stats when Redis is not initialized', async () => {
      process.env.NODE_ENV = 'production';
      require('../../lib/cache-utils').__setRedisClient(null);
      
      const stats = await getCacheStats();
      
      expect(stats).toMatchObject({
        connected: false,
        environment: 'production',
        redisAvailable: false,
        message: 'Redis client not initialized'
      });
    });
    
    test('should return Redis server stats when connected', async () => {
      process.env.NODE_ENV = 'production';
      require('../../lib/cache-utils').__setRedisClient(mockRedisClient);
      
      mockRedisClient.ping.mockResolvedValue('PONG');
      mockRedisClient.info.mockResolvedValue(
        'used_memory_human:1.23M\r\n' +
        'connected_clients:5\r\n' +
        'total_commands_processed:12345\r\n'
      );
      
      const stats = await getCacheStats();
      
      expect(stats).toMatchObject({
        connected: true,
        environment: 'production',
        redisAvailable: true,
        memoryUsage: '1.23M',
        connectedClients: 5,
        totalCommands: 12345,
        message: 'Redis cache operational'
      });
      expect(mockRedisClient.ping).toHaveBeenCalled();
    });
    
    test('should handle Redis ping errors', async () => {
      process.env.NODE_ENV = 'production';
      require('../../lib/cache-utils').__setRedisClient(mockRedisClient);
      
      mockRedisClient.ping.mockRejectedValue(new Error('Ping failed'));
      
      const stats = await getCacheStats();
      
      expect(stats).toMatchObject({
        connected: false,
        environment: 'production',
        redisAvailable: true,
        error: 'Ping failed',
        message: 'Redis cache error'
      });
    });
  });
});

// Helper functions for test setup
function setupCacheUtilsWithMockRedis(mockClient) {
  delete require.cache[require.resolve('../../lib/cache-utils')];
  const cacheUtils = require('../../lib/cache-utils');
  cacheUtils.__setRedisClient(mockClient);
  return cacheUtils;
}