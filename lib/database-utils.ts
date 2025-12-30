/**
 * Database Utility Functions
 * MongoDB and Mongoose helper functions with strong typings
 */
// 🚩AI: ENTRY_POINT_FOR_DATABASE_OPERATIONS
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
import {
  sendServiceUnavailable,
  sendInternalServerError,
  sendConflict,
  sendValidationError,
} from './http-utils.js';
import qerrors from 'qerrors';

interface Logger {
  logDebug(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

// Simple logger implementation keeps console-based observability for agents
const logger: Logger = {
  logDebug: (message: string, context?: Record<string, unknown>) =>
    console.log(`DEBUG: ${message}`, context ?? ''),
  warn: (message: string, context?: Record<string, unknown>) =>
    console.warn(`WARN: ${message}`, context ?? ''),
  error: (message: string, context?: Record<string, unknown>) =>
    console.error(`ERROR: ${message}`, context ?? ''),
};

type AnyDocumentShape = Record<string, unknown>;

export interface IdempotencyRecord<TResult> extends AnyDocumentShape {
  idempotencyKey: string;
  result: TResult;
  createdAt: Date;
}

const isMongoServerError = (error: unknown): error is MongoServerError =>
  typeof error === 'object' && error !== null && 'code' in error;

const isValidationError = (
  error: unknown
): error is { name: 'ValidationError'; errors?: Record<string, { message: string }> } =>
  typeof error === 'object' &&
  error !== null &&
  (error as { name?: string }).name === 'ValidationError';

const isCastError = (error: unknown): error is { name: 'CastError' } =>
  typeof error === 'object' && error !== null && (error as { name?: string }).name === 'CastError';

// 🚩AI: MUST_UPDATE_IF_MONGOOSE_CONNECTION_PATTERN_CHANGES
/**
 * Validates that the active mongoose connection is ready before operations are attempted.
 * @param res Express response used to surface availability errors to the caller.
 * @returns true when the database connection is ready, otherwise false and response sent.
 */
export const ensureMongoDB = (res: Response): boolean => {
  logger.logDebug('ensureMongoDB is running', {
    readyState: mongoose.connection.readyState,
  });
  try {
    const isReady = mongoose.connection.readyState === 1; // 1 = connected state in Mongoose
    if (!isReady) {
      sendServiceUnavailable(res, 'Database functionality unavailable');
      logger.warn('Database connection not ready when ensureMongoDB executed');
      return false;
    }
    logger.logDebug('ensureMongoDB confirmed healthy database connection');
    return true;
  } catch (error) {
    qerrors.qerrors(error as Error, 'database-utils.ensureMongoDB', {
      readyState: mongoose.connection.readyState,
    });
    logger.error('Database availability check error', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    sendInternalServerError(res, 'Error checking database connection');
    return false;
  }
};

/**
 * Ensures that no existing document matches the supplied uniqueness query.
 * @param model Mongoose model containing the collection.
 * @param query Filter enforcing uniqueness.
 * @param res Express response for conflict propagation.
 * @param duplicateMsg Optional custom duplicate message.
 * @returns true when the record is unique, false when duplicates were detected.
 */
export const ensureUnique = async <TSchema extends AnyDocumentShape>(
  model: Model<TSchema>,
  query: FilterQuery<TSchema>,
  res: Response,
  duplicateMsg?: string
): Promise<boolean> => {
  logger.logDebug('ensureUnique is running', { query });
  try {
    const existingDoc = await model.exists(query);
    if (existingDoc) {
      const duplicateId = String(existingDoc._id);
      logger.warn('Duplicate document detected during ensureUnique', {
        query,
        duplicateId,
      });
      sendConflict(res, duplicateMsg ?? 'Resource already exists');
      return false;
    }
    logger.logDebug('ensureUnique completed without detecting duplicates');
    return true;
  } catch (error) {
    qerrors.qerrors(error as Error, 'database-utils.ensureUnique', {
      queryKeys: Object.keys(query),
    });
    logger.error('Error checking document uniqueness', {
      query,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    sendInternalServerError(res, 'Error checking document uniqueness');
    return false;
  }
};

/**
 * Centralized Mongo error handling that classifies all known failure scenarios.
 * @param error Unknown error raised by mongoose or the Mongo driver.
 * @param res Optional Express response to surface a sanitized failure.
 * @param operation Name of the operation in-flight for logging correlation.
 */
export const handleMongoError = (error: unknown, res: Response | null, operation: string): void => {
  qerrors.qerrors(error as Error, 'database-utils.handleMongoError', {
    operation,
    isMongoServerError: isMongoServerError(error),
    errorCode: isMongoServerError(error) ? error.code : undefined,
    hasResponse: res !== null,
  });

  logger.error(`MongoDB error during ${operation}`, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    operation,
    code: isMongoServerError(error) ? error.code : undefined,
  });

  if (!res) {
    return;
  }

  if (isMongoServerError(error) && error.code === 11000) {
    const field = Object.keys(
      (error as MongoServerError & { keyPattern?: Record<string, number> }).keyPattern ?? {}
    )[0];
    sendConflict(res, `Duplicate value for field: ${field ?? 'unknown'}`);
    return;
  }

  if (isValidationError(error)) {
    const messages = Object.values(error.errors ?? {}).map(
      validationError => validationError.message
    );
    sendValidationError(res, 'Validation failed', messages);
    return;
  }

  if (isCastError(error)) {
    sendValidationError(res, 'Invalid ID format');
    return;
  }

  sendInternalServerError(res, `Database error during ${operation}`);
};

/**
 * Executes a database operation and normalizes error handling + logging.
 * @param operation Deferred database call that will be executed safely.
 * @param res Optional Express response to notify caller on failure.
 * @param operationName Logical name for observability.
 * @returns The database result or null when the call failed.
 */
export const safeDbOperation = async <TResult>(
  operation: () => Promise<TResult>,
  res: Response | null,
  operationName: string
): Promise<TResult | null> => {
  logger.logDebug('safeDbOperation executing', { operationName });
  try {
    const result = await operation();
    logger.logDebug('safeDbOperation completed successfully', { operationName });
    return result;
  } catch (error) {
    qerrors.qerrors(error as Error, 'database-utils.safeDbOperation', {
      operationName,
      hasResponse: res !== null,
    });
    logger.error('safeDbOperation failed', {
      operationName,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    handleMongoError(error, res ?? null, operationName);
    return null;
  }
};

/**
 * Retries an operation with exponential backoff, throwing the final error if all attempts fail.
 * @param operation Operation to execute.
 * @param maxRetries Maximum number of retries (default 3).
 * @param delay Initial delay between attempts in milliseconds (default 1000).
 * @returns The successful result of the operation.
 */
export const retryDbOperation = async <TResult>(
  operation: () => Promise<TResult>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<TResult> => {
  let lastError: Error = new Error('Unknown error');
  let activeConnection = null; // Track if operation has connections to cleanup

  try {
    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        logger.logDebug('retryDbOperation attempt', { attempt, maxRetries });
        const result = await operation();
        logger.logDebug('retryDbOperation succeeded', { attempt });
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        qerrors.qerrors(lastError, 'database-utils.retryDbOperation', {
          attempt,
          maxRetries,
          isFinalAttempt: attempt === maxRetries,
        });
        logger.warn('retryDbOperation attempt failed', {
          attempt,
          maxRetries,
          message: lastError.message,
        });
        if (attempt < maxRetries) {
          // Exponential backoff with jitter to prevent thundering herd
          const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
          const jitter = Math.random() * 0.1 * exponentialDelay;
          const totalDelay = exponentialDelay + jitter;
          logger.logDebug('retryDbOperation scheduling next attempt', { totalDelay });
          await new Promise(resolve => setTimeout(resolve, totalDelay));
        }
      }
    }
    throw lastError;
  } finally {
    // CRITICAL: Clean up any connections if operation has connection cleanup logic
    if (activeConnection) {
      // Add cleanup logic here if applicable to the operation
    }
  }
};

/**
 * Executes an idempotent operation by persisting the result behind an idempotency key.
 * @param model Backing model that stores idempotency records.
 * @param idempotencyKey Stable key provided by the caller.
 * @param operation Function to execute when no cached result is found.
 * @returns Either the cached result or the newly computed result.
 */
export const ensureIdempotency = async <TResult, TRecord extends IdempotencyRecord<TResult>>(
  model: Model<TRecord>,
  idempotencyKey: string,
  operation: () => Promise<TResult>
): Promise<TResult> => {
  logger.logDebug('ensureIdempotency checking key', { idempotencyKey });
  try {
    const existing = await model.findOne({ idempotencyKey }).exec();
    if (existing) {
      logger.logDebug('ensureIdempotency found cached result', { idempotencyKey });
      return existing.result;
    }
    logger.logDebug('ensureIdempotency executing new operation', { idempotencyKey });
    const result = await operation();
    await model.create({
      idempotencyKey,
      result,
      createdAt: new Date(),
    } as TRecord);
    logger.logDebug('ensureIdempotency stored new result', { idempotencyKey });
    return result;
  } catch (error) {
    qerrors.qerrors(error as Error, 'database-utils.ensureIdempotency', {
      idempotencyKey,
      operationType: typeof operation,
    });
    logger.error('ensureIdempotency operation failed', {
      idempotencyKey,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};

/**
 * Applies common read optimizations to a query (lean reads and reduced projection).
 * @param query Query instance that will be enhanced.
 * @returns Optimized query with lean + projection applied where relevant.
 */
export const optimizeQuery = <
  TResult,
  TSchema extends AnyDocumentShape,
  THelpers = unknown,
  TRawDocType extends AnyDocumentShape = TSchema,
>(
  query: QueryWithHelpers<TResult, HydratedDocument<TSchema>, THelpers, TRawDocType>
): QueryWithHelpers<TResult, HydratedDocument<TSchema>, THelpers, TRawDocType> => {
  logger.logDebug('optimizeQuery processing query');
  let optimizedQuery = query;
  if (typeof optimizedQuery.lean === 'function') {
    optimizedQuery = optimizedQuery.lean() as typeof optimizedQuery;
  }
  const options: QueryOptions<TSchema> = optimizedQuery.getOptions();
  if (!options.select && typeof optimizedQuery.select === 'function') {
    optimizedQuery = optimizedQuery.select('-__v') as typeof optimizedQuery;
  }
  logger.logDebug('optimizeQuery completed');
  return optimizedQuery;
};

interface AggregationStageDefinition {
  match?: PipelineStage.Match['$match'];
  group?: PipelineStage.Group['$group'];
  sort?: PipelineStage.Sort['$sort'];
  skip?: PipelineStage.Skip['$skip'];
  limit?: PipelineStage.Limit['$limit'];
  project?: PipelineStage.Project['$project'];
  lookup?: PipelineStage.Lookup['$lookup'];
  unwind?: PipelineStage.Unwind['$unwind'];
}

/**
 * Builds a validated aggregation pipeline from simplified stage descriptors.
 * @param stages Array of stage descriptors that will be expanded into pipeline stages.
 * @returns Fully formed aggregation pipeline ready for execution.
 */
export const createAggregationPipeline = (
  stages: AggregationStageDefinition[]
): PipelineStage[] => {
  logger.logDebug('createAggregationPipeline building pipeline', { stageCount: stages.length });
  const pipeline: PipelineStage[] = [];
  stages.forEach((stage, index) => {
    logger.logDebug('createAggregationPipeline processing stage', { index, stage });
    if (stage.match) {
      pipeline.push({ $match: stage.match });
    }
    if (stage.group) {
      pipeline.push({ $group: stage.group });
    }
    if (stage.sort) {
      pipeline.push({ $sort: stage.sort });
    }
    if (stage.skip !== undefined) {
      pipeline.push({ $skip: stage.skip });
    }
    if (stage.limit !== undefined) {
      pipeline.push({ $limit: stage.limit });
    }
    if (stage.project) {
      pipeline.push({ $project: stage.project });
    }
    if (stage.lookup) {
      pipeline.push({ $lookup: stage.lookup });
    }
    if (stage.unwind) {
      pipeline.push({ $unwind: stage.unwind });
    }
  });
  logger.logDebug('createAggregationPipeline completed', { pipelineLength: pipeline.length });
  return pipeline;
};

/**
 * Database index creation utility for optimizing query performance
 *
 * Creates essential database indexes to prevent full collection scans and
 * improve query performance for user-specific operations and common query patterns.
 */

/**
 * Index definition interface for database index creation
 *
 * Defines the structure of database index specifications including
 * field composition, uniqueness constraints, and index options.
 */
interface DatabaseIndexDefinition {
  fields: Record<string, 1 | -1>; // Field names with sort direction (1=ascending, -1=descending)
  unique?: boolean; // Whether to enforce uniqueness constraint
  sparse?: boolean; // Whether to create sparse index (only index documents with the field)
  background?: boolean; // Whether to create index in background (default: true for production)
}

/**
 * Create optimized database indexes for document collections
 *
 * This function creates essential indexes for user-specific queries and
 * common operations to prevent full collection scans and improve scalability.
 *
 * @param model - Mongoose model to create indexes on
 * @returns Promise<void> - Completes when all indexes are created
 *
 * @example
 * await createDocumentIndexes(UserDocumentModel);
 * // Creates indexes for user field, user+createdAt, user+title combinations
 */
export const createDocumentIndexes = async <TSchema extends AnyDocumentShape>(
  model: Model<TSchema>
): Promise<void> => {
  try {
    logger.logDebug('createDocumentIndexes starting index creation', {
      modelName: model.modelName,
    });

    // Essential indexes for user-specific queries
    const indexes: DatabaseIndexDefinition[] = [
      // Primary user index for filtering documents by user
      {
        fields: { user: 1 },
        background: true,
      },

      // Compound index for user + creation date sorting (common pagination pattern)
      {
        fields: { user: 1, createdAt: -1 },
        background: true,
      },

      // Compound index for user + last update sorting (recent activity queries)
      {
        fields: { user: 1, updatedAt: -1 },
        background: true,
      },

      // Unique constraint for user + title combinations (if applicable)
      {
        fields: { user: 1, title: 1 },
        unique: true,
        sparse: true, // Only index documents that have both fields
        background: true,
      },
    ];

    // Create indexes in parallel for better performance
    await Promise.all(
      indexes.map(async (indexDef, index) => {
        try {
          await model.collection.createIndex(indexDef.fields, {
            unique: indexDef.unique,
            sparse: indexDef.sparse,
            background: indexDef.background,
          });
          logger.logDebug('createDocumentIndexes index created', {
            modelName: model.modelName,
            indexNumber: index + 1,
            fields: Object.keys(indexDef.fields),
            unique: indexDef.unique,
          });
        } catch (indexError) {
          // Log error but don't fail - index might already exist
          logger.warn('createDocumentIndexes index creation failed', {
            modelName: model.modelName,
            indexNumber: index + 1,
            fields: Object.keys(indexDef.fields),
            error: indexError instanceof Error ? indexError.message : String(indexError),
          });
        }
      })
    );

    logger.logDebug('createDocumentIndexes completed successfully', { modelName: model.modelName });
  } catch (error) {
    logger.error('createDocumentIndexes failed', {
      modelName: model.modelName,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
