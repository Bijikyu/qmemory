/**
 * Global Constants & Environment Variable Exporting
 * Single source of truth for all environment variables and constants
 * Following NPM architecture SRP requirements
 */

// ==================== ENVIRONMENT CONFIGURATION ====================

/**
 * Environment mode settings
 * - Development: NODE_ENV unset or 'development' enables verbose logging and debugging
 * - Production: NODE_ENV='production' optimizes performance and reduces output verbosity
 * - Testing: NODE_ENV='test' enables test-specific behaviors and mock data usage
 */
export const NODE_ENV = process.env.NODE_ENV || 'development';

// ==================== DATABASE CONFIGURATION ====================

/**
 * MongoDB Connection Settings
 */
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qmemory';
export const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'qmemory';

// ==================== REDIS CONFIGURATION ====================

/**
 * Redis Connection Settings for Caching
 */
export const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
export const REDIS_PORT = process.env.REDIS_PORT || 6379;
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD || null;
export const REDIS_DB = process.env.REDIS_DB || 0;

// ==================== GOOGLE CLOUD STORAGE ====================

/**
 * Google Cloud Storage Configuration
 */
export const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || null;
export const GCS_PROJECT_ID = process.env.GCS_PROJECT_ID || null;
export const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS || null;

// ==================== APPLICATION CONFIGURATION ====================

/**
 * Application Behavior Settings
 */
export const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'error' : 'info');
export const MAX_MEMORY_STORAGE_USERS = process.env.MAX_MEMORY_STORAGE_USERS || 10000;
export const API_REQUEST_TIMEOUT = process.env.API_REQUEST_TIMEOUT || 30000;
export const ENABLE_PERFORMANCE_MONITORING = process.env.ENABLE_PERFORMANCE_MONITORING !== 'false';

// ==================== SECURITY CONFIGURATION ====================

/**
 * Security and Validation Settings
 */
export const ENABLE_CORS = process.env.ENABLE_CORS !== 'false';
export const RATE_LIMIT_WINDOW = process.env.RATE_LIMIT_WINDOW || 900000; // 15 minutes
export const RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX || 100;
export const ENABLE_REQUEST_ID = process.env.ENABLE_REQUEST_ID !== 'false';

// ==================== TESTING CONFIGURATION ====================

/**
 * Testing Environment Settings
 */
export const TEST_MONGODB_URI =
  process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/qmemory_test';
export const TEST_TIMEOUT = process.env.TEST_TIMEOUT || 10000;
export const ENABLE_TEST_LOGGING = process.env.ENABLE_TEST_LOGGING === 'true';

// ==================== PERFORMANCE CONFIGURATION ====================

/**
 * Performance and Monitoring Settings
 */
export const PERFORMANCE_SAMPLE_RATE = process.env.PERFORMANCE_SAMPLE_RATE || 0.1;
export const SLOW_QUERY_THRESHOLD = process.env.SLOW_QUERY_THRESHOLD || 1000; // milliseconds
export const MEMORY_CHECK_INTERVAL = process.env.MEMORY_CHECK_INTERVAL || 60000; // milliseconds

// ==================== CIRCUIT BREAKER CONFIGURATION ====================

/**
 * Circuit Breaker Settings for Resilience
 */
export const CIRCUIT_BREAKER_TIMEOUT = process.env.CIRCUIT_BREAKER_TIMEOUT || 60000;
export const CIRCUIT_BREAKER_ERROR_THRESHOLD = process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD || 5;
export const CIRCUIT_BREAKER_RESET_TIMEOUT = process.env.CIRCUIT_BREAKER_RESET_TIMEOUT || 30000;

// ==================== STORAGE CONFIGURATION ====================

/**
 * Storage Default Settings
 */
export const DEFAULT_MAX_USERS = process.env.MAX_MEMORY_STORAGE_USERS || 10000;

// ==================== BINARY STORAGE CONFIGURATION ====================

