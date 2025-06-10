
/**
 * Document Operation Functions
 * High-level document manipulation utilities for user-owned documents
 * 
 * This module provides a comprehensive set of utilities for managing documents
 * that belong to specific users. It implements common CRUD patterns while
 * enforcing user ownership constraints and providing consistent error handling.
 * 
 * Design philosophy:
 * - User ownership enforcement: All operations verify that users can only access their own documents
 * - Consistent error handling: Standardized responses for common failure cases (not found, cast errors)
 * - Composable operations: Higher-level functions build on lower-level primitives
 * - Logging for debugging: Comprehensive logging helps track operation flow and identify issues
 * - DRY principle: Common patterns are abstracted to reduce code duplication
 * 
 * Security considerations:
 * - All functions require username parameter to prevent unauthorized document access
 * - MongoDB ObjectId casting errors are handled gracefully to prevent information leakage
 * - No direct exposure of internal document IDs or database errors to clients
 * 
 * Performance considerations:
 * - Uses findOne/findOneAndDelete for single document operations (more efficient than find + filter)
 * - Leverages MongoDB indexes on _id and user fields for optimal query performance
 * - Minimal data transfer by only selecting/returning necessary fields
 */

// Dependencies for database operations and utility functions
const mongoose = require('mongoose'); // MongoDB object modeling for Node.js
const { sendNotFound } = require('./http-utils'); // Consistent HTTP error responses
const { ensureUnique } = require('./database-utils'); // Document uniqueness validation
const { logFunctionEntry, logFunctionExit, logFunctionError } = require('./logging-utils'); // Centralized logging

/**
 * Generic document operation executor with error handling
 * 
 * This function provides a standardized wrapper for document operations that require
 * user ownership validation. It handles common error cases (like invalid ObjectIds)
 * and provides consistent logging across all document operations.
 * 
 * Design rationale:
 * - Centralizes error handling logic to avoid repetition across specific operations
 * - Provides consistent logging format for debugging and monitoring
 * - Handles MongoDB CastError (invalid ObjectId) gracefully by returning null
 * - Allows any operation function to be wrapped with standard error handling
 * 
 * Error handling strategy:
 * - CastError (invalid ObjectId): Return null instead of throwing (client sent bad ID)
 * - Other errors: Re-throw to allow calling code to handle appropriately
 * - Logging: Track operation start, result, and any errors for debugging
 * 
 * Alternative approaches considered:
 * - Middleware pattern: More complex, would require Express integration
 * - Decorator pattern: Would require different function signatures
 * - Try-catch in each function: Would lead to code duplication
 * 
 * @param {Object} model - Mongoose model to operate on
 * @param {string} id - Document ID (will be validated as ObjectId)
 * @param {string} username - Username for ownership verification
 * @param {Function} opCallback - Operation function to execute with error handling
 * @returns {Promise<Object|null>} Document result or null if not found/invalid ID
 */
async function performUserDocOp(model, id, username, opCallback) {
  console.log(`performUserDocOp is running with id: ${id} user: ${username}`); // log function start
  // Log operation start with parameters for debugging and audit trails
  logFunctionEntry(opCallback.name, { id, username });
  
  try {
    // Execute the provided operation with standard parameters
    const doc = await opCallback(model, id, username);
    
    // Log successful operation result
    logFunctionExit(opCallback.name, doc);
    console.log(`performUserDocOp is returning ${doc}`); // log before returning result
    return doc; // Return fetched document to calling controller
  } catch (error) {
    // Log error details for debugging while handling gracefully
    logFunctionError(opCallback.name, error);
    
    // Handle MongoDB CastError (invalid ObjectId format) by returning null
    // This prevents information leakage about valid vs invalid IDs
    if (error instanceof mongoose.Error.CastError) {
      logFunctionExit(opCallback.name, 'null due to CastError');
      console.log('performUserDocOp is returning null'); // log null case
      return null;
    }
    
    // Re-throw other errors to allow proper handling by calling code
    // Database connection errors, validation errors, etc. should bubble up
    throw error;
  }
} // Wrapper centralizes repetitive error handling for all doc operations

