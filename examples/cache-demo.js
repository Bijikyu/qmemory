/**
 * Cache Utilities Demo
 * Comprehensive demonstration of Redis-based caching with environment awareness
 *
 * This demo showcases how the cache utilities adapt to different environments:
 * - Development: Bypasses cache for faster iteration
 * - Production: Uses Redis for persistent caching with TTL
 * - Fallback: Gracefully handles Redis unavailability
 *
 * Real-world scenarios demonstrated:
 * 1. Database query caching with TTL
 * 2. API response caching with dynamic keys
 * 3. Expensive computation caching
 * 4. Cache invalidation patterns
 * 5. Cache monitoring and health checks
 * 6. Error handling and fallback behaviors
 */

const {
  withCache,
  initializeRedisClient,
  disconnectRedis,
  invalidateCache,
  getCacheStats,
} = require('../lib/cache-utils');

const localVars = require('../config/localVars');

// Simulate expensive operations for demonstration
async function simulateExpensiveDbQuery(userId) {
  console.log(`📊 Executing expensive database query for user: ${userId}`);
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate DB delay
  return {
    userId,
    profile: {
      name: `User ${userId}`,
      email: `user${userId}@example.com`,
      preferences: {
        theme: 'dark',
        language: 'en',
      },
    },
    lastLogin: new Date().toISOString(),
    queryTimestamp: new Date().toISOString(),
  };
}

async function simulateApiCall(city) {
  console.log(`🌤️  Fetching weather data for: ${city}`);
  await new Promise(resolve => setTimeout(resolve, 200)); // Simulate API delay
  return {
    city,
    temperature: Math.floor(Math.random() * 35) + 10,
    condition: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)],
    humidity: Math.floor(Math.random() * 50) + 30,
    fetchedAt: new Date().toISOString(),
  };
}

async function simulateExpensiveCalculation(dataset) {
  console.log(`🧮 Performing expensive calculation on dataset: ${dataset}`);
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate computation time

  // Simulate complex calculation
  let result = 0;
  for (let i = 0; i < 1000000; i++) {
    result += Math.sqrt(i) * Math.random();
  }

  return {
    dataset,
    result: result.toFixed(2),
    iterations: 1000000,
    calculatedAt: new Date().toISOString(),
  };
}

async function demo1_basicCaching() {
  console.log('\n=== Demo 1: Basic Cache Usage Patterns ===');

  // Demonstrate user profile caching
  console.log('\n--- User Profile Caching ---');
  const userId = 'user_123';

  console.log('🔄 First call (cache miss expected):');
  const startTime1 = Date.now();
  const profile1 = await withCache(
    `user:profile:${userId}`,
    300, // 5 minutes TTL
    () => simulateExpensiveDbQuery(userId)
  );
  const time1 = Date.now() - startTime1;
  console.log(`✅ Profile retrieved in ${time1}ms:`, profile1.profile.name);

  console.log('\n🔄 Second call (cache hit expected in production):');
  const startTime2 = Date.now();
  const profile2 = await withCache(`user:profile:${userId}`, 300, () =>
    simulateExpensiveDbQuery(userId)
  );
  const time2 = Date.now() - startTime2;
  console.log(`✅ Profile retrieved in ${time2}ms:`, profile2.profile.name);

  // Compare timestamps to show caching behavior
  if (profile1.queryTimestamp === profile2.queryTimestamp) {
    console.log('📈 Cache hit detected - same timestamp returned');
  } else {
    console.log('📉 No cache hit - different timestamps (expected in development)');
  }
}

async function demo2_dynamicKeyCaching() {
  console.log('\n=== Demo 2: Dynamic Cache Keys ===');

  const cities = ['New York', 'London', 'Tokyo'];

  console.log('\n--- Weather Data Caching ---');
  for (const city of cities) {
    console.log(`\n🌍 Fetching weather for ${city}:`);

    const startTime = Date.now();
    const weather = await withCache(
      `weather:${city.toLowerCase().replace(' ', '_')}`,
      1800, // 30 minutes TTL
      () => simulateApiCall(city)
    );
    const time = Date.now() - startTime;

    console.log(`✅ Weather data retrieved in ${time}ms:`);
    console.log(`   Temperature: ${weather.temperature}°C`);
    console.log(`   Condition: ${weather.condition}`);
    console.log(`   Humidity: ${weather.humidity}%`);
  }

  // Demonstrate second round of calls
  console.log('\n--- Second Round (Cache Behavior Test) ---');
  for (const city of cities) {
    const startTime = Date.now();
    const weather = await withCache(`weather:${city.toLowerCase().replace(' ', '_')}`, 1800, () =>
      simulateApiCall(city)
    );
    const time = Date.now() - startTime;

    console.log(
      `🔄 ${city}: ${time}ms, fetched at ${new Date(weather.fetchedAt).toLocaleTimeString()}`
    );
  }
}

