/**
 * Enhanced Performance Monitoring Demo
 * Demonstrates the complete performance monitoring capabilities including singleton usage
 * 
 * This demo showcases the enhanced performance monitoring system with:
 * - Singleton pattern for application-wide monitoring
 * - Individual component usage for specialized monitoring
 * - Real-world integration patterns
 * - Database operation tracking
 * - HTTP request monitoring
 * - System resource analysis
 * - Health check functionality
 */

const { 
  DatabaseMetrics, 
  RequestMetrics, 
  SystemMetrics, 
  PerformanceMonitor,
  performanceMonitor  // Enhanced singleton instance
} = require('../lib/performance-utils');

// Sample data for realistic performance testing
const sampleDatabaseOperations = [
  { name: 'getUserById', duration: 45, success: true },
  { name: 'createUser', duration: 89, success: true },
  { name: 'updateUser', duration: 67, success: true },
  { name: 'deleteUser', duration: 34, success: true },
  { name: 'complexQuery', duration: 156, success: true }, // Slow query
  { name: 'getUserById', duration: 23, success: true },
  { name: 'bulkInsert', duration: 245, success: false }, // Slow + failed
  { name: 'indexScan', duration: 178, success: true }, // Slow query
];

const sampleHttpRequests = [
  { method: 'GET', path: '/api/users', status: 200, duration: 45 },
  { method: 'POST', path: '/api/users', status: 201, duration: 89 },
  { method: 'PUT', path: '/api/users/:id', status: 200, duration: 67 },
  { method: 'DELETE', path: '/api/users/:id', status: 204, duration: 34 },
  { method: 'GET', path: '/api/users', status: 200, duration: 23 },
  { method: 'GET', path: '/api/dashboard', status: 200, duration: 156 },
  { method: 'POST', path: '/api/analytics', status: 500, duration: 245 }, // Error
  { method: 'GET', path: '/api/reports', status: 200, duration: 89 },
];

async function demo1_singletonUsage() {
  console.log('\n=== Demo 1: Enhanced Singleton Performance Monitoring ===');
  console.log('Demonstrating the global performance monitor instance');
  
  console.log('\nSingleton Performance Monitor Features:');
  console.log('  • Ready-to-use global instance');
  console.log('  • No initialization required');
  console.log('  • Consistent monitoring across application');
  console.log('  • Automatic metrics collection');
  
  // Simulate database operations using singleton
  console.log('\nSimulating database operations with singleton monitor:');
  for (const op of sampleDatabaseOperations.slice(0, 5)) {
    performanceMonitor.database.recordQuery(op.name, op.duration, op.success);
    console.log(`  ✓ Recorded ${op.name}: ${op.duration}ms (${op.success ? 'success' : 'failed'})`);
  }
  
  // Simulate HTTP requests using singleton
  console.log('\nSimulating HTTP requests with singleton monitor:');
  for (const req of sampleHttpRequests.slice(0, 5)) {
    performanceMonitor.requests.recordRequest(req.method, req.path, req.status, req.duration);
    console.log(`  ✓ Recorded ${req.method} ${req.path}: ${req.duration}ms (${req.status})`);
  }
  
  // Get immediate performance report
  const metrics = performanceMonitor.getComprehensiveMetrics();
  
  console.log('\nSingleton Performance Summary:');
  console.log(`  Database Operations: ${metrics.database.totalQueries}`);
  console.log(`  Slow Queries: ${metrics.database.slowQueries}`);
  console.log(`  HTTP Requests: ${metrics.requests.totalRequests}`);
  console.log(`  Memory Usage: ${metrics.system.memory.current.heapUsed}MB`);
  console.log(`  CPU Usage: ${metrics.system.cpu.current}%`);
}

