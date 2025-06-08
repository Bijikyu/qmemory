/**
 * My NPM Module
 * A simple Node.js module with database utilities
 */

// Import organized modules
const { greet, add, isEven } = require('./lib/utils');
const { sendNotFound } = require('./lib/http-utils');
const { ensureMongoDB, ensureUnique } = require('./lib/database-utils');
const {
  performUserDocOp,
  findUserDoc,
  deleteUserDoc,
  userDocActionOr404,
  fetchUserDocOr404,
  deleteUserDocOr404,
  listUserDocs,
  createUniqueDoc,
  updateUserDoc
} = require('./lib/document-ops');
const { MemStorage, storage } = require('./lib/storage');

// Export all functions for use as a module
module.exports = {
  // Basic utilities
  greet,
  add,
  isEven,

  // HTTP utilities
  sendNotFound,

  // Database utilities
  ensureMongoDB,
  ensureUnique,

  // Document operations
  performUserDocOp,
  findUserDoc,
  deleteUserDoc,
  userDocActionOr404,
  fetchUserDocOr404,
  deleteUserDocOr404,
  listUserDocs,
  createUniqueDoc,
  updateUserDoc,

  // Storage
  MemStorage,
  storage
};