/**
 * Document Operation Functions
 * High-level document manipulation utilities for user-owned documents
 */
// 🚩AI: ENTRY_POINT_FOR_USER_DOCUMENT_OPERATIONS
import mongoose, { Model, HydratedDocument, FilterQuery, AnyObject, Types } from 'mongoose';
import type { Response } from 'express';
import { sendNotFound } from './http-utils.js';
import { ensureUnique } from './database-utils.js';
import { logFunctionEntry, logFunctionExit, logFunctionError } from './logging-utils.js';
import qerrors from 'qerrors';

type AnyUserDoc = AnyObject & { user: string };
type DocumentId = Types.ObjectId | string;

const logFunctionStart = (functionName: string, params?: Record<string, unknown>): void => {
  if (params && typeof params === 'object') {
    const paramString = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    console.log(`${functionName} is running${paramString ? ` with ${paramString}` : ''}`);
  } else {
    console.log(`${functionName} is running`);
  }
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
  logFunctionStart('performUserDocOp', { id, username });
  logFunctionEntry(opCallback.name, { id, username });
  try {
    const doc = await opCallback(model, id, username);
    logFunctionExit(opCallback.name, doc);
    console.log(`performUserDocOp is returning ${doc ?? 'null'}`);
    return doc;
  } catch (error) {
    qerrors.qerrors(error as Error, 'document-ops.performUserDocOp', {
      operation: opCallback.name,
      id,
      username,
      isCastError: error instanceof mongoose.Error.CastError,
    });
    logFunctionError(opCallback.name, error);
    if (error instanceof mongoose.Error.CastError) {
      logFunctionExit(opCallback.name, 'null due to CastError');
      console.log('performUserDocOp is returning null');
      return null;
    }
    throw error;
  }
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
  logFunctionStart('findUserDoc', { id, username });
  const op = (m: Model<TSchema>, i: DocumentId, u: string) =>
    m.findOne({ _id: i, user: u } as FilterQuery<TSchema>).exec();
  console.log('findUserDoc is returning result from performUserDocOp');
  return performUserDocOp(model, id, username, op);
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
  logFunctionStart('deleteUserDoc', { id, username });
  const op = (m: Model<TSchema>, i: DocumentId, u: string) =>
    m.findOneAndDelete({ _id: i, user: u } as FilterQuery<TSchema>).exec();
  console.log('deleteUserDoc is returning result from performUserDocOp');
  return performUserDocOp(model, id, username, op);
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
  logFunctionStart('userDocActionOr404', { id, user });
  logFunctionEntry('userDocActionOr404', { id, user });
  try {
    const doc = await action(model, id, user);
    if (doc == null) {
      sendNotFound(res, msg);
      logFunctionExit('userDocActionOr404', 'undefined');
      console.log('userDocActionOr404 is returning undefined');
      return undefined;
    }
    logFunctionExit('userDocActionOr404', doc);
    console.log(`userDocActionOr404 is returning ${doc}`);
    return doc;
  } catch (error) {
    qerrors.qerrors(error as Error, 'document-ops.userDocActionOr404', {
      action: action.name,
      id,
      user,
      message: msg,
    });
    logFunctionError('userDocActionOr404', error);
    throw error;
  }
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
  logFunctionStart('fetchUserDocOr404', { id, user });
  logFunctionEntry('fetchUserDocOr404', { id, user });
  try {
    const doc = await userDocActionOr404(model, id, user, res, findUserDoc, msg);
    if (!doc) {
      logFunctionExit('fetchUserDocOr404', 'undefined');
      console.log('fetchUserDocOr404 is returning undefined');
      return undefined;
    }
    logFunctionExit('fetchUserDocOr404', doc);
    console.log(`fetchUserDocOr404 is returning ${doc}`);
    return doc;
  } catch (error) {
    qerrors.qerrors(error as Error, 'document-ops.fetchUserDocOr404', {
      id,
      user,
      message: msg,
    });
    logFunctionError('fetchUserDocOr404', error);
    throw error;
  }
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
  logFunctionStart('deleteUserDocOr404', { id, user });
  logFunctionEntry('deleteUserDocOr404', { id, user });
  try {
    const doc = await userDocActionOr404(model, id, user, res, deleteUserDoc, msg);
    if (!doc) {
      logFunctionExit('deleteUserDocOr404', 'undefined');
      console.log('deleteUserDocOr404 is returning undefined');
      return undefined;
    }
    logFunctionExit('deleteUserDocOr404', doc);
    console.log(`deleteUserDocOr404 is returning ${doc}`);
    return doc;
  } catch (error) {
    qerrors.qerrors(error as Error, 'document-ops.deleteUserDocOr404', {
      id,
      user,
      message: msg,
    });
    logFunctionError('deleteUserDocOr404', error);
    throw error;
  }
};

