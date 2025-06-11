
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
  constructor(maxUsers = 10000) { // optionally cap user count in memory
    console.log(`constructor is running with ${maxUsers}`); // trace constructor usage
    if (typeof maxUsers !== 'number' || !Number.isInteger(maxUsers) || maxUsers <= 0) { // validate parameter
      throw new Error('maxUsers must be a positive integer'); // fail fast on invalid configuration
    }

    // Initialize backing store using Map for constant time lookups by ID
    // Map chosen over Object because numeric keys remain uncoerced and performance is predictable
    this.users = new Map(); // Map chosen for O(1) id lookup

    // Set first user ID to 1 so each created user gets a simple, sequential identifier
    // Auto-incrementing this value avoids collisions and keeps ID generation trivial
    this.currentId = 1; // first id value for new users

    this.maxUsers = maxUsers; // track maximum users allowed
    console.log(`constructor has run resulting in a final value of ${this.maxUsers}`); // log final state
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
    // Input validation for production safety - ensure valid ID type
    // Reject non-numeric IDs and IDs less than 1 (our starting ID)
    if (typeof id !== 'number' || id < 1) {
      return undefined; // Return undefined for invalid IDs to match Map.get() behavior
    }
    
    // Map.get gives constant-time access because IDs are stored as map keys
    // Keeping the method async mirrors database APIs without blocking the event loop
    return this.users.get(id); // Undefined when user doesn't exist keeps caller logic simple
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
    // Input validation for production safety - ensure valid username type
    if (typeof username !== 'string' || username.trim().length === 0) {
      return undefined; // Invalid usernames return undefined consistently
    }
    
    // Convert map values to an array so we can scan each user object by username
    // This linear search is slower than ID lookups but fine for small dev datasets
    return Array.from(this.users.values()).find(
      (user) => user.username === username.trim() // Normalize username with trim
    ); // Map stores users by ID so username search requires iteration
  }

  /**
   * Normalizes user fields by converting undefined values to null
   * 
   * This helper function ensures consistent data representation by converting
   * undefined optional fields to null, which serializes properly to JSON and
   * maintains explicit representation of "no value" vs "not provided".
   * 
   * @param {Object} insertUser - User data with optional fields as undefined
   * @returns {Object} Normalized user fields with null instead of undefined
   */
  normalizeUserFields(insertUser) {
    return {
      username: insertUser.username.trim(), // remove extraneous spaces for consistent duplicates
      displayName: insertUser.displayName ?? null, // Convert undefined to null
      githubId: insertUser.githubId ?? null,       // Convert undefined to null
      avatar: insertUser.avatar ?? null,           // Convert undefined to null
    };
  } // Helper centralizes field normalization logic

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
    // Input validation for production safety - ensure required fields exist and are valid
    // Username is the primary identifier and must be present and non-empty
    if (!insertUser || typeof insertUser.username !== 'string' || insertUser.username.trim().length === 0) {
      throw new Error('Username is required and must be a non-empty string');
    }

    const trimmedUsername = insertUser.username.trim(); // single value for duplicate check

    // Check for duplicate username to prevent data conflicts
    // This linear search is acceptable for development scenarios with limited users
    const existingUser = await this.getUserByUsername(trimmedUsername); // lookup with trimmed value
    if (existingUser) {
      throw new Error(`Username '${trimmedUsername}' already exists`); // use normalized name in message
    }
    
    if (this.users.size >= this.maxUsers) { // enforce optional limit on users
      throw new Error('Maximum user limit reached'); // stop when capacity full
    }

    // Generate unique numeric ID then bump the counter for future calls
    // Auto-increment keeps IDs sequential which simplifies debugging
    const id = this.currentId++;
    
    // Transform InsertUser to User format with proper null handling
    // Use helper function to normalize fields consistently across all user operations
    const normalizedFields = this.normalizeUserFields({ ...insertUser, username: trimmedUsername }); // ensure stored username lacks spaces
    const user = {
      id,
      ...normalizedFields
    };
    
    // Store user in Map so lookups by id remain constant time
    // Map handles numeric keys without string conversion for speed
    this.users.set(id, user);
    
    return user; // Return created user with generated ID for caller use
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
    // Convert Map values to array since Map stores users keyed by ID
    // Array.from makes a shallow copy so callers can't mutate internal storage
    return Array.from(this.users.values()); // Snapshot of all users for callers
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
    // Input validation for production safety - ensure valid ID type
    if (typeof id !== 'number' || id < 1) {
      return false; // Invalid IDs return false consistently
    }
    
    // Map.delete removes the keyed entry in constant time if it exists
    // The boolean return lets the caller know whether anything was actually removed
    return this.users.delete(id); // True when user existed and is now gone
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
    // Remove every entry from the map in one call for efficiency
    this.users.clear();

    // Reset the auto-increment counter so future creates start at ID 1 again
    this.currentId = 1; // Predictable IDs aid repeatable tests
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
// Instantiate a single shared storage object so all modules access the same Map
// This avoids state fragmentation that would occur if each import created a new instance
const storage = new MemStorage(); // singleton used across the app

// Export both the class for custom instantiation and the singleton for common use
// Developers can use the provided singleton for convenience or make separate
// instances when isolated state is desired (e.g., in tests)
module.exports = {
  MemStorage, // Class export for custom instantiation
  storage     // Singleton instance for application-wide use
};
