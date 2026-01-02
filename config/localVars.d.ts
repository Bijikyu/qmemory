/**
 * Global Constants & Environment Variable Exporting
 * Single source of truth for all environment variables and constants
 * Following NPM architecture SRP requirements
 */
/**
 * Environment mode settings
 * - Development: NODE_ENV unset or 'development' enables verbose logging and debugging
 * - Production: NODE_ENV='production' optimizes performance and reduces output verbosity
 * - Testing: NODE_ENV='test' enables test-specific behaviors and mock data usage
 */
export declare const NODE_ENV: string;
/**
 * MongoDB Connection Settings
 */
export declare const MONGODB_URI: string;
export declare const MONGODB_DB_NAME: string;
/**
 * Redis Connection Settings for Caching
 */
export declare const REDIS_HOST: string;
export declare const REDIS_PORT: string | number;
export declare const REDIS_PASSWORD: string;
export declare const REDIS_DB: string | number;
/**
 * Google Cloud Storage Configuration
 */
export declare const GCS_BUCKET_NAME: string;
export declare const GCS_PROJECT_ID: string;
export declare const GOOGLE_APPLICATION_CREDENTIALS: string;
/**
 * Application Behavior Settings
 */
export declare const LOG_LEVEL: string;
export declare const MAX_MEMORY_STORAGE_USERS: string | number;
export declare const API_REQUEST_TIMEOUT: string | number;
export declare const ENABLE_PERFORMANCE_MONITORING: boolean;
/**
 * Security and Validation Settings
 */
export declare const ENABLE_CORS: boolean;
export declare const RATE_LIMIT_WINDOW: string | number;
export declare const RATE_LIMIT_MAX: string | number;
export declare const ENABLE_REQUEST_ID: boolean;
/**
 * Testing Environment Settings
 */
export declare const TEST_MONGODB_URI: string;
export declare const TEST_TIMEOUT: string | number;
export declare const ENABLE_TEST_LOGGING: boolean;
/**
 * Performance and Monitoring Settings
 */
export declare const PERFORMANCE_SAMPLE_RATE: string | number;
export declare const SLOW_QUERY_THRESHOLD: string | number;
export declare const MEMORY_CHECK_INTERVAL: string | number;
/**
 * Circuit Breaker Settings for Resilience
 */
export declare const CIRCUIT_BREAKER_TIMEOUT: string | number;
export declare const CIRCUIT_BREAKER_ERROR_THRESHOLD: string | number;
export declare const CIRCUIT_BREAKER_RESET_TIMEOUT: string | number;
/**
 * Storage Default Settings
 */
export declare const DEFAULT_MAX_USERS: string | number;
/**
 * Binary Storage Settings
 */
export declare const BINARY_STORAGE_TYPE: string;
export declare const BINARY_STORAGE_DIR: string;
export declare const BINARY_STORAGE_MAX_SIZE: string;
/**
 * Health Check Monitoring Settings
 */
export declare const HEALTH_CHECK_INTERVAL: string | number;
export declare const MEMORY_THRESHOLD_WARNING: string | number;
export declare const CPU_THRESHOLD_WARNING: string | number;
/**
 * Application Constants (Non-configurable)
 */
export declare const APP_NAME = "qmemory";
export declare const APP_VERSION = "1.0.2";
export declare const DEFAULT_PAGE_SIZE = 20;
export declare const MAX_PAGE_SIZE = 100;
export declare const MONGODB_CONNECTION_RETRY_ATTEMPTS = 3;
export declare const MONGODB_CONNECTION_RETRY_DELAY = 5000;
/**
 * Demo Application Settings
 */
export declare const DEFAULT_PORT: string | number;
/**
 * Queue and Redis Configuration
 */
export declare const DEFAULT_REDIS_HOST: string;
export declare const DEFAULT_REDIS_PORT: string | number;
export declare const DEFAULT_QUEUE_PREFIX: string;
/**
 * Circuit Breaker Default Settings
 */
export declare const DEFAULT_CIRCUIT_BREAKER_TIMEOUT: string | number;
export declare const DEFAULT_CIRCUIT_BREAKER_ERROR_THRESHOLD: string | number;
export declare const DEFAULT_CIRCUIT_BREAKER_RESET_TIMEOUT: string | number;
export declare const DEFAULT_CIRCUIT_BREAKER_FAILURE_THRESHOLD: string | number;
/**
 * Database Performance Metrics Settings
 */
export declare const DEFAULT_SLOW_QUERY_THRESHOLD: string | number;
export declare const DEFAULT_MAX_SLOW_QUERIES: string | number;
export declare const DEFAULT_MAX_RECENT_TIMES: string | number;
/**
 * System Resource Monitoring Settings
 */
export declare const DEFAULT_SYSTEM_COLLECTION_INTERVAL: string | number;
export declare const DEFAULT_MAX_HISTORY_POINTS: string | number;
/**
 * Database Connection Pool Settings
 */
export declare const DEFAULT_POOL_MAX_CONNECTIONS: string | number;
export declare const DEFAULT_POOL_MIN_CONNECTIONS: string | number;
export declare const DEFAULT_POOL_ACQUIRE_TIMEOUT: string | number;
export declare const DEFAULT_POOL_IDLE_TIMEOUT: string | number;
export declare const DEFAULT_POOL_HEALTH_CHECK_INTERVAL: string | number;
export declare const DEFAULT_POOL_MAX_QUERY_TIME: string | number;
export declare const DEFAULT_POOL_RETRY_ATTEMPTS: string | number;
export declare const DEFAULT_POOL_RETRY_DELAY: string | number;
export declare const DEFAULT_DB_CONNECT_TIMEOUT: string | number;
export declare const DEFAULT_DB_SOCKET_TIMEOUT: string | number;
/**
 * Pagination Default Settings
 */
export declare const DEFAULT_PAGINATION_PAGE: string | number;
export declare const DEFAULT_PAGINATION_LIMIT: string | number;
export declare const DEFAULT_PAGINATION_MAX_LIMIT: string | number;
export declare const DEFAULT_CURSOR_PAGINATION_LIMIT: string | number;
export declare const DEFAULT_CURSOR_PAGINATION_MAX_LIMIT: string | number;
export declare const DEFAULT_CURSOR_PAGINATION_SORT: string;
export declare const DEFAULT_MAX_SORT_FIELDS: string | number;
/**
 * Health Check Threshold Settings
 */
export declare const DEFAULT_MEMORY_WARNING_THRESHOLD: string | number;
export declare const DEFAULT_MEMORY_CRITICAL_THRESHOLD: string | number;
export declare const DEFAULT_CPU_WARNING_THRESHOLD: string | number;
export declare const DEFAULT_CPU_CRITICAL_THRESHOLD: string | number;
export declare const DEFAULT_ERROR_RATE_WARNING_THRESHOLD: string | number;
export declare const DEFAULT_ERROR_RATE_CRITICAL_THRESHOLD: string | number;
export declare const DEFAULT_HEALTH_CHECK_TIMEOUT: string | number;
export declare const DEFAULT_HEALTH_CHECK_INTERVAL: string | number;
/**
 * Circuit Breaker State Constants
 */
export declare const CIRCUIT_BREAKER_STATES: {
    CLOSED: string;
    OPEN: string;
    HALF_OPEN: string;
};
//# sourceMappingURL=localVars.d.ts.map