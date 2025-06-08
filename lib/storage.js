
/**
 * Storage Implementations
 * Various storage mechanisms for user data
 * 
 * This module provides storage abstractions for user data management.
 * Currently implements an in-memory storage solution suitable for development,
 * testing, and prototype deployments. The design allows for future extension
 * with additional storage backends (Redis, PostgreSQL, etc.) while maintaining
 * a consistent interface.
 * 
 * Architecture decisions:
 * - Interface-driven design: Enables swapping storage implementations
 * - Async methods: Maintains consistency with database-backed implementations
 * - Singleton pattern: Provides application-wide shared storage instance
 * - Type transformation: Handles conversion between insertion and stored formats
 * 
 * Future extensibility considerations:
 * - Additional implementations can be added following the same interface
 * - Configuration could be added to select storage backend at runtime
 * - Migration utilities could be developed to move between storage types
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
 * - Performance testing where database I/O would be a bottleneck
 * 
 * Limitations:
 * - Data loss on application restart (by design for development use)
 * - No persistence across deployments or server crashes
 * - Memory usage grows with user count (no automatic cleanup)
 * - Not suitable for production at scale (single server, no backup)
 * - No concurrent access protection (though Node.js is single-threaded)
 * 
 * Performance characteristics:
 * - O(1) lookup by ID using Map data structure
 * - O(n) lookup by username requiring full scan
 * - Minimal latency since all data is in memory
 * - No network or disk I/O overhead
 * 
 * Design decisions:
 * - Map for O(1) ID access vs. Array for simpler iteration
 * - Auto-incrementing IDs for predictability vs. UUIDs for uniqueness
 * - Async methods for interface consistency vs. sync for performance
 * - Null for missing fields vs. undefined for consistent serialization
 */
class MemStorage {
  /**
   * Initialize empty storage with starting ID counter
   * 
   * Sets up the internal data structures needed for user storage
   * and initializes the ID counter for unique user identification.
   * 
   * Design decisions:
   * - Map instead of Object for better key type handling and performance
   * - Starting ID at 1 for human-friendly sequential IDs
   * - Private fields (via convention) to encapsulate internal state
   */
  constructor() {
    // Private Map for efficient user storage with O(1) ID-based access
    // Map is preferred over Object for numeric keys and better performance
    this.users = new Map();
    
    // Auto-incrementing ID counter for generating unique user identifiers
    // Starts at 1 for human-friendly IDs (avoids 0 which can be falsy in some contexts)
    this.currentId = 1;
  }