/**
 * Finds a document by ID that belongs to a specific user
 * 
 * This function provides the foundation for all user document retrieval operations.
 * It ensures that users can only access documents they own, preventing unauthorized
 * data access through direct ID manipulation.
 * 
 * Security implementation:
 * - Queries both _id AND user fields to enforce ownership
 * - Invalid ObjectIds are handled gracefully without revealing existence of valid IDs
 * - No information leakage about documents belonging to other users
 * 
 * Performance characteristics:
 * - Uses findOne() which stops at first match
 * - Relies on compound index on (_id, user) for optimal query performance
 * - Returns full document - consider field selection for large documents
 * 
 * @param {Object} model - Mongoose model to query
 * @param {string} id - Document ID to find
 * @param {string} username - Username that must own the document
 * @returns {Promise<Object|null>} Document if found and owned by user, null otherwise
 */
async function findUserDoc(model, id, username) {
  console.log(`findUserDoc is running with id: ${id} user: ${username}`); // log start
  // Define the operation as a named function for better logging and debugging
  const op = async function findUserDoc(m, i, u) {
    // Query for document with both ID and user ownership constraints
    // This ensures users can only access their own documents
    return m.findOne({ _id: i, user: u });
  };
  
  // Execute with standardized error handling and logging
  console.log('findUserDoc is returning result from performUserDocOp'); // log before returning wrapped result
  return performUserDocOp(model, id, username, op); // Use shared wrapper to avoid duplicate try/catch logic
}

/**
 * Deletes a document by ID that belongs to a specific user
 * 
 * This function provides secure document deletion by enforcing user ownership.
 * It returns the deleted document for confirmation and potential undo operations.
 * 
 * Design decisions:
 * - Uses findOneAndDelete for atomic operation (find + delete in single query)
 * - Returns deleted document to allow confirmation and potential data recovery
 * - Enforces user ownership to prevent unauthorized deletions
 * 
 * Alternative approaches:
 * - Soft delete: Mark as deleted instead of removing (would require schema changes)
 * - Two-step process: find then delete (less efficient, potential race conditions)
 * - deleteOne: Doesn't return deleted document (less information for caller)
 * 
 * @param {Object} model - Mongoose model to operate on
 * @param {string} id - Document ID to delete
 * @param {string} username - Username that must own the document
 * @returns {Promise<Object|null>} Deleted document if found and owned by user, null otherwise
 */
async function deleteUserDoc(model, id, username) {
  console.log(`deleteUserDoc is running with id: ${id} user: ${username}`); // log start
  // Define the operation as a named function for clear logging
  const op = async function deleteUserDoc(m, i, u) {
    // Use findOneAndDelete for atomic operation with ownership constraint
    // Returns the deleted document for confirmation
    return m.findOneAndDelete({ _id: i, user: u });
  };
  
  // Execute with standardized error handling
  console.log('deleteUserDoc is returning result from performUserDocOp'); // log before return
  return performUserDocOp(model, id, username, op);
}

/**
 * Executes a document action and sends 404 response if document not found
 * 
 * This function bridges document operations with HTTP response handling,
 * automatically sending appropriate error responses when documents don't exist
 * or users don't have access. It centralizes the common pattern of "perform
 * operation, send 404 if null result".
 * 
 * Design rationale:
 * - Reduces boilerplate in controller functions by handling common null-check pattern
 * - Provides consistent 404 responses across all document operations
 * - Separates HTTP concerns from pure document operations
 * - Allows customizable error messages for different contexts
 * 
 * Usage pattern: This is typically called from Express route handlers where
 * a null result should trigger a 404 response rather than continuing execution.
 * 
 * @param {Object} model - Mongoose model to operate on
 * @param {string} id - Document ID for the operation
 * @param {string} user - Username for ownership verification
 * @param {Object} res - Express response object for sending 404 if needed
 * @param {Function} action - Document operation function to execute
 * @param {string} msg - Custom message for 404 response
 * @returns {Promise<Object|undefined>} Document if found, undefined if 404 sent
 */