/**
 * Binary Storage Settings
 */
export const BINARY_STORAGE_TYPE = process.env.BINARY_STORAGE_TYPE || 'memory';
export const BINARY_STORAGE_DIR = process.env.BINARY_STORAGE_DIR || null;
export const BINARY_STORAGE_MAX_SIZE = process.env.BINARY_STORAGE_MAX_SIZE || null;

// ==================== HEALTH CHECK CONFIGURATION ====================

/**
 * Health Check Monitoring Settings
 */
export const HEALTH_CHECK_INTERVAL = process.env.HEALTH_CHECK_INTERVAL || 30000;
export const MEMORY_THRESHOLD_WARNING = process.env.MEMORY_THRESHOLD_WARNING || 0.8;
export const CPU_THRESHOLD_WARNING = process.env.CPU_THRESHOLD_WARNING || 0.8;

// ==================== CONSTANTS ====================

/**
 * Application Constants (Non-configurable)
 */
export const APP_NAME = 'qmemory';
export const APP_VERSION = '1.0.2';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MONGODB_CONNECTION_RETRY_ATTEMPTS = 3;
export const MONGODB_CONNECTION_RETRY_DELAY = 5000;

// ==================== DEMO APPLICATION CONFIGURATION ====================

/**
 * Demo Application Settings
 */
export const DEFAULT_PORT = process.env.PORT || 5000;

// ==================== QUEUE CONFIGURATION ====================

/**
 * Queue and Redis Configuration
 */
export const DEFAULT_REDIS_HOST = process.env.REDIS_HOST || 'localhost';
export const DEFAULT_REDIS_PORT = process.env.REDIS_PORT || 6379;
export const DEFAULT_QUEUE_PREFIX = process.env.QUEUE_PREFIX || 'qmemory';

// ==================== CIRCUIT BREAKER CONFIGURATION ====================

/**
 * Circuit Breaker Default Settings
 */
export const DEFAULT_CIRCUIT_BREAKER_TIMEOUT = process.env.CIRCUIT_BREAKER_TIMEOUT || 30000;
export const DEFAULT_CIRCUIT_BREAKER_ERROR_THRESHOLD =
  process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD || 50;
export const DEFAULT_CIRCUIT_BREAKER_RESET_TIMEOUT =
  process.env.CIRCUIT_BREAKER_RESET_TIMEOUT || 60000;
export const DEFAULT_CIRCUIT_BREAKER_FAILURE_THRESHOLD =
  process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || 5;

// ==================== PERFORMANCE MONITORING CONFIGURATION ====================

/**
 * Database Performance Metrics Settings
 */
export const DEFAULT_SLOW_QUERY_THRESHOLD = process.env.DEFAULT_SLOW_QUERY_THRESHOLD || 100;
export const DEFAULT_MAX_SLOW_QUERIES = process.env.DEFAULT_MAX_SLOW_QUERIES || 100;
export const DEFAULT_MAX_RECENT_TIMES = process.env.DEFAULT_MAX_RECENT_TIMES || 100;

/**
 * System Resource Monitoring Settings
 */
export const DEFAULT_SYSTEM_COLLECTION_INTERVAL =
  process.env.DEFAULT_SYSTEM_COLLECTION_INTERVAL || 30000;
export const DEFAULT_MAX_HISTORY_POINTS = process.env.DEFAULT_MAX_HISTORY_POINTS || 2880;

// ==================== DATABASE POOL CONFIGURATION ====================

/**
 * Database Connection Pool Settings
 */
export const DEFAULT_POOL_MAX_CONNECTIONS = process.env.DEFAULT_POOL_MAX_CONNECTIONS || 20;
export const DEFAULT_POOL_MIN_CONNECTIONS = process.env.DEFAULT_POOL_MIN_CONNECTIONS || 5;
export const DEFAULT_POOL_ACQUIRE_TIMEOUT = process.env.DEFAULT_POOL_ACQUIRE_TIMEOUT || 10000;
export const DEFAULT_POOL_IDLE_TIMEOUT = process.env.DEFAULT_POOL_IDLE_TIMEOUT || 300000;
export const DEFAULT_POOL_HEALTH_CHECK_INTERVAL =
  process.env.DEFAULT_POOL_HEALTH_CHECK_INTERVAL || 60000;
