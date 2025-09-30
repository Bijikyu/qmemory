/**
 * Database Utility Functions
 * MongoDB and Mongoose helper functions
 * 
 * This module provides essential database connectivity and validation utilities
 * that ensure robust database operations throughout the application. These functions
 * implement defensive programming principles by validating database state before
 * operations and providing consistent error handling patterns.
 * 
 * Key design principles:
 * - Fail fast: Check database connectivity before attempting operations
 * - Consistent error responses: Standardize HTTP responses for database issues
 * - Separation of concerns: Keep database validation separate from business logic
 * - Graceful degradation: Provide meaningful errors when database is unavailable
 * 
 * These utilities are particularly important in cloud environments where database
 * connectivity can be intermittent, and in development environments where the
 * database might not always be running.
 */

// Mongoose provides the connection state monitoring we need for database validation
const mongoose = require('mongoose'); // access connection state
const { sendServiceUnavailable, sendInternalServerError, sendConflict } = require('./http-utils'); // HTTP response helpers
const { logger } = require('./qgenutils-wrapper');

/**
 * Database availability validation utility
 * 
 * This function checks the MongoDB connection state before allowing operations
 * that require database access. It provides graceful degradation by responding
 * with appropriate HTTP errors when the database is unavailable.
 * 
 * Connection state validation: Uses Mongoose connection readyState to determine
 * if the database is ready for operations. State 1 indicates a successful
 * connection, while other states represent disconnected, connecting, or error states.
 * 
 * Design rationale: Prevents database operations from failing with unclear errors
 * by checking connectivity upfront. This approach provides better user experience
 * and clearer error messages when database issues occur.
 * 
 * Error handling strategy: Sends appropriate HTTP status codes (503 for service
 * unavailable, 500 for unexpected errors) to inform clients about the specific
 * nature of the database issue.
 * 
 * Alternative approaches considered:
 * - Ping the database: More thorough but adds latency to every request
 * - Middleware approach: Would require Express integration, reducing flexibility
 * - Connection pooling checks: More complex and may not be necessary for simple cases
 * 
 * Trade-offs:
 * - Performance: Fast check using existing connection state vs. actual database ping
 * - Accuracy: Connection state might be stale, but actual operations will catch real issues
 * - Simplicity: Simple boolean return allows easy integration into existing code
 * 
 * @param {Object} res - Express response object for sending database error responses
 * @returns {boolean} Boolean indicating whether database is available for operations
 * 
 * Side effects: Sends HTTP error responses when database is unavailable
 * Usage pattern: Controllers should check this before database operations
 */
function ensureMongoDB(res) {
  logger.debug('ensureMongoDB is running'); // entry log for tracing calls
  
  // Log current connection state for debugging and monitoring purposes
  // readyState values: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  // This logging is crucial for diagnosing connectivity issues in cloud environments
  logger.debug(`Checking database availability - connection state: ${mongoose.connection.readyState}`); // records state for debugging

  try {
    // Check if MongoDB connection is in ready state (1 = connected)
    // We use readyState !== 1 instead of === 0 to catch all non-ready states
    // This is a fast, non-blocking check that uses existing connection information
    if (mongoose.connection.readyState !== 1) { // quick readyState check over ping prioritizes speed but may miss stale connections
      sendServiceUnavailable(res, 'Database functionality unavailable'); // send 503 when DB not ready
      logger.warn('Database check failed - connection not ready'); // log failure path
      logger.debug('ensureMongoDB is returning false'); // trace unsuccessful return
      return false; // stop DB operations when connection not ready
    }

    logger.debug('Database check passed - connection ready'); // log success path
    logger.debug('ensureMongoDB is returning true'); // trace successful return
    return true; // allow calling code to use DB
  } catch (error) {
    logger.error('Database availability check error', { message: error.message, stack: error.stack }); // log unexpected failure

    sendInternalServerError(res, 'Error checking database connection'); // respond with 500 on check error
    logger.debug('ensureMongoDB is returning false'); // trace error return
    return false; // fail safe when check throws
  }
}

