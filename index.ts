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
  sendBadRequest,
  getTimestamp,
  sendValidationError,
  sendAuthError,
  generateUniqueId,
} from './lib/http-utils';
// Database utilities
import {
  ensureMongoDB,
  ensureUnique,
  handleMongoError,
  safeDbOperation,
  retryDbOperation,
  ensureIdempotency,
  optimizeQuery,
  createAggregationPipeline,
} from './lib/database-utils';

// Storage utilities
import { MemStorage, storage, User, InsertUser } from './lib/storage';
// Document helpers
import {
  findDocumentById,
  updateDocumentById,
  deleteDocumentById,
  cascadeDeleteDocument,
  createDocument,
  findDocuments,
  findOneDocument,
  bulkUpdateDocuments,
} from './lib/document-helpers';
// Document operations
import {
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
} from './lib/document-ops';
// Storage
// MemStorage and storage imported above
// Utils
import {
  greet,
  add,
  isEven,
  dedupeByFirst,
  dedupeByLowercaseFirst,
  dedupeByLast,
  dedupe,
} from './lib/utils';
// Email utilities
import {
  getEmails,
  createEmailTarget,
  isValidEmail,
  normalizeEmail,
  getEmailDomain,
  filterValidEmails,
} from './lib/email-utils';
// Circuit breaker
import { createCircuitBreaker, STATES as CIRCUIT_BREAKER_STATES } from './lib/circuit-breaker';
// Circuit breaker factory
import {
  CircuitBreakerFactory,
  getCircuitBreakerFactory,
  getManagedCircuitBreaker,
  getCircuitBreakerStats,
  getCircuitBreakerFactoryStats,
  clearAllCircuitBreakers,
  shutdownCircuitBreakerFactory,
} from './lib/circuit-breaker-factory';
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
  createReadinessEndpoint,
} from './lib/health-check';
// Test memory manager
// teardownTestMemoryMonitoring,
// Temporarily commented out due to broken implementation
// } from './lib/test-memory-manager';
// Async queue
import { createQueue } from './lib/async-queue';
// Database pool
// // Temporarily commented out due to broken implementation
// // import {
// //   SimpleDatabasePool,
// //   DatabaseConnectionPool,
// //   databaseConnectionPool,
// //   createDatabasePool,
// //   acquireDatabaseConnection,
// //   releaseDatabaseConnection,
// //   executeDatabaseQuery,
// //   getDatabasePoolStats,
// //   getDatabasePoolHealth,
// //   shutdownDatabasePools,
// // } from './lib/database-pool.ts.js';
// CRUD service factory
import {
  createCrudService,
  createPaginatedService,
  createValidatedService,
  findByFieldIgnoreCase,
  createDuplicateError,
  escapeRegex as escapeRegexCrud,
  validateData,
} from './lib/crud-service-factory';
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
  createBatchUniqueChecker,
} from './lib/unique-validator';
// Streaming JSON
import { safeJsonStringify, safeJsonParse, SafeJSON } from './lib/streaming-json';
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
  Prop,
} from './lib/fast-operations';
// Logging utilities
import { logFunctionEntry, logFunctionExit, logFunctionError } from './lib/logging-utils';
// Pagination utilities
import {
  validatePagination,
  createPaginationMeta,
  createPaginatedResponse,
  validateCursorPagination,
  createCursor,
  createCursorPaginationMeta,
  createCursorPaginatedResponse,
  validateSorting,
} from './lib/pagination-utils';
// Performance utilities
import {
  DatabaseMetrics,
  RequestMetrics,
  SystemMetrics,
  PerformanceMonitor,
  performanceMonitor,
} from './lib/performance-utils';
// Cache utilities
import { createRedisClient } from './lib/cache-utils';
// LRU cache
import { LRUCache } from 'lru-cache';
// Bounded collections
import { BoundedQueue, BoundedMap } from './lib/bounded-collections';
// Performance metrics
import {
  incCacheHit,
  incCacheMiss,
  setCacheKeys,
  getCacheMetrics,
  resetCacheMetrics,
} from './lib/perf';
// Field utilities
import {
  normalizeFieldName,
  getCollectionName,
  denormalizeFieldName,
  normalizeObjectFields,
  denormalizeObjectFields,
} from './lib/field-utils';
// Type map
import { getMongoType, getSupportedTypes } from './lib/typeMap';
// Mongoose mapper
import {
  mapParameterToMongoType,
  mapParametersToSchema,
  generateMongooseSchema,
  generateMongoSchema,
} from './lib/mongoose-mapper';
// Binary storage
import {
  MemoryBinaryStorage,
  FileSystemBinaryStorage,
  StorageFactory,
  getDefaultStorage,
} from './lib/binary-storage';
import { IStorage } from './lib/storage-interfaces';
// Security middleware
import { setupSecurity, getSecurityConfig, destroySecurity } from './lib/security-middleware';
// Privacy and compliance
import {
  privacyMiddleware,
  privacyHeadersMiddleware,
  ccpaComplianceMiddleware,
  handleDataDeletionRequest,
  handleDataExportRequest,
  setupDataRetention,
} from './lib/privacy-compliance';
import { BasicRateLimiter } from './lib/security-middleware';
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
  serializeWithoutFields,
} from './lib/serialization-utils';
// Export everything
export {
  // HTTP utilities
  sendNotFound,
  sendConflict,
  sendInternalServerError,
  sendServiceUnavailable,
  sendBadRequest,
  getTimestamp,
  sendValidationError,
  sendAuthError,
  generateUniqueId,
  // Security and privacy
  setupSecurity,
  getSecurityConfig,
  destroySecurity,
  privacyMiddleware,
  privacyHeadersMiddleware,
  ccpaComplianceMiddleware,
  handleDataDeletionRequest,
  handleDataExportRequest,
  setupDataRetention,
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
  listUserDocsLean,
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
  // Test memory manager - temporarily disabled
  // TestMemoryManager,
  // createMemoryManager,
  // createLeakDetectionSession,
  // quickMemoryCheck,
  // withMemoryTracking,
  // setupTestMemoryMonitoring,
  // teardownTestMemoryMonitoring,
  // createQueue,
  // Database pool - temporarily disabled
  // SimpleDatabasePool,
  // DatabaseConnectionPool,
  // databaseConnectionPool,
  // createDatabasePool,
  // acquireDatabaseConnection,
  // releaseDatabaseConnection,
  // executeDatabaseQuery,
  // getDatabasePoolStats,
  // getDatabasePoolHealth,
  // shutdownDatabasePools,
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
  // LRU cache
  LRUCache,
  // Bounded collections
  BoundedQueue,
  BoundedMap,
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
  serializeWithoutFields,
};

// Export types
export type { User, InsertUser } from './lib/storage';
// No BasicRateLimiter export here to avoid duplicate
export type { Application, Request, Response, NextFunction } from 'express';
