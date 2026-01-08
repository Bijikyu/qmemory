/**
 * Database Utilities Module
 *
 * This module provides comprehensive MongoDB database operation utilities with
 * enhanced error handling, performance optimization, and security features.
 * It serves as the foundation for all database interactions in the application.
 *
 * Key Features:
 * - Robust error handling with specific MongoDB error classification
 * - Automatic retry logic with exponential backoff for transient failures
 * - Query optimization for improved performance
 * - Idempotency support for safe operation retries
 * - Comprehensive logging and debugging capabilities
 * - Timeout protection to prevent hanging operations
 * - Index management for optimal query performance
 *
 * Security Considerations:
 * - All database operations include proper error sanitization
 * - Timeout protection prevents resource exhaustion attacks
 * - Input validation through Mongoose schemas
 * - Connection pooling and resource management
 * - Audit logging for all database operations
 */

import mongoose, {
  Model,
  HydratedDocument,
  FilterQuery,
  QueryWithHelpers,
  PipelineStage,
  QueryOptions,
} from 'mongoose';
import type { Response } from 'express';
import type { MongoServerError } from 'mongodb';
import { sendInternalServerError, sendConflict, sendValidationError } from './http-utils.js';
import { createModuleUtilities } from './common-patterns.js';
import { calculateBackoffDelay, safeDelay } from './core/secure-delay.js';

// Re-export MongoDB connection validation from dedicated module
export { ensureMongoDB } from './database/connection-utils.js';

// Create module-specific utilities for logging and error handling
const utils = createModuleUtilities('database-utils');

/**
 * Generic type for any MongoDB document shape
 *
 * This type represents flexible document structures that can contain
 * any combination of string keys and unknown values. It's used throughout
 * the database utilities to maintain type safety while allowing flexibility.
 */
type AnyDocumentShape = Record<string, unknown>;

/**
 * Type guard for MongoDB server errors
 *
 * This function safely determines if an error is a MongoDB server error
 * by checking for the presence of the 'code' property. This enables proper
 * error handling and classification for different MongoDB error scenarios.
 *
 * @param error - Unknown error to check
 * @returns {boolean} True if error is a MongoServerError
 */
const isMongoServerError = (error: unknown): error is MongoServerError =>
  typeof error === 'object' && error !== null && 'code' in error;

/**
 * Type guard for Mongoose validation errors
 *
 * This function identifies Mongoose validation errors which contain
 * detailed field-level validation information. These errors occur when
 * document data fails schema validation rules.
 *
 * @param error - Unknown error to check
 * @returns {boolean} True if error is a Mongoose ValidationError
 */
const isValidationError = (
  error: unknown
): error is {
  name: 'ValidationError';
  errors?: Record<string, { message: string }>;
  message?: string;
} =>
  typeof error === 'object' &&
  error !== null &&
  (error as { name?: string }).name === 'ValidationError';

/**
 * Type guard for Mongoose cast errors
 *
 * This function identifies Mongoose cast errors which occur when data
 * cannot be properly cast to the expected schema type (e.g., invalid
 * ObjectId format, type conversion failures).
 *
 * @param error - Unknown error to check
 * @returns {boolean} True if error is a Mongoose CastError
 */
const isCastError = (error: unknown): error is { name: 'CastError' } =>
  typeof error === 'object' && error !== null && (error as { name?: string }).name === 'CastError';

/**
 * Interface for idempotency records
 *
 * This interface defines the structure for database records that store
 * operation results to ensure idempotency. When an operation is retried
 * with the same idempotency key, the cached result is returned instead
 * of re-executing the operation.
 *
 * @template TResult - Type of the stored operation result
 */
export interface IdempotencyRecord<TResult> extends AnyDocumentShape {
  idempotencyKey: string; // Unique key for identifying duplicate operations
  result: TResult; // Cached result of the operation
  createdAt: Date; // Timestamp for record aging and cleanup
}

// Re-export uniqueness validation utilities from dedicated module
export { ensureUnique } from './database/validation-utils.js';

/**
 * Handles MongoDB duplicate key errors (code 11000) with detailed field information
 *
 * This function specifically handles MongoDB duplicate key errors which occur when
 * attempting to insert documents that violate unique constraints. It extracts the
 * field name from the error metadata and sends an appropriate conflict response.
 *
 * Error Code 11000: Indicates a duplicate key violation in MongoDB
 *
 * @param error - The error object to check and handle
 * @param res - Express response object (optional, for sending HTTP responses)
 * @param customMessage - Optional custom error message override
 * @returns {boolean} True if the error was handled as a duplicate key error
 */
