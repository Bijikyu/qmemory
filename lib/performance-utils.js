/**
 * Performance Monitoring Utilities
 * Centralized performance tracking and metrics collection
 * 
 * This module provides comprehensive performance monitoring capabilities that integrate
 * seamlessly with existing library architecture. It tracks database operations,
 * HTTP requests, system resources, and provides actionable insights for optimization.
 * 
 * Refactored for Single Responsibility Principle - now delegates to specialized modules:
 * - Database performance: performance/database-metrics.js
 * - HTTP request performance: performance/request-metrics.js
 * - System resource monitoring: performance/system-metrics.js
 * - Performance orchestration: performance/performance-monitor.js
 */

const DatabaseMetrics = require('./performance/database-metrics');
const RequestMetrics = require('./performance/request-metrics');
const SystemMetrics = require('./performance/system-metrics');
const PerformanceMonitor = require('./performance/performance-monitor');

// Create singleton instance for immediate use across the application
// This provides a ready-to-use global performance monitor while still allowing
// custom instances for specialized monitoring requirements
const performanceMonitor = new PerformanceMonitor();

// Export individual components for flexible integration patterns
// This allows consumers to use specific monitoring components independently
// while also providing unified PerformanceMonitor for comprehensive monitoring
module.exports = {
    DatabaseMetrics,        // database performance tracking component
    RequestMetrics,         // HTTP request performance tracking component
    SystemMetrics,          // system resource monitoring component
    PerformanceMonitor,     // unified performance monitoring orchestration
    performanceMonitor      // singleton instance for immediate application-wide monitoring
};