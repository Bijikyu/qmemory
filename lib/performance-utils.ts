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
import DatabaseMetrics from './performance/database-metrics.js';
import RequestMetrics from './performance/request-metrics.js';
import SystemMetrics from './performance/system-metrics.js';
import PerformanceMonitor from './performance/performance-monitor.js';
const performanceMonitor = new PerformanceMonitor();
export { DatabaseMetrics, RequestMetrics, SystemMetrics, PerformanceMonitor, performanceMonitor };
