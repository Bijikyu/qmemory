
/**
 * My NPM Module
 * A simple Node.js module with database utilities
 */

const mongoose = require('mongoose');

/**
 * Sends a 404 Not Found response with a message
 * @param {Object} res - Express response object
 * @param {string} message - Error message to send
 */
function sendNotFound(res, message) {
  res.status(404).json({ message });
}

/**
 * Checks if a document with the given query exists
 * @param {Object} model - Mongoose model
 * @param {Object} query - Query to check for uniqueness
 * @param {Object} res - Express response object
 * @param {string} duplicateMsg - Message to send if duplicate found
 * @returns {boolean} True if unique, false if duplicate exists
 */
async function ensureUnique(model, query, res, duplicateMsg) {
  console.log(`ensureUnique is checking query: ${JSON.stringify(query)}`);
  try {
    const existing = await model.findOne(query);
    if (existing) {
      res.status(409).json({ message: duplicateMsg });
      console.log('ensureUnique found duplicate');
      return false;
    }
    console.log('ensureUnique passed - no duplicates');
    return true;
  } catch (error) {
    console.error('ensureUnique error', error);
    throw error;
  }
}

/**
 * Example function that greets a user
 * @param {string} name - The name to greet
 * @returns {string} A greeting message
 */
function greet(name = 'World') {
  return `Hello, ${name}!`;
}

/**
 * Example function that adds two numbers
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Sum of a and b
 */
function add(a, b) {
  return a + b;
}

/**
 * Example function that checks if a number is even
 * @param {number} num - Number to check
 * @returns {boolean} True if even, false if odd
 */
function isEven(num) {
  return num % 2 === 0;
}

/**
 * Database availability validation utility
 * 
 * This function checks the MongoDB connection state before allowing operations
 * that require database access. It provides graceful degradation by responding
 * with appropriate HTTP errors when the database is unavailable.
 * 
 * Connection state validation: Uses Mongoose connection readyState to determine
 * if the database is ready for operations. State 1 indicates a successful
 * connection, while other states represent disconnected, connecting, or error states.
 * 
 * Design rationale: Prevents database operations from failing with unclear errors
 * by checking connectivity upfront. This approach provides better user experience
 * and clearer error messages when database issues occur.
 * 
 * Error handling strategy: Sends appropriate HTTP status codes (503 for service
 * unavailable, 500 for unexpected errors) to inform clients about the specific
 * nature of the database issue.
 * 
 * @param {Object} res - Express response object for sending database error responses
 * @returns {boolean} Boolean indicating whether database is available for operations
 * 
 * Side effects: Sends HTTP error responses when database is unavailable
 * Usage pattern: Controllers should check this before database operations
 */
function ensureMongoDB(res) {
  console.log(`Checking database availability - connection state: ${mongoose.connection.readyState}`);
  
  try {
    // Check if MongoDB connection is in ready state (1 = connected)
    // Other states: 0 = disconnected, 2 = connecting, 3 = disconnecting
    if (mongoose.connection.readyState !== 1) {
      // Send HTTP 503 Service Unavailable for database connectivity issues
      res.status(503).json({ message: 'Database functionality unavailable' });
      console.log('Database check failed - connection not ready');
      return false;
    }
    
    console.log('Database check passed - connection ready');
    return true;
  } catch (error) {
    // Handle unexpected errors during connection state checking
    console.error('Database availability check error:', error);
    
    // Send HTTP 500 Internal Server Error for unexpected database issues
    res.status(500).json({ message: 'Error checking database connection' });
    return false;
  }
}

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

/**
 * In-Memory Storage Implementation - Volatile user storage for development and testing
 * 
 * This implementation provides a simple, fast storage mechanism that doesn't require
 * external dependencies. Data is stored in application memory and will be lost when
 * the application restarts.
 * 
 * Use cases:
 * - Development environments where data persistence isn't critical
 * - Testing scenarios that need clean state between test runs
 * - Prototype deployments with minimal infrastructure requirements
 * 
 * Limitations:
 * - Data loss on application restart
 * - No persistence across deployments
 * - Memory usage grows with user count
 * - Not suitable for production at scale
 * 
 * Performance characteristics:
 * - O(1) lookup by ID using Map data structure
 * - O(n) lookup by username requiring full scan
 * - Minimal latency since all data is in memory
 */
