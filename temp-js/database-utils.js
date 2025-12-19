/**
 * Database Utility Functions
 * MongoDB and Mongoose helper functions
 */
// 🚩AI: ENTRY_POINT_FOR_DATABASE_OPERATIONS
import mongoose, { Model, Document, Types } from 'mongoose';
import { Response } from 'express';
import {
  sendServiceUnavailable,
  sendInternalServerError,
  sendConflict,
  sendValidationError,
} from './http-utils.js';

// Type definitions
interface Logger {
  logDebug(message: string): void;
  warn(message: string): void;
  error(message: string, data?: any): void;
}

// Simple logger implementation
const logger: Logger = {
  logDebug: (message: string) => console.log(`DEBUG: ${message}`),
  warn: (message: string) => console.warn(`WARN: ${message}`),
  error: (message: string, data?: any) => console.error(`ERROR: ${message}`, data || ''),
};
// 🚩AI: MUST_UPDATE_IF_MONGOOSE_CONNECTION_PATTERN_CHANGES
const ensureMongoDB = (res: Response): boolean => {
  logger.logDebug('ensureMongoDB is running');
  logger.logDebug(
    `Checking database availability - connection state: ${mongoose.connection.readyState}`
  ); // mongoose connection state check
  try {
    return mongoose.connection.readyState === 1
      ? (logger.logDebug('Database check passed - connection ready'),
        logger.logDebug('ensureMongoDB is returning true'),
        true)
      : (sendServiceUnavailable(res, 'Database functionality unavailable'),
        logger.warn('Database check failed - connection not ready'),
        logger.logDebug('ensureMongoDB is returning false'),
        false);
  } catch (error) {
    logger.error('Database availability check error', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    sendInternalServerError(res, 'Error checking database connection');
    logger.logDebug('ensureMongoDB is returning false');
    return false;
  }
};
const ensureUnique = async (
  model: Model<any>,
  query: any,
  res: Response,
  duplicateMsg?: string
): Promise<boolean> => {
  logger.logDebug('ensureUnique is running');
  logger.logDebug(`ensureUnique is checking query: ${JSON.stringify(query)}`);
  try {
    const existingDoc = await model.findOne(query).lean();
    logger.logDebug(`ensureUnique found existing document: ${!!existingDoc}`);
    if (existingDoc) {
      logger.warn(
        `Duplicate document detected - query: ${JSON.stringify(query)}, existingId: ${existingDoc._id}`
      );
      sendConflict(res, duplicateMsg || 'Resource already exists');
      return false;
    }
    logger.logDebug('ensureUnique check passed - no duplicates found');
    return true;
  } catch (error) {
    logger.error('Error checking document uniqueness', {
      query,
      error: error.message,
      stack: error.stack,
    });
    sendInternalServerError(res, 'Error checking document uniqueness');
    return false;
  }
};
const handleMongoError = (error, res, operation) => {
  logger.error(`MongoDB error during ${operation}`, {
    error: error.message,
    stack: error.stack,
    operation,
    code: error.code,
  });
  // Handle specific MongoDB errors
  if (error.code === 11000) {
    // Duplicate key error
    const field = Object.keys(error.keyPattern || {})[0];
    sendConflict(res, `Duplicate value for field: ${field}`);
  } else if (error.name === 'ValidationError') {
    // Mongoose validation error
    const messages = Object.values(error.errors).map(err => err.message);
    sendValidationError(res, 'Validation failed', messages);
  } else if (error.name === 'CastError') {
    // Invalid ObjectId format
    sendValidationError(res, 'Invalid ID format');
  } else {
    // Generic error
    sendInternalServerError(res, `Database error during ${operation}`);
  }
};
const safeDbOperation = async (operation, res, operationName) => {
  logger.logDebug(`safeDbOperation executing: ${operationName}`);
  try {
    const result = await operation();
    logger.logDebug(`safeDbOperation completed successfully: ${operationName}`);
    return result;
  } catch (error) {
    logger.error(
      `safeDbOperation failed: ${operationName} - error: ${error.message}, stack: ${error.stack}`
    );
    handleMongoError(error, res, operationName);
    return null;
  }
};
const retryDbOperation = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError = new Error('Unknown error');
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.logDebug(`retryDbOperation attempt ${attempt}/${maxRetries}`);
      const result = await operation();
      logger.logDebug(`retryDbOperation succeeded on attempt ${attempt}`);
      return result;
    } catch (error) {
      lastError = error;
      logger.warn(
        `retryDbOperation attempt ${attempt} failed - error: ${lastError.message}, attempt: ${attempt}, maxRetries: ${maxRetries}`
      );
      if (attempt < maxRetries) {
        logger.logDebug(`retryDbOperation waiting ${delay}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  logger.error(
    `retryDbOperation failed after ${maxRetries} attempts - error: ${lastError.message}, stack: ${lastError.stack}`
  );
  throw lastError;
};
const ensureIdempotency = async (model, idempotencyKey, operation) => {
  logger.logDebug(`ensureIdempotency checking key: ${idempotencyKey}`);
  try {
    // Check if operation with this key already exists
    const existing = await model.findOne({ idempotencyKey }).lean();
    if (existing) {
      logger.logDebug(`ensureIdempotency found existing operation for key: ${idempotencyKey}`);
      return existing.result;
    }
    // Execute the operation
    logger.logDebug(`ensureIdempotency executing new operation for key: ${idempotencyKey}`);
    const result = await operation();
    // Store the result for idempotency
    await model.create({
      idempotencyKey,
      result,
      createdAt: new Date(),
    });
    logger.logDebug(`ensureIdempotency stored result for key: ${idempotencyKey}`);
    return result;
  } catch (error) {
    logger.error(
      `ensureIdempotency operation failed - idempotencyKey: ${idempotencyKey}, error: ${error.message}, stack: ${error.stack}`
    );
    throw error;
  }
};
const optimizeQuery = query => {
  logger.logDebug('optimizeQuery processing query');
  // Add lean() for better performance on read operations
  if (typeof query.lean === 'function') {
    query = query.lean();
  }
  // Add select() to limit fields if not already specified
  if (!query.getOptions().select && typeof query.select === 'function') {
    query = query.select('-__v');
  }
  logger.logDebug('optimizeQuery completed');
  return query;
};
const createAggregationPipeline = stages => {
  logger.logDebug(`createAggregationPipeline building pipeline with ${stages.length} stages`);
  const pipeline = [];
  stages.forEach((stage, index) => {
    logger.logDebug(`Processing pipeline stage ${index}: ${JSON.stringify(stage)}`);
    // Add common stages with validation
    if (stage.match) {
      pipeline.push({ $match: stage.match });
    }
    if (stage.group) {
      pipeline.push({ $group: stage.group });
    }
    if (stage.sort) {
      pipeline.push({ $sort: stage.sort });
    }
    if (stage.skip) {
      pipeline.push({ $skip: stage.skip });
    }
    if (stage.limit) {
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
  logger.logDebug(`createAggregationPipeline completed with ${pipeline.length} pipeline stages`);
  return pipeline;
};
export {
  ensureMongoDB,
  ensureUnique,
  handleMongoError,
  safeDbOperation,
  retryDbOperation,
  ensureIdempotency,
  optimizeQuery,
  createAggregationPipeline,
};
