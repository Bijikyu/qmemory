/**
 * Performance Monitoring Demo
 * Practical examples showing comprehensive performance tracking integration
 * 
 * This demo shows real-world usage patterns for the performance monitoring utilities
 * integrated with the qmemory library's existing storage and HTTP utilities.
 */

const qmemory = require('../index');

// Create a performance monitor instance for comprehensive tracking
const perfMonitor = new qmemory.PerformanceMonitor({
    database: { slowQueryThreshold: 75 }, // Custom threshold for demo
    system: { collectionInterval: 5000 }  // 5 second collection for demo
});

// Simulate Express-like objects for demonstration
function createMockExpressObjects(method = 'GET', path = '/users', statusCode = 200) {
    const req = {
        method,
        path,
        route: { path },
        get: (header) => header === 'User-Agent' ? 'Demo-Client/1.0' : null
    };
    
    const res = {
        statusCode,
        eventHandlers: {},
        on: function(event, handler) {
            this.eventHandlers[event] = handler;
        },
        finish: function() {
            if (this.eventHandlers.finish) {
                this.eventHandlers.finish();
            }
        }
    };
    
    return { req, res };
}

// Demo 1: Database Performance Tracking
async function demo1_databasePerformance() {
    console.log('\n=== Demo 1: Database Performance Tracking ===');
    
    // Simulate various database operations with different performance characteristics
    console.log('Simulating database operations...');
    
    // Fast query simulation
    perfMonitor.database.recordQuery('getUserById', 25, true, { userId: 123 });
    perfMonitor.database.recordQuery('getUserById', 30, true, { userId: 456 });
    perfMonitor.database.recordQuery('getUserById', 28, true, { userId: 789 });
    
    // Medium performance queries
    perfMonitor.database.recordQuery('getUsersByRole', 65, true, { role: 'admin' });
    perfMonitor.database.recordQuery('getUsersByRole', 70, true, { role: 'user' });
    
    // Slow query simulation (will trigger alert)
    perfMonitor.database.recordQuery('complexReport', 120, true, { reportType: 'monthly' });
    
    // Failed query simulation
    perfMonitor.database.recordQuery('brokenQuery', 85, false, { error: 'timeout' });
    
    // Update connection pool metrics
    perfMonitor.database.updateConnectionMetrics(8, 12, 150, 142);
    
    // Generate database metrics report
    const dbMetrics = perfMonitor.database.getMetrics();
    console.log('\nDatabase Performance Summary:');
    console.log(`- Total queries: ${dbMetrics.totalQueries}`);
    console.log(`- Slow queries detected: ${dbMetrics.slowQueries}`);
    console.log(`- Connection pool: ${dbMetrics.connectionPool.active} active, ${dbMetrics.connectionPool.available} available`);
    
    console.log('\nQuery Performance Breakdown:');
    Object.entries(dbMetrics.queryStats).forEach(([queryName, stats]) => {
        console.log(`  ${queryName}:`);
        console.log(`    - Average: ${stats.avgDuration}ms`);
        console.log(`    - Range: ${stats.minDuration}ms - ${stats.maxDuration}ms`);
        console.log(`    - Failure rate: ${stats.failureRate}%`);
        console.log(`    - Queries/sec: ${stats.queriesPerSecond}`);
    });
}

// Demo 2: HTTP Request Performance Tracking
async function demo2_httpPerformance() {
    console.log('\n=== Demo 2: HTTP Request Performance Tracking ===');
    
    // Create request middleware for automatic tracking
    const middleware = perfMonitor.createRequestMiddleware();
    console.log('Created request tracking middleware');
    
    // Simulate various HTTP requests
    console.log('Simulating HTTP requests...');
    
    const requests = [
        { method: 'GET', path: '/users', status: 200, duration: 45 },
        { method: 'GET', path: '/users', status: 200, duration: 38 },
        { method: 'GET', path: '/users', status: 404, duration: 25 },
        { method: 'POST', path: '/users', status: 201, duration: 95 },
        { method: 'PUT', path: '/users/123', status: 200, duration: 75 },
        { method: 'DELETE', path: '/users/456', status: 204, duration: 55 },
        { method: 'GET', path: '/posts', status: 500, duration: 150 }
    ];
    
    // Process each simulated request
    for (const { method, path, status, duration } of requests) {
        const { req, res } = createMockExpressObjects(method, path, status);
        
        // Use middleware to track the request
        const next = () => {};
        middleware(req, res, next);
        
        // Simulate request processing time
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Simulate response completion
        res.finish();
    }
    
    // Wait for middleware processing
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Generate HTTP metrics report
    const reqMetrics = perfMonitor.requests.getMetrics();
    console.log('\nHTTP Performance Summary:');
    console.log(`- Total requests: ${reqMetrics.totalRequests}`);
    console.log(`- Requests per second: ${reqMetrics.requestsPerSecond}`);
    console.log(`- Uptime: ${reqMetrics.uptime} seconds`);
    
    console.log('\nEndpoint Performance Breakdown:');
    Object.entries(reqMetrics.endpoints).forEach(([endpoint, stats]) => {
        console.log(`  ${endpoint}:`);
        console.log(`    - Requests: ${stats.requests}`);
        console.log(`    - Average: ${stats.avgDuration}ms`);
        console.log(`    - Range: ${stats.minDuration}ms - ${stats.maxDuration}ms`);
        console.log(`    - Error rate: ${stats.errorRate}%`);
        console.log(`    - Status codes:`, stats.statusCodes);
    });
}