export const DEFAULT_POOL_MAX_QUERY_TIME = process.env.DEFAULT_POOL_MAX_QUERY_TIME || 30000;
export const DEFAULT_POOL_RETRY_ATTEMPTS = process.env.DEFAULT_POOL_RETRY_ATTEMPTS || 3;
export const DEFAULT_POOL_RETRY_DELAY = process.env.DEFAULT_POOL_RETRY_DELAY || 1000;
export const DEFAULT_DB_CONNECT_TIMEOUT = process.env.DEFAULT_DB_CONNECT_TIMEOUT || 10000;
export const DEFAULT_DB_SOCKET_TIMEOUT = process.env.DEFAULT_DB_SOCKET_TIMEOUT || 30000;

// ==================== PAGINATION CONFIGURATION ====================

/**
 * Pagination Default Settings
 */
export const DEFAULT_PAGINATION_PAGE = process.env.DEFAULT_PAGINATION_PAGE || 1;
export const DEFAULT_PAGINATION_LIMIT = process.env.DEFAULT_PAGINATION_LIMIT || 50;
export const DEFAULT_PAGINATION_MAX_LIMIT = process.env.DEFAULT_PAGINATION_MAX_LIMIT || 100;
export const DEFAULT_CURSOR_PAGINATION_LIMIT = process.env.DEFAULT_CURSOR_PAGINATION_LIMIT || 50;
export const DEFAULT_CURSOR_PAGINATION_MAX_LIMIT =
  process.env.DEFAULT_CURSOR_PAGINATION_MAX_LIMIT || 100;
export const DEFAULT_CURSOR_PAGINATION_SORT = process.env.DEFAULT_CURSOR_PAGINATION_SORT || 'id';
export const DEFAULT_MAX_SORT_FIELDS = process.env.DEFAULT_MAX_SORT_FIELDS || 3;

// ==================== HEALTH CHECK CONFIGURATION ====================

/**
 * Health Check Threshold Settings
 */
export const DEFAULT_MEMORY_WARNING_THRESHOLD = process.env.DEFAULT_MEMORY_WARNING_THRESHOLD || 90;
export const DEFAULT_MEMORY_CRITICAL_THRESHOLD =
  process.env.DEFAULT_MEMORY_CRITICAL_THRESHOLD || 75;
export const DEFAULT_CPU_WARNING_THRESHOLD = process.env.DEFAULT_CPU_WARNING_THRESHOLD || 2;
export const DEFAULT_CPU_CRITICAL_THRESHOLD = process.env.DEFAULT_CPU_CRITICAL_THRESHOLD || 1;
export const DEFAULT_ERROR_RATE_WARNING_THRESHOLD =
  process.env.DEFAULT_ERROR_RATE_WARNING_THRESHOLD || 10;
export const DEFAULT_ERROR_RATE_CRITICAL_THRESHOLD =
  process.env.DEFAULT_ERROR_RATE_CRITICAL_THRESHOLD || 50;
export const DEFAULT_HEALTH_CHECK_TIMEOUT = process.env.DEFAULT_HEALTH_CHECK_TIMEOUT || 5000;
export const DEFAULT_HEALTH_CHECK_INTERVAL = process.env.DEFAULT_HEALTH_CHECK_INTERVAL || 10000;

// ==================== CIRCUIT BREAKER STATES ====================

/**
 * Circuit Breaker State Constants
 */
export const CIRCUIT_BREAKER_STATES = { CLOSED: 'closed', OPEN: 'open', HALF_OPEN: 'half-open' };
