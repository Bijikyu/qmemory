/**
 * Database Utility Functions
 * MongoDB and Mongoose helper functions
 */

// 🚩AI: ENTRY_POINT_FOR_DATABASE_OPERATIONS

const mongoose = require('mongoose');
const { sendServiceUnavailable, sendInternalServerError, sendConflict } = require('./http-utils');
const { logger } = require('./logging-utils');

// 🚩AI: MUST_UPDATE_IF_MONGOOSE_CONNECTION_PATTERN_CHANGES
const ensureMongoDB = (res) => {
  logger.logDebug('ensureMongoDB is running');
  logger.logDebug(`Checking database availability - connection state: ${mongoose.connection.readyState}`); // mongoose connection state check
  try {
    return mongoose.connection.readyState === 1 ?
      (logger.logDebug('Database check passed - connection ready'), logger.logDebug('ensureMongoDB is returning true'), true) :
      (sendServiceUnavailable(res, 'Database functionality unavailable'), logger.warn('Database check failed - connection not ready'), logger.logDebug('ensureMongoDB is returning false'), false);
  } catch (error) {
    logger.error('Database availability check error', { message: error.message, stack: error.stack });
    sendInternalServerError(res, 'Error checking database connection');
    logger.logDebug('ensureMongoDB is returning false');
    return false;
  }
};

const ensureUnique = async (model, query, res, duplicateMsg) => {
  logger.logDebug('ensureUnique is running');
  logger.logDebug(`ensureUnique is checking query: ${JSON.stringify(query)}`);
  try {
    const existing = await model.findOne(query);
    return existing ?
      (sendConflict(res, duplicateMsg), logger.info('ensureUnique found duplicate', { query }), logger.logDebug('ensureUnique is returning false'), false) :
      (logger.logDebug('ensureUnique passed - no duplicates'), logger.logDebug('ensureUnique is returning true'), true);
  } catch (error) {
    logger.error('ensureUnique error', { message: error.message, stack: error.stack });
    throw error;
  }
};

const handleMongoError = (error, operation, context = {}) => {
    const errorInfo = { operation, context, timestamp: new Date().toISOString(), errorCode: error.code, errorMessage: error.message };
    logger.logDebug(`handleMongoError processing error for operation: ${operation}`);
    logger.logDebug(`Error details: ${JSON.stringify(errorInfo)}`);

    if (error.code === 11000) {
        const duplicateKeyInfo = { ...errorInfo, type: 'DUPLICATE_KEY_ERROR', severity: 'medium', recoverable: true, keyValue: error.keyValue || 'unknown' };
        logger.warn('Duplicate key error in database operation', duplicateKeyInfo);
        logger.logDebug(`[QERRORS] Duplicate key error in ${operation} ${JSON.stringify(context)}`);
        return { type: 'DUPLICATE_KEY_ERROR', message: 'Resource already exists', recoverable: true, statusCode: 409, details: error.keyValue };
    }

    if (error.name === 'ValidationError') {
        const validationInfo = { ...errorInfo, type: 'VALIDATION_ERROR', severity: 'low', recoverable: true, validationErrors: Object.keys(error.errors || {}) };
        logger.warn('Database validation error', validationInfo);
        logger.logDebug(`[QERRORS] Validation error in ${operation} ${JSON.stringify(context)}`);
        return { type: 'VALIDATION_ERROR', message: 'Data validation failed', details: error.errors, recoverable: true, statusCode: 400 };
    }

    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerError') {
        const connectionInfo = { ...errorInfo, type: 'CONNECTION_ERROR', severity: 'high', recoverable: false };
        logger.error('Database connection error', connectionInfo);
        logger.logDebug(`[QERRORS] Connection error in ${operation} ${JSON.stringify(context)}`);
        return { type: 'CONNECTION_ERROR', message: 'Database connection failed', recoverable: false, statusCode: 503 };
    }

    if (error.name === 'MongoServerSelectionError' || error.message.includes('timeout')) {
        const timeoutInfo = { ...errorInfo, type: 'TIMEOUT_ERROR', severity: 'high', recoverable: true };
        logger.error('Database timeout error', timeoutInfo);
        logger.logDebug(`[QERRORS] Timeout error in ${operation} ${JSON.stringify(context)}`);
        return { type: 'TIMEOUT_ERROR', message: 'Database operation timed out', recoverable: true, statusCode: 504 };
    }

    const unknownInfo = { ...errorInfo, type: 'UNKNOWN_ERROR', severity: 'high', recoverable: false };
    logger.error('Unknown database error', unknownInfo);
    logger.logDebug(`[QERRORS] Unknown error in ${operation} ${JSON.stringify(context)}`);
    return { type: 'UNKNOWN_ERROR', message: 'Database operation failed', recoverable: false, statusCode: 500 };
};

