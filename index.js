
/**
 * My NPM Module
 * A simple Node.js module with database utilities
 * 
 * This serves as the main entry point for the NPM module, organizing and re-exporting
 * functionality from specialized modules in the /lib directory. This approach follows
 * the barrel pattern, providing a clean public API while maintaining internal code
 * organization.
 * 
 * Design rationale: By separating concerns into different modules and re-exporting
 * them here, we achieve better maintainability, testability, and allow consumers
 * to import everything from a single location while keeping the internal structure
 * flexible for future changes.
 */

// Import organized modules - each module handles a specific domain of functionality
// This separation allows for easier testing, maintenance, and selective importing
const {
  sendNotFound,
  sendConflict,
  sendInternalServerError,
  sendServiceUnavailable, // helper for 503 responses
  validateResponseObject, // validates Express response objects
  sanitizeMessage,        // sanitizes error messages for safe client responses
  getTimestamp           // generates consistent ISO timestamp strings
} = require('./lib/http-utils'); // Central location for HTTP helpers promotes consistency
const { 
  ensureMongoDB, 
  ensureUnique, 
  handleMongoError, 
  safeDbOperation, 
  retryDbOperation, 
  ensureIdempotency, 
  optimizeQuery, 
  createAggregationPipeline 
} = require('./lib/database-utils'); // Database helpers keep controllers clean
const {
  findDocumentById,
  updateDocumentById,
  deleteDocumentById,
  cascadeDeleteDocument,
  createDocument,
  findDocuments,
  findOneDocument,
  bulkUpdateDocuments
} = require('./lib/document-helpers'); // Generic document CRUD operations with consistent error handling
const {
  performUserDocOp,
  findUserDoc,
  deleteUserDoc,
  userDocActionOr404,
  fetchUserDocOr404,
  deleteUserDocOr404,
  listUserDocs,
  createUniqueDoc,
  updateUserDoc, // helper to update user documents safely
  validateDocumentUniqueness, // helper for uniqueness validation
  hasUniqueFieldChanges // helper for change detection
} = require('./lib/document-ops'); // Higher level document handling utilities
const { MemStorage, storage } = require('./lib/storage'); // in-memory storage class and singleton instance
const { greet, add, isEven, dedupeByFirst, dedupeByLowercaseFirst, dedupeByLast, dedupe } = require('./lib/utils'); // basic utility functions for common operations
const { getEmails, createEmailTarget, isValidEmail, normalizeEmail, getEmailDomain, filterValidEmails } = require('./lib/email-utils'); // email aggregation and validation utilities
const { CircuitBreaker, createCircuitBreaker, STATES: CIRCUIT_BREAKER_STATES } = require('./lib/circuit-breaker'); // circuit breaker for fault tolerance
const { CircuitBreakerFactory, getCircuitBreakerFactory, getManagedCircuitBreaker, getCircuitBreakerStats, getCircuitBreakerFactoryStats, clearAllCircuitBreakers, shutdownCircuitBreakerFactory } = require('./lib/circuit-breaker-factory'); // circuit breaker factory with lifecycle management
const { updateMetrics: updateHealthMetrics, incrementActiveRequests, decrementActiveRequests, getRequestMetrics, resetMetrics: resetHealthMetrics, checkMemoryHealth, checkCpuHealth, checkFilesystemHealth, runCustomCheck, determineOverallStatus, getHealthStatus, healthCheckMiddleware, readinessCheckMiddleware, livenessCheckMiddleware, setupHealthRoutes } = require('./lib/health-check'); // health check service for monitoring
const { TestMemoryManager, createMemoryManager, createLeakDetectionSession, quickMemoryCheck, withMemoryTracking, setupTestMemoryMonitoring, teardownTestMemoryMonitoring } = require('./lib/test-memory-manager'); // test memory management and leak detection
const { AsyncQueue, createAsyncQueue, getDefaultQueue, shutdownDefaultQueue, queueTask } = require('./lib/async-queue'); // async job queue with priority and retries
const { SimpleDatabasePool, DatabaseConnectionPool, databaseConnectionPool, createDatabasePool, acquireDatabaseConnection, releaseDatabaseConnection, executeDatabaseQuery, getDatabasePoolStats, getDatabasePoolHealth, shutdownDatabasePools } = require('./lib/database-pool'); // database connection pooling
const { createCrudService, createPaginatedService, createValidatedService, findByFieldIgnoreCase, createDuplicateError, escapeRegex: escapeRegexCrud, validateData } = require('./lib/crud-service-factory'); // CRUD service factory for Mongoose models
const { logFunctionEntry, logFunctionExit, logFunctionError } = require('./lib/logging-utils'); // centralized logging patterns
const { 
  validatePagination, 
  createPaginationMeta, 
  createPaginatedResponse,
  validateCursorPagination,
  createCursor,
  createCursorPaginationMeta,
  createCursorPaginatedResponse,
  validateSorting
} = require('./lib/pagination-utils'); // pagination parameter validation and response formatting
const { DatabaseMetrics, RequestMetrics, SystemMetrics, PerformanceMonitor, performanceMonitor } = require('./lib/performance-utils'); // performance monitoring and metrics collection
const { 
  withCache, 
  initializeRedisClient, 
  disconnectRedis, 
  invalidateCache, 
  getCacheStats 
} = require('./lib/cache-utils'); // Redis-based caching with development mode bypass
const { createCache } = require('./lib/lru-cache'); // LRU cache with performance monitoring
const { incCacheHit, incCacheMiss, setCacheKeys, getCacheMetrics, resetCacheMetrics } = require('./lib/perf'); // Cache performance monitoring functions
const { normalizeFieldName, getCollectionName, denormalizeFieldName, normalizeObjectFields, denormalizeObjectFields } = require('./lib/field-utils'); // Field name normalization and collection utilities
const { getMongoType, getSupportedTypes, isSupportedType } = require('./lib/typeMap'); // JavaScript to Mongoose type mapping
const { mapParameterToMongoType, mapParametersToSchema, generateMongooseSchema, generateMongoSchema } = require('./lib/mongoose-mapper'); // Parameter to Mongoose field descriptor mapping
const {
  IStorage,
  MemoryBinaryStorage,
  FileSystemBinaryStorage,
  StorageFactory,
  getDefaultStorage
} = require('./lib/binary-storage'); // Binary data storage interface and implementations
const {
  serializeDocument,
  serializeMongooseDocument,
  mapAndSerialize,
  saveAndSerialize,
  mapAndSerializeObj,
  serializeDocumentObj,
  serializeMongooseDocumentObj,
  saveAndSerializeObj,
  safeSerializeDocument,
  safeMapAndSerialize,
  serializeFields,
  serializeWithoutFields
} = require('./lib/serialization-utils'); // Document serialization utilities for API response formatting

