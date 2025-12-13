/**
 * Document Operation Functions
 * High-level document manipulation utilities for user-owned documents
 */

const mongoose = require('mongoose');
const { sendNotFound } = require('./http-utils');
const { ensureUnique } = require('./database-utils');
const { logFunctionEntry, logFunctionExit, logFunctionError } = require('./logging-utils');

const logFunctionStart = (functionName, params) => {
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

const performUserDocOp = async (model, id, username, opCallback) => {
  logFunctionStart('performUserDocOp', { id, username });
  logFunctionEntry(opCallback.name, { id, username });
  try {
    const doc = await opCallback(model, id, username);
    logFunctionExit(opCallback.name, doc);
    console.log(`performUserDocOp is returning ${doc}`);
    return doc;
  } catch (error) {
    logFunctionError(opCallback.name, error);
    if (error instanceof mongoose.Error.CastError) {
      logFunctionExit(opCallback.name, 'null due to CastError');
      console.log('performUserDocOp is returning null');
      return null;
    }
    throw error;
  }
};

const findUserDoc = async (model, id, username) => {
  logFunctionStart('findUserDoc', { id, username });
  const op = async (m, i, u) => m.findOne({ _id: i, user: u });
  console.log('findUserDoc is returning result from performUserDocOp');
  return performUserDocOp(model, id, username, op);
};

const deleteUserDoc = async (model, id, username) => {
  logFunctionStart('deleteUserDoc', { id, username });
  const op = async (m, i, u) => m.findOneAndDelete({ _id: i, user: u });
  console.log('deleteUserDoc is returning result from performUserDocOp');
  return performUserDocOp(model, id, username, op);
};

const userDocActionOr404 = async (model, id, user, res, action, msg) => {
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
    logFunctionError('userDocActionOr404', error);
    throw error;
  }
};

const fetchUserDocOr404 = async (model, id, user, res, msg) => {
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
    logFunctionError('fetchUserDocOr404', error);
    throw error;
  }
};

const deleteUserDocOr404 = async (model, id, user, res, msg) => {
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
    logFunctionError('deleteUserDocOr404', error);
    throw error;
  }
};

const listUserDocs = async (model, username, sort) => {
  logFunctionStart('listUserDocs', { username });
  logFunctionEntry('listUserDocs', { username, sort: JSON.stringify(sort) });
  
  try {
    const docs = await model.find({ user: username }).sort(sort);
    logFunctionExit('listUserDocs', docs);
    console.log(`listUserDocs is returning ${docs}`);
    return docs;
  } catch (error) {
    logFunctionError('listUserDocs', error);
    throw error;
  }
};

const validateDocumentUniqueness = async (model, uniqueQuery, res, duplicateMsg) => await ensureUnique(model, uniqueQuery, res, duplicateMsg);

function hasUniqueFieldChanges(doc, fieldsToUpdate, uniqueQuery) {
  if (!uniqueQuery) return false;
  return Object.keys(uniqueQuery).some((key) => key in fieldsToUpdate && doc[key] !== fieldsToUpdate[key]);
}

const createUniqueDoc = async (model, fields, uniqueQuery, res, duplicateMsg) => {
  logFunctionStart('createUniqueDoc');
  logFunctionEntry('createUniqueDoc', { fields: JSON.stringify(fields) });
  
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
    logFunctionError('createUniqueDoc', error);
    throw error;
  }
};

const updateUserDoc = async (model, id, username, fieldsToUpdate, uniqueQuery, res, duplicateMsg) => {
  logFunctionStart('updateUserDoc', { id, username });
  logFunctionEntry('updateUserDoc', { id, username });

  try {
    const updates = { ...fieldsToUpdate };

    if (Object.prototype.hasOwnProperty.call(updates, 'user')) {
      console.warn(`updateUserDoc ignored user change for doc: ${id}`);
      delete updates.user;
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
    logFunctionError('updateUserDoc', error);
    throw error;
  }
};

module.exports = {
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