  /**
   * Retrieve user by unique identifier
   * 
   * Provides fast O(1) lookup using the Map data structure.
   * Returns undefined for non-existent users rather than throwing errors
   * to simplify error handling in consuming code.
   * 
   * Design rationale:
   * - Returns undefined instead of null for consistency with Map.get()
   * - Async method for interface compatibility with database implementations
   * - No error throwing for missing users - let caller decide how to handle
   * 
   * @param {number} id - Unique numeric identifier for the user
   * @returns {Promise<Object|undefined>} Promise resolving to User object or undefined if not found
   */
  async getUser(id) {
    // Direct Map.get() provides O(1) lookup performance
    // Async wrapper maintains interface consistency for future database implementations
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
   * with a secondary index (Map<string, User>) or replaced with database storage
   * that supports indexed queries on username.
   * 
   * Alternative approaches considered:
   * - Secondary Map index: Would speed lookups but increase memory usage and complexity
   * - Username as primary key: Would lose auto-incrementing numeric IDs
   * - Compound data structure: More complex but would support both lookup types efficiently
   * 
   * Current approach chosen for simplicity in development/testing scenarios where
   * user count is limited and code clarity is more important than optimization.
   * 
   * @param {string} username - Unique username string for user identification
   * @returns {Promise<Object|undefined>} Promise resolving to User object or undefined if not found
   */
  async getUserByUsername(username) {
    // Convert Map values to array and find first matching username
    // O(n) operation but acceptable for development/testing with limited users
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
   * Field transformation rationale:
   * - Converts undefined values to null to match the User type definition
   * - Ensures consistent data representation across all storage implementations
   * - Null values serialize properly to JSON while undefined values are omitted
   * - Maintains explicit representation of "no value" vs "not provided"
   * 
   * ID generation strategy:
   * - Uses simple auto-increment for predictable, human-friendly user IDs
   * - Sequential IDs are easier to debug and reference in development
   * - In production, UUIDs might be preferred for security (no enumeration attacks)
   * - Current approach optimizes for development simplicity over production security
   * 
   * @param {Object} insertUser - User data for creation with optional fields as undefined
   * @param {string} insertUser.username - Required username for the new user
   * @param {string|undefined} insertUser.displayName - Optional display name
   * @param {string|undefined} insertUser.githubId - Optional GitHub user ID
   * @param {string|undefined} insertUser.avatar - Optional avatar URL
   * @returns {Promise<Object>} Promise resolving to complete User object with generated ID
   */
  async createUser(insertUser) {
    // Log user creation for debugging and audit purposes
    console.log(`MemStorage.createUser is creating user with username: ${insertUser.username}`);
    
    // Generate unique ID and increment counter for next user
    // Post-increment ensures current user gets the current value
    const id = this.currentId++;
    
    // Transform InsertUser to User format with proper null handling
    // Nullish coalescing (??) converts undefined to null while preserving other falsy values
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
   * 
   * Returns all stored users as an array. Useful for administrative interfaces,
   * debugging, and scenarios where full user lists are needed.
   * 
   * Performance consideration: O(n) operation that creates a new array.
   * For large user sets, consider pagination or streaming approaches.
   * 
   * @returns {Promise<Array>} Promise resolving to array of all users
   */
  async getAllUsers() {
    // Convert Map values to array for easy consumption
    // Array.from() creates a new array, preserving original Map
    return Array.from(this.users.values());
  }

  /**
   * Delete user by ID
   * 
   * Removes a user from storage permanently. Returns boolean to indicate
   * whether the user existed and was deleted.
   * 
   * Design decisions:
   * - Returns boolean for success/failure indication
   * - Uses Map.delete() for O(1) removal
   * - Logs operation for debugging and audit trails
   * - No cascade deletion (would need to be implemented by caller if needed)
   * 
   * @param {number} id - User ID to delete
   * @returns {Promise<boolean>} Promise resolving to true if deleted, false if not found
   */
  async deleteUser(id) {
    console.log(`MemStorage.deleteUser deleting user with ID: ${id}`);
    
    // Map.delete() returns true if element existed and was removed, false otherwise
    const result = this.users.delete(id);
    
    console.log(`MemStorage.deleteUser result: ${result}`);
    return result;
  }

  /**
   * Clear all users and reset ID counter
   * 
   * Removes all stored users and resets the ID counter to 1.
   * Particularly useful for testing scenarios where clean state
   * is needed between test runs.
   * 
   * Design rationale:
   * - Resets ID counter to maintain predictable IDs in testing
   * - Uses Map.clear() for efficient removal of all entries
   * - Async for interface consistency with other storage implementations
   * 
   * @returns {Promise<void>} Promise resolving when clear operation completes
   */
  async clear() {
    console.log('MemStorage.clear clearing all users');
    
    // Clear all users from Map
    this.users.clear();
    
    // Reset ID counter to starting value for predictable testing
    this.currentId = 1;
  }
}

// Export singleton instance for application-wide use
// This ensures consistent user data across all parts of the application
// and follows the singleton pattern for shared storage state.
//
// Design rationale for singleton:
// - Provides shared storage state across the entire application
// - Eliminates need to pass storage instance through dependency injection
// - Simplifies usage in modules that need user storage
// - Consistent with database connection patterns in many frameworks
//
// Alternative approaches considered:
// - Dependency injection: More flexible but adds complexity
// - Factory pattern: Would allow multiple instances but may cause data fragmentation
// - Module-level storage: Would tightly couple storage to specific modules
//
// Current approach balances simplicity with functionality for development use cases
const storage = new MemStorage();

// Export both the class for custom instantiation and the singleton for common use
// This provides flexibility: use the singleton for typical cases, create custom
// instances for testing isolation or specialized use cases
module.exports = {
  MemStorage, // Class export for custom instantiation
  storage     // Singleton instance for application-wide use
};
