/**
 * Document Operation Functions
 * High-level document manipulation utilities for user-owned documents
 */

// 🚩AI: ENTRY_POINT_FOR_USER_DOCUMENT_OPERATIONS

import mongoose, { Model, Document, Error } from 'mongoose';
import { sendNotFound } from './http-utils.js';
import { ensureUnique } from './database-utils.js';
import { logFunctionEntry, logFunctionExit, logFunctionError } from './logging-utils.js';

// Express Response interface
interface Response {
  status(code: number): Response;
  json(data: any): Response;
}

// Interface for user-owned documents
interface UserDocument extends Document {
  user: string;
}

// Type for operation callback functions
type OperationCallback<T extends Document> = (
  model: Model<T>, 
  id: string | mongoose.Types.ObjectId, 
  username: string
) => Promise<T | null>;

const logFunctionStart = (functionName: string, params: any): void => {
  if (params && typeof params === 'object') {
    const paramString = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    console.log(`${functionName} is running${paramString ? ' with ' + paramString : ''}`);
  } else {
    console.log(`${functionName} is running`);
  }
};

// 🚩AI: CORE_USER_OWNERSHIP_ENFORCEMENT
const performUserDocOp = async <T extends UserDocument>(
  model: Model<T>,
  id: string | mongoose.Types.ObjectId,
  username: string,
  opCallback: OperationCallback<T>
): Promise<T | null> => {
  logFunctionStart('performUserDocOp', { id, username });
  logFunctionEntry(opCallback.name, { id, username });
  try {
    const doc = await opCallback(model, id, username); // enforces user ownership in all operations
    logFunctionExit(opCallback.name, doc);
    console.log(`performUserDocOp is returning ${doc}`);
    return doc;
  } catch (error) {
    logFunctionError(opCallback.name, error as Error);
    if (error instanceof mongoose.Error.CastError) {
      logFunctionExit(opCallback.name, 'null due to CastError');
      console.log('performUserDocOp is returning null');
      return null;
    }
    throw error;
  }
};

const findUserDoc = async <T extends UserDocument>(
  model: Model<T>,
  id: string | mongoose.Types.ObjectId,
  username: string
): Promise<T | null> => {
  logFunctionStart('findUserDoc', { id, username });
  const op: OperationCallback<T> = async (m, i, u) => m.findOne({ _id: i, user: u });
  console.log('findUserDoc is returning result from performUserDocOp');
  return performUserDocOp(model, id, username, op);
};

const deleteUserDoc = async <T extends UserDocument>(
  model: Model<T>,
  id: string | mongoose.Types.ObjectId,
  username: string
): Promise<T | null> => {
  logFunctionStart('deleteUserDoc', { id, username });
  const op: OperationCallback<T> = async (m, i, u) => m.findOneAndDelete({ _id: i, user: u });
  console.log('deleteUserDoc is returning result from performUserDocOp');
  return performUserDocOp(model, id, username, op);
};

const userDocActionOr404 = async <T extends UserDocument>(
  model: Model<T>,
  id: string | mongoose.Types.ObjectId,
  user: string,
  res: Response,
  action: OperationCallback<T>,
  msg: string
): Promise<T | undefined> => {
  logFunctionStart('userDocActionOr404', { id, user });
  logFunctionEntry('userDocActionOr404', { id, user });
  
  try {
    const doc = await action(model, id, user);
    if (doc == null) {
      sendNotFound(res, msg);
      logFunctionExit('userDocActionOr404', 'undefined');
      console.log('userDocActionOr404 is returning undefined');
      return;
    }
    logFunctionExit('userDocActionOr404', doc);
    console.log(`userDocActionOr404 is returning ${doc}`);
    return doc;
  } catch (error) {
    logFunctionError('userDocActionOr404', error as Error);
    throw error;
  }
};

const fetchUserDocOr404 = async <T extends UserDocument>(
  model: Model<T>,
  id: string | mongoose.Types.ObjectId,
  user: string,
  res: Response,
  msg: string
): Promise<T | undefined> => {
  logFunctionStart('fetchUserDocOr404', { id, user });
  logFunctionEntry('fetchUserDocOr404', { id, user });
  
  try {
    const doc = await userDocActionOr404(model, id, user, res, findUserDoc, msg);
    if (!doc) {
      logFunctionExit('fetchUserDocOr404', 'undefined');
      console.log('fetchUserDocOr404 is returning undefined');
      return;
    }
    logFunctionExit('fetchUserDocOr404', doc);
    console.log(`fetchUserDocOr404 is returning ${doc}`);
    return doc;
  } catch (error) {
    logFunctionError('fetchUserDocOr404', error as Error);
    throw error;
  }
};