async function demo3_computationCaching() {
  console.log('\n=== Demo 3: Expensive Computation Caching ===');

  const datasets = ['financial_data', 'user_analytics', 'sales_metrics'];

  console.log('\n--- Mathematical Computation Caching ---');
  for (const dataset of datasets) {
    console.log(`\n🧮 Processing ${dataset}:`);

    const startTime = Date.now();
    const result = await withCache(
      `computation:${dataset}`,
      3600, // 1 hour TTL
      () => simulateExpensiveCalculation(dataset)
    );
    const time = Date.now() - startTime;

    console.log(`✅ Computation completed in ${time}ms:`);
    console.log(`   Dataset: ${result.dataset}`);
    console.log(`   Result: ${result.result}`);
    console.log(`   Calculated at: ${new Date(result.calculatedAt).toLocaleTimeString()}`);
  }
}

async function demo4_cacheInvalidation() {
  console.log('\n=== Demo 4: Cache Invalidation Patterns ===');

  // Cache some data first
  console.log('\n--- Setting Up Cache Data ---');
  await withCache('demo:item1', 3600, async () => ({ data: 'item1', created: Date.now() }));
  await withCache('demo:item2', 3600, async () => ({ data: 'item2', created: Date.now() }));
  await withCache('test:item1', 3600, async () => ({ data: 'test1', created: Date.now() }));

  console.log('✅ Cache data setup completed');

  // Demonstrate single key invalidation
  console.log('\n--- Single Key Invalidation ---');
  const deleted1 = await invalidateCache('demo:item1');
  console.log(`✅ Invalidated single key, deleted: ${deleted1} items`);

  // Demonstrate pattern-based invalidation
  console.log('\n--- Pattern-Based Invalidation ---');
  const deleted2 = await invalidateCache('demo:*', true);
  console.log(`✅ Invalidated pattern keys, deleted: ${deleted2} items`);

  // Verify invalidation worked
  console.log('\n--- Verification ---');
  const freshData = await withCache('demo:item1', 3600, async () => ({
    data: 'fresh_item1',
    created: Date.now(),
    note: 'This should be fresh data after invalidation',
  }));
  console.log('✅ Fresh data after invalidation:', freshData.note);
}

async function demo5_cacheMonitoring() {
  console.log('\n=== Demo 5: Cache Monitoring and Health Checks ===');

  console.log('\n--- Cache Statistics ---');
  const stats = await getCacheStats();

  console.log('📊 Cache Health Report:');
  console.log(`   Environment: ${stats.environment}`);
  console.log(`   Redis Available: ${stats.redisAvailable}`);
  console.log(`   Connected: ${stats.connected}`);
  console.log(`   Status: ${stats.message}`);

  if (stats.memoryUsage) {
    console.log(`   Memory Usage: ${stats.memoryUsage}`);
    console.log(`   Connected Clients: ${stats.connectedClients}`);
    console.log(`   Total Commands: ${stats.totalCommands}`);
  }

  if (stats.error) {
    console.log(`   Error: ${stats.error}`);
  }
}

async function demo6_errorHandlingAndFallbacks() {
  console.log('\n=== Demo 6: Error Handling and Fallback Patterns ===');

  console.log('\n--- Testing Input Validation ---');

  // Test invalid cache key
  try {
    await withCache('', 300, () => Promise.resolve('test'));
  } catch (error) {
    console.log('✅ Invalid key error handled:', error.message);
  }

  // Test invalid TTL
  try {
    await withCache('test:key', -1, () => Promise.resolve('test'));
  } catch (error) {
    console.log('✅ Invalid TTL error handled:', error.message);
  }

  // Test invalid function
  try {
    await withCache('test:key', 300, 'not a function');
  } catch (error) {
    console.log('✅ Invalid function error handled:', error.message);
  }

  console.log('\n--- Testing Fallback Behavior ---');

  // This will demonstrate fallback behavior in both environments
  const fallbackResult = await withCache('fallback:test', 300, async () => {
    return {
      message: 'This executed successfully despite any Redis issues',
      executedAt: new Date().toISOString(),
      environment: localVars.NODE_ENV,
    };
  });

  console.log('✅ Fallback execution successful:', fallbackResult.message);
  console.log(`   Environment: ${fallbackResult.environment}`);
}