async function demo2_customInstanceUsage() {
  console.log('\n=== Demo 2: Custom Performance Monitor Instances ===');
  console.log('Demonstrating specialized monitoring for different application components');
  
  // Create specialized monitors for different components
  const apiMonitor = new PerformanceMonitor();
  const backgroundTaskMonitor = new PerformanceMonitor();
  
  console.log('\nAPI Component Monitoring:');
  // Simulate API-specific operations
  const apiOperations = sampleDatabaseOperations.slice(0, 4);
  const apiRequests = sampleHttpRequests.slice(0, 4);
  
  for (const op of apiOperations) {
    apiMonitor.database.recordQuery(op.name, op.duration, op.success);
  }
  
  for (const req of apiRequests) {
    apiMonitor.requests.recordRequest(req.method, req.path, req.status, req.duration);
  }
  
  const apiMetrics = apiMonitor.getComprehensiveMetrics();
  console.log(`  API Database Operations: ${apiMetrics.database.totalQueries}`);
  console.log(`  API HTTP Requests: ${apiMetrics.requests.totalRequests}`);
  console.log(`  API Average Response Time: ${Object.values(apiMetrics.requests.endpoints)[0]?.avgDuration || 0}ms`);
  
  console.log('\nBackground Task Monitoring:');
  // Simulate background task operations
  const backgroundOps = [
    { name: 'dataSync', duration: 2340, success: true },
    { name: 'reportGeneration', duration: 5670, success: true },
    { name: 'cleanupTask', duration: 890, success: true },
    { name: 'backupProcess', duration: 12340, success: false }
  ];
  
  for (const op of backgroundOps) {
    backgroundTaskMonitor.database.recordQuery(op.name, op.duration, op.success);
    console.log(`  ✓ Background task ${op.name}: ${op.duration}ms (${op.success ? 'success' : 'failed'})`);
  }
  
  const backgroundMetrics = backgroundTaskMonitor.getComprehensiveMetrics();
  console.log(`  Background Operations: ${backgroundMetrics.database.totalQueries}`);
  console.log(`  Background Slow Queries: ${backgroundMetrics.database.slowQueries}`);
  
  // Cleanup custom instances
  apiMonitor.stop();
  backgroundTaskMonitor.stop();
}

