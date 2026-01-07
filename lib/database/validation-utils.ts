/**
 * Database Validation Utilities
 *
 * Handles uniqueness validation and duplicate key errors.
 * Single Responsibility: Data validation and conflict resolution
 */

import type { Response } from 'express';
import type { MongoServerError } from 'mongodb';
import { sendConflict, sendValidationError } from '../http-utils.js';
import { createModuleUtilities } from '../common-patterns.js';

const utils = createModuleUtilities('database-validation');

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

/**
 * Ensures a document is unique before creation/update
 * @param model Mongoose model to check
 * @param query Query to find existing document
 * @param res Express response for error handling
 * @param duplicateMsg Custom duplicate message
 * @returns True if unique, false if duplicate exists
 */
export const ensureUnique = async <TSchema extends Record<string, unknown>>(
  model: any,
  query: any,
  res: Response,
  duplicateMsg?: string
): Promise<boolean> => {
  return (
    utils.safeAsync(
      async () => {
        utils.getFunctionLogger('ensureUnique').debug('is running', { query });
        const existingDoc = await model.exists(query);
        if (existingDoc) {
          const duplicateId = String(existingDoc._id);
          utils.debugLog('Duplicate document detected during ensureUnique', { query, duplicateId });
          sendConflict(res, duplicateMsg ?? 'Resource already exists');
          return false;
        }
        utils.debugLog('ensureUnique completed without detecting duplicates');
        return true;
      },
      'ensureUnique',
      { queryKeys: Object.keys(query) }
    ) || false
  );
};

/**
 * Handles MongoDB duplicate key error (code 11000)
 * @param error Error object to check
 * @param res Express response for error handling
 * @param customMessage Custom error message
 * @returns True if duplicate error handled, false otherwise
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

/**
 * Handles various MongoDB error types with appropriate HTTP responses
 * @param error Error object to handle
 * @param res Express response for error handling
 * @param operation Operation name for context
 */
export const handleMongoError = (error: unknown, res: Response | null, operation: string): void => {
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

  // Handle validation errors
  if (isValidationError(error)) {
    sendValidationError(res, error.errors || {});
    return;
  }

  // Handle cast errors
  if (isCastError(error)) {
    sendValidationError(res, 'Invalid data format or type conversion failed');
    return;
  }

  // Handle other server errors
  if (isMongoServerError(error)) {
    utils.debugLog('MongoDB server error detected', {
      code: error.code,
      message: error.message,
    });
    sendValidationError(res, `Database operation failed: ${error.message}`);
    return;
  }

  // Handle unknown errors
  utils.debugLog('Unknown MongoDB error', { error });
  sendValidationError(res, 'An unexpected database error occurred');
};
