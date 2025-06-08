
/**
 * Document Operation Functions
 * High-level document manipulation utilities for user-owned documents
 */

const mongoose = require('mongoose');
const { sendNotFound } = require('./http-utils');
const { ensureUnique } = require('./database-utils');

/**
 * Executes a document operation with error handling
 * @param {Object} model - Mongoose model
 * @param {string} id - Document ID
 * @param {string} username - Username for ownership check
 * @param {Function} opCallback - Operation callback function
 * @returns {Object|null} Document or null
 */
async function performUserDocOp(model, id, username, opCallback) {
  console.log(`${opCallback.name} is running with ${id}, ${username}`);
  try {
    const doc = await opCallback(model, id, username);
    console.log(`${opCallback.name} is returning ${doc}`);
    return doc;
  } catch (error) {
    console.error(`${opCallback.name} error`, error);
    if (error instanceof mongoose.Error.CastError) {
      console.log(`${opCallback.name} is returning null due to CastError`);
      return null;
    }
    throw error;
  }
}

/**
 * Finds a document by id and username
 * Wraps model.findOne and centralizes user ownership checks for reusability.
 * @param {Object} model - Mongoose model
 * @param {string} id - Document ID
 * @param {string} username - Username for ownership check
 * @returns {Object|null} Document or null
 */
async function findUserDoc(model, id, username) {
  const op = async function findUserDoc(m, i, u) {
    return m.findOne({ _id: i, user: u });
  };
  return performUserDocOp(model, id, username, op);
}

/**
 * Deletes a document by id and username
 * Wraps model.findOneAndDelete for consistent deletion and user checks.
 * @param {Object} model - Mongoose model
 * @param {string} id - Document ID
 * @param {string} username - Username for ownership check
 * @returns {Object|null} Deleted document or null
 */
async function deleteUserDoc(model, id, username) {
  const op = async function deleteUserDoc(m, i, u) {
    return m.findOneAndDelete({ _id: i, user: u });
  };
  return performUserDocOp(model, id, username, op);
}

/**
 * Executes a document action and sends 404 if missing
 * Centralizes logic for fetching or deleting a user owned document.
 * @param {Object} model - Mongoose model
 * @param {string} id - Document ID
 * @param {string} user - Username
 * @param {Object} res - Express response object
 * @param {Function} action - Action function to execute
 * @param {string} msg - Message for 404 response
 * @returns {Object|undefined} Document or undefined
 */
async function userDocActionOr404(model, id, user, res, action, msg) {
  console.log(`userDocActionOr404 is running with ${id}, ${user}`);
  try {
    const doc = await action(model, id, user);
    if (doc == null) {
      sendNotFound(res, msg);
      console.log(`userDocActionOr404 is returning undefined`);
      return;
    }
    console.log(`userDocActionOr404 is returning ${doc}`);
    return doc;
  } catch (error) {
    console.error('userDocActionOr404 error', error);
    throw error;
  }
}

/**
 * Fetches a user document or sends a 404 response
 * Combines findUserDoc with not-found handling for repeated use in controllers.
 * @param {Object} model - Mongoose model
 * @param {string} id - Document ID
 * @param {string} user - Username
 * @param {Object} res - Express response object
 * @param {string} msg - Message for 404 response
 * @returns {Object|undefined} Document or undefined
 */
async function fetchUserDocOr404(model, id, user, res, msg) {
  console.log(`fetchUserDocOr404 is running with ${id}, ${user}`);
  try {
    const doc = await userDocActionOr404(model, id, user, res, findUserDoc, msg);
    if (!doc) {
      console.log(`fetchUserDocOr404 is returning undefined`);
      return;
    }
    console.log(`fetchUserDocOr404 is returning ${doc}`);
    return doc;
  } catch (error) {
    console.error('fetchUserDocOr404 error', error);
    throw error;
  }
}

/**
 * Deletes a user document or sends a 404 response
 * Combines deleteUserDoc with not-found handling for repeated use in controllers.
 * @param {Object} model - Mongoose model
 * @param {string} id - Document ID
 * @param {string} user - Username
 * @param {Object} res - Express response object
 * @param {string} msg - Message for 404 response
 * @returns {Object|undefined} Deleted document or undefined
 */