async function userDocActionOr404(model, id, user, res, action, msg) {
  console.log(`userDocActionOr404 is running with id: ${id} user: ${user}`); // log start
  // Log operation start for debugging and request tracing
  logFunctionEntry('userDocActionOr404', { id, user });
  
  try {
    // Execute the provided action (findUserDoc, deleteUserDoc, etc.)
    const doc = await action(model, id, user);
    
    // Check if document was found/operation succeeded
    if (doc == null) {
      // Send 404 response with custom message and stop execution
      sendNotFound(res, msg);
      logFunctionExit('userDocActionOr404', 'undefined');
      console.log('userDocActionOr404 is returning undefined'); // log before return
      return; // undefined return indicates 404 response was sent
    }

    // Log successful operation and return document
    logFunctionExit('userDocActionOr404', doc);
    console.log(`userDocActionOr404 is returning ${doc}`); // log before returning doc
    return doc;
  } catch (error) {
    // Log error and re-throw for higher-level error handling
    logFunctionError('userDocActionOr404', error);
    throw error;
  }
}

/**
 * Fetches a user document or sends a 404 response if not found
 * 
 * This function combines findUserDoc with automatic 404 handling, providing
 * a common pattern used throughout controllers for document retrieval with
 * proper HTTP error responses.
 * 
 * Design purpose: Eliminates repetitive null-checking code in controllers
 * by encapsulating the "fetch and 404 if not found" pattern that appears
 * frequently in REST API implementations.
 * 
 * @param {Object} model - Mongoose model to query
 * @param {string} id - Document ID to fetch
 * @param {string} user - Username that must own the document
 * @param {Object} res - Express response object for potential 404 response
 * @param {string} msg - Message to send with 404 response
 * @returns {Promise<Object|undefined>} Document if found, undefined if 404 sent
 */
async function fetchUserDocOr404(model, id, user, res, msg) {
  console.log(`fetchUserDocOr404 is running with id: ${id} user: ${user}`); // log start
  logFunctionEntry('fetchUserDocOr404', { id, user });
  
  try {
    // Use the generic action wrapper with findUserDoc as the specific action
    const doc = await userDocActionOr404(model, id, user, res, findUserDoc, msg);
    
    // Check if 404 response was sent (doc would be undefined)
    if (!doc) {
      logFunctionExit('fetchUserDocOr404', 'undefined');
      console.log('fetchUserDocOr404 is returning undefined'); // log before return undefined
      return;
    }

    logFunctionExit('fetchUserDocOr404', doc);
    console.log(`fetchUserDocOr404 is returning ${doc}`); // log before returning doc
    return doc;
  } catch (error) {
    logFunctionError('fetchUserDocOr404', error);
    throw error;
  }
}

/**
 * Deletes a user document or sends a 404 response if not found
 * 
 * This function combines deleteUserDoc with automatic 404 handling, providing
 * the delete equivalent of fetchUserDocOr404. It's commonly used in DELETE
 * endpoints where the absence of a document should result in a 404 response.
 * 
 * @param {Object} model - Mongoose model to operate on
 * @param {string} id - Document ID to delete
 * @param {string} user - Username that must own the document
 * @param {Object} res - Express response object for potential 404 response
 * @param {string} msg - Message to send with 404 response
 * @returns {Promise<Object|undefined>} Deleted document if found, undefined if 404 sent
 */
async function deleteUserDocOr404(model, id, user, res, msg) {
  console.log(`deleteUserDocOr404 is running with id: ${id} user: ${user}`); // log start
  logFunctionEntry('deleteUserDocOr404', { id, user });
  
  try {
    // Use the generic action wrapper with deleteUserDoc as the specific action
    const doc = await userDocActionOr404(model, id, user, res, deleteUserDoc, msg);
    
    if (!doc) {
      logFunctionExit('deleteUserDocOr404', 'undefined');
      console.log('deleteUserDocOr404 is returning undefined'); // log before return
      return;
    }

    logFunctionExit('deleteUserDocOr404', doc);
    console.log(`deleteUserDocOr404 is returning ${doc}`); // log before returning doc
    return doc; // Provide deleted document back to caller for confirmation
  } catch (error) {
    logFunctionError('deleteUserDocOr404', error);
    throw error;
  }
}