async function demo7_performanceComparison() {
  console.log('\n=== Demo 7: Performance Impact Analysis ===');

  const testKey = 'performance:test';
  const iterations = 5;

  console.log(`\n--- Performance Test (${iterations} iterations) ---`);

  let totalCacheTime = 0;
  let totalDirectTime = 0;

  // Test cached execution times
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    await withCache(`${testKey}:${i}`, 300, () => simulateExpensiveDbQuery(`perf_user_${i}`));
    totalCacheTime += Date.now() - startTime;
  }

  // Test direct execution times for comparison
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    await simulateExpensiveDbQuery(`direct_user_${i}`);
    totalDirectTime += Date.now() - startTime;
  }

  const avgCacheTime = totalCacheTime / iterations;
  const avgDirectTime = totalDirectTime / iterations;

  console.log('📈 Performance Analysis Results:');
  console.log(`   Average cache-enabled time: ${avgCacheTime.toFixed(1)}ms`);
  console.log(`   Average direct execution time: ${avgDirectTime.toFixed(1)}ms`);

  if (localVars.NODE_ENV === 'production') {
    const improvement = ((avgDirectTime - avgCacheTime) / avgDirectTime) * 100;
    console.log(`   Performance improvement: ${improvement.toFixed(1)}%`);
  } else {
    console.log('   Development mode: Cache bypass active for debugging');
  }
}

async function runAllCacheDemos() {
  console.log('🚀 Starting Cache Utilities Demo Suite');
  console.log(`Environment: ${localVars.NODE_ENV}`);
  console.log('This demo showcases intelligent caching with environment awareness\n');

  try {
    // Initialize Redis in production mode (will skip in development)
    console.log('🔌 Initializing cache system...');
    const initialized = await initializeRedisClient();

    if (initialized) {
      console.log('✅ Redis cache initialized for production mode');
    } else {
      console.log('ℹ️  Cache bypassed (development mode or Redis unavailable)');
    }

    await demo1_basicCaching();
    await demo2_dynamicKeyCaching();
    await demo3_computationCaching();
    await demo4_cacheInvalidation();
    await demo5_cacheMonitoring();
    await demo6_errorHandlingAndFallbacks();
    await demo7_performanceComparison();

    console.log('\n🎉 All cache demos completed successfully!');
    console.log('\nKey benefits demonstrated:');
    console.log('✅ Environment-aware caching (development bypass, production Redis)');
    console.log('✅ Graceful fallback when Redis is unavailable');
    console.log('✅ Flexible TTL management for different data types');
    console.log('✅ Dynamic cache keys for scalable caching strategies');
    console.log('✅ Pattern-based cache invalidation for bulk operations');
    console.log('✅ Comprehensive error handling and input validation');
    console.log('✅ Performance monitoring and health check capabilities');
    console.log('✅ Automatic JSON serialization for complex objects');
  } catch (error) {
    console.error('❌ Demo suite failed:', error.message);
    throw error;
  } finally {
    // Clean up Redis connection
    console.log('\n🧹 Cleaning up cache connections...');
    await disconnectRedis();
    console.log('✅ Cache cleanup completed');
  }
}

// Export for testing and usage
module.exports = {
  demo1_basicCaching,
  demo2_dynamicKeyCaching,
  demo3_computationCaching,
  demo4_cacheInvalidation,
  demo5_cacheMonitoring,
  demo6_errorHandlingAndFallbacks,
  demo7_performanceComparison,
  runAllCacheDemos,
  simulateExpensiveDbQuery,
  simulateApiCall,
  simulateExpensiveCalculation,
};

// Run demo if called directly
if (require.main === module) {
  runAllCacheDemos()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
}