export const handleMongoDuplicateError = (
  error: unknown,
  res: Response | null,
  customMessage?: string
): boolean => {
  // Check if this is a MongoDB duplicate key error (code 11000)
  if (isMongoServerError(error) && error.code === 11000) {
    if (res) {
      // Extract the field name from the key pattern in the error
      const field = Object.keys(
        (error as MongoServerError & { keyPattern?: Record<string, number> }).keyPattern ?? {}
      )[0];
      // Use custom message or generate default message with field name
      const message = customMessage || `Duplicate value for field: ${field ?? 'unknown'}`;
      sendConflict(res, message); // Send 409 Conflict response
    }
    return true; // Indicate that this error was handled
  }
  return false; // Not a duplicate key error
};

/**
 * Comprehensive MongoDB error handling with classification and appropriate HTTP responses
 *
 * This function serves as the central error handler for all MongoDB operations.
 * It classifies different types of MongoDB errors and sends appropriate HTTP
 * responses with meaningful error messages. It also provides detailed logging
 * for debugging and monitoring purposes.
 *
 * Error Types Handled:
 * - Duplicate Key Errors (11000) → 409 Conflict
 * - Validation Errors → 400 Validation Error with field details
 * - Cast Errors → 400 Validation Error (invalid format)
 * - All Other Errors → 500 Internal Server Error
 *
 * @param error - The error object to handle and classify
 * @param res - Express response object (optional, for sending HTTP responses)
 * @param operation - Description of the operation that failed (for logging)
 */
export const handleMongoError = (error: unknown, res: Response | null, operation: string): void => {
  // Log the error with comprehensive context for debugging
  utils.logError(error as Error, 'handleMongoError', {
    operation,
    isMongoServerError: isMongoServerError(error),
    errorCode: isMongoServerError(error) ? error.code : undefined,
    hasResponse: res !== null,
  });

  // Additional debug logging with full error details
  utils.debugLog('MongoDB error during operation', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    operation,
    code: isMongoServerError(error) ? error.code : undefined,
  });

  // If no response object provided, just log and return
  if (!res) return;

  // Handle duplicate key errors using the dedicated helper function
  if (handleMongoDuplicateError(error, res)) {
    return; // Error was handled, exit early
  }

  // Handle Mongoose validation errors with field-level details
  if (isValidationError(error)) {
    const messages = Object.values(error.errors ?? {}).map(
      validationError => validationError.message
    );
    sendValidationError(res, 'Validation failed', messages); // Send 400 with validation details
    return;
  }

  // Handle Mongoose cast errors (type conversion failures)
  if (isCastError(error)) {
    sendValidationError(res, 'Invalid ID format'); // Send 400 for format errors
    return;
  }

  // Handle all other errors as generic internal server errors
  sendInternalServerError(res, 'Database error during operation');
};

/**
 * Executes database operations with timeout protection and comprehensive error handling
 *
 * This function provides a safe wrapper for database operations that includes
 * timeout protection to prevent hanging operations, comprehensive error handling,
 * and detailed logging. It's designed to prevent resource exhaustion and provide
 * consistent error handling across all database operations.
 *
 * Key Features:
 * - 30-second timeout protection prevents hanging operations
 * - Automatic error classification and HTTP response handling
 * - Enhanced logging for performance monitoring and debugging
 * - Connection pool exhaustion detection
 * - Graceful error recovery with null return on failure
 *
 * @template TResult - Type of the operation result
 * @param operation - Async database operation to execute
 * @param operationName - Descriptive name for logging and error reporting
 * @param res - Optional Express response object for error responses
 * @returns {Promise<TResult | null>} Operation result or null on failure
 */
export const safeDbOperation = async <TResult>(
  operation: () => Promise<TResult>,
  operationName: string,
  res: Response | null = null
): Promise<TResult | null> => {
  return utils
    .safeAsync(
      async () => {
        utils.getFunctionLogger('safeDbOperation').debug('executing', { operationName });

        // Timeout protection to prevent hanging operations (Scalability Fix #1)
        let timeoutId: NodeJS.Timeout | null = null;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(
            () => reject(new Error(`Database operation timeout: ${operationName}`)),
            30000 // 30-second timeout for all database operations
          );
        });

        // Race the operation against the timeout to prevent hanging
        const result = await Promise.race([operation(), timeoutPromise]).finally(() => {
          // Clean up timeout to prevent memory leaks
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        });

        utils
          .getFunctionLogger('safeDbOperation')
          .debug('completed successfully', { operationName });
        return result;
      },
      operationName,
      { operationName, hasResponse: res !== null }
    )
    .catch(error => {
      // Enhanced error logging for performance monitoring (Scalability Fix #2)
      if (error.message.includes('timeout')) {
        console.error(`DATABASE TIMEOUT: ${operationName} - possible connection pool exhaustion`);
      }
      // Handle the error using the comprehensive error handler
      handleMongoError(error, res, operationName);
      return null; // Return null on failure to prevent cascade errors
    });
};

