/**
 * Database Document Helper Utilities
 * Generic MongoDB CRUD operations with consistent error handling and type safety
 * 
 * This module provides a comprehensive set of generic document helpers that complement
 * the existing user-owned document operations. These utilities centralize common CRUD
 * patterns, eliminate duplicate try-catch blocks, and provide consistent error handling
 * across storage operations.
 * 
 * Design philosophy:
 * - Generic operations: Work with any Mongoose model without user ownership constraints
 * - Consistent error handling: Graceful handling of invalid ObjectIds and database errors
 * - Type safety: TypeScript-style generics for better development experience
 * - Defensive programming: Always return safe fallback values instead of throwing
 * - Performance patterns: Efficient MongoDB operations with proper options
 * 
 * Use cases:
 * - Administrative operations that bypass user ownership
 * - System-level document management and cleanup
 * - Bulk operations for data migration and maintenance
 * - Generic CRUD where user context is not required
 * 
 * Integration with existing utilities:
 * - Complements lib/document-ops.js (user-owned documents)
 * - Uses lib/database-utils.js for error handling and safe operations
 * - Follows lib/logging-utils.js patterns for consistent debugging
 */

const mongoose = require('mongoose'); // MongoDB object modeling for Node.js
const { safeDbOperation, handleMongoError } = require('./database-utils'); // Consistent error handling and safe operations

/**
 * Generic helper for safe document retrieval by ID
 * 
 * Handles invalid ObjectId errors and provides consistent error handling
 * for document lookup operations. This function provides a safe wrapper
 * around MongoDB's findById with graceful error handling.
 * 
 * Error handling approach:
 * - Invalid ObjectId: Returns undefined instead of throwing CastError
 * - Database connection issues: Returns undefined with logging
 * - Document not found: Returns undefined (null normalized)
 * - All errors logged but operation continues gracefully
 * 
 * @param {Object} model - Mongoose model to query
 * @param {string} id - Document ID to find
 * @returns {Promise<Object|undefined>} Document or undefined if not found/error
 */
async function findDocumentById(model, id) {
    console.log(`findDocumentById is running with ${model.modelName} model and ${id} id`);
    
    const result = await safeDbOperation(
        async () => {
            const document = await model.findById(id);
            return document || undefined; // Normalize null to undefined for consistent return type
        },
        'findDocumentById',
        { model: model.modelName, id }
    );
    
    if (result.success) {
        console.log(`findDocumentById is returning ${result.data ? 'document found' : 'undefined'}`);
        return result.data;
    } else {
        console.log(`findDocumentById is returning undefined due to error`);
        return undefined; // Handle invalid ObjectId or database connection errors gracefully
    }
}

/**
 * Generic helper for safe document update by ID
 * 
 * Standardizes update operations with consistent error handling and new document return.
 * This function provides a safe wrapper around MongoDB's findByIdAndUpdate with
 * the 'new: true' option to return the updated document.
 * 
 * Update strategy:
 * - Uses findByIdAndUpdate with new: true for immediate updated document access
 * - Handles validation errors gracefully by returning undefined
 * - Logs all operations for debugging and monitoring
 * - Maintains referential integrity with atomic operations
 * 
 * @param {Object} model - Mongoose model to update
 * @param {string} id - Document ID to update
 * @param {Object} updates - Partial updates to apply
 * @returns {Promise<Object|undefined>} Updated document or undefined if not found/error
 */
async function updateDocumentById(model, id, updates) {
    console.log(`updateDocumentById is running with ${model.modelName} model, ${id} id, and updates`);
    
    const result = await safeDbOperation(
        async () => {
            const document = await model.findByIdAndUpdate(id, updates, { new: true });
            return document || undefined; // Normalize null to undefined for consistent return type
        },
        'updateDocumentById',
        { model: model.modelName, id, updateFields: Object.keys(updates) }
    );
    
    if (result.success) {
        console.log(`updateDocumentById is returning ${result.data ? 'updated document' : 'undefined'}`);
        return result.data;
    } else {
        console.log(`updateDocumentById is returning undefined due to error`);
        return undefined; // Handle invalid ObjectId, validation errors, or database connection issues gracefully
    }
}

/**
 * Generic helper for safe document deletion by ID
 * 
 * Provides consistent boolean return pattern for deletion operations.
 * This function provides a safe wrapper around MongoDB's findByIdAndDelete
 * with explicit boolean conversion for consistent return patterns.
 * 
 * Deletion strategy:
 * - Uses findByIdAndDelete for atomic operation
 * - Returns explicit boolean for consistent API
 * - Logs all operations for audit trails
 * - Handles errors gracefully without throwing
 * 
 * @param {Object} model - Mongoose model to delete from
 * @param {string} id - Document ID to delete
 * @returns {Promise<boolean>} True if deleted successfully, false otherwise
 */
