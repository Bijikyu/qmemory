
/**
 * Storage Implementations
 * Various storage mechanisms for user data
 */

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

module.exports = {
  MemStorage,
  storage
};