/**
 * Executes database operations with automatic retry logic and exponential backoff
 *
 * This function provides robust retry logic for transient database failures.
 * It uses exponential backoff with jitter to prevent thundering herd problems
 * and includes comprehensive logging for monitoring retry attempts.
 *
 * Retry Strategy:
 * - Maximum 3 retries by default (configurable)
 * - Exponential backoff with 1-second base delay
 * - Maximum delay capped at 60 seconds
 * - Jitter added to prevent synchronized retries
 * - Detailed logging of all retry attempts
 *
 * @template TResult - Type of the operation result
 * @param operation - Async database operation to retry on failure
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds for exponential backoff (default: 1000)
 * @returns {Promise<TResult>} Operation result after successful completion
 * @throws {Error} The last error if all retry attempts fail
 */
export const retryDbOperation = async <TResult>(
  operation: () => Promise<TResult>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<TResult> => {
  return utils.safeAsync(
    async () => {
      let lastError: Error = new Error('Unknown error');
      let activeConnection = null; // Reserved for future connection management

      try {
        // Attempt the operation with retry logic
        for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
          try {
            utils.getFunctionLogger('retryDbOperation').debug('attempt', { attempt, maxRetries });
            const result = await operation();
            utils.getFunctionLogger('retryDbOperation').debug('succeeded', { attempt });
            return result; // Success! Return the result immediately
          } catch (error) {
            // Store the error for potential final throw
            lastError = error instanceof Error ? error : new Error(String(error));

            // Log the retry attempt with comprehensive context
            utils.logError(lastError, 'retryDbOperation', {
              attempt,
              maxRetries,
              isFinalAttempt: attempt === maxRetries,
            });

            utils.debugLog('retryDbOperation attempt failed', {
              attempt,
              maxRetries,
              message: lastError.message,
            });

            // If this isn't the final attempt, schedule the next retry
            if (attempt < maxRetries) {
              // Calculate exponential backoff delay with jitter, capped at 60 seconds
              const totalDelay = calculateBackoffDelay(baseDelay, attempt, 60000);
              utils.debugLog('retryDbOperation scheduling next attempt', { totalDelay });
              await safeDelay(totalDelay); // Safe delay with error handling
            }
          }
        }
        // All retries exhausted, throw the last error
        throw lastError;
      } finally {
        // Cleanup reserved resources (placeholder for future connection management)
        if (activeConnection) {
          // Future: Clean up active connections if needed
        }
      }
    },
    'retryDbOperation',
    { maxRetries, baseDelay }
  );
};

/**
 * Ensures operation idempotency by caching results and preventing duplicate executions
 *
 * This function provides idempotency guarantees for database operations by storing
 * operation results with unique keys. If the same operation is attempted with the
 * same idempotency key, the cached result is returned instead of re-executing
 * the operation. This is crucial for preventing duplicate operations in distributed
 * systems and ensuring data consistency.
 *
 * Idempotency Flow:
 * 1. Check if idempotency key exists in database
 * 2. If found, return cached result
 * 3. If not found, execute the operation
 * 4. Store the result with the idempotency key
 * 5. Return the result
 *
 * @template TResult - Type of the operation result
 * @template TRecord - Type of the idempotency record (extends IdempotencyRecord)
 * @param model - Mongoose model for idempotency records
 * @param idempotencyKey - Unique key identifying the operation (e.g., request ID)
 * @param operation - Async operation to execute if not already performed
 * @returns {Promise<TResult>} Operation result (from cache or fresh execution)
 */
export const ensureIdempotency = async <TResult, TRecord extends IdempotencyRecord<TResult>>(
  model: Model<TRecord>,
  idempotencyKey: string,
  operation: () => Promise<TResult>
): Promise<TResult> => {
  return utils.safeAsync(
    async () => {
      utils.getFunctionLogger('ensureIdempotency').debug('checking key', { idempotencyKey });

      // Check if we already have a result for this idempotency key
      const existing = await model.findOne({ idempotencyKey }).exec();
      if (existing) {
        utils
          .getFunctionLogger('ensureIdempotency')
          .debug('found cached result', { idempotencyKey });
        return existing.result; // Return cached result
      }

      // No cached result found, execute the operation
      utils
        .getFunctionLogger('ensureIdempotency')
        .debug('executing new operation', { idempotencyKey });
      const result = await operation();

      // Store the result with the idempotency key for future requests
      await model.create({ idempotencyKey, result, createdAt: new Date() } as TRecord);
      utils.getFunctionLogger('ensureIdempotency').debug('stored new result', { idempotencyKey });

      return result; // Return the fresh result
    },
    'ensureIdempotency',
    { idempotencyKey, operationType: typeof operation }
  );
};

