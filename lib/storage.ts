/**
 * Storage Implementations
 * Various storage mechanisms for user data
 */

/**
 * User record persisted within the in-memory storage system.
 */
export interface User {
  id: number;
  username: string;
  displayName: string | null;
  githubId: string | null;
  avatar: string | null;
}

/**
 * Payload accepted when inserting a new user record.
 */
export interface InsertUser {
  username: string;
  displayName?: string | null;
  githubId?: string | null;
  avatar?: string | null;
}

/**
 * Developer-friendly in-memory storage used for demos and unit tests.
 */
export class MemStorage {
  private users: Map<number, User>;
  private currentId: number;
  private maxUsers: number;

  /**
   * @param maxUsers - Upper bound enforced to protect development environments.
   */
  constructor(maxUsers: number = 10000) {
    console.log(`constructor is running with ${maxUsers}`);
    if (typeof maxUsers !== 'number' || !Number.isInteger(maxUsers) || maxUsers <= 0)
      throw new Error('maxUsers must be a positive integer'); // validation prevents memory issues
    this.users = new Map(); // using Map for O(1) lookups by ID
    this.currentId = 1; // auto-incrementing ID generator
    this.maxUsers = maxUsers; // memory usage limit for development safety
    console.log(`constructor has run resulting in a final value of ${this.maxUsers}`);
  }

  /**
   * Retrieves a user by numeric identifier.
   *
   * @param id - Auto-incremented identifier assigned to the user.
   * @returns Stored user or undefined when not found.
   */
  getUser = async (id: number): Promise<User | undefined> =>
    typeof id !== 'number' || id < 1 ? undefined : this.users.get(id); // direct Map lookup for performance

  /**
   * Retrieves a user by username, trimming whitespace for consistency.
   *
   * @param username - Username to match against existing records.
   * @returns Stored user or undefined when not found.
   */
  getUserByUsername = async (username: string): Promise<User | undefined> =>
    typeof username !== 'string' || !username.trim().length
      ? undefined
      : Array.from(this.users.values()).find(user => user.username === username.trim()); // O(n) search but necessary for username lookup

  private normalizeUserFields = (insertUser: InsertUser): Omit<User, 'id'> => ({
    username: insertUser.username.trim(),
    displayName: insertUser.displayName ?? null,
    githubId: insertUser.githubId ?? null,
    avatar: insertUser.avatar ?? null,
  });

  /**
   * Creates a new user, enforcing uniqueness and maximum capacity rules.
   *
   * @param insertUser - Candidate user payload.
   * @returns Persisted user record with generated identifier.
   */
  createUser = async (insertUser: InsertUser): Promise<User> => {
    if (
      !insertUser ||
      typeof insertUser.username !== 'string' ||
      !insertUser.username.trim().length
    )
      throw new Error('Username is required and must be a non-empty string');
    const trimmedUsername = insertUser.username.trim(); // consistent storage prevents spacing issues
    if (this.users.size >= this.maxUsers) throw new Error('Maximum user limit reached');
    const existingUser = await this.getUserByUsername(trimmedUsername);
    if (existingUser) throw new Error(`Username '${trimmedUsername}' already exists`); // uniqueness constraint
    const id = this.currentId++; // atomic increment ensures unique IDs
    const normalizedFields = this.normalizeUserFields({ ...insertUser, username: trimmedUsername });
    const user = { id, ...normalizedFields }; // spread operator combines ID with normalized fields
    this.users.set(id, user); // Map storage for O(1) retrieval
    return user;
  };

  /**
   * @returns Snapshot of the current users stored in memory.
   */
  getAllUsers = async (): Promise<User[]> => Array.from(this.users.values());

  /**
   * Removes a user record by identifier.
   *
   * @param id - Identifier to remove.
   * @returns True when deletion occurred, otherwise false.
   */
  deleteUser = async (id: number): Promise<boolean> => {
    if (typeof id !== 'number' || id < 1) return false;
    return this.users.delete(id);
  };

  /**
   * Updates a user record by identifier.
   *
   * @param id - Identifier to update.
   * @param updates - Partial user data to update.
   * @returns Updated user record or null if not found.
   */
  updateUser = async (id: number, updates: Partial<InsertUser>): Promise<User | null> => {
    if (typeof id !== 'number' || id < 1) return null;

    const existingUser = this.users.get(id);
    if (!existingUser) return null;

    // Apply updates with validation
    const updatedUser: User = { ...existingUser };

    if (updates.username !== undefined) {
      if (typeof updates.username !== 'string' || !updates.username.trim().length) {
        throw new Error('Username is required and must be a non-empty string');
      }
      const trimmedUsername = updates.username.trim();
      // Check for username conflicts (excluding current user)
      const conflictUser = await this.getUserByUsername(trimmedUsername);
      if (conflictUser && conflictUser.id !== id) {
        throw new Error(`Username '${trimmedUsername}' already exists`);
      }
      updatedUser.username = trimmedUsername;
    }

    if (updates.displayName !== undefined) {
      updatedUser.displayName = updates.displayName === null ? null : String(updates.displayName);
    }

    if (updates.githubId !== undefined) {
      updatedUser.githubId = updates.githubId === null ? null : String(updates.githubId);
    }

    if (updates.avatar !== undefined) {
      updatedUser.avatar = updates.avatar === null ? null : String(updates.avatar);
    }

    // Store updated user
    this.users.set(id, updatedUser);
    return updatedUser;
  };

  /**
   * Clears the storage and resets the auto-incrementing counter.
   */
  clear = async (): Promise<void> => {
    this.users.clear();
    this.currentId = 1;
  };
}

const storage = new MemStorage();
export { storage };
