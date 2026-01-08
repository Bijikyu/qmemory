/**
 * Document Operations Module - User-Owned Document Management
 *
 * This module provides comprehensive utilities for managing user-owned documents
 * with strict security enforcement. It serves as the security layer that ensures
 * users can only access their own documents, preventing cross-user data access
 * and maintaining data isolation in multi-tenant applications.
 *
 * Key Security Features:
 * - Mandatory user ownership enforcement on all operations
 * - Input sanitization to prevent MongoDB injection attacks
 * - Username validation with strict format requirements
 * - Comprehensive error handling and logging
 * - Type-safe document operations with TypeScript
 *
 * Security Architecture:
 * - All database queries automatically include user filtering
 * - Username sanitization removes dangerous MongoDB operators
 * - Input validation prevents malformed queries and injection attempts
 * - Operation logging provides audit trails for security monitoring
 *
 * 🚩AI: ENTRY_POINT_FOR_USER_DOCUMENT_OPERATIONS - All user document operations flow through this module
 */

import mongoose, { Model, HydratedDocument, FilterQuery, AnyObject, Types } from 'mongoose';
import type { Response } from 'express';
import { sendNotFound } from './http-utils.js';
import { ensureUnique } from './database-utils.js';
import { createModuleUtilities } from './common-patterns.js';
import { ErrorFactory } from './core/centralized-errors';

/**
 * Type representing any user-owned document
 *
 * This type extends the base MongoDB object type to include the required
 * 'user' field that associates documents with their owners. All documents
 * managed by this module must conform to this structure.
 */
type AnyUserDoc = AnyObject & { user: string };

/**
 * Union type for document identifiers
 *
 * This type accepts both MongoDB ObjectId instances and string representations,
 * providing flexibility for different input formats while maintaining type safety.
 */
type DocumentId = Types.ObjectId | string;

/**
 * Security utility functions to prevent MongoDB injection attacks
 *
 * These functions provide comprehensive input validation and sanitization
 * for username parameters to prevent NoSQL injection attacks and ensure
 * data integrity in user-owned document operations.
 */

/**
 * Sanitizes username to prevent MongoDB injection attacks
 *
 * This function removes dangerous MongoDB operators and special characters
 * that could be used for injection attacks. It's a critical security function
 * that protects the database from malicious input.
 *
 * Security Threats Prevented:
 * - MongoDB operator injection ($, ., [])
 * - Field traversal attacks
 * - Query manipulation through special characters
 *
 * @param username - Raw username input to sanitize
 * @returns {string} Sanitized username safe for database queries
 */
const sanitizeUsername = (username: string): string => {
  // Remove MongoDB operators and special characters that could be used for injection
  return username.replace(/[$\.\[\]]/g, '').trim();
};

/**
 * Validates username format against security requirements
 *
 * This function enforces strict username format rules to prevent abuse
 * and ensure consistent user identification. Only allows safe characters
 * and enforces reasonable length limits.
 *
 * Validation Rules:
 * - Only alphanumeric characters, underscores, and hyphens allowed
 * - Minimum 1 character (prevents empty usernames)
 * - Maximum 50 characters (prevents abuse and storage issues)
 * - No whitespace or special characters
 *
 * @param username - Username to validate
 * @returns {boolean} True if username meets security requirements
 */
const isValidUsername = (username: string): boolean => {
  // Only allow alphanumeric characters, underscores, and hyphens
  // Reasonable length limits to prevent abuse
  return /^[a-zA-Z0-9_-]+$/.test(username) && username.length > 0 && username.length <= 50;
};

/**
 * Comprehensive username validation and sanitization
 *
 * This function combines validation and sanitization to provide complete
 * username security processing. It validates the input format and then
 * sanitizes it for safe database usage. Includes detailed error messages
 * for debugging and user feedback.
 *
 * @param username - Raw username input to validate and sanitize
 * @param functionName - Name of calling function for error context
 * @returns {string} Validated and sanitized username
 * @throws {Error} When username format is invalid or input is malformed
 */
