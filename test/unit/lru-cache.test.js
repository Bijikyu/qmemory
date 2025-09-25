/**
 * LRU Cache Tests
 * Tests for the LRU cache implementation with performance monitoring
 */

const { createCache } = require('../../lib/lru-cache');
const { getCacheMetrics, resetCacheMetrics } = require('../../lib/perf');

describe('LRU Cache with Performance Monitoring', () => {
  beforeEach(() => {
    resetCacheMetrics(); // Reset metrics before each test
  });

  describe('createCache function', () => {
    test('should create a cache with basic functionality', () => {
      const cache = createCache({ name: 'test-cache', max: 3 });
      
      expect(cache).toHaveProperty('get');
      expect(cache).toHaveProperty('set');
      expect(cache).toHaveProperty('delete');
      expect(cache).toHaveProperty('clear');
      expect(cache).toHaveProperty('lru');
    });

    test('should track cache hits and misses', () => {
      const cache = createCache({ name: 'test-cache', max: 3 });
      
      // Test cache miss
      cache.get('nonexistent-key');
      let metrics = getCacheMetrics('test-cache');
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(1);
      
      // Set and get value (should be a hit)
      cache.set('key1', 'value1');
      cache.get('key1');
      
      metrics = getCacheMetrics('test-cache');
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(1);
    });

    test('should track cache size correctly', () => {
      const cache = createCache({ name: 'test-cache', max: 3 });
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      let metrics = getCacheMetrics('test-cache');
      expect(metrics.keys).toBe(2);
      
      cache.delete('key1');
      metrics = getCacheMetrics('test-cache');
      expect(metrics.keys).toBe(1);
      
      cache.clear();
      metrics = getCacheMetrics('test-cache');
      expect(metrics.keys).toBe(0);
    });

    test('should respect max size limit', () => {
      const cache = createCache({ name: 'test-cache', max: 2 });
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3'); // Should evict key1 (LRU)
      
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
    });

    test('should handle TTL correctly', (done) => {
      const cache = createCache({ name: 'test-cache', max: 3, ttl: 50 }); // 50ms TTL
      
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      
      setTimeout(() => {
        expect(cache.get('key1')).toBeUndefined(); // Should be expired
        done();
      }, 60); // Wait 60ms for expiration
    }, 100);
  });

  describe('error handling', () => {
    test('should handle perf tracking errors gracefully', () => {
      // Create cache with invalid name that might cause issues
      const cache = createCache({ name: '', max: 3 });
      
      // Should not throw errors even with problematic cache name
      expect(() => {
        cache.set('key1', 'value1');
        cache.get('key1');
        cache.delete('key1');
        cache.clear();
      }).not.toThrow();
    });
  });
});