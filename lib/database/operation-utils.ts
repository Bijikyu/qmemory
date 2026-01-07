/**
 * Database Operation Utilities
 *
 * Handles safe database operations with retry logic and error handling.
 * Single Responsibility: Database operation execution and error management
 */

import type { Response } from 'express';
import type { MongoServerError } from 'mongodb';
import { sendInternalServerError, sendValidationError } from '../http-utils.js';
import { createModuleUtilities } from '../common-patterns.js';
import { handleMongoError } from './validation-utils.js';

const utils = createModuleUtilities('database-operations');

export type AnyDocumentShape = Record<string, unknown>;

export interface IdempotencyRecord<TResult> extends AnyDocumentShape {
  idempotencyKey: string;
  result: TResult;
  createdAt: Date;
}

/**
 * Wraps database operations with comprehensive error handling
 * @param operation Database operation to execute
 * @param operationName Name of operation for logging
 * @param res Express response for error handling
 * @returns Operation result or null on error
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
        const result = await operation();
        utils
          .getFunctionLogger('safeDbOperation')
          .debug('completed successfully', { operationName });
        return result;
      },
      operationName,
      { operationName, hasResponse: res !== null }
    )
    .catch(error => {
      handleMongoError(error, res, operationName);
      return null;
    });
};

/**
 * Retries database operations with exponential backoff
 * @param operation Database operation to retry
 * @param operationName Name of operation for logging
 * @param maxRetries Maximum number of retry attempts
 * @param baseDelay Base delay in milliseconds
 * @returns Operation result or null on failure
 */
export const retryDbOperation = async <TResult>(
  operation: () => Promise<TResult>,
  operationName: string,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<TResult | null> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      utils.debugLog(`Attempt ${attempt}/${maxRetries} for ${operationName}`);
      const result = await operation();
      if (attempt > 1) {
        utils.debugLog(`Operation succeeded after ${attempt - 1} retries: ${operationName}`);
      }
      return result;
    } catch (error) {
      lastError = error as Error;
      utils.debugLog(`Attempt ${attempt} failed: ${operationName}`, {
        error: error.message,
        attempt,
      });

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        utils.debugLog(`Retrying in ${delay}ms for ${operationName}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  utils.debugLog(`All ${maxRetries} attempts failed for ${operationName}`, {
    error: lastError?.message,
  });

  if (lastError) {
    handleMongoError(lastError, null, operationName);
  }

  return null;
};

/**
 * Ensures idempotent operations to prevent duplicate executions
 * @param model Mongoose model
 * @param idempotencyKey Unique key for the operation
 * @param operation Operation to execute idempotently
 * @param ttl Time-to-live for idempotency records (default: 1 hour)
 * @returns Operation result or null on error
 */
export const ensureIdempotency = async <TResult>(
  model: any,
  idempotencyKey: string,
  operation: () => Promise<IdempotencyRecord<TResult>>,
  ttlMs: number = 3600000 // 1 hour
): Promise<TResult | null> => {
  return utils.safeAsync(
    async () => {
      utils.getFunctionLogger('ensureIdempotency').debug('checking', { idempotencyKey });

      // Check for existing idempotency record
      const existingRecord = await model.findOne({
        idempotencyKey,
        createdAt: { $gt: new Date(Date.now() - ttlMs) },
      });

      if (existingRecord) {
        utils.debugLog('Found existing idempotency record, returning cached result', {
          idempotencyKey,
        });
        return existingRecord.result;
      }

      // Execute the operation
      utils.debugLog('Executing new operation for idempotency', { idempotencyKey });
      const result = await operation();

      // Store the result for idempotency
      const idempotencyRecord: IdempotencyRecord<TResult> = {
        idempotencyKey,
        result: result as any,
        createdAt: new Date(),
      };

      await model.create(idempotencyRecord);
      utils.debugLog('Stored idempotency record', { idempotencyKey });

      return result;
    },
    'ensureIdempotency',
    { idempotencyKey, ttlMs }
  );
};