/**
 * Lists all documents owned by a user with optional sorting
 * 
 * This function provides filtered document listing for user-owned content.
 * It supports sorting to enable various presentation orders (newest first,
 * alphabetical, etc.) commonly needed in user interfaces.
 * 
 * Design considerations:
 * - Returns array (possibly empty) rather than null for consistent handling
 * - Supports MongoDB sort syntax for flexible ordering
 * - Filters by user ownership to maintain security boundaries
 * - Does not paginate - consider adding pagination for large document sets
 * 
 * Performance notes:
 * - Uses index on 'user' field for efficient filtering
 * - Sort operations may require additional indexes depending on sort fields
 * - Consider adding field selection for large documents or pagination for large result sets
 * 
 * @param {Object} model - Mongoose model to query
 * @param {string} username - Username to filter documents by
 * @param {Object} sort - MongoDB sort object (e.g., { createdAt: -1 })
 * @returns {Promise<Array>} Array of documents owned by the user (may be empty)
 */
async function listUserDocs(model, username, sort) {
  console.log(`listUserDocs is running with user: ${username}`); // log start
  // Log operation with sort configuration for debugging
  logFunctionEntry('listUserDocs', { username, sort: JSON.stringify(sort) });
  
  try {
    // Query for all documents owned by user with specified sorting
    // Uses find() to return all matching documents, not just the first
    const docs = await model.find({ user: username }).sort(sort);
    
    logFunctionExit('listUserDocs', docs);
    console.log(`listUserDocs is returning ${docs}`); // log before return
    return docs; // Returning array keeps caller logic simple
  } catch (error) {
    logFunctionError('listUserDocs', error);
    throw error;
  }
}

/**
 * Creates a new document after verifying uniqueness constraints
 * 
 * This function implements the common pattern of checking for duplicates
 * before creating new documents. It's essential for maintaining data integrity
 * where business rules require unique values (usernames, email addresses, etc.).
 * 
 * Design rationale:
 * - Separates uniqueness checking from document creation for reusability
 * - Provides consistent 409 Conflict responses for duplicate attempts
 * - Returns undefined when duplicate found to signal that HTTP response was sent
 * - Uses new + save pattern for full Mongoose validation and middleware execution
 * 
 * Race condition considerations:
 * - Small window between uniqueness check and save where duplicates could occur
 * - For critical uniqueness, consider database unique indexes as backup protection
 * - Current approach balances simplicity with adequate protection for most use cases
 * 
 * @param {Object} model - Mongoose model to create document with
 * @param {Object} fields - Field values for the new document
 * @param {Object} uniqueQuery - Query to check for existing documents
 * @param {Object} res - Express response object for potential duplicate response
 * @param {string} duplicateMsg - Message to send if duplicate is found
 * @returns {Promise<Object|undefined>} Created document if successful, undefined if duplicate
 */
async function createUniqueDoc(model, fields, uniqueQuery, res, duplicateMsg) {
  console.log('createUniqueDoc is running'); // log start with no heavy params
  logFunctionEntry('createUniqueDoc', { fields: JSON.stringify(fields) });
  
  try {
    // Check for existing documents matching uniqueness criteria
    if (!(await ensureUnique(model, uniqueQuery, res, duplicateMsg))) {
      // ensureUnique sent 409 response, return undefined to signal this
      logFunctionExit('createUniqueDoc', 'undefined');
      console.log('createUniqueDoc is returning undefined'); // log before return
      return;
    }
    
    // Create new document instance with provided fields
    const doc = new model(fields);
    
    // Save to database with full validation and middleware execution
    const saved = await doc.save();
    
    logFunctionExit('createUniqueDoc', saved);
    console.log(`createUniqueDoc is returning ${saved}`); // log before returning saved doc
    return saved; // Return persisted document for caller usage
  } catch (error) {
    logFunctionError('createUniqueDoc', error);
    throw error;
  }
}