/**
 * Document uniqueness validation utility
 * 
 * This function checks if a document matching the given query already exists
 * in the database, preventing duplicate records and enforcing business rules.
 * It's commonly used before creating new documents or updating existing ones
 * where uniqueness constraints need to be maintained.
 * 
 * Design rationale:
 * - Prevents race conditions by checking immediately before operations
 * - Provides consistent HTTP 409 Conflict responses for duplicate attempts
 * - Centralizes uniqueness logic to avoid duplication across controllers
 * - Returns boolean for easy integration into conditional logic
 * 
 * Performance considerations:
 * - Uses findOne() which stops at first match, more efficient than find()
 * - Query should include indexed fields for optimal performance
 * - Consider database-level unique constraints for critical uniqueness requirements
 * 
 * Race condition handling:
 * - This check + insert pattern has an inherent race condition window
 * - For critical uniqueness, consider using database unique indexes or upsert operations
 * - Current approach balances simplicity with adequate protection for most use cases
 * 
 * @param {Object} model - Mongoose model to query against
 * @param {Object} query - MongoDB query object to check for existing documents
 * @param {Object} res - Express response object for sending duplicate error responses
 * @param {string} duplicateMsg - Custom message to send when duplicate is found
 * @returns {Promise<boolean>} Promise resolving to true if unique, false if duplicate exists
 */
async function ensureUnique(model, query, res, duplicateMsg) {
  logger.debug('ensureUnique is running'); // entry log for uniqueness checks
  
  // Log the query for debugging and monitoring duplicate attempt patterns
  // JSON.stringify ensures complex queries are readable in logs for troubleshooting
  logger.debug(`ensureUnique is checking query: ${JSON.stringify(query)}`); // log query for audit

  try {
    // Use findOne for efficiency - we only need to know if ANY matching document exists
    // findOne() stops at first match, making it faster than find() which returns all matches
    // This is critical for performance when checking uniqueness in large collections
    const existing = await model.findOne(query); // fast check may race; index enforcement would be safer

    if (existing) {
      // Send 409 Conflict status code - the standard HTTP response for duplicate resource attempts
      // Use centralized HTTP utility for consistent conflict responses across all endpoints
      sendConflict(res, duplicateMsg); // respond 409 for duplicates
      logger.info('ensureUnique found duplicate', { query }); // log detection
      logger.debug('ensureUnique is returning false'); // trace duplicate return
      return false; // caller should abort create/update
    }

    logger.debug('ensureUnique passed - no duplicates'); // log success state
    logger.debug('ensureUnique is returning true'); // trace success return
    return true; // safe to continue with unique data
  } catch (error) {
    logger.error('ensureUnique error', { message: error.message, stack: error.stack }); // log DB error
    throw error; // let caller decide handling
  }
}

/**
 * MongoDB Error Handler
 * 
 * Centralizes MongoDB error handling logic for consistent error responses across the application.
 * This function consolidates error handling patterns and provides structured error classification
 * that integrates with the existing HTTP utilities for consistent API responses.
 * 
 * Error handling approach:
 * - Duplicate key errors (11000) indicate race conditions or retry scenarios
 * - Connection errors require different handling than validation errors
 * - Consistent error classification enables appropriate client responses
 * - Structured error logging supports debugging and monitoring
 * 
 * Integration with existing utilities:
 * - Uses existing HTTP response helpers for consistent status codes
 * - Maintains the same defensive programming patterns used throughout the library
 * - Follows the established logging conventions for debugging consistency
 * 
 * @param {Error} error - MongoDB error object
 * @param {string} operation - Name of the operation that failed
 * @param {Object} context - Additional context for error logging
 * @returns {Object} Structured error response with type, message, and status code
 */