const validateAndSanitizeUsername = (username: string, functionName: string): string => {
  // Validate input type and presence
  if (!username || typeof username !== 'string') {
    throw new Error(`Invalid username: must be a non-empty string in ${functionName}`);
  }

  // Validate format against security requirements
  if (!isValidUsername(username)) {
    throw new Error(
      `Invalid username format: only alphanumeric characters, underscores, and hyphens allowed (max 50 chars) in ${functionName}`
    );
  }

  // Sanitize for safe database usage
  return sanitizeUsername(username);
};

// Create module-specific utilities for logging and error handling
const utils = createModuleUtilities('document-ops');

/**
 * Helper functions to eliminate duplicate logging patterns
 *
 * These functions provide consistent logging patterns for common return
 * scenarios, reducing code duplication and ensuring uniform logging
 * across all document operations.
 */

/**
 * Logs and returns undefined for consistent error handling
 *
 * This helper function standardizes the logging pattern for operations
 * that return undefined (not found scenarios). It ensures consistent
 * debug logging and return value handling.
 *
 * @param log - Logger instance from the calling function
 * @param functionName - Name of the calling function for context
 * @returns {undefined} Always returns undefined
 */
const logAndReturnUndefined = (log: any, functionName: string): undefined => {
  log.return('undefined');
  utils.debugLog(functionName, 'returning undefined');
  return undefined;
};

/**
 * Logs and returns document for consistent success handling
 *
 * This helper function standardizes the logging pattern for operations
 * that successfully return documents. It ensures consistent debug
 * logging and return value handling for successful operations.
 *
 * @param log - Logger instance from the calling function
 * @param functionName - Name of the calling function for context
 * @param doc - Document being returned
 * @returns {any} The document passed in for return
 */
const logAndReturnDoc = (log: any, functionName: string, doc: any): any => {
  log.return(doc);
  utils.debugLog(functionName, 'returning document');
  return doc;
};

// 🚩AI: CORE_USER_OWNERSHIP_ENFORCEMENT - This is the central security enforcement point

/**
 * Core user ownership enforcement function
 *
 * This function is the heart of the security system for user-owned documents.
 * It executes user-scoped document operations while centralizing ownership
 * enforcement, validation, and error handling. All user document operations
 * must flow through this function to maintain security guarantees.
 *
 * Security Enforcement:
 * - Validates and sanitizes username before operation
 * - Ensures all operations include user ownership context
 * - Provides comprehensive error handling and logging
 * - Maintains audit trail for security monitoring
 *
 * @template TSchema - Type of the document schema (must extend AnyUserDoc)
 * @param model - Mongoose model storing the user-owned documents
 * @param id - Target document identifier (ObjectId or string)
 * @param username - Username that owns the record (will be validated and sanitized)
 * @param opCallback - Operation to execute when ownership is confirmed
 * @param opCallback.scopedModel - Model with user ownership context
 * @param opCallback.scopedId - Validated document identifier
 * @param opCallback.scopedUsername - Sanitized username for database queries
 * @returns {Promise<HydratedDocument<TSchema> | null>} Hydrated document or null when not found
 * @throws {Error} When username validation fails or operation encounters errors
 */
const performUserDocOp = async <TSchema extends AnyUserDoc>(
  model: Model<TSchema>,
  id: DocumentId,
  username: string,
  opCallback: (
    scopedModel: Model<TSchema>,
    scopedId: DocumentId,
    scopedUsername: string
  ) => Promise<HydratedDocument<TSchema> | null>
): Promise<HydratedDocument<TSchema> | null> => {
  return utils.safeAsync(
    async () => {
      // Execute the operation with validated parameters
      const doc = await opCallback(model, id, username);
      utils.debugLog('performUserDocOp', `operation completed: ${doc ?? 'null'}`);
      return doc;
    },
    'performUserDocOp',
    { id, username }
  );
};