async function deleteDocumentById(model, id) {
    console.log(`deleteDocumentById is running with ${model.modelName} model and ${id} id`);
    
    const result = await safeDbOperation(
        async () => {
            const deletedDocument = await model.findByIdAndDelete(id);
            return !!deletedDocument; // Convert truthy/falsy to explicit boolean for consistent return type
        },
        'deleteDocumentById',
        { model: model.modelName, id }
    );
    
    if (result.success) {
        console.log(`deleteDocumentById is returning ${result.data}`);
        return result.data;
    } else {
        console.log(`deleteDocumentById is returning false due to error`);
        return false; // Handle invalid ObjectId or database connection errors gracefully
    }
}

/**
 * Helper for cascading deletion operations
 * 
 * Safely deletes related documents and handles cleanup operations.
 * This function implements the cascade delete pattern commonly needed
 * when removing documents that have related data in other collections.
 * 
 * Cascade strategy:
 * - Performs cascade operations first to maintain referential integrity
 * - Continues with main deletion even if some cascade operations fail
 * - Logs cascade failures but doesn't stop the main operation
 * - Returns boolean based on main deletion success only
 * 
 * Common use cases:
 * - User deletion with profile, settings, and content cleanup
 * - Order deletion with line items, payments, and shipping cleanup
 * - Project deletion with files, permissions, and history cleanup
 * 
 * @param {Object} mainModel - Primary model to delete from
 * @param {string} mainId - ID of main document to delete
 * @param {Array} cascadeOperations - Array of cleanup operations to perform
 * @returns {Promise<boolean>} True if main deletion succeeded, regardless of cascade results
 */
async function cascadeDeleteDocument(mainModel, mainId, cascadeOperations = []) {
    console.log(`cascadeDeleteDocument is running with ${mainModel.modelName} model, ${mainId} id, and ${cascadeOperations.length} cascade operations`);
    
    const result = await safeDbOperation(
        async () => {
            // Perform cascade operations first to maintain referential integrity
            for (let i = 0; i < cascadeOperations.length; i++) {
                try {
                    await cascadeOperations[i](); // Execute each cleanup operation independently
                    console.log(`[DEBUG] Cascade operation ${i + 1} completed successfully`);
                } catch (error) {
                    console.warn(`[WARN] Cascade operation ${i + 1} failed:`, error.message);
                    // Continue with other operations - cascade failures shouldn't stop main deletion
                }
            }
            
            // Delete main document after cascade cleanup
            const deletedDocument = await mainModel.findByIdAndDelete(mainId);
            return !!deletedDocument; // Convert truthy/falsy to explicit boolean
        },
        'cascadeDeleteDocument',
        { model: mainModel.modelName, id: mainId, cascadeCount: cascadeOperations.length }
    );
    
    if (result.success) {
        console.log(`cascadeDeleteDocument is returning ${result.data}`);
        return result.data;
    } else {
        console.log(`cascadeDeleteDocument is returning false due to error`);
        return false; // Handle database errors gracefully
    }
}

/**
 * Generic helper for safe document creation
 * 
 * Standardizes document creation with consistent error handling.
 * Unlike other helpers that return undefined on error, this function
 * throws errors to maintain the expected behavior for creation operations
 * where the caller needs to handle validation and duplicate key errors.
 * 
 * Creation strategy:
 * - Uses new model() + save() pattern for middleware hook execution
 * - Allows validation errors and duplicate key errors to bubble up
 * - Logs creation operations for audit trails
 * - Integrates with existing error handling patterns
 * 
 * @param {Object} model - Mongoose model to create document in
 * @param {Object} data - Data to create document with
 * @returns {Promise<Object>} Created document
 * @throws {Error} If creation fails (validation, duplicate key, etc.)
 */
async function createDocument(model, data) {
    console.log(`createDocument is running with ${model.modelName} model and data`);
    
    const result = await safeDbOperation(
        async () => {
            const document = new model(data); // Create Mongoose document instance for validation and middleware hooks
            return await document.save(); // Persist to MongoDB with schema validation and pre/post hooks
        },
        'createDocument',
        { model: model.modelName, dataFields: Object.keys(data) }
    );
    
    if (result.success) {
        console.log(`createDocument is returning created document`);
        return result.data;
    } else {
        console.log(`createDocument is throwing error due to failure`);
        // Re-throw the original error for creation operations where caller needs to handle specific error types
        const error = new Error(result.error.message);
        error.code = result.error.statusCode;
        error.type = result.error.type;
        throw error;
    }
}