function handleMongoError(error, operation, context = {}) {
    const errorInfo = {
        operation,
        context,
        timestamp: new Date().toISOString(),
        errorCode: error.code,
        errorMessage: error.message
    };

    logger.debug(`handleMongoError processing error for operation: ${operation}`);
    logger.debug(`Error details: ${JSON.stringify(errorInfo)}`);

    // Handle duplicate key errors (common in payment processing and user registration)
    if (error.code === 11000) {
        const duplicateKeyInfo = {
            ...errorInfo,
            type: 'DUPLICATE_KEY_ERROR',
            severity: 'medium',
            recoverable: true,
            keyValue: error.keyValue || 'unknown'
        };
        
        logger.warn('Duplicate key error in database operation', duplicateKeyInfo);
        logger.debug(`[QERRORS] Duplicate key error in ${operation} ${JSON.stringify(context)}`);
        
        return {
            type: 'DUPLICATE_KEY_ERROR',
            message: 'Resource already exists',
            recoverable: true,
            statusCode: 409,
            details: error.keyValue
        };
    }

    // Handle validation errors from Mongoose schema validation
    if (error.name === 'ValidationError') {
        const validationInfo = {
            ...errorInfo,
            type: 'VALIDATION_ERROR',
            severity: 'low',
            recoverable: true,
            validationErrors: Object.keys(error.errors || {})
        };
        
        logger.warn('Database validation error', validationInfo);
        logger.debug(`[QERRORS] Validation error in ${operation} ${JSON.stringify(context)}`);
        
        return {
            type: 'VALIDATION_ERROR',
            message: 'Data validation failed',
            details: error.errors,
            recoverable: true,
            statusCode: 400
        };
    }

    // Handle connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerError') {
        const connectionInfo = {
            ...errorInfo,
            type: 'CONNECTION_ERROR',
            severity: 'high',
            recoverable: false
        };
        
        logger.error('Database connection error', connectionInfo);
        logger.debug(`[QERRORS] Connection error in ${operation} ${JSON.stringify(context)}`);
        
        return {
            type: 'CONNECTION_ERROR',
            message: 'Database connection failed',
            recoverable: false,
            statusCode: 503
        };
    }

    // Handle timeout errors
    if (error.name === 'MongoServerSelectionError' || error.message.includes('timeout')) {
        const timeoutInfo = {
            ...errorInfo,
            type: 'TIMEOUT_ERROR',
            severity: 'high',
            recoverable: true
        };
        
        logger.error('Database timeout error', timeoutInfo);
        logger.debug(`[QERRORS] Timeout error in ${operation} ${JSON.stringify(context)}`);
        
        return {
            type: 'TIMEOUT_ERROR',
            message: 'Database operation timed out',
            recoverable: true,
            statusCode: 504
        };
    }

    // Handle unknown errors with fallback response
    const unknownInfo = {
        ...errorInfo,
        type: 'UNKNOWN_ERROR',
        severity: 'high',
        recoverable: false
    };
    
    logger.error('Unknown database error', unknownInfo);
    logger.debug(`[QERRORS] Unknown error in ${operation} ${JSON.stringify(context)}`);
    
    return {
        type: 'UNKNOWN_ERROR',
        message: 'Database operation failed',
        recoverable: false,
        statusCode: 500
    };
}

/**
 * Safe Database Operation Wrapper
 * 
 * Wraps database operations with consistent error handling, logging, and performance tracking.
 * This function consolidates try-catch patterns and integrates with the existing HTTP utilities
 * to provide uniform error responses across all database operations.
 * 
 * Design integration:
 * - Uses existing HTTP response helpers for consistent API responses
 * - Maintains the same logging patterns as other library modules
 * - Provides performance tracking capabilities that integrate with monitoring utilities
 * - Follows defensive programming principles used throughout the library
 * 
 * Performance tracking:
 * - Records operation timing for performance monitoring integration
 * - Logs operation success/failure for debugging and monitoring
 * - Provides structured response format for consistent error handling
 * 
 * @param {Function} operation - Async database operation to execute
 * @param {string} operationName - Name of the operation for logging
 * @param {Object} context - Additional context for logging and monitoring
 * @returns {Promise<Object>} Result object with success status, data/error, and timing
 */
async function safeDbOperation(operation, operationName, context = {}) {
    const startTime = Date.now();
    
    logger.debug(`safeDbOperation starting: ${operationName}`);
    logger.debug(`Operation context: ${JSON.stringify(context)}`);
    
    try {
        const result = await operation();
        const processingTime = Date.now() - startTime;
        
        logger.debug(`Database operation completed: ${operationName}`, {
            operation: operationName,
            processingTime,
            context,
            success: true
        });
        
        return { success: true, data: result, processingTime };
        
    } catch (error) {
        const processingTime = Date.now() - startTime;
        const errorResult = handleMongoError(error, operationName, context);
        
        logger.error(`Database operation failed: ${operationName}`, {
            operation: operationName,
            processingTime,
            context,
            error: errorResult
        });
        
        return { 
            success: false, 
            error: errorResult, 
            processingTime 
        };
    }
}

/**
 * Retry Logic for Database Operations
 * 
 * Implements sophisticated retry logic for recoverable database errors with exponential backoff.
 * This function consolidates retry patterns and provides robust handling for transient failures
 * commonly encountered in cloud database environments.
 * 
 * Retry strategy:
 * - Network issues and timeouts are often transient and benefit from retry
 * - Duplicate key errors in race conditions may resolve with retry and proper handling
 * - Exponential backoff prevents overwhelming database during outages
 * - Maximum retry limits prevent infinite loops and resource exhaustion
 * 
 * Integration considerations:
 * - Works seamlessly with existing database operation patterns
 * - Maintains consistent logging format for monitoring integration
 * - Provides detailed retry attempt tracking for debugging
 * - Uses existing error classification for retry decision making
 * 
 * @param {Function} operation - Async database operation to retry
 * @param {string} operationName - Name of the operation for logging
 * @param {Object} options - Retry configuration options
 * @returns {Promise<Object>} Final result after all retry attempts
 */