/**
 * Retrieves a user-owned document with strict ownership enforcement
 *
 * This function provides secure document retrieval that ensures users can
 * only access their own documents. It combines ownership validation with
 * database querying to prevent cross-user data access. This is a fundamental
 * security function that maintains data isolation between users.
 *
 * Security Features:
 * - Username validation and sanitization
 * - User ownership enforcement in database query
 * - Comprehensive error handling and logging
 * - Type-safe document retrieval
 *
 * Query Pattern: { _id: id, user: username } - Ensures both ID match AND user ownership
 *
 * @template TSchema - Type of the document schema (must extend AnyUserDoc)
 * @param model - Mongoose model for user-owned documents
 * @param id - Document identifier to retrieve
 * @param username - Username that must own the document
 * @returns {Promise<HydratedDocument<TSchema> | null>} User document or null if not found
 * @throws {Error} When username validation fails or database errors occur
 */
const findUserDoc = async <TSchema extends AnyUserDoc>(
  model: Model<TSchema>,
  id: DocumentId,
  username: string
): Promise<HydratedDocument<TSchema> | null> => {
  const log = utils.getFunctionLogger('findUserDoc');
  const sanitizedUsername = validateAndSanitizeUsername(username, 'findUserDoc');
  log.entry({ id, username: sanitizedUsername });
  const op = (m: Model<TSchema>, i: DocumentId, u: string) =>
    m.findOne({ _id: i, user: u } as FilterQuery<TSchema>).exec();
  utils.debugLog('findUserDoc', 'returning result from performUserDocOp');
  const result = performUserDocOp(model, id, sanitizedUsername, op);
  log.return(result);
  return result;
};

/**
 * Removes a user document ensuring the caller owns the record.
 * @param model User-owned model.
 * @param id Document identifier.
 * @param username User that must own the record.
 * @returns Deleted hydrated document or null when not found.
 */
const deleteUserDoc = async <TSchema extends AnyUserDoc>(
  model: Model<TSchema>,
  id: DocumentId,
  username: string
): Promise<HydratedDocument<TSchema> | null> => {
  const log = utils.getFunctionLogger('deleteUserDoc');
  const sanitizedUsername = validateAndSanitizeUsername(username, 'deleteUserDoc');
  log.entry({ id, username: sanitizedUsername });
  const op = (m: Model<TSchema>, i: DocumentId, u: string) =>
    m.findOneAndDelete({ _id: i, user: u } as FilterQuery<TSchema>).exec();
  utils.debugLog('deleteUserDoc', 'returning result from performUserDocOp');
  const result = performUserDocOp(model, id, sanitizedUsername, op);
  log.return(result);
  return result;
};

/**
 * Executes a user document action, sending a 404 when no record is found.
 * @param model Target model.
 * @param id Document identifier.
 * @param user Owner of the record.
 * @param res Express response to surface not-found results.
 * @param action Operation to execute (must enforce user scope).
 * @param msg Message to use when the document is missing.
 */
const userDocActionOr404 = async <TSchema extends AnyUserDoc>(
  model: Model<TSchema>,
  id: DocumentId,
  user: string,
  res: Response,
  action: (
    scopedModel: Model<TSchema>,
    scopedId: DocumentId,
    scopedUsername: string
  ) => Promise<HydratedDocument<TSchema> | null>,
  msg: string
): Promise<HydratedDocument<TSchema> | undefined> => {
  return utils.safeAsync(
    async () => {
      const log = utils.getFunctionLogger('userDocActionOr404');
      log.entry({ id, user });
      const doc = await action(model, id, user);
      if (doc == null) {
        sendNotFound(res, msg);
        return logAndReturnUndefined(log, 'userDocActionOr404');
      }
      return logAndReturnDoc(log, 'userDocActionOr404', doc);
    },
    'userDocActionOr404',
    {
      action: action.name,
      id,
      user,
      message: msg,
    }
  );
};

/**
 * Fetches a user document, surfacing a 404 when not found.
 */