/**
 * Generic helper for safe document query with find condition
 * 
 * Handles database errors gracefully and provides consistent return pattern.
 * This function provides a safe wrapper around MongoDB's find operation
 * with optional sorting and consistent error handling.
 * 
 * Query strategy:
 * - Uses MongoDB find() with flexible condition objects
 * - Supports optional sorting for consistent result ordering
 * - Returns empty array on any error for safe iteration
 * - Logs query patterns for performance monitoring
 * 
 * @param {Object} model - Mongoose model to query
 * @param {Object} condition - Query condition object
 * @param {Object} sortOptions - Optional sort configuration
 * @returns {Promise<Array>} Array of documents or empty array on error
 */
async function findDocuments(model, condition, sortOptions = null) {
    console.log(`findDocuments is running with ${model.modelName} model and condition`);
    
    const result = await safeDbOperation(
        async () => {
            let query = model.find(condition); // MongoDB query builder with find condition for document filtering
            if (sortOptions) {
                query = query.sort(sortOptions); // Apply sorting if provided for consistent result ordering
            }
            return await query; // Execute query and return document array
        },
        'findDocuments',
        { model: model.modelName, condition, hasSort: !!sortOptions }
    );
    
    if (result.success) {
        console.log(`findDocuments is returning ${result.data.length} documents`);
        return result.data;
    } else {
        console.log(`findDocuments is returning empty array due to error`);
        return []; // Handle database errors gracefully with empty array fallback
    }
}

/**
 * Generic helper for safe single document query with find condition
 * 
 * Provides consistent undefined return for not found or error cases.
 * This function provides a safe wrapper around MongoDB's findOne operation
 * with consistent null-to-undefined normalization.
 * 
 * Query strategy:
 * - Uses MongoDB findOne() for single document retrieval
 * - Normalizes null to undefined for consistent API
 * - Handles database errors gracefully
 * - Logs query patterns for debugging
 * 
 * @param {Object} model - Mongoose model to query
 * @param {Object} condition - Query condition object
 * @returns {Promise<Object|undefined>} Document or undefined if not found/error
 */
async function findOneDocument(model, condition) {
    console.log(`findOneDocument is running with ${model.modelName} model and condition`);
    
    const result = await safeDbOperation(
        async () => {
            const document = await model.findOne(condition); // MongoDB findOne query for single document retrieval
            return document || undefined; // Normalize null to undefined for consistent return type
        },
        'findOneDocument',
        { model: model.modelName, condition }
    );
    
    if (result.success) {
        console.log(`findOneDocument is returning ${result.data ? 'document found' : 'undefined'}`);
        return result.data;
    } else {
        console.log(`findOneDocument is returning undefined due to error`);
        return undefined; // Handle database errors gracefully with undefined fallback
    }
}

/**
 * Helper for bulk document updates with consistent error handling
 * 
 * Useful for operations like reordering where multiple documents need updates.
 * This function provides efficient bulk update capabilities with individual
 * error handling to prevent cascading failures.
 * 
 * Bulk update strategy:
 * - Processes updates sequentially to avoid overwhelming database
 * - Continues processing even if individual updates fail
 * - Returns count of successful updates for progress tracking
 * - Logs bulk operation progress for monitoring
 * 
 * Performance considerations:
 * - Uses individual findByIdAndUpdate calls for simplicity and error isolation
 * - Could be optimized with bulkWrite() for very large operations
 * - Provides progress feedback through success counting
 * 
 * @param {Object} model - Mongoose model to update
 * @param {Array} updates - Array of update operations with id and data
 * @returns {Promise<number>} Number of successful updates
 */
async function bulkUpdateDocuments(model, updates) {
    console.log(`bulkUpdateDocuments is running with ${model.modelName} model and ${updates.length} updates`);
    
    let successCount = 0; // Track successful updates for return value
    
    for (let i = 0; i < updates.length; i++) {
        const update = updates[i];
        const result = await safeDbOperation(
            async () => {
                const updatedDocument = await model.findByIdAndUpdate(update.id, update.data);
                return !!updatedDocument; // Return boolean for success tracking
            },
            'bulkUpdateDocuments_single',
            { model: model.modelName, updateIndex: i, id: update.id }
        );
        
        if (result.success && result.data) {
            successCount++; // Increment counter only if document was found and updated
        }
        // Continue with other updates even if one fails to prevent cascading failures
    }
    
    console.log(`bulkUpdateDocuments is returning ${successCount} successful updates`);
    return successCount;
}

// Export functions using object shorthand for clean module interface
// This pattern provides a consistent export structure across all utility modules
// Generic document helpers for MongoDB operations without user ownership constraints
module.exports = {
    findDocumentById,         // safe document retrieval by ID with error handling
    updateDocumentById,       // safe document update by ID with new document return
    deleteDocumentById,       // safe document deletion by ID with boolean return
    cascadeDeleteDocument,    // cascading deletion with cleanup operations
    createDocument,           // safe document creation with validation error propagation
    findDocuments,            // safe document query with find condition and sorting
    findOneDocument,          // safe single document query with consistent undefined return
    bulkUpdateDocuments       // bulk document updates with individual error handling
};