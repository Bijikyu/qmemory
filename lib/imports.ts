/**
 * Common Import Barrels
 *
 * Purpose: Reduce import statement duplication across codebase.
 * Addresses "Import Pattern Duplication" (100+ occurrences) identified in wet-code analysis.
 *
 * Design Principles:
 * - Centralized common imports
 * - Type-safe re-exports
 * - Easy access to frequently used modules
 */

// MongoDB and Mongoose
export type { Model, HydratedDocument, FilterQuery, UpdateQuery, Document, Types } from 'mongoose';

// Express.js types
export type { Request, Response, NextFunction, RequestHandler } from 'express';

// Core utilities
export { createLogger, type LogContext, LogLevel } from './core/centralized-logger';
export { ErrorHandler } from './core/error-handler';
export type { ErrorContext, ErrorResponse, StandardResponse } from './core/error-handler-types';

// Shared result types
export {
  type SafeReadResult,
  type SafeWriteResult,
  type SafeReadSimpleResult,
  type SafeReadSyncResult,
  type SafeWriteSyncResult,
  type OperationResult,
  type OperationError,
  type SafeOperation,
  type FileProcessingResult,
  type BatchProcessingResult,
  type PathValidationResult,
  type FileErrorContext,
  type FileMetadataResult,
  type ConfigurationResult,
  type StreamResult,
  isSuccessResult,
  isErrorResult,
  isSuccessRead,
  isSuccessWrite,
} from './types/result-types';

// Internal utilities
export {
  sendNotFound,
  sendConflict,
  sendInternalServerError,
  sendServiceUnavailable,
  sendBadRequest,
  getTimestamp as getHttpTimestamp,
  sendValidationError,
  sendAuthError,
  generateUniqueId,
} from './http-utils';
export {
  ensureMongoDB,
  ensureUnique,
  handleMongoError,
  safeDbOperation,
  retryDbOperation,
  ensureIdempotency,
  optimizeQuery,
  createAggregationPipeline,
} from './database-utils';
export { MemStorage, storage } from './storage';
export {
  findDocumentById,
  updateDocumentById,
  deleteDocumentById,
  cascadeDeleteDocument,
  createDocument,
  findDocuments,
  findOneDocument,
  bulkUpdateDocuments,
  findManyByFieldIgnoreCase,
  existsByField,
  getDistinctValues,
  bulkDeleteDocuments,
  aggregateDocuments,
  getByDateRange,
  softDeleteDocument,
  getActiveDocuments,
  textSearchDocuments,
  getPaginatedDocuments,
} from './document-helpers';
export {
  performUserDocOp,
  findUserDoc,
  deleteUserDoc,
  userDocActionOr404,
  fetchUserDocOr404,
  deleteUserDocOr404,
  listUserDocsLean,
  createUniqueDoc,
  updateUserDoc,
  validateDocumentUniqueness,
  hasUniqueFieldChanges,
} from './document-ops';

// Core utilities
// export { createHash } from './qgenutils-wrapper';

// Utils
export {
  greet,
  add,
  isEven,
  dedupeByFirst,
  dedupeByLowercaseFirst,
  dedupeByLast,
  dedupe,
} from './utils';

// Email utilities
export {
  getEmails,
  createEmailTarget,
  isValidEmail,
  normalizeEmail,
  getEmailDomain,
  filterValidEmails,
} from './email-utils';

// Circuit breaker
export { createCircuitBreaker, STATES as CIRCUIT_BREAKER_STATES } from './circuit-breaker';
export {
  CircuitBreakerFactory,
  getCircuitBreakerFactory,
  getManagedCircuitBreaker,
  getCircuitBreakerStats,
  getCircuitBreakerFactoryStats,
  clearAllCircuitBreakers,
  shutdownCircuitBreakerFactory,
} from './circuit-breaker-factory';

// Health check
export {
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
  createReadinessEndpoint,
} from './health-check';

// Pagination utilities
export {
  validatePagination,
  createPaginationMeta,
  createPaginatedResponse,
  validateCursorPagination,
  createCursor,
  createCursorPaginationMeta,
  createCursorPaginatedResponse,
  validateSorting,
} from './pagination-utils';