const fetchUserDocOr404 = async <TSchema extends AnyUserDoc>(
  model: Model<TSchema>,
  id: DocumentId,
  user: string,
  res: Response,
  msg: string
): Promise<HydratedDocument<TSchema> | undefined> => {
  return utils.safeAsync(
    async () => {
      const sanitizedUser = validateAndSanitizeUsername(user, 'fetchUserDocOr404');
      const log = utils.getFunctionLogger('fetchUserDocOr404');
      log.entry({ id, user: sanitizedUser });
      const doc = await userDocActionOr404(model, id, sanitizedUser, res, findUserDoc, msg);
      if (!doc) {
        return logAndReturnUndefined(log, 'fetchUserDocOr404');
      }
      return logAndReturnDoc(log, 'fetchUserDocOr404', doc);
    },
    'fetchUserDocOr404',
    { id, user, message: msg }
  );
};

/**
 * Deletes a user document and surfaces 404 when not found.
 */
const deleteUserDocOr404 = async <TSchema extends AnyUserDoc>(
  model: Model<TSchema>,
  id: DocumentId,
  user: string,
  res: Response,
  msg: string
): Promise<HydratedDocument<TSchema> | undefined> => {
  return utils.safeAsync(
    async () => {
      const sanitizedUser = validateAndSanitizeUsername(user, 'deleteUserDocOr404');
      const log = utils.getFunctionLogger('deleteUserDocOr404');
      log.entry({ id, user: sanitizedUser });
      const doc = await userDocActionOr404(model, id, sanitizedUser, res, deleteUserDoc, msg);
      if (!doc) {
        return logAndReturnUndefined(log, 'deleteUserDocOr404');
      }
      return logAndReturnDoc(log, 'deleteUserDocOr404', doc);
    },
    'deleteUserDocOr404',
    { id, user, message: msg }
  );
};

/**
 * Lists all documents owned by a user with optional sorting and field selection for scalability.
 * Enhanced version with lean query option for better performance and reduced memory usage.
 */
const listUserDocsLean = async <TSchema extends AnyUserDoc>(
  model: Model<TSchema>,
  username: string,
  options: { sort?: Record<string, 1 | -1>; select?: string; limit?: number; skip?: number } = {}
): Promise<Array<any>> => {
  return utils.safeAsync(
    async () => {
      const sanitizedUsername = validateAndSanitizeUsername(username, 'listUserDocsLean');
      const log = utils.getFunctionLogger('listUserDocsLean');
      log.entry({
        username: sanitizedUsername,
        sort: JSON.stringify(options?.sort),
        limit: options?.limit,
        skip: options?.skip,
      });

      const filter: FilterQuery<TSchema> = { user: sanitizedUsername };
      const queryOptions: any = { lean: true };

      options?.select && (queryOptions.select = options.select);
      options?.sort && (queryOptions.sort = options.sort);
      options?.skip && (queryOptions.skip = options.skip);

      const maxLimit = 1000,
        defaultLimit = 100;
      queryOptions.limit = options?.limit ? Math.min(options.limit, maxLimit) : defaultLimit;

      const docs = await model.find(filter, null, queryOptions);

      log.return(docs);
      utils.debugLog('listUserDocsLean', `returning ${docs.length} lean documents`);
      return docs;
    },
    'listUserDocsLean',
    {
      username,
      hasSort: options?.sort !== undefined,
      sortKeys: options?.sort ? Object.keys(options.sort) : undefined,
      hasSelect: options?.select !== undefined,
      selectFields: options?.select,
      hasLimit: options?.limit !== undefined,
      limit: options?.limit,
      hasSkip: options?.skip !== undefined,
      skip: options?.skip,
    }
  );
};

/**
 * Validates uniqueness for user documents by delegating to the shared ensureUnique helper.
 */
const validateDocumentUniqueness = async <TSchema extends AnyUserDoc>(
  model: Model<TSchema>,
  uniqueQuery: FilterQuery<TSchema>,
  res: Response,
  duplicateMsg?: string
): Promise<boolean> => ensureUnique(model, uniqueQuery, res, duplicateMsg);

/**
 * Detects whether any unique fields are changing in the pending update payload.
 */
