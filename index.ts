/**
 * My NPM Module
 * A simple Node.js module with database utilities
 */

// HTTP utilities
import { 
  sendNotFound, 
  sendConflict, 
  sendInternalServerError, 
  sendServiceUnavailable, 
  validateResponseObject, 
  sanitizeResponseMessage, 
  getTimestamp, 
  sendValidationError, 
  sendAuthError, 
  generateRequestId 
} from './lib/http-utils.js';

// Database utilities
import { 
  ensureMongoDB, 
  ensureUnique, 
  handleMongoError, 
  safeDbOperation, 
  retryDbOperation, 
  ensureIdempotency, 
  optimizeQuery, 
  createAggregationPipeline 
} from './lib/database-utils.js';

// Document helpers
import { 
  findDocumentById, 
  updateDocumentById, 
  deleteDocumentById, 
  cascadeDeleteDocument, 
  createDocument, 
  findDocuments, 
  findOneDocument, 
  bulkUpdateDocuments 
} from './lib/document-helpers.js';

// Document operations
import { 
  performUserDocOp, 
  findUserDoc, 
  deleteUserDoc, 
  userDocActionOr404, 
  fetchUserDocOr404, 
  deleteUserDocOr404, 
  listUserDocs, 
  createUniqueDoc, 
  updateUserDoc, 
  validateDocumentUniqueness, 
  hasUniqueFieldChanges 
} from './lib/document-ops.js';

// Storage
import { MemStorage, storage } from './lib/storage.js';

// Utils
import { 
  greet, 
  add, 
  isEven, 
  dedupeByFirst, 
  dedupeByLowercaseFirst, 
  dedupeByLast, 
  dedupe 
} from './lib/utils.js';

// Email utilities
import { 
  getEmails, 
  createEmailTarget, 
  isValidEmail, 
  normalizeEmail, 
  getEmailDomain, 
  filterValidEmails 
} from './lib/email-utils.js';

// Circuit breaker
import { 
  CircuitBreaker, 
  createCircuitBreaker, 
  STATES as CIRCUIT_BREAKER_STATES 
} from './lib/circuit-breaker.js';

// Circuit breaker factory
import { 
  CircuitBreakerFactory, 
  getCircuitBreakerFactory, 
  getManagedCircuitBreaker, 
  getCircuitBreakerStats, 
  getCircuitBreakerFactoryStats, 
  clearAllCircuitBreakers, 
  shutdownCircuitBreakerFactory 
} from './lib/circuit-breaker-factory.js';

// Health check
import { 
  updateMetrics as updateHealthMetrics, 
  incrementActiveRequests, 
  decrementActiveRequests, 
  getRequestMetrics, 
  getMemoryUsage, 
  getCpuUsage, 
  getFilesystemUsage, 
  performHealthCheck, 
  createLivenessCheck, 
  createReadinessCheck, 
  setupHealthChecks, 
  createHealthEndpoint, 
  createLivenessEndpoint, 
  createReadinessEndpoint 
} from './lib/health-check.js';

// Test memory manager
import { 
  TestMemoryManager, 
  createMemoryManager, 
  createLeakDetectionSession, 
  quickMemoryCheck, 
  withMemoryTracking, 
  setupTestMemoryMonitoring, 
  teardownTestMemoryMonitoring 
} from './lib/test-memory-manager.js';

// Async queue
import { 
  AsyncQueue, 
  createQueue 
} from './lib/async-queue.js';

// Database pool
import { 
  SimpleDatabasePool, 
  DatabaseConnectionPool, 
  databaseConnectionPool, 
  createDatabasePool, 
  acquireDatabaseConnection, 
  releaseDatabaseConnection, 
  executeDatabaseQuery, 
  getDatabasePoolStats, 
  getDatabasePoolHealth, 
  shutdownDatabasePools 
} from './lib/database-pool.js';

// CRUD service factory
import { 
  createCrudService, 
  createPaginatedService, 
  createValidatedService, 
  findByFieldIgnoreCase, 
  createDuplicateError, 
  escapeRegex as escapeRegexCrud, 
  validateData 
} from './lib/crud-service-factory.js';