/**
 * Lists all documents owned by a user with optional sorting.
 */
const listUserDocs = async <TSchema extends AnyUserDoc>(
  model: Model<TSchema>,
  username: string,
  sort?: Record<string, 1 | -1>
): Promise<Array<HydratedDocument<TSchema>>> => {
  logFunctionStart('listUserDocs', { username });
  logFunctionEntry('listUserDocs', { username, sort: JSON.stringify(sort) });
  try {
    const docs = await model
      .find({ user: username } as FilterQuery<TSchema>)
      .sort(sort ?? {})
      .exec();
    logFunctionExit('listUserDocs', docs);
    console.log(`listUserDocs is returning ${docs.length} documents`);
    return docs;
  } catch (error) {
    qerrors.qerrors(error as Error, 'document-ops.listUserDocs', {
      username,
      hasSort: sort !== undefined,
      sortKeys: sort ? Object.keys(sort) : undefined,
    });
    logFunctionError('listUserDocs', error);
    throw error;
  }
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
): boolean => {
  if (!uniqueQuery) {
    return false;
  }
  return Object.keys(uniqueQuery).some(key => {
    if (!(key in fieldsToUpdate)) {
      return false;
    }
    return (
      (doc as Record<string, unknown>)[key] !== (fieldsToUpdate as Record<string, unknown>)[key]
    );
  });
};

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
  logFunctionStart('createUniqueDoc', {});
  logFunctionEntry('createUniqueDoc', { fields: JSON.stringify(fields ?? {}) });
  try {
    const isUnique = await validateDocumentUniqueness(model, uniqueQuery, res, duplicateMsg);
    if (!isUnique) {
      logFunctionExit('createUniqueDoc', 'undefined');
      console.log('createUniqueDoc is returning undefined');
      return undefined;
    }
    const doc = new model(fields);
    const saved = await doc.save();
    logFunctionExit('createUniqueDoc', saved);
    console.log(`createUniqueDoc is returning ${saved}`);
    return saved;
  } catch (error) {
    qerrors.qerrors(error as Error, 'document-ops.createUniqueDoc', {
      fieldKeys: Object.keys(fields),
      uniqueQueryKeys: Object.keys(uniqueQuery),
      hasDuplicateMsg: duplicateMsg !== undefined,
    });
    logFunctionError('createUniqueDoc', error);
    throw error;
  }
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
  logFunctionStart('updateUserDoc', { id, username });
  logFunctionEntry('updateUserDoc', { id, username });
  try {
    const updates: Partial<TSchema> = { ...fieldsToUpdate };
    if (Object.prototype.hasOwnProperty.call(updates, 'user')) {
      console.warn(`updateUserDoc ignored user change for doc: ${id}`);
      delete (updates as AnyUserDoc).user;
    }
    const doc = await fetchUserDocOr404(model, id, username, res, 'Document not found');
    if (!doc) {
      logFunctionExit('updateUserDoc', 'undefined');
      console.log('updateUserDoc is returning undefined');
      return undefined;
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
        logFunctionExit('updateUserDoc', 'undefined');
        console.log('updateUserDoc is returning undefined');
        return undefined;
      }
    }
    Object.assign(doc, updates);
    await doc.save();
    logFunctionExit('updateUserDoc', doc);
    console.log(`updateUserDoc is returning ${doc}`);
    return doc;
  } catch (error) {
    qerrors.qerrors(error as Error, 'document-ops.updateUserDoc', {
      id,
      username,
      updateFieldKeys: Object.keys(fieldsToUpdate),
      hasUniqueQuery: uniqueQuery !== undefined,
      attemptedUserChange: Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'user'),
    });
    logFunctionError('updateUserDoc', error);
    throw error;
  }
};

export {
  performUserDocOp,
  findUserDoc,
  deleteUserDoc,
  userDocActionOr404,
  fetchUserDocOr404,
  deleteUserDocOr404,
  listUserDocs,
  createUniqueDoc,
  updateUserDoc,
  validateDocumentUniqueness,
  hasUniqueFieldChanges,
};