const hasUniqueFieldChanges = <TSchema extends AnyUserDoc>(
  doc: HydratedDocument<TSchema>,
  fieldsToUpdate: Partial<TSchema>,
  uniqueQuery?: FilterQuery<TSchema>
): boolean =>
  !uniqueQuery
    ? false
    : Object.keys(uniqueQuery).some(key =>
        !(key in fieldsToUpdate)
          ? false
          : (doc as Record<string, unknown>)[key] !==
            (fieldsToUpdate as Record<string, unknown>)[key]
      );

/**
 * Creates a user document after validating uniqueness constraints.
 */
const createUniqueDoc = async <TSchema extends AnyUserDoc>(
  model: Model<TSchema>,
  fields: TSchema,
  uniqueQuery: FilterQuery<TSchema>,
  res: Response,
  duplicateMsg?: string
): Promise<HydratedDocument<TSchema> | undefined> => {
  return utils.safeAsync(
    async () => {
      const log = utils.getFunctionLogger('createUniqueDoc');
      log.entry({
        fields: JSON.stringify(fields ?? {}),
      });
      const isUnique = await validateDocumentUniqueness(model, uniqueQuery, res, duplicateMsg);
      if (!isUnique) {
        return logAndReturnUndefined(log, 'createUniqueDoc');
      }
      const doc = new model(fields);
      const saved = await doc.save();
      return logAndReturnDoc(log, 'createUniqueDoc', saved);
    },
    'createUniqueDoc',
    {
      fieldKeys: Object.keys(fields),
      uniqueQueryKeys: Object.keys(uniqueQuery),
      hasDuplicateMsg: duplicateMsg !== undefined,
    }
  );
};

/**
 * Updates a user document while enforcing ownership and uniqueness rules.
 */
const updateUserDoc = async <TSchema extends AnyUserDoc>(
  model: Model<TSchema>,
  id: DocumentId,
  username: string,
  fieldsToUpdate: Partial<TSchema>,
  uniqueQuery: FilterQuery<TSchema> | undefined,
  res: Response,
  duplicateMsg?: string
): Promise<HydratedDocument<TSchema> | undefined> => {
  return utils.safeAsync(
    async () => {
      const sanitizedUsername = validateAndSanitizeUsername(username, 'updateUserDoc');
      const log = utils.getFunctionLogger('updateUserDoc');
      log.entry({ id, username: sanitizedUsername });
      const updates: Partial<TSchema> = { ...fieldsToUpdate };
      if (Object.prototype.hasOwnProperty.call(updates, 'user')) {
        console.warn(`updateUserDoc ignored user change for doc: ${id}`);
        delete (updates as AnyUserDoc).user;
      }
      const doc = await fetchUserDocOr404(model, id, sanitizedUsername, res, 'Document not found');
      if (!doc) {
        return logAndReturnUndefined(log, 'updateUserDoc');
      }
      if (uniqueQuery && hasUniqueFieldChanges(doc, updates, uniqueQuery)) {
        const uniqueQueryWithExclusion = {
          ...uniqueQuery,
          _id: { $ne: doc._id },
        } as FilterQuery<TSchema>;
        const isStillUnique = await validateDocumentUniqueness(
          model,
          uniqueQueryWithExclusion,
          res,
          duplicateMsg
        );
        if (!isStillUnique) {
          return logAndReturnUndefined(log, 'updateUserDoc');
        }
      }
      Object.assign(doc, updates);
      await doc.save();
      return logAndReturnDoc(log, 'updateUserDoc', doc);
    },
    'updateUserDoc',
    {
      id,
      username,
      updateFieldKeys: Object.keys(fieldsToUpdate),
      hasUniqueQuery: uniqueQuery !== undefined,
      attemptedUserChange: Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'user'),
    }
  );
};

export {
  performUserDocOp,
  findUserDoc,
  deleteUserDoc,
  userDocActionOr404,
  fetchUserDocOr404,
  deleteUserDocOr404,
  listUserDocsLean,
  createUniqueDoc,
  updateUserDoc,
  validateDocumentUniqueness,
  hasUniqueFieldChanges,
};