async function deleteUserDocOr404(model, id, user, res, msg) {
  console.log(`deleteUserDocOr404 is running with ${id}, ${user}`);
  try {
    const doc = await userDocActionOr404(model, id, user, res, deleteUserDoc, msg);
    if (!doc) {
      console.log(`deleteUserDocOr404 is returning undefined`);
      return;
    }
    console.log(`deleteUserDocOr404 is returning ${doc}`);
    return doc;
  } catch (error) {
    console.error('deleteUserDocOr404 error', error);
    throw error;
  }
}

/**
 * Lists documents owned by a user with optional sorting
 * Wraps model.find for reuse across controllers.
 * @param {Object} model - Mongoose model
 * @param {string} username - Username
 * @param {Object} sort - Sort configuration object
 * @returns {Array} Array of documents
 */
async function listUserDocs(model, username, sort) {
  console.log(`listUserDocs is running with ${username}, ${JSON.stringify(sort)}`);
  try {
    const docs = await model.find({ user: username }).sort(sort);
    console.log(`listUserDocs is returning ${docs}`);
    return docs;
  } catch (error) {
    console.error('listUserDocs error', error);
    throw error;
  }
}

/**
 * Creates and saves a new document if the unique query has no match
 * Centralizes duplicate checks and saves for repeated use in controllers.
 * @param {Object} model - Mongoose model
 * @param {Object} fields - Fields for new document
 * @param {Object} uniqueQuery - Query to check for uniqueness
 * @param {Object} res - Express response object
 * @param {string} duplicateMsg - Message for duplicate response
 * @returns {Object|undefined} Created document or undefined
 */
async function createUniqueDoc(model, fields, uniqueQuery, res, duplicateMsg) {
  console.log(`createUniqueDoc is running with ${JSON.stringify(fields)}`);
  try {
    if (!(await ensureUnique(model, uniqueQuery, res, duplicateMsg))) {
      console.log('createUniqueDoc is returning undefined');
      return;
    }
    const doc = new model(fields);
    const saved = await doc.save();
    console.log(`createUniqueDoc is returning ${saved}`);
    return saved;
  } catch (error) {
    console.error('createUniqueDoc error', error);
    throw error;
  }
}

/**
 * Updates a document owned by a user after optional uniqueness check
 * Combines fetchUserDocOr404 and ensureUnique for repeated update logic.
 * @param {Object} model - Mongoose model
 * @param {string} id - Document ID
 * @param {string} username - Username
 * @param {Object} fieldsToUpdate - Fields to update
 * @param {Object} uniqueQuery - Query to check for uniqueness (optional)
 * @param {Object} res - Express response object
 * @param {string} duplicateMsg - Message for duplicate response
 * @returns {Object|undefined} Updated document or undefined
 */
async function updateUserDoc(model, id, username, fieldsToUpdate, uniqueQuery, res, duplicateMsg) {
  console.log(`updateUserDoc is running with ${id}, ${username}`);
  try {
    const doc = await fetchUserDocOr404(model, id, username, res, 'Document not found');
    if (!doc) {
      console.log('updateUserDoc is returning undefined');
      return;
    }
    if (
      uniqueQuery &&
      Object.keys(uniqueQuery).some(
        (key) => key in fieldsToUpdate && doc[key] !== fieldsToUpdate[key]
      )
    ) {
      if (!(await ensureUnique(model, uniqueQuery, res, duplicateMsg))) {
        console.log('updateUserDoc is returning undefined');
        return;
      }
    }
    Object.assign(doc, fieldsToUpdate);
    await doc.save();
    console.log(`updateUserDoc is returning ${doc}`);
    return doc;
  } catch (error) {
    console.error('updateUserDoc error', error);
    throw error;
  }
}

module.exports = {
  performUserDocOp,
  findUserDoc,
  deleteUserDoc,
  userDocActionOr404,
  fetchUserDocOr404,
  deleteUserDocOr404,
  listUserDocs,
  createUniqueDoc,
  updateUserDoc
};