// Unique validator
import { 
  checkDuplicateByField, 
  validateUniqueField, 
  validateUniqueFields, 
  createUniqueValidator, 
  handleDuplicateKeyError, 
  withDuplicateKeyHandling, 
  createUniqueFieldMiddleware, 
  createUniqueFieldsMiddleware, 
  isDuplicateError, 
  createBatchUniqueChecker 
} from './lib/unique-validator.js';

// Streaming JSON
import { 
  safeJsonStringify, 
  safeJsonParse, 
  JSON as SafeJSON 
} from './lib/streaming-json.js';

// Fast operations
import { 
  FastMath, 
  FastString, 
  LockFreeQueue, 
  ObjectPool, 
  FastTimer, 
  FastMemory, 
  FastHash, 
  FastOps, 
  Cast, 
  Prop 
} from './lib/fast-operations.js';

// Logging utilities
import { 
  logFunctionEntry, 
  logFunctionExit, 
  logFunctionError 
} from './lib/logging-utils.js';

// Pagination utilities
import { 
  validatePagination, 
  createPaginationMeta, 
  createPaginatedResponse, 
  validateCursorPagination, 
  createCursor, 
  createCursorPaginationMeta, 
  createCursorPaginatedResponse, 
  validateSorting 
} from './lib/pagination-utils.js';

// Performance utilities
import { 
  DatabaseMetrics, 
  RequestMetrics, 
  SystemMetrics, 
  PerformanceMonitor, 
  performanceMonitor 
} from './lib/performance-utils.js';

// Cache utilities
import { 
  createRedisClient, 
  redis 
} from './lib/cache-utils.js';

// LRU cache
import { LRUCache } from './lib/lru-cache.js';

// Performance metrics
import { 
  incCacheHit, 
  incCacheMiss, 
  setCacheKeys, 
  getCacheMetrics, 
  resetCacheMetrics 
} from './lib/perf.js';

// Field utilities
import { 
  normalizeFieldName, 
  getCollectionName, 
  denormalizeFieldName, 
  normalizeObjectFields, 
  denormalizeObjectFields 
} from './lib/field-utils.js';

// Type map
import { 
  getMongoType, 
  getSupportedTypes, 
  isSupportedType 
} from './lib/typeMap.js';

// Mongoose mapper
import { 
  mapParameterToMongoType, 
  mapParametersToSchema, 
  generateMongooseSchema, 
  generateMongoSchema 
} from './lib/mongoose-mapper.js';

// Binary storage
import { 
  IStorage, 
  MemoryBinaryStorage, 
  FileSystemBinaryStorage, 
  StorageFactory, 
  getDefaultStorage 
} from './lib/binary-storage.js';

// Serialization utilities
import { 
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
} from './lib/serialization-utils.js';