// Demo 3: System Resource Monitoring
async function demo3_systemMonitoring() {
    console.log('\n=== Demo 3: System Resource Monitoring ===');
    
    console.log('Collecting system metrics...');
    
    // Wait for system metrics collection
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    const sysMetrics = perfMonitor.system.getMetrics();
    console.log('\nSystem Performance Summary:');
    console.log(`- Process uptime: ${sysMetrics.uptime} seconds`);
    console.log(`- Node.js version: ${sysMetrics.nodeVersion}`);
    
    console.log('\nMemory Usage:');
    console.log(`  - RSS: ${sysMetrics.memory.current.rss} MB`);
    console.log(`  - Heap Used: ${sysMetrics.memory.current.heapUsed} MB`);
    console.log(`  - Heap Total: ${sysMetrics.memory.current.heapTotal} MB`);
    console.log(`  - External: ${sysMetrics.memory.current.external} MB`);
    
    console.log('\nCPU Usage:');
    console.log(`  - Current: ${sysMetrics.cpu.current}%`);
    console.log(`  - History points: ${sysMetrics.cpu.history.length}`);
    
    if (sysMetrics.memory.history.length > 0) {
        console.log(`\nMetrics History: ${sysMetrics.memory.history.length} data points collected`);
    }
}

// Demo 4: Database Operation Wrapper
async function demo4_databaseWrapper() {
    console.log('\n=== Demo 4: Database Operation Wrapper ===');
    
    // Simulate database operations that we want to monitor
    const mockDatabaseOperations = {
        async getUserById(id) {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 20));
            if (id === 'invalid') throw new Error('User not found');
            return { id, name: `User ${id}`, email: `user${id}@example.com` };
        },
        
        async createUser(userData) {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
            return { id: Date.now(), ...userData };
        },
        
        async updateUser(id, data) {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 80 + 30));
            if (Math.random() < 0.1) throw new Error('Database timeout');
            return { id, ...data, updatedAt: new Date() };
        }
    };
    
    // Wrap operations for performance monitoring
    const monitoredDb = {
        getUserById: perfMonitor.wrapDatabaseOperation(mockDatabaseOperations.getUserById, 'getUserById'),
        createUser: perfMonitor.wrapDatabaseOperation(mockDatabaseOperations.createUser, 'createUser'),
        updateUser: perfMonitor.wrapDatabaseOperation(mockDatabaseOperations.updateUser, 'updateUser')
    };
    
    console.log('Testing wrapped database operations...');
    
    // Test successful operations
    try {
        const user1 = await monitoredDb.getUserById('123');
        console.log('✓ Retrieved user:', user1.name);
        
        const newUser = await monitoredDb.createUser({ name: 'John Doe', email: 'john@example.com' });
        console.log('✓ Created user:', newUser.name);
        
        const updatedUser = await monitoredDb.updateUser('123', { name: 'Jane Doe' });
        console.log('✓ Updated user:', updatedUser.name);
    } catch (error) {
        console.log('✗ Operation failed (as expected for demo):', error.message);
    }
    
    // Test failed operations
    try {
        await monitoredDb.getUserById('invalid');
    } catch (error) {
        console.log('✗ Failed operation tracked:', error.message);
    }
    
    // Attempt operation that might timeout
    try {
        await monitoredDb.updateUser('456', { name: 'Test User' });
    } catch (error) {
        console.log('✗ Timeout operation tracked:', error.message);
    }
    
    console.log('\nAll database operations are now being automatically tracked!');
}