async function retryDbOperation(operation, operationName, options = {}) {
    const {
        maxRetries = 3,
        baseDelay = 1000,
        maxDelay = 10000,
        retryCondition = (error) => error.recoverable,
        context = {}
    } = options;

    logger.debug(`retryDbOperation starting: ${operationName} with max retries: ${maxRetries}`);

    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        logger.debug(`Attempting database operation: ${operationName}, attempt ${attempt}`);
        
        const result = await safeDbOperation(operation, operationName, { ...context, attempt });
        
        if (result.success) {
            if (attempt > 1) {
                logger.info(`Database operation succeeded after retry: ${operationName}`, {
                    operation: operationName,
                    attempt,
                    context
                });
            }
            return result;
        }
        
        lastError = result.error;
        
        // Don't retry if not recoverable or max attempts reached
        if (!retryCondition(result.error) || attempt > maxRetries) {
            logger.info(`Retry limit reached or error not recoverable for: ${operationName}`);
            break;
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        
        logger.warn(`Database operation failed, retrying: ${operationName}`, {
            operation: operationName,
            attempt,
            nextRetryIn: delay,
            error: result.error.type,
            context
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    return { success: false, error: lastError };
}

/**
 * Idempotency Helper for Database Operations
 * 
 * Implements idempotency checks for critical operations to prevent duplicate processing.
 * This function consolidates idempotency patterns essential for payment processing,
 * webhook handling, and other operations where duplicate execution must be prevented.
 * 
 * Idempotency strategy:
 * - Payment operations must not be duplicated due to financial impact
 * - Webhook events may be delivered multiple times requiring deduplication
 * - Race conditions can cause duplicate processing without proper safeguards
 * - Idempotency keys provide unique operation identification for deduplication
 * 
 * Race condition handling:
 * - Handles concurrent operations attempting to create the same resource
 * - Provides graceful recovery when duplicate key errors occur
 * - Returns existing records when duplicate operations are detected
 * - Maintains operation atomicity and consistency
 * 
 * @param {Object} model - Mongoose model for database operations
 * @param {Object} idempotencyKey - Object with field and value for uniqueness checking
 * @param {Function} operation - Database operation to execute if no duplicate exists
 * @param {string} operationName - Name of the operation for logging
 * @returns {Promise<Object>} Result with success status and data or error information
 */
async function ensureIdempotency(model, idempotencyKey, operation, operationName) {
    const context = { 
        idempotencyKey: `${idempotencyKey.field}=${idempotencyKey.value}`,
        model: model.modelName 
    };
    
    logger.debug(`ensureIdempotency checking for operation: ${operationName}`);
    logger.debug(`Idempotency context: ${JSON.stringify(context)}`);
    
    // Check if operation already exists using existing pattern
    const existingRecord = await safeDbOperation(
        () => model.findOne({ [idempotencyKey.field]: idempotencyKey.value }),
        `${operationName}_idempotency_check`,
        context
    );
    
    if (!existingRecord.success) {
        return existingRecord;
    }
    
    if (existingRecord.data) {
        logger.info(`Idempotent operation detected for: ${operationName}`, {
            operation: operationName,
            existingId: existingRecord.data._id,
            context
        });
        
        return {
            success: true,
            data: existingRecord.data,
            idempotent: true
        };
    }
    
    // Perform operation with duplicate key handling
    const result = await safeDbOperation(operation, operationName, context);
    
    // Handle race condition where another process created the record
    if (!result.success && result.error.type === 'DUPLICATE_KEY_ERROR') {
        logger.info(`Race condition detected for: ${operationName}, fetching existing record`);
        
        const raceResult = await safeDbOperation(
            () => model.findOne({ [idempotencyKey.field]: idempotencyKey.value }),
            `${operationName}_race_recovery`,
            context
        );
        
        if (raceResult.success && raceResult.data) {
            return {
                success: true,
                data: raceResult.data,
                idempotent: true,
                raceCondition: true
            };
        }
    }
    
    return result;
}

/**
 * Query Optimization Helper
 * 
 * Provides optimized query patterns for common database operations with performance enhancements.
 * This function consolidates query optimization techniques used across the application to ensure
 * consistent performance characteristics and reduce resource consumption.
 * 
 * Optimization techniques:
 * - Lean queries reduce memory usage by returning plain JavaScript objects
 * - Field selection minimizes network overhead by only retrieving needed data
 * - Proper indexing hints improve query performance for complex operations
 * - Pagination patterns prevent memory exhaustion with large datasets
 * 
 * Performance considerations:
 * - Lean queries are faster and use less memory for read-only operations
 * - Field selection reduces network bandwidth and parsing overhead
 * - Limit and skip provide efficient pagination when combined with proper indexes
 * - Sort operations benefit from compound indexes matching sort criteria
 * 
 * @param {Object} baseQuery - Mongoose query object to optimize
 * @param {Object} options - Optimization options for query enhancement
 * @returns {Object} Optimized Mongoose query ready for execution
 */
function optimizeQuery(baseQuery, options = {}) {
    const {
        lean = true,
        select = null,
        limit = null,
        skip = null,
        sort = null,
        populate = null,
        hint = null
    } = options;

    logger.debug(`optimizeQuery applying optimizations:`, {
        lean,
        hasSelect: !!select,
        hasLimit: !!limit,
        hasSkip: !!skip,
        hasSort: !!sort,
        hasPopulate: !!populate,
        hasHint: !!hint
    });

    let query = baseQuery;
    
    // Apply lean for better performance (returns plain objects instead of Mongoose documents)
    if (lean) {
        query = query.lean();
    }
    
    // Apply field selection to reduce network overhead
    if (select) {
        query = query.select(select);
    }
    
    // Apply result limiting for pagination and performance
    if (limit) {
        query = query.limit(limit);
    }
    
    // Apply skip for pagination offset
    if (skip) {
        query = query.skip(skip);
    }
    
    // Apply sorting for consistent result ordering
    if (sort) {
        query = query.sort(sort);
    }
    
    // Apply population for related document inclusion
    if (populate) {
        query = query.populate(populate);
    }
    
    // Apply index hints for query performance optimization
    if (hint) {
        query = query.hint(hint);
    }
    
    logger.debug('optimizeQuery optimizations applied successfully');
    return query;
}

/**
 * Aggregation Pipeline Helper
 * 
 * Provides standardized aggregation patterns for analytics and reporting operations.
 * This function consolidates aggregation logic used across analytics services and ensures
 * consistent pipeline construction with performance optimizations.
 * 
 * Pipeline optimization:
 * - Match stages early in pipeline to reduce document processing
 * - Efficient stage ordering minimizes resource usage
 * - Standardized patterns improve query plan caching
 * - Consistent result formatting aids client processing
 * 
 * Common use cases:
 * - Analytics reporting with grouping and aggregation
 * - Data transformation for client consumption
 * - Complex joins between collections using lookup stages
 * - Filtering and projection for optimized result sets
 * 
 * @param {Array} stages - Array of pipeline stage definitions
 * @returns {Array} MongoDB aggregation pipeline ready for execution
 */
function createAggregationPipeline(stages = []) {
    logger.debug(`createAggregationPipeline building pipeline with ${stages.length} stages`);
    
    const pipeline = [];
    
    // Process stages in order, applying MongoDB aggregation operators
    stages.forEach((stage, index) => {
        logger.debug(`Processing pipeline stage ${index + 1}: ${Object.keys(stage)}`);
        
        // Match stage for filtering - should be early in pipeline for performance
        if (stage.match) {
            pipeline.push({ $match: stage.match });
        }
        
        // Group stage for aggregation operations
        if (stage.group) {
            pipeline.push({ $group: stage.group });
        }
        
        // Sort stage for result ordering
        if (stage.sort) {
            pipeline.push({ $sort: stage.sort });
        }
        
        // Limit stage for result size control
        if (stage.limit) {
            pipeline.push({ $limit: stage.limit });
        }
        
        // Project stage for field selection and transformation
        if (stage.project) {
            pipeline.push({ $project: stage.project });
        }
        
        // Lookup stage for collection joins
        if (stage.lookup) {
            pipeline.push({ $lookup: stage.lookup });
        }
        
        // Unwind stage for array deconstruction
        if (stage.unwind) {
            pipeline.push({ $unwind: stage.unwind });
        }
    });
    
    logger.debug(`createAggregationPipeline completed with ${pipeline.length} pipeline stages`);
    return pipeline;
}

// Export functions using object shorthand for clean module interface
// This pattern provides a consistent export structure across all utility modules
// Enhanced with advanced database operation patterns for production reliability
module.exports = {
  ensureMongoDB,              // database connectivity validator for operation safety
  ensureUnique,               // uniqueness checker with duplicate key conflict handling
  handleMongoError,           // centralized MongoDB error handling and classification
  safeDbOperation,            // safe operation wrapper with error handling and timing
  retryDbOperation,           // retry logic for recoverable database errors
  ensureIdempotency,          // idempotency checking for critical operations
  optimizeQuery,              // query optimization helper for performance enhancement
  createAggregationPipeline   // aggregation pipeline builder for analytics operations
};