// Export everything
export {
  // HTTP utilities
  sendNotFound,
  sendConflict,
  sendInternalServerError,
  sendServiceUnavailable,
  validateResponseObject,
  sanitizeResponseMessage,
  getTimestamp,
  sendValidationError,
  sendAuthError,
  generateRequestId,
  
  // Database utilities
  ensureMongoDB,
  ensureUnique,
  handleMongoError,
  safeDbOperation,
  retryDbOperation,
  ensureIdempotency,
  optimizeQuery,
  createAggregationPipeline,
  
  // Document helpers
  findDocumentById,
  updateDocumentById,
  deleteDocumentById,
  cascadeDeleteDocument,
  createDocument,
  findDocuments,
  findOneDocument,
  bulkUpdateDocuments,
  
  // Document operations
  performUserDocOp,
  findUserDoc,
  deleteUserDoc,
  userDocActionOr404,
  fetchUserDocOr404,
  deleteUserDocOr404,
  listUserDocs,
  createUniqueDoc,
  updateUserDoc,
  validateDocumentUniqueness,
  hasUniqueFieldChanges,
  
  // Storage
  MemStorage,
  storage,
  
  // Utils
  greet,
  add,
  isEven,
  dedupeByFirst,
  dedupeByLowercaseFirst,
  dedupeByLast,
  dedupe,
  
  // Email utilities
  getEmails,
  createEmailTarget,
  isValidEmail,
  normalizeEmail,
  getEmailDomain,
  filterValidEmails,
  
  // Circuit breaker
  CircuitBreaker,
  createCircuitBreaker,
  CIRCUIT_BREAKER_STATES,
  
  // Circuit breaker factory
  CircuitBreakerFactory,
  getCircuitBreakerFactory,
  getManagedCircuitBreaker,
  getCircuitBreakerStats,
  getCircuitBreakerFactoryStats,
  clearAllCircuitBreakers,
  shutdownCircuitBreakerFactory,
  
  // Health check
  updateHealthMetrics,
  incrementActiveRequests,
  decrementActiveRequests,
  getRequestMetrics,
  getMemoryUsage,
  getCpuUsage,
  getFilesystemUsage,
  performHealthCheck,
  createLivenessCheck,
  createReadinessCheck,
  setupHealthChecks,
  createHealthEndpoint,
  createLivenessEndpoint,
  createReadinessEndpoint,
  
  // Test memory manager
  TestMemoryManager,
  createMemoryManager,
  createLeakDetectionSession,
  quickMemoryCheck,
  withMemoryTracking,
  setupTestMemoryMonitoring,
  teardownTestMemoryMonitoring,
  
  // Async queue
  AsyncQueue,
  createQueue,
  
  // Database pool
  SimpleDatabasePool,
  DatabaseConnectionPool,
  databaseConnectionPool,
  createDatabasePool,
  acquireDatabaseConnection,
  releaseDatabaseConnection,
  executeDatabaseQuery,
  getDatabasePoolStats,
  getDatabasePoolHealth,
  shutdownDatabasePools,
  
  // CRUD service factory
  createCrudService,
  createPaginatedService,
  createValidatedService,
  findByFieldIgnoreCase,
  createDuplicateError,
  escapeRegexCrud,
  validateData,
  
  // Unique validator
  checkDuplicateByField,
  validateUniqueField,
  validateUniqueFields,
  createUniqueValidator,
  handleDuplicateKeyError,
  withDuplicateKeyHandling,
  createUniqueFieldMiddleware,
  createUniqueFieldsMiddleware,
  isDuplicateError,
  createBatchUniqueChecker,
  
  // Streaming JSON
  safeJsonStringify,
  safeJsonParse,
  SafeJSON as JSON,
  
  // Fast operations
  FastMath,
  FastString,
  LockFreeQueue,
  ObjectPool,
  FastTimer,
  FastMemory,
  FastHash,
  FastOps,
  Cast,
  Prop,
  
  // Logging utilities
  logFunctionEntry,
  logFunctionExit,
  logFunctionError,
  
  // Pagination utilities
  validatePagination,
  createPaginationMeta,
  createPaginatedResponse,
  validateCursorPagination,
  createCursor,
  createCursorPaginationMeta,
  createCursorPaginatedResponse,
  validateSorting,
  
  // Performance utilities
  DatabaseMetrics,
  RequestMetrics,
  SystemMetrics,
  PerformanceMonitor,
  performanceMonitor,
  
  // Cache utilities
  createRedisClient,
  redis,
  
  // LRU cache
  LRUCache,
  
  // Performance metrics
  incCacheHit,
  incCacheMiss,
  setCacheKeys,
  getCacheMetrics,
  resetCacheMetrics,
  
  // Field utilities
  normalizeFieldName,
  getCollectionName,
  denormalizeFieldName,
  normalizeObjectFields,
  denormalizeObjectFields,
  
  // Type map
  getMongoType,
  getSupportedTypes,
  isSupportedType,
  
  // Mongoose mapper
  mapParameterToMongoType,
  mapParametersToSchema,
  generateMongooseSchema,
  generateMongoSchema,
  
  // Binary storage
  IStorage,
  MemoryBinaryStorage,
  FileSystemBinaryStorage,
  StorageFactory,
  getDefaultStorage,
  
  // Serialization utilities
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
};