// CRUD service factory
export {
  createCrudService,
  createPaginatedService,
  createValidatedService,
  findByFieldIgnoreCase,
  createDuplicateError,
  escapeRegex as escapeRegexCrud,
  validateData,
} from './crud-service-factory';

// Unique validator
export {
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
} from './unique-validator';

// Serialization utilities
export { safeJsonStringify, safeJsonParse, SafeJSON } from './streaming-json';

// Fast operations
export {
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
} from './fast-operations';

// Logging utilities
export { logFunctionEntry, logFunctionExit, logFunctionError } from './logging-utils';

// Bounded collections
export { BoundedQueue, BoundedMap } from './bounded-collections';

// Performance metrics
export {
  DatabaseMetrics,
  RequestMetrics,
  SystemMetrics,
  PerformanceMonitor,
  performanceMonitor,
} from './performance-utils';

// Memory management utilities
export {
  MemoryManager,
  memoryManager,
  sanitizeObject,
  cleanupObject,
  createWeakCache,
} from './performance/memory-manager';

// Memory-optimized cache
export {
  MemoryOptimizedCache,
  createMemoryOptimizedCache,
  globalCaches,
  type MemoryOptimizedCacheConfig,
  type CacheMemoryStats,
  type GlobalCacheInstances,
} from './performance/memory-optimized-cache';

// Cache utilities
export { createRedisClient } from './cache-utils';

// Field utilities
export {
  normalizeFieldName,
  getCollectionName,
  denormalizeFieldName,
  normalizeObjectFields,
  denormalizeObjectFields,
} from './field-utils';

// Type utilities
export { getMongoType, getSupportedTypes } from './typeMap';

// Mongoose mapper
export {
  mapParameterToMongoType,
  mapParametersToSchema,
  generateMongooseSchema,
  generateMongoSchema,
} from './mongoose-mapper';

// Binary storage
export {
  MemoryBinaryStorage,
  FileSystemBinaryStorage,
  StorageFactory,
  getDefaultStorage,
} from './binary-storage';

// Storage interfaces
export type { IStorage } from './storage-interfaces';

// Security middleware
export { setupSecurity, getSecurityConfig, destroySecurity } from './security-middleware';

// Privacy compliance
export {
  privacyMiddleware,
  privacyHeadersMiddleware,
  ccpaComplianceMiddleware,
  handleDataDeletionRequest,
  handleDataExportRequest,
  setupDataRetention,
} from './privacy-compliance';

// Serialization utilities
export {
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
  serializeWithoutFields,
} from './serialization-utils';

// Database operation factory
export { createDatabaseOperations, createMockModel } from './database-operation-factory';

// HTTP response factory
export { createResponseFactory } from './http-response-factory';

// Database pool
export {
  DatabaseConnectionPool,
  databaseConnectionPool as sharedDatabaseConnectionPool,
} from './database/connection-pool-manager';

// Native MongoDB operations
export {
  MongoDBOperations,
  MongoDBManager,
  createMongoDBOperations,
  getMongoDBManager,
  type FindManyOptions,
} from './database/mongodb-operations';

// LocalStorage utilities
export {
  isLocalStorageAvailable,
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem,
  getLocalStorageBoolean,
  setLocalStorageBoolean,
  clearLocalStorage,
  getLocalStorageKeys,
  getLocalStorageSize,
} from './storage/local-storage-utils';

// Queue management
export {
  QueueStateManager,
  IntervalManager,
  ConcurrencyLimiter,
  enforceQueueLimit,
  createConcurrencyLimiter,
  startPeriodicTask,
  stopPeriodicTask,
  stopAllPeriodicTasks,
  getActivePeriodicTasks,
  type QueueMetrics,
  type QueueManagerOptions,
} from './queue/queue-manager';

// Streaming utilities
export {
  ChunkedStreamProcessor,
  JSONStreamProcessor,
  ScalableFileReader,
  LineStreamProcessor,
  createChunkedProcessor,
  createJSONStreamProcessor,
  createLineStreamProcessor,
  createScalableFileReader,
  type ChunkedStreamOptions,
  type ChunkResult,
  type JSONStreamOptions,
  type ScalableFileReaderOptions,
  type LineReaderOptions,
} from './streaming/streaming-utils';

// Common patterns
export { validateResponse, getTimestamp } from './common-patterns';