class MemStorage {
  /**
   * Initialize empty storage with starting ID counter
   * 
   * Sets up the internal data structures needed for user storage
   * and initializes the ID counter for unique user identification.
   */
  constructor() {
    // Private Map for efficient user storage with O(1) ID-based access
    this.users = new Map();
    // Auto-incrementing ID counter for generating unique user identifiers
    this.currentId = 1;
  }

  /**
   * Retrieve user by unique identifier
   * 
   * Provides fast O(1) lookup using the Map data structure.
   * Returns undefined for non-existent users rather than throwing errors
   * to simplify error handling in consuming code.
   * 
   * @param {number} id - Unique numeric identifier for the user
   * @returns {Promise<Object|undefined>} Promise resolving to User object or undefined if not found
   */
  async getUser(id) {
    return this.users.get(id);
  }

  /**
   * Retrieve user by username for authentication purposes
   * 
   * Performs linear search through all users to find matching username.
   * This operation is O(n) but acceptable for development scenarios with
   * limited user counts.
   * 
   * Production consideration: For large user bases, this should be optimized
   * with a secondary index or replaced with database storage.
   * 
   * @param {string} username - Unique username string for user identification
   * @returns {Promise<Object|undefined>} Promise resolving to User object or undefined if not found
   */
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  /**
   * Create new user with auto-generated ID and default field handling
   * 
   * Generates a unique ID for the new user and converts the InsertUser format
   * (which may have undefined fields) to the full User format (which uses null
   * for missing optional fields).
   * 
   * Field transformation: Converts undefined values to null to match the User
   * type definition and ensure consistent data representation.
   * 
   * ID generation: Uses simple auto-increment for predictable, human-friendly
   * user IDs. In production, UUIDs might be preferred for security.
   * 
   * @param {Object} insertUser - User data for creation with optional fields as undefined
   * @returns {Promise<Object>} Promise resolving to complete User object with generated ID
   */
  async createUser(insertUser) {
    console.log(`MemStorage.createUser is creating user with username: ${insertUser.username}`);
    
    // Generate unique ID and increment counter for next user
    const id = this.currentId++;
    
    // Transform InsertUser to User format with proper null handling
    const user = {
      id,
      username: insertUser.username,
      displayName: insertUser.displayName ?? null, // Convert undefined to null
      githubId: insertUser.githubId ?? null,       // Convert undefined to null
      avatar: insertUser.avatar ?? null,           // Convert undefined to null
    };
    
    // Store user in Map with ID as key for efficient retrieval
    this.users.set(id, user);
    console.log(`MemStorage.createUser created user with ID: ${id}`);
    return user;
  }

  /**
   * Get all users for administrative purposes
   * @returns {Promise<Array>} Promise resolving to array of all users
   */
  async getAllUsers() {
    return Array.from(this.users.values());
  }

  /**
   * Delete user by ID
   * @param {number} id - User ID to delete
   * @returns {Promise<boolean>} Promise resolving to true if deleted, false if not found
   */
  async deleteUser(id) {
    console.log(`MemStorage.deleteUser deleting user with ID: ${id}`);
    const result = this.users.delete(id);
    console.log(`MemStorage.deleteUser result: ${result}`);
    return result;
  }

  /**
   * Clear all users (useful for testing)
   * @returns {Promise<void>}
   */
  async clear() {
    console.log('MemStorage.clear clearing all users');
    this.users.clear();
    this.currentId = 1;
  }
}

// Export singleton instance for application-wide use
// This ensures consistent user data across all parts of the application
const storage = new MemStorage();

// Export functions for use as a module
module.exports = {
  greet,
  add,
  isEven,
  ensureMongoDB,
  sendNotFound,
  ensureUnique,
  findUserDoc,
  deleteUserDoc,
  fetchUserDocOr404,
  deleteUserDocOr404,
  listUserDocs,
  createUniqueDoc,
  updateUserDoc,
  MemStorage,
  storage
};