async function demo3_realTimeAlertingSystem() {
  console.log('\n=== Demo 3: Real-Time Alerting and Event System ===');
  console.log('Demonstrating automated alerting for performance issues');
  
  // Create monitor with event listeners
  const alertingMonitor = new PerformanceMonitor();
  
  // Set up event listeners for real-time alerts
  let alertCount = 0;
  alertingMonitor.database.on('slowQuery', (query) => {
    alertCount++;
    console.log(`  🚨 ALERT ${alertCount}: Slow query detected!`);
    console.log(`     Query: ${query.queryName}`);
    console.log(`     Duration: ${query.duration}ms`);
    console.log(`     Timestamp: ${query.timestamp.toISOString()}`);
    console.log(`     Status: ${query.success ? 'Success' : 'Failed'}`);
  });
  
  console.log('\nSimulating operations that trigger alerts:');
  
  // Simulate operations including slow queries
  const alertingOps = [
    { name: 'normalQuery', duration: 45, success: true },
    { name: 'slowAnalytics', duration: 156, success: true }, // Will trigger alert
    { name: 'fastLookup', duration: 12, success: true },
    { name: 'timeoutQuery', duration: 234, success: false }, // Will trigger alert
    { name: 'batchProcess', duration: 187, success: true }, // Will trigger alert
  ];
  
  for (const op of alertingOps) {
    alertingMonitor.database.recordQuery(op.name, op.duration, op.success);
    console.log(`  ✓ Executed ${op.name}: ${op.duration}ms`);
    
    // Small delay to see alerts in sequence
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\nTotal alerts generated: ${alertCount}`);
  console.log('Real-time alerting enables immediate response to performance degradation');
  
  alertingMonitor.stop();
}

async function demo4_healthCheckIntegration() {
  console.log('\n=== Demo 4: Health Check Integration ===');
  console.log('Demonstrating health monitoring for production deployments');
  
  // Use singleton for health checking
  console.log('\nSimulating production workload:');
  
  // Add more operations to create realistic load
  const productionOps = sampleDatabaseOperations.concat([
    { name: 'healthCheck', duration: 5, success: true },
    { name: 'metricsCollection', duration: 12, success: true },
    { name: 'cacheWarmup', duration: 89, success: true },
    { name: 'heavyAnalytics', duration: 234, success: true }, // Slow
  ]);
  
  const productionRequests = sampleHttpRequests.concat([
    { method: 'GET', path: '/health', status: 200, duration: 5 },
    { method: 'GET', path: '/metrics', status: 200, duration: 12 },
    { method: 'POST', path: '/api/analytics', status: 200, duration: 156 },
  ]);
  
  for (const op of productionOps) {
    performanceMonitor.database.recordQuery(op.name, op.duration, op.success);
  }
  
  for (const req of productionRequests) {
    performanceMonitor.requests.recordRequest(req.method, req.path, req.status, req.duration);
  }
  
  // Generate health check report
  const healthCheck = performanceMonitor.getHealthCheck();
  
  console.log('\nProduction Health Check Results:');
  console.log(`  Overall Status: ${healthCheck.status.toUpperCase()}`);
  console.log(`  Timestamp: ${healthCheck.timestamp}`);
  
  console.log('\nComponent Health Details:');
  Object.entries(healthCheck.checks).forEach(([component, health]) => {
    const statusIcon = health.status === 'healthy' ? '✅' : 
                      health.status === 'warning' ? '⚠️' : '❌';
    console.log(`  ${statusIcon} ${component}: ${health.status}`);
    
    if (component === 'database') {
      console.log(`     Slow Queries: ${health.slowQueries}`);
      console.log(`     Total Queries: ${health.totalQueries}`);
    } else if (component === 'requests') {
      console.log(`     Requests/Second: ${health.requestsPerSecond}`);
      console.log(`     Total Requests: ${health.totalRequests}`);
    } else if (component === 'memory') {
      console.log(`     Heap Used: ${health.heapUsedMB}MB`);
      console.log(`     CPU Usage: ${health.cpuPercent}%`);
    }
  });
  
  // Demonstrate health check API endpoint pattern
  console.log('\nHealth Check API Integration Pattern:');
  console.log('  GET /health → returns health check JSON');
  console.log('  Status codes: 200 (healthy), 503 (degraded)');
  console.log('  Suitable for load balancer health checks');
  console.log('  Integrates with monitoring systems');
}

async function demo5_performanceOptimizationInsights() {
  console.log('\n=== Demo 5: Performance Optimization Insights ===');
  console.log('Demonstrating actionable performance analytics');
  
  // Get comprehensive metrics for analysis
  const metrics = performanceMonitor.getComprehensiveMetrics();
  
  console.log('\nDatabase Performance Analysis:');
  console.log(`  Total Queries Executed: ${metrics.database.totalQueries}`);
  console.log(`  Slow Queries Detected: ${metrics.database.slowQueries}`);
  console.log(`  Connection Pool Status: Active=${metrics.database.connectionPool.active}, Available=${metrics.database.connectionPool.available}`);
  
  if (metrics.database.queryStats) {
    console.log('\nQuery Performance Breakdown:');
    Object.entries(metrics.database.queryStats).forEach(([queryName, stats]) => {
      console.log(`  • ${queryName}:`);
      console.log(`    Executions: ${stats.count}`);
      console.log(`    Average Duration: ${stats.avgDuration}ms`);
      console.log(`    95th Percentile: ${stats.p95Duration}ms`);
      console.log(`    Failure Rate: ${stats.failureRate}%`);
      console.log(`    QPS: ${stats.queriesPerSecond}`);
      
      // Provide optimization recommendations
      if (stats.avgDuration > 100) {
        console.log(`    🔍 OPTIMIZATION: Consider indexing or query optimization`);
      }
      if (stats.failureRate > 5) {
        console.log(`    🔍 RELIABILITY: High failure rate requires investigation`);
      }
    });
  }
  
  console.log('\nHTTP Endpoint Performance Analysis:');
  console.log(`  Total Requests: ${metrics.requests.totalRequests}`);
  console.log(`  Requests Per Second: ${metrics.requests.requestsPerSecond}`);
  console.log(`  Uptime: ${metrics.requests.uptime} seconds`);
  
  if (metrics.requests.endpoints) {
    console.log('\nEndpoint Performance Breakdown:');
    Object.entries(metrics.requests.endpoints).forEach(([endpoint, stats]) => {
      console.log(`  • ${endpoint}:`);
      console.log(`    Requests: ${stats.requests}`);
      console.log(`    Average Response: ${stats.avgDuration}ms`);
      console.log(`    95th Percentile: ${stats.p95Duration}ms`);
      console.log(`    Error Rate: ${stats.errorRate}%`);
      
      // Provide optimization recommendations
      if (stats.avgDuration > 200) {
        console.log(`    🔍 OPTIMIZATION: Response time above target, consider caching`);
      }
      if (stats.errorRate > 1) {
        console.log(`    🔍 RELIABILITY: Error rate above threshold`);
      }
    });
  }
  
  console.log('\nSystem Resource Analysis:');
  console.log(`  Memory Usage: ${metrics.system.memory.current.heapUsed}MB heap`);
  console.log(`  CPU Usage: ${metrics.system.cpu.current}%`);
  console.log(`  Process Uptime: ${Math.floor(metrics.system.uptime)} seconds`);
  console.log(`  Node.js Version: ${metrics.system.nodeVersion}`);
  
  // Resource optimization recommendations
  if (metrics.system.memory.current.heapUsed > 256) {
    console.log(`  🔍 MEMORY: Consider memory optimization or scaling`);
  }
  if (metrics.system.cpu.current > 80) {
    console.log(`  🔍 CPU: High CPU usage, consider performance tuning`);
  }
}

async function runAllEnhancedDemos() {
  console.log('🚀 Enhanced Performance Monitoring Comprehensive Demo');
  console.log('=====================================================');
  console.log('\nThis demonstration showcases the enhanced performance monitoring');
  console.log('system with singleton pattern and advanced features.');
  console.log('\nEnhanced Features:');
  console.log('  • Singleton instance for application-wide monitoring');
  console.log('  • Custom instances for component-specific monitoring');
  console.log('  • Real-time alerting system with event-driven architecture');
  console.log('  • Production-ready health check integration');
  console.log('  • Actionable performance optimization insights');
  
  try {
    await demo1_singletonUsage();
    await demo2_customInstanceUsage();
    await demo3_realTimeAlertingSystem();
    await demo4_healthCheckIntegration();
    await demo5_performanceOptimizationInsights();
    
    console.log('\n=====================================================');
    console.log('✅ All Enhanced Performance Monitoring Demos Completed!');
    console.log('\nEnhancement Summary:');
    console.log('  ✓ Added singleton pattern for immediate use');
    console.log('  ✓ Maintained existing comprehensive functionality');
    console.log('  ✓ Enhanced integration patterns demonstrated');
    console.log('  ✓ Production-ready monitoring capabilities');
    console.log('  ✓ Real-time alerting and health check systems');
    console.log('\nThe enhanced performance monitoring system is production-ready!');
    
  } catch (error) {
    console.error('\n❌ Demo execution error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Export for use in other modules or direct execution
module.exports = {
  runAllEnhancedDemos,
  demo1_singletonUsage,
  demo2_customInstanceUsage,
  demo3_realTimeAlertingSystem,
  demo4_healthCheckIntegration,
  demo5_performanceOptimizationInsights
};

// Run demos if this file is executed directly
if (require.main === module) {
  runAllEnhancedDemos().catch(console.error);
}