/**
 * Updates a user-owned document with optional uniqueness validation
 * 
 * This function provides comprehensive document updating with user ownership
 * enforcement and optional uniqueness checking. It handles the complex logic
 * of determining when uniqueness validation is needed and updating documents
 * atomically.
 * 
 * Design complexity rationale:
 * - Fetches existing document first to enable ownership verification
 * - Performs uniqueness check only when relevant fields are being changed
 * - Uses Object.assign for partial updates while preserving unchanged fields
 * - Calls save() to trigger Mongoose validation and middleware
 * 
 * Uniqueness check optimization:
 * - Only validates uniqueness when unique fields are actually being modified
 * - Compares current vs new values to avoid unnecessary database queries
 * - Supports compound uniqueness constraints through query object
 * 
 * Alternative approaches considered:
 * - findOneAndUpdate: More efficient but bypasses some Mongoose features
 * - Optimistic locking: More complex but would handle race conditions better
 * - Separate validation: Would require additional parameter passing
 * 
 * @param {Object} model - Mongoose model to update
 * @param {string} id - Document ID to update
 * @param {string} username - Username that must own the document
 * @param {Object} fieldsToUpdate - Object containing fields to update
 * @param {Object} uniqueQuery - Query for uniqueness check (optional)
 * @param {Object} res - Express response object for error responses
 * @param {string} duplicateMsg - Message for duplicate responses
 * @returns {Promise<Object|undefined>} Updated document if successful, undefined if error response sent
 */
async function updateUserDoc(model, id, username, fieldsToUpdate, uniqueQuery, res, duplicateMsg) {
  console.log(`updateUserDoc is running with id: ${id} user: ${username}`); // log start
  logFunctionEntry('updateUserDoc', { id, username });
  
  try {
    // First, fetch the existing document to verify ownership and enable comparison
    const doc = await fetchUserDocOr404(model, id, username, res, 'Document not found');
    
    // If document not found, fetchUserDocOr404 already sent 404 response
    if (!doc) {
      logFunctionExit('updateUserDoc', 'undefined');
      console.log('updateUserDoc is returning undefined'); // log before return when not found
      return;
    }
    
    // Check if uniqueness validation is needed by examining if any unique fields are changing
    if (
      uniqueQuery &&
      Object.keys(uniqueQuery).some(
        (key) => key in fieldsToUpdate && doc[key] !== fieldsToUpdate[key]
      )
    ) {
      // Build uniqueness query excluding the current document to avoid false positives
      const uniqueQueryWithExclusion = {
        ...uniqueQuery,
        _id: { $ne: doc._id }
      };
      
      // Only validate uniqueness if unique fields are actually being modified
      // This optimization avoids unnecessary database queries for updates that don't affect unique fields
      if (!(await ensureUnique(model, uniqueQueryWithExclusion, res, duplicateMsg))) {
        logFunctionExit('updateUserDoc', 'undefined');
        console.log('updateUserDoc is returning undefined'); // log before return duplicate case
        return;
      }
    }
    
    // Apply updates to document using Object.assign for partial update
    // This preserves unchanged fields while updating only specified fields
    Object.assign(doc, fieldsToUpdate);
    
    // Save updated document to trigger validation and middleware
    await doc.save();
    
    logFunctionExit('updateUserDoc', doc);
    console.log(`updateUserDoc is returning ${doc}`); // log before returning updated doc
    return doc; // Provide updated document for downstream logic
  } catch (error) {
    logFunctionError('updateUserDoc', error);
    throw error;
  }
}

// Export all functions for use by other modules
// This comprehensive set of document operations provides building blocks
// for most user-document CRUD scenarios while maintaining security and consistency
module.exports = {
  performUserDocOp,  // wraps operations with error handling
  findUserDoc,       // fetches a user owned doc
  deleteUserDoc,     // removes a user owned doc
  userDocActionOr404, // performs action and sends 404 on miss
  fetchUserDocOr404, // fetch with auto 404
  deleteUserDocOr404, // delete with auto 404
  listUserDocs,      // list docs by user
  createUniqueDoc,   // create with uniqueness check
  updateUserDoc      // update with optional uniqueness
};
