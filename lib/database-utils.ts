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
import { ensureMongoDB } from './database/connection-utils.js';
import { ensureMongoDB } from './database/connection-utils.js';

const utils = createModuleUtilities('database-utils');

type AnyDocumentShape = Record<string, unknown>;

export interface IdempotencyRecord<TResult> extends AnyDocumentShape {
  idempotencyKey: string;
  result: TResult;
  createdAt: Date;
}

// Simple database error handling (refactored from validation-utils)
const handleMongoDuplicateError = (
  error: unknown,
  res: Response | null,
  customMessage?: string
): boolean => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as any).code === 11000
  ) {
    if (res) {
      const field = Object.keys((error as any).keyPattern ?? {})[0];
      const message = customMessage || `Duplicate value for field: ${field ?? 'unknown'}`;
      sendConflict(res, message);
    }
    return true;
  }
  return false;
};

export { ensureUnique } from './database/validation-utils.js';

/**
 * Handle MongoDB duplicate key error (code 11000)
 * Extracts common pattern used across multiple error handling functions
 */
export const handleMongoDuplicateError = (
  error: unknown,
  res: Response | null,
  customMessage?: string
): boolean => {
  if (isMongoServerError(error) && error.code === 11000) {
    if (res) {
      const field = Object.keys(
        (error as MongoServerError & { keyPattern?: Record<string, number> }).keyPattern ?? {}
      )[0];
      const message = customMessage || `Duplicate value for field: ${field ?? 'unknown'}`;
      sendConflict(res, message);
    }
    return true;
  }
  return false;
};

export const handleMongoError = (error: unknown, res: Response | null, operation: string): void => {
  utils.logError(error as Error, 'handleMongoError', {
    operation,
    isMongoServerError: isMongoServerError(error),
    errorCode: isMongoServerError(error) ? error.code : undefined,
    hasResponse: res !== null,
  });

  utils.debugLog('MongoDB error during operation', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    operation,
    code: isMongoServerError(error) ? error.code : undefined,
  });

  if (!res) return;

  // Handle duplicate key error using extracted helper
  if (handleMongoDuplicateError(error, res)) {
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

  sendInternalServerError(res, 'Database error during operation');
};

export const safeDbOperation = async <TResult>(
  operation: () => Promise<TResult>,
  operationName: string,
  res: Response | null = null
): Promise<TResult | null> => {
  return utils
    .safeAsync(
      async () => {
        utils.getFunctionLogger('safeDbOperation').debug('executing', { operationName });

        // Add timeout to prevent hanging operations (Scalability Fix #1)
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error(`Database operation timeout: ${operationName}`)),
            30000
          );
        });

        const result = await Promise.race([operation(), timeoutPromise]);
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
      handleMongoError(error, res, operationName);
      return null;
    });
};

export const retryDbOperation = async <TResult>(
  operation: () => Promise<TResult>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<TResult> => {
  return utils.safeAsync(
    async () => {
      let lastError: Error = new Error('Unknown error');
      let activeConnection = null;

      try {
        for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
          try {
            utils.getFunctionLogger('retryDbOperation').debug('attempt', { attempt, maxRetries });
            const result = await operation();
            utils.getFunctionLogger('retryDbOperation').debug('succeeded', { attempt });
            return result;
          } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
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
            if (attempt < maxRetries) {
              const totalDelay = calculateBackoffDelay(baseDelay, attempt, 60000);
              utils.debugLog('retryDbOperation scheduling next attempt', { totalDelay });
              await safeDelay(totalDelay);
            }
          }
        }
        throw lastError;
      } finally {
        if (activeConnection) {
        }
      }
    },
    'retryDbOperation',
    { maxRetries, baseDelay }
  );
};

export const ensureIdempotency = async <TResult, TRecord extends IdempotencyRecord<TResult>>(
  model: Model<TRecord>,
  idempotencyKey: string,
  operation: () => Promise<TResult>
): Promise<TResult> => {
  return utils.safeAsync(
    async () => {
      utils.getFunctionLogger('ensureIdempotency').debug('checking key', { idempotencyKey });
      const existing = await model.findOne({ idempotencyKey }).exec();
      if (existing) {
        utils
          .getFunctionLogger('ensureIdempotency')
          .debug('found cached result', { idempotencyKey });
        return existing.result;
      }
      utils
        .getFunctionLogger('ensureIdempotency')
        .debug('executing new operation', { idempotencyKey });
      const result = await operation();
      await model.create({ idempotencyKey, result, createdAt: new Date() } as TRecord);
      utils.getFunctionLogger('ensureIdempotency').debug('stored new result', { idempotencyKey });
      return result;
    },
    'ensureIdempotency',
    { idempotencyKey, operationType: typeof operation }
  );
};

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
    if (typeof optimizedQuery.lean === 'function') {
      optimizedQuery = optimizedQuery.lean() as typeof optimizedQuery;
    }
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

export const createAggregationPipeline = (
  stages: AggregationStageDefinition[]
): PipelineStage[] => {
  return utils.safeSync(
    () => {
      utils.debugLog('createAggregationPipeline building pipeline', { stageCount: stages.length });
      const pipeline: PipelineStage[] = [];
      stages.forEach((stage, index) => {
        utils.debugLog('createAggregationPipeline processing stage', { index, stage });
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

interface DatabaseIndexDefinition {
  fields: Record<string, 1 | -1>;
  unique?: boolean;
  sparse?: boolean;
  background?: boolean;
}

export const createDocumentIndexes = async <TSchema extends AnyDocumentShape>(
  model: Model<TSchema>
): Promise<void> => {
  return utils.safeAsync(
    async () => {
      utils.debugLog('createDocumentIndexes starting index creation', {
        modelName: model.modelName,
      });

      const indexes: DatabaseIndexDefinition[] = [
        { fields: { user: 1 }, background: true },
        { fields: { user: 1, createdAt: -1 }, background: true },
        { fields: { user: 1, updatedAt: -1 }, background: true },
        { fields: { user: 1, title: 1 }, unique: true, sparse: true, background: true },
      ];

      await Promise.all(
        indexes.map(async (indexDef, index) => {
          try {
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