const safeDbOperation = async (operation, operationName, context = {}) => {
    const startTime = Date.now();
    logger.logDebug(`safeDbOperation starting: ${operationName}`);
    logger.logDebug(`Operation context: ${JSON.stringify(context)}`);
    
    try {
        const result = await operation();
        const processingTime = Date.now() - startTime;
        logger.logDebug(`Database operation completed: ${operationName}`, { operation: operationName, processingTime, context, success: true });
        return { success: true, data: result, processingTime };
    } catch (error) {
        const processingTime = Date.now() - startTime, errorResult = handleMongoError(error, operationName, context);
        logger.error(`Database operation failed: ${operationName}`, { operation: operationName, processingTime, context, error: errorResult });
        return { success: false, error: errorResult, processingTime };
    }
};

const retryDbOperation = async (operation, operationName, options = {}) => {
    const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000, retryCondition = (error) => error.recoverable, context = {} } = options;
    logger.logDebug(`retryDbOperation starting: ${operationName} with max retries: ${maxRetries}`);
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        logger.logDebug(`Attempting database operation: ${operationName}, attempt ${attempt}`);
        const result = await safeDbOperation(operation, operationName, { ...context, attempt });
        
        if (result.success) {
            attempt > 1 && logger.info(`Database operation succeeded after retry: ${operationName}`, { operation: operationName, attempt, context });
            return result;
        }
        
        lastError = result.error;
        
        if (!retryCondition(result.error) || attempt > maxRetries) {
            logger.info(`Retry limit reached or error not recoverable for: ${operationName}`);
            break;
        }
        
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        logger.warn(`Database operation failed, retrying: ${operationName}`, { operation: operationName, attempt, nextRetryIn: delay, error: result.error.type, context });
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    return { success: false, error: lastError };
};

const ensureIdempotency = async (model, idempotencyKey, operation, operationName) => {
    const context = { idempotencyKey: `${idempotencyKey.field}=${idempotencyKey.value}`, model: model.modelName };
    logger.logDebug(`ensureIdempotency checking for operation: ${operationName}`);
    logger.logDebug(`Idempotency context: ${JSON.stringify(context)}`);
    
    const existingRecord = await safeDbOperation(() => model.findOne({ [idempotencyKey.field]: idempotencyKey.value }), `${operationName}_idempotency_check`, context);
    
    if (!existingRecord.success) return existingRecord;
    
    if (existingRecord.data) {
        logger.info(`Idempotent operation detected for: ${operationName}`, { operation: operationName, existingId: existingRecord.data._id, context });
        return { success: true, data: existingRecord.data, idempotent: true };
    }
    
    const result = await safeDbOperation(operation, operationName, context);
    
    if (!result.success && result.error.type === 'DUPLICATE_KEY_ERROR') {
        logger.info(`Race condition detected for: ${operationName}, fetching existing record`);
        const raceResult = await safeDbOperation(() => model.findOne({ [idempotencyKey.field]: idempotencyKey.value }), `${operationName}_race_recovery`, context);
        if (raceResult.success && raceResult.data) return { success: true, data: raceResult.data, idempotent: true, raceCondition: true };
    }
    
    return result;
};

const optimizeQuery = (baseQuery, options = {}) => {
    const { lean = true, select = null, limit = null, skip = null, sort = null, populate = null, hint = null } = options;
    logger.logDebug('optimizeQuery applying optimizations:', { lean, hasSelect: !!select, hasLimit: !!limit, hasSkip: !!skip, hasSort: !!sort, hasPopulate: !!populate, hasHint: !!hint });
    let query = baseQuery;
    
    lean && (query = query.lean());
    select && (query = query.select(select));
    limit && (query = query.limit(limit));
    skip && (query = query.skip(skip));
    sort && (query = query.sort(sort));
    populate && (query = query.populate(populate));
    hint && (query = query.hint(hint));
    
    logger.logDebug('optimizeQuery optimizations applied successfully');
    return query;
};

const createAggregationPipeline = (stages = []) => {
    logger.logDebug(`createAggregationPipeline building pipeline with ${stages.length} stages`);
    const pipeline = [];
    
    stages.forEach((stage, index) => {
        logger.logDebug(`Processing pipeline stage ${index + 1}: ${Object.keys(stage)}`);
        stage.match && pipeline.push({ $match: stage.match });
        stage.group && pipeline.push({ $group: stage.group });
        stage.sort && pipeline.push({ $sort: stage.sort });
        stage.limit && pipeline.push({ $limit: stage.limit });
        stage.project && pipeline.push({ $project: stage.project });
        stage.lookup && pipeline.push({ $lookup: stage.lookup });
        stage.unwind && pipeline.push({ $unwind: stage.unwind });
    });
    
    logger.logDebug(`createAggregationPipeline completed with ${pipeline.length} pipeline stages`);
    return pipeline;
};

module.exports = {
  ensureMongoDB,
  ensureUnique,
  handleMongoError,
  safeDbOperation,
  retryDbOperation,
  ensureIdempotency,
  optimizeQuery,
  createAggregationPipeline
};