// Demo 5: Comprehensive Monitoring Report
async function demo5_comprehensiveReport() {
    console.log('\n=== Demo 5: Comprehensive Performance Report ===');
    
    const report = perfMonitor.getComprehensiveMetrics();
    
    console.log('Full Performance Report:');
    console.log('=======================');
    console.log(`Report generated at: ${report.timestamp}`);
    
    console.log('\n📊 Database Performance:');
    console.log(`  - Total queries: ${report.database.totalQueries}`);
    console.log(`  - Slow queries: ${report.database.slowQueries}`);
    console.log(`  - Connection pool utilization: ${report.database.connectionPool.active}/${report.database.connectionPool.active + report.database.connectionPool.available}`);
    
    console.log('\n🌐 HTTP Performance:');
    console.log(`  - Total requests: ${report.requests.totalRequests}`);
    console.log(`  - Throughput: ${report.requests.requestsPerSecond} req/sec`);
    console.log(`  - Tracked endpoints: ${Object.keys(report.requests.endpoints).length}`);
    
    console.log('\n💻 System Resources:');
    console.log(`  - Memory usage: ${report.system.memory.current.heapUsed} MB heap`);
    console.log(`  - CPU usage: ${report.system.cpu.current}%`);
    console.log(`  - Process uptime: ${report.system.uptime} seconds`);
    
    // Generate health check
    console.log('\n🏥 Health Check:');
    const health = perfMonitor.getHealthCheck();
    console.log(`  - Overall status: ${health.status.toUpperCase()}`);
    console.log(`  - Database: ${health.checks.database.status}`);
    console.log(`  - Requests: ${health.checks.requests.status}`);
    console.log(`  - Memory: ${health.checks.memory.status}`);
    
    if (health.status !== 'healthy') {
        console.log('\n⚠️  Performance Issues Detected:');
        Object.entries(health.checks).forEach(([component, check]) => {
            if (check.status !== 'healthy') {
                console.log(`  - ${component}: ${check.status}`);
            }
        });
    }
}

// Demo 6: Integration with Existing Storage
async function demo6_storageIntegration() {
    console.log('\n=== Demo 6: Integration with Existing Storage ===');
    
    // Clear existing storage
    await qmemory.storage.clear();
    
    // Wrap storage operations for monitoring
    const monitoredStorage = {
        createUser: perfMonitor.wrapDatabaseOperation(qmemory.storage.createUser.bind(qmemory.storage), 'storage.createUser'),
        getUserByUsername: perfMonitor.wrapDatabaseOperation(qmemory.storage.getUserByUsername.bind(qmemory.storage), 'storage.getUserByUsername'),
        getAllUsers: perfMonitor.wrapDatabaseOperation(qmemory.storage.getAllUsers.bind(qmemory.storage), 'storage.getAllUsers')
    };
    
    console.log('Creating users with performance monitoring...');
    
    // Create several users to generate performance data
    const users = [
        { username: 'alice', displayName: 'Alice Johnson' },
        { username: 'bob', displayName: 'Bob Smith' },
        { username: 'charlie', displayName: 'Charlie Brown' }
    ];
    
    for (const userData of users) {
        try {
            const user = await monitoredStorage.createUser(userData);
            console.log(`✓ Created user: ${user.displayName}`);
        } catch (error) {
            console.log(`✗ Failed to create user: ${error.message}`);
        }
    }
    
    // Test retrieval operations
    console.log('\nTesting retrieval operations...');
    
    const alice = await monitoredStorage.getUserByUsername('alice');
    console.log(`✓ Retrieved user: ${alice?.displayName || 'Not found'}`);
    
    const allUsers = await monitoredStorage.getAllUsers();
    console.log(`✓ Retrieved ${allUsers.length} users total`);
    
    // Show storage operation performance
    const storageMetrics = perfMonitor.database.getMetrics();
    console.log('\nStorage Operation Performance:');
    Object.entries(storageMetrics.queryStats)
        .filter(([name]) => name.startsWith('storage.'))
        .forEach(([operation, stats]) => {
            console.log(`  ${operation}: ${stats.avgDuration}ms avg (${stats.count} ops)`);
        });
}

// Run all demos
async function runAllDemos() {
    console.log('🚀 Performance Monitoring Demo');
    console.log('=====================================');
    
    try {
        await demo1_databasePerformance();
        await demo2_httpPerformance();
        await demo3_systemMonitoring();
        await demo4_databaseWrapper();
        await demo5_comprehensiveReport();
        await demo6_storageIntegration();
        
        console.log('\n✅ All performance monitoring demos completed successfully!');
        console.log('\nThe performance monitoring utilities provide:');
        console.log('- Real-time database query performance tracking');
        console.log('- HTTP request monitoring with Express middleware');
        console.log('- System resource utilization monitoring');
        console.log('- Automatic slow query detection and alerting');
        console.log('- Comprehensive health checks for monitoring systems');
        console.log('- Easy integration with existing applications');
        
    } catch (error) {
        console.error('❌ Demo failed:', error);
    } finally {
        // Clean up monitoring resources
        perfMonitor.stop();
        console.log('\n🧹 Performance monitoring stopped and cleaned up');
    }
}

// Run demos if this file is executed directly
if (require.main === module) {
    runAllDemos();
}

module.exports = {
    perfMonitor,
    runAllDemos
};