// Export all functions for use as a module
// This barrel export pattern provides a single import point for consumers
// while maintaining internal organization. Each category is grouped logically
// to help consumers understand the available functionality at a glance.
module.exports = { // re-exposes modules so consumers import from one place
  // HTTP utilities - Express.js response helpers re-exposed from http-utils
  // Centralized HTTP response handling reduces duplication across controllers
  sendNotFound, // 404 response helper re-exported for convenience
  sendConflict, // 409 conflict helper re-exported for barrel pattern
  sendInternalServerError, // 500 response helper re-exported for consistency
  sendServiceUnavailable, // 503 response helper re-exported for unified API
  validateResponseObject, // validates Express response objects for custom HTTP helpers
  sanitizeMessage, // sanitizes error messages for safe client responses
  getTimestamp, // generates consistent ISO timestamp strings

  // Database utilities - MongoDB connection and advanced operation helpers re-exposed from database-utils
  // These functions provide robust database interaction patterns with proper error handling
  ensureMongoDB, // initializes MongoDB connection for consumers
  ensureUnique, // duplicate check helper re-exported for unified API
  handleMongoError, // centralized MongoDB error handling and classification
  safeDbOperation, // safe operation wrapper with error handling and timing
  retryDbOperation, // retry logic for recoverable database errors
  ensureIdempotency, // idempotency checking for critical operations
  optimizeQuery, // query optimization helper for performance enhancement
  createAggregationPipeline, // aggregation pipeline builder for analytics operations

  // Generic document helpers - CRUD operations without user ownership constraints re-exposed from document-helpers
  // These functions provide safe MongoDB operations with consistent error handling for any document type
  findDocumentById, // safe document retrieval by ID with graceful error handling
  updateDocumentById, // safe document update by ID with new document return
  deleteDocumentById, // safe document deletion by ID with boolean return pattern
  cascadeDeleteDocument, // cascading deletion with cleanup operations for related data
  createDocument, // safe document creation with validation error propagation
  findDocuments, // safe document query with find condition and optional sorting
  findOneDocument, // safe single document query with consistent undefined return
  bulkUpdateDocuments, // bulk document updates with individual error handling

  // Document operations - High-level document manipulation utilities re-exposed from document-ops
  // These encapsulate common CRUD patterns for user-owned documents,
  // reducing boilerplate in application controllers and ensuring consistent behavior
  performUserDocOp, // wrapper for generic document operations
  findUserDoc, // fetches a document scoped to the current user
  deleteUserDoc, // removes a user owned document safely
  userDocActionOr404, // triggers action or returns 404 if not found
  fetchUserDocOr404, // retrieves a document or fails with 404
  deleteUserDocOr404, // deletes a document or fails with 404
  listUserDocs, // lists documents for a specific user
  createUniqueDoc, // creates a document enforcing unique fields
  updateUserDoc, // update with uniqueness checks re-exported for convenience
  validateDocumentUniqueness, // helper for uniqueness validation re-exported
  hasUniqueFieldChanges, // helper for change detection re-exported

  // Storage - In-memory storage implementation and singleton instance re-exposed from storage module
  // Provides both the class for custom instantiation and a ready-to-use singleton
  MemStorage, // storage class allowing separate instances
  storage, // shared singleton instance re-exported for convenience

  // Basic utilities - Common helper functions for everyday operations re-exposed from utils
  // Simple, reusable functions for string formatting, math, and data validation
  greet, // generates a greeting string
  add, // performs simple integer addition
  isEven, // checks numeric parity
  dedupeByFirst, // deduplicate array keeping first occurrence by key
  dedupeByLowercaseFirst, // case-insensitive deduplication keeping first occurrence
  dedupeByLast, // deduplicate array keeping last occurrence by key
  dedupe, // simple primitive array deduplication

  // Email utilities - Email aggregation and validation for contact discovery
  // Provides email aggregation from multiple sources with deduplication and validation
  getEmails, // aggregate emails from multiple discovery sources with deduplication
  createEmailTarget, // create email contact object with source attribution
  isValidEmail, // validate email format
  normalizeEmail, // normalize email to lowercase
  getEmailDomain, // extract domain from email address
  filterValidEmails, // filter array to only valid emails

  // Circuit breaker utilities - Fault tolerance and resilience patterns
  // Prevents cascading failures by monitoring operations and opening circuit when thresholds exceeded
  CircuitBreaker, // circuit breaker class for wrapping operations
  createCircuitBreaker, // create new circuit breaker instance
  CIRCUIT_BREAKER_STATES, // circuit breaker states (closed, open, half-open)
  CircuitBreakerFactory, // factory class for managing multiple breakers
  getCircuitBreakerFactory, // get or create global factory instance
  getManagedCircuitBreaker, // get managed circuit breaker for domain
  getCircuitBreakerStats, // get statistics for all circuit breakers
  getCircuitBreakerFactoryStats, // get factory-level statistics
  clearAllCircuitBreakers, // clear all circuit breakers manually
  shutdownCircuitBreakerFactory, // graceful shutdown of factory

  // Health check utilities - Application health monitoring for Kubernetes and load balancers
  // Provides comprehensive health status, readiness probes, and liveness checks
  updateHealthMetrics, // update request metrics for health tracking
  incrementActiveRequests, // track active concurrent requests
  decrementActiveRequests, // decrement active request counter
  getRequestMetrics, // get current request metrics snapshot
  resetHealthMetrics, // reset health metrics counters
  checkMemoryHealth, // check memory usage health status
  checkCpuHealth, // check CPU load health status
  checkFilesystemHealth, // check filesystem access health
  runCustomCheck, // run custom health check function
  determineOverallStatus, // determine healthy/degraded/unhealthy from checks
  getHealthStatus, // get comprehensive health status report
  healthCheckMiddleware, // Express middleware for /health endpoint
  readinessCheckMiddleware, // Express middleware for Kubernetes readiness probe
  livenessCheckMiddleware, // Express middleware for Kubernetes liveness probe
  setupHealthRoutes, // setup all health routes on Express app

  // Test memory management - Memory tracking and leak detection for test environments
  // Prevents memory leaks in test suites, CI pipelines, and integration tests
  TestMemoryManager, // class for comprehensive memory monitoring
  createMemoryManager, // create new memory manager instance
  createLeakDetectionSession, // create and start leak detection session
  quickMemoryCheck, // quick memory check with GC
  withMemoryTracking, // run function with memory tracking
  setupTestMemoryMonitoring, // Jest beforeAll helper
  teardownTestMemoryMonitoring, // Jest afterAll helper

  // Async queue - Background job processing with priority and retries
  // Production-ready queue for moving I/O out of request paths
  AsyncQueue, // class for job queue with full control
  createAsyncQueue, // create new queue instance
  getDefaultQueue, // get/create singleton default queue
  shutdownDefaultQueue, // graceful shutdown of default queue
  queueTask, // simple helper to queue a task

  // Database connection pool - Scalable connection management with health monitoring
  // Supports Redis, PostgreSQL, MySQL, and MongoDB with automatic recovery
  SimpleDatabasePool, // single database pool class
  DatabaseConnectionPool, // multi-database pool manager class
  databaseConnectionPool, // singleton pool manager instance
  createDatabasePool, // create pool for database URL
  acquireDatabaseConnection, // acquire connection from pool
  releaseDatabaseConnection, // release connection back to pool
  executeDatabaseQuery, // execute query with auto connection management
  getDatabasePoolStats, // get statistics for all pools
  getDatabasePoolHealth, // get health status for all pools
  shutdownDatabasePools, // graceful shutdown of all pools

  // CRUD service factory - Standardized data access layer for Mongoose models
  // Eliminates repetitive CRUD code with lifecycle hooks and validation
  createCrudService, // create full CRUD service for a model
  createPaginatedService, // create paginated query service
  createValidatedService, // create service with validation rules
  findByFieldIgnoreCase, // case-insensitive field lookup
  createDuplicateError, // create standardized duplicate error
  escapeRegexCrud, // escape regex special characters
  validateData, // validate data against rules

  // Logging utilities - Centralized logging patterns for consistent debugging re-exposed from logging-utils
  // Standardized logging functions for function entry, exit, and error tracking
  logFunctionEntry, // logs when a function begins execution
  logFunctionExit, // logs when a function completes execution
  logFunctionError, // logs errors with context

  // Pagination utilities - Parameter validation and response formatting for paginated endpoints
  // Standardized pagination handling reduces controller complexity and ensures consistent API behavior
  validatePagination, // validates query parameters and returns pagination config or sends error response
  createPaginationMeta, // generates navigation metadata for paginated API responses
  createPaginatedResponse, // creates complete paginated response with data and metadata
  validateCursorPagination, // validates cursor-based pagination parameters for large datasets
  createCursor, // generates encoded cursors for navigation positioning
  createCursorPaginationMeta, // creates cursor pagination metadata for API responses
  createCursorPaginatedResponse, // creates complete cursor-based paginated response
  validateSorting, // validates and extracts sorting parameters with security checks

  // Performance monitoring utilities - Comprehensive performance tracking and metrics collection
  // Real-time monitoring enables proactive optimization and issue detection across all application layers
  DatabaseMetrics, // database query performance tracking with slow query detection
  RequestMetrics, // HTTP endpoint performance monitoring with response time analysis
  SystemMetrics, // system resource utilization tracking with memory and CPU monitoring
  PerformanceMonitor, // unified performance monitoring orchestration with automated alerting
  performanceMonitor, // singleton instance for immediate application-wide monitoring

  // Cache utilities - Redis-based caching with environment-aware behavior
  // Intelligent caching that adapts between development and production modes
  withCache, // main caching function for wrapping expensive operations with TTL
  initializeRedisClient, // Redis connection setup for production environments
  disconnectRedis, // graceful Redis connection cleanup and resource management
  invalidateCache, // cache invalidation for fresh data requirements and pattern-based clearing
  getCacheStats, // cache monitoring and health check utilities for performance insights

  // LRU Cache - in-memory caching with size limits and performance monitoring
  createCache, // Create LRU cache instance with performance tracking
  
  // Cache Performance Monitoring - hit/miss tracking and metrics
  incCacheHit, // Increment cache hit counter
  incCacheMiss, // Increment cache miss counter  
  setCacheKeys, // Set current key count for cache
  getCacheMetrics, // Get performance metrics for caches
  resetCacheMetrics, // Reset cache performance metrics

  // Field utilities - Name normalization and collection name generation
  normalizeFieldName, // Convert camelCase/PascalCase to snake_case
  getCollectionName, // Derive pluralized snake_case collection names
  denormalizeFieldName, // Convert snake_case back to camelCase
  normalizeObjectFields, // Normalize entire objects to snake_case
  denormalizeObjectFields, // Denormalize entire objects back to camelCase

  // Type mapping utilities - JavaScript to Mongoose type conversion
  getMongoType, // Map generic types to Mongoose types
  getSupportedTypes, // Get all supported type mappings
  isSupportedType, // Check if a type is supported

  // Mongoose schema mapping - Parameter to field descriptor conversion
  mapParameterToMongoType, // Map parameter to Mongoose field descriptor with validation
  mapParametersToSchema, // Map multiple parameters to schema object
  generateMongooseSchema, // Generate complete Mongoose schema from parameters
  generateMongoSchema, // Generate collection schemas from function metadata

  // Binary storage utilities - Interface and implementations for storing binary data
  // Provides unified interface for memory, file system, and cloud-based binary data storage
  IStorage, // storage interface defining standard binary data operations (save, get, delete, exists)
  MemoryBinaryStorage, // in-memory binary storage for development and caching scenarios
  FileSystemBinaryStorage, // file system binary storage for local persistence
  StorageFactory, // factory for creating storage instances based on configuration
  getDefaultStorage, // default storage instance for immediate use

  // Serialization utilities - Document to plain object conversion for API responses
  // Provides consistent serialization of Mongoose documents for JSON-safe responses
  serializeDocument, // core serialization with toObject/toJSON/spread strategy
  serializeMongooseDocument, // semantic wrapper for Mongoose-specific serialization
  mapAndSerialize, // batch serialize arrays of documents
  saveAndSerialize, // save document then serialize in one operation
  mapAndSerializeObj, // object-based wrapper for array serialization
  serializeDocumentObj, // object-based wrapper for single document
  serializeMongooseDocumentObj, // object-based wrapper for Mongoose documents
  saveAndSerializeObj, // object-based wrapper for save-and-serialize
  safeSerializeDocument, // null-safe serialization with default value support
  safeMapAndSerialize, // null-safe array serialization
  serializeFields, // selective field serialization
  serializeWithoutFields // serialization with field exclusion
};