const deleteUserDocOr404 = async <T extends UserDocument>(
  model: Model<T>,
  id: string | mongoose.Types.ObjectId,
  user: string,
  res: Response,
  msg: string
): Promise<T | undefined> => {
  logFunctionStart('deleteUserDocOr404', { id, user });
  logFunctionEntry('deleteUserDocOr404', { id, user });
  
  try {
    const doc = await userDocActionOr404(model, id, user, res, deleteUserDoc, msg);
    if (!doc) {
      logFunctionExit('deleteUserDocOr404', 'undefined');
      console.log('deleteUserDocOr404 is returning undefined');
      return;
    }
    logFunctionExit('deleteUserDocOr404', doc);
    console.log(`deleteUserDocOr404 is returning ${doc}`);
    return doc;
  } catch (error) {
    logFunctionError('deleteUserDocOr404', error as Error);
    throw error;
  }
};

const listUserDocs = async <T extends UserDocument>(
  model: Model<T>,
  username: string,
  sort: any
): Promise<T[]> => {
  logFunctionStart('listUserDocs', { username });
  logFunctionEntry('listUserDocs', { username, sort: JSON.stringify(sort) });
  
  try {
    const docs = await model.find({ user: username }).sort(sort);
    logFunctionExit('listUserDocs', docs);
    console.log(`listUserDocs is returning ${docs}`);
    return docs;
  } catch (error) {
    logFunctionError('listUserDocs', error as Error);
    throw error;
  }
};

const validateDocumentUniqueness = async (
  model: Model<any>,
  uniqueQuery: any,
  res: Response,
  duplicateMsg?: string
): Promise<boolean> => {
  return await ensureUnique(model, uniqueQuery, res, duplicateMsg);
};

function hasUniqueFieldChanges(doc: any, fieldsToUpdate: any, uniqueQuery: any): boolean {
  if (!uniqueQuery) return false;
  return Object.keys(uniqueQuery).some((key) => key in fieldsToUpdate && doc[key] !== fieldsToUpdate[key]);
}

const createUniqueDoc = async <T extends UserDocument>(
  model: Model<T>,
  fields: Partial<T>,
  uniqueQuery: any,
  res: Response,
  duplicateMsg?: string
): Promise<T | undefined> => {
  logFunctionStart('createUniqueDoc', {});
  logFunctionEntry('createUniqueDoc', { fields: JSON.stringify(fields || {}) });
  
  try {
    if (!(await validateDocumentUniqueness(model, uniqueQuery, res, duplicateMsg))) {
      logFunctionExit('createUniqueDoc', 'undefined');
      console.log('createUniqueDoc is returning undefined');
      return;
    }
    
    const doc = new model(fields);
    const saved = await doc.save();
    
    logFunctionExit('createUniqueDoc', saved);
    console.log(`createUniqueDoc is returning ${saved}`);
    return saved;
  } catch (error) {
    logFunctionError('createUniqueDoc', error as Error);
    throw error;
  }
};

const updateUserDoc = async <T extends UserDocument>(
  model: Model<T>,
  id: string | mongoose.Types.ObjectId,
  username: string,
  fieldsToUpdate: Partial<T>,
  uniqueQuery: any,
  res: Response,
  duplicateMsg?: string
): Promise<T | undefined> => {
  logFunctionStart('updateUserDoc', { id, username });
  logFunctionEntry('updateUserDoc', { id, username });

  try {
    const updates = { ...fieldsToUpdate };

    if (Object.prototype.hasOwnProperty.call(updates, 'user')) {
      console.warn(`updateUserDoc ignored user change for doc: ${id}`);
      delete (updates as any).user;
    }
    
    const doc = await fetchUserDocOr404(model, id, username, res, 'Document not found');
    
    if (!doc) {
      logFunctionExit('updateUserDoc', 'undefined');
      console.log('updateUserDoc is returning undefined');
      return;
    }
    
    if (hasUniqueFieldChanges(doc, updates, uniqueQuery)) {
      const uniqueQueryWithExclusion = {
        ...uniqueQuery,
        _id: { $ne: doc._id }
      };
      
      if (!(await validateDocumentUniqueness(model, uniqueQueryWithExclusion, res, duplicateMsg))) {
        logFunctionExit('updateUserDoc', 'undefined');
        console.log('updateUserDoc is returning undefined');
        return;
      }
    }
    
    Object.assign(doc, updates);
    await doc.save();
    
    logFunctionExit('updateUserDoc', doc);
    console.log(`updateUserDoc is returning ${doc}`);
    return doc;
  } catch (error) {
    logFunctionError('updateUserDoc', error as Error);
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
  hasUniqueFieldChanges
};