
/**
 * My NPM Module
 * A simple Node.js module with database utilities
 * 
 * This serves as the main entry point for the NPM module, organizing and re-exporting
 * functionality from specialized modules in the /lib directory. This approach follows
 * the barrel pattern, providing a clean public API while maintaining internal code
 * organization.
 * 
 * Design rationale: By separating concerns into different modules and re-exporting
 * them here, we achieve better maintainability, testability, and allow consumers
 * to import everything from a single location while keeping the internal structure
 * flexible for future changes.
 */

// Import organized modules - each module handles a specific domain of functionality
// This separation allows for easier testing, maintenance, and selective importing
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
// This barrel export pattern provides a single import point for consumers
// while maintaining internal organization. Each category is grouped logically
// to help consumers understand the available functionality at a glance.
module.exports = {
  // HTTP utilities - Express.js response helpers
  // Centralized HTTP response handling reduces duplication across controllers
  sendNotFound,

  // Database utilities - MongoDB connection and validation helpers
  // These functions provide robust database interaction patterns with proper error handling
  ensureMongoDB,
  ensureUnique,

  // Document operations - High-level document manipulation utilities
  // These encapsulate common CRUD patterns for user-owned documents,
  // reducing boilerplate in application controllers and ensuring consistent behavior
  performUserDocOp,
  findUserDoc,
  deleteUserDoc,
  userDocActionOr404,
  fetchUserDocOr404,
  deleteUserDocOr404,
  listUserDocs,
  createUniqueDoc,
  updateUserDoc,

  // Storage - In-memory storage implementation and singleton instance
  // Provides both the class for custom instantiation and a ready-to-use singleton
  MemStorage,
  storage
};