/**
 * Optimizes MongoDB queries for improved performance and reduced memory usage
 *
 * This function applies several performance optimizations to MongoDB queries:
 * - Converts queries to lean mode (returns plain JavaScript objects instead of Mongoose documents)
 * - Excludes the internal __v field (version key) from results
 * - Preserves all existing query options and conditions
 *
 * Performance Benefits:
 * - Lean queries use significantly less memory
 * - Faster query execution without document overhead
 * - Reduced network payload by excluding internal fields
 * - Better scalability for high-volume operations
 *
 * @template TResult - Type of the query result
 * @template TSchema - Type of the document schema
 * @template THelpers - Type of query helpers (default: unknown)
 * @template TRawDocType - Type of raw document (default: TSchema)
 * @param query - MongoDB query to optimize
 * @returns {QueryWithHelpers} Optimized query with performance enhancements
 */
export const optimizeQuery = <
  TResult,
  TSchema extends AnyDocumentShape,
  THelpers = unknown,
  TRawDocType extends AnyDocumentShape = TSchema,
>(
  query: QueryWithHelpers<TResult, HydratedDocument<TSchema>, THelpers, TRawDocType>
): QueryWithHelpers<TResult, HydratedDocument<TSchema>, THelpers, TRawDocType> => {
  return utils.safeSync(() => {
    utils.debugLog('optimizeQuery processing query');
    let optimizedQuery = query;

    // Apply lean optimization for better performance and memory usage
    if (typeof optimizedQuery.lean === 'function') {
      optimizedQuery = optimizedQuery.lean() as typeof optimizedQuery;
    }

    // Exclude internal Mongoose version field (__v) if no explicit select is set
    const options: QueryOptions<TSchema> = optimizedQuery.getOptions();
    if (!options.select && typeof optimizedQuery.select === 'function') {
      optimizedQuery = optimizedQuery.select('-__v') as typeof optimizedQuery;
    }

    utils.debugLog('optimizeQuery completed');
    return optimizedQuery;
  }, 'optimizeQuery') as QueryWithHelpers<
    TResult,
    HydratedDocument<TSchema>,
    THelpers,
    TRawDocType
  >;
};

/**
 * Interface defining MongoDB aggregation pipeline stages
 *
 * This interface provides a type-safe way to define aggregation pipeline stages
 * without having to use the raw MongoDB pipeline syntax. It supports the most
 * commonly used aggregation stages with proper TypeScript typing.
 */
interface AggregationStageDefinition {
  match?: PipelineStage.Match['$match']; // Filter documents (WHERE clause)
  group?: PipelineStage.Group['$group']; // Group documents (GROUP BY clause)
  sort?: PipelineStage.Sort['$sort']; // Sort documents (ORDER BY clause)
  skip?: PipelineStage.Skip['$skip']; // Skip documents (OFFSET clause)
  limit?: PipelineStage.Limit['$limit']; // Limit results (LIMIT clause)
  project?: PipelineStage.Project['$project']; // Shape documents (SELECT clause)
  lookup?: PipelineStage.Lookup['$lookup']; // Join collections (JOIN clause)
  unwind?: PipelineStage.Unwind['$unwind']; // Deconstruct arrays (UNNEST clause)
}

/**
 * Creates a MongoDB aggregation pipeline from stage definitions
 *
 * This function builds a MongoDB aggregation pipeline from a more readable
 * and type-safe stage definition format. It automatically handles the
 * conversion from the interface format to raw MongoDB pipeline syntax.
 *
 * Pipeline Construction:
 * - Processes stages in the order they are provided
 * - Only includes non-null/undefined stages in the final pipeline
 * - Provides comprehensive logging for debugging and monitoring
 * - Maintains type safety throughout the construction process
 *
 * @param stages - Array of aggregation stage definitions
 * @returns {PipelineStage[]} Complete MongoDB aggregation pipeline
 */
export const createAggregationPipeline = (
  stages: AggregationStageDefinition[]
): PipelineStage[] => {
  return utils.safeSync(
    () => {
      utils.debugLog('createAggregationPipeline building pipeline', { stageCount: stages.length });
      const pipeline: PipelineStage[] = [];

      // Process each stage definition and convert to MongoDB pipeline syntax
      stages.forEach((stage, index) => {
        utils.debugLog('createAggregationPipeline processing stage', { index, stage });

        // Add each non-null stage to the pipeline in order
        if (stage.match) pipeline.push({ $match: stage.match });
        if (stage.group) pipeline.push({ $group: stage.group });
        if (stage.sort) pipeline.push({ $sort: stage.sort });
        if (stage.skip !== undefined) pipeline.push({ $skip: stage.skip });
        if (stage.limit !== undefined) pipeline.push({ $limit: stage.limit });
        if (stage.project) pipeline.push({ $project: stage.project });
        if (stage.lookup) pipeline.push({ $lookup: stage.lookup });
        if (stage.unwind) pipeline.push({ $unwind: stage.unwind });
      });

      utils.debugLog('createAggregationPipeline completed', { pipelineLength: pipeline.length });
      return pipeline;
    },
    'createAggregationPipeline',
    { stageCount: stages.length }
  ) as PipelineStage[];
};

/**
 * Interface defining MongoDB index creation options
 *
 * This interface provides type-safe configuration for creating MongoDB indexes
 * with various options for performance optimization and data integrity.
 */
interface DatabaseIndexDefinition {
  fields: Record<string, 1 | -1>; // Field definitions (1 for ascending, -1 for descending)
  unique?: boolean; // Enforce uniqueness constraint
  sparse?: boolean; // Only index documents that have the field
  background?: boolean; // Create index in background (non-blocking)
}

/**
 * Creates optimized database indexes for document collections
 *
 * This function creates a set of standard indexes that optimize query performance
 * for user-owned documents. The indexes are designed to support common query
 * patterns while maintaining data integrity and performance.
 *
 * Standard Indexes Created:
 * 1. Single user field index - For basic user queries
 * 2. User + createdAt compound index - For chronological user queries
 * 3. User + updatedAt compound index - For recently updated user queries
 * 4. User + title unique sparse index - For unique title enforcement per user
 *
 * Performance Benefits:
 * - Optimizes user-scoped queries (most common pattern)
 * - Supports chronological sorting and filtering
 * - Enforces uniqueness constraints where needed
 * - Background creation prevents blocking operations
 *
 * @template TSchema - Type of the document schema
 * @param model - Mongoose model to create indexes for
 * @returns {Promise<void>} Completes when all indexes are created (or fail gracefully)
 */
export const createDocumentIndexes = async <TSchema extends AnyDocumentShape>(
  model: Model<TSchema>
): Promise<void> => {
  return utils.safeAsync(
    async () => {
      utils.debugLog('createDocumentIndexes starting index creation', {
        modelName: model.modelName,
      });

      // Define standard indexes for user-owned document collections
      const indexes: DatabaseIndexDefinition[] = [
        // Basic user field index for simple user queries
        { fields: { user: 1 }, background: true },

        // Compound index for user queries sorted by creation date (most common pattern)
        { fields: { user: 1, createdAt: -1 }, background: true },

        // Compound index for user queries sorted by update date (recent changes)
        { fields: { user: 1, updatedAt: -1 }, background: true },

        // Unique sparse index for title uniqueness per user (optional field)
        { fields: { user: 1, title: 1 }, unique: true, sparse: true, background: true },
      ];

      // Create all indexes in parallel for faster execution
      await Promise.all(
        indexes.map(async (indexDef, index) => {
          try {
            // Create the index with specified options
            await model.collection.createIndex(indexDef.fields, {
              unique: indexDef.unique,
              sparse: indexDef.sparse,
              background: indexDef.background,
            });

            utils.debugLog('createDocumentIndexes index created', {
              modelName: model.modelName,
              indexNumber: index + 1,
              fields: Object.keys(indexDef.fields),
              unique: indexDef.unique,
            });
          } catch (indexError) {
            // Log index creation failures but don't fail the entire operation
            utils.debugLog('createDocumentIndexes index creation failed', {
              modelName: model.modelName,
              indexNumber: index + 1,
              fields: Object.keys(indexDef.fields),
              error: indexError instanceof Error ? indexError.message : String(indexError),
            });
          }
        })
      );

      utils.debugLog('createDocumentIndexes completed successfully', {
        modelName: model.modelName,
      });
    },
    'createDocumentIndexes',
    { modelName: model.modelName }
  );
};
