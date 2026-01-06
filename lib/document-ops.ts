/**
 * Document Operation Functions
 * High-level document manipulation utilities for user-owned documents
 */
// 🚩AI: ENTRY_POINT_FOR_USER_DOCUMENT_OPERATIONS
import mongoose, { Model, HydratedDocument, FilterQuery, AnyObject, Types } from 'mongoose';
import type { Response } from 'express';
import { sendNotFound } from './http-utils.js';
import { ensureUnique } from './database-utils.js';
import { createModuleUtilities } from './common-patterns.js';
import { ErrorFactory } from './core/centralized-errors';

type AnyUserDoc = AnyObject & { user: string };
type DocumentId = Types.ObjectId | string;

// Create module-specific utilities
const utils = createModuleUtilities('document-ops');

// Helper functions to eliminate duplicate logging patterns
const logAndReturnUndefined = (log: any, functionName: string): undefined => {
  log.return('undefined');
  utils.debugLog(functionName, 'returning undefined');
  return undefined;
};

const logAndReturnDoc = (log: any, functionName: string, doc: any): any => {
  log.return(doc);
  utils.debugLog(functionName, 'returning document');
  return doc;
};

// 🚩AI: CORE_USER_OWNERSHIP_ENFORCEMENT
/**
 * Executes a user-scoped document operation while centralizing ownership enforcement.
 * @param model Model storing the user-owned documents.
 * @param id Target document identifier.
 * @param username User name that owns the record.
 * @param opCallback Operation to execute when ownership is confirmed.
 * @returns Hydrated document or null when not found.
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
      const doc = await opCallback(model, id, username);
      utils.debugLog('performUserDocOp', `operation completed: ${doc ?? 'null'}`);
      return doc;
    },
    'performUserDocOp',
    { id, username }
  );
};

/**
 * Looks up a user document ensuring the caller only sees their own record.
 * @param model User-owned model.
 * @param id Document identifier.
 * @param username User that must own the record.
 * @returns Hydrated document or null when not found.
 */
const findUserDoc = async <TSchema extends AnyUserDoc>(
  model: Model<TSchema>,
  id: DocumentId,
  username: string
): Promise<HydratedDocument<TSchema> | null> => {
  const log = utils.getFunctionLogger('findUserDoc');
  log.entry({ id, username });
  const op = (m: Model<TSchema>, i: DocumentId, u: string) =>
    m.findOne({ _id: i, user: u } as FilterQuery<TSchema>).exec();
  utils.debugLog('findUserDoc', 'returning result from performUserDocOp');
  const result = performUserDocOp(model, id, username, op);
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
  log.entry({ id, username });
  const op = (m: Model<TSchema>, i: DocumentId, u: string) =>
    m.findOneAndDelete({ _id: i, user: u } as FilterQuery<TSchema>).exec();
  utils.debugLog('deleteUserDoc', 'returning result from performUserDocOp');
  const result = performUserDocOp(model, id, username, op);
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
      const log = utils.getFunctionLogger('fetchUserDocOr404');
      log.entry({ id, user });
      const doc = await userDocActionOr404(model, id, user, res, findUserDoc, msg);
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
      const log = utils.getFunctionLogger('deleteUserDocOr404');
      log.entry({ id, user });
      const doc = await userDocActionOr404(model, id, user, res, deleteUserDoc, msg);
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
      const log = utils.getFunctionLogger('listUserDocsLean');
      log.entry({
        username,
        sort: JSON.stringify(options?.sort),
        limit: options?.limit,
        skip: options?.skip,
      });

      const filter: FilterQuery<TSchema> = { user: username };
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
      const log = utils.getFunctionLogger('updateUserDoc');
      log.entry({ id, username });
      const updates: Partial<TSchema> = { ...fieldsToUpdate };
      if (Object.prototype.hasOwnProperty.call(updates, 'user')) {
        console.warn(`updateUserDoc ignored user change for doc: ${id}`);
        delete (updates as AnyUserDoc).user;
      }
      const doc = await fetchUserDocOr404(model, id, username, res, 'Document not found');
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
