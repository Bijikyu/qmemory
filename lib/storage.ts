/**
 * Storage Implementations
 * Various storage mechanisms for user data
 */
import qerrors from 'qerrors';

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
  getUser = async (id: number): Promise<User | undefined> => {
    try {
      return typeof id !== 'number' || id < 1 ? undefined : this.users.get(id); // direct Map lookup for performance
    } catch (error) {
      qerrors.qerrors(error as Error, 'storage.getUser', {
        id,
        operation: 'get',
      });
      throw error; // Re-throw to preserve error propagation
    }
  };

  /**
   * Retrieves a user by username, trimming whitespace for consistency.
   *
   * @param username - Username to match against existing records.
   * @returns Stored user or undefined when not found.
   */
  getUserByUsername = async (username: string): Promise<User | undefined> => {
    try {
      return typeof username !== 'string' || !username.trim().length
        ? undefined
        : Array.from(this.users.values()).find(user => user.username === username.trim()); // O(n) search but necessary for username lookup
    } catch (error) {
      qerrors.qerrors(error as Error, 'storage.getUserByUsername', {
        username: typeof username === 'string' ? username.trim() : username,
        operation: 'getByUsername',
      });
      throw error; // Re-throw to preserve error propagation
    }
  };

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
    try {
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
      const normalizedFields = this.normalizeUserFields({
        ...insertUser,
        username: trimmedUsername,
      });
      const user = { id, ...normalizedFields }; // spread operator combines ID with normalized fields
      this.users.set(id, user); // Map storage for O(1) retrieval
      return user;
    } catch (error) {
      qerrors.qerrors(error as Error, 'storage.createUser', {
        username: insertUser?.username,
        currentUsers: this.users.size,
        maxUsers: this.maxUsers,
        hasDisplayName: insertUser?.displayName !== undefined,
      });
      throw error;
    }
  };

  /**
   * @returns Snapshot of the current users stored in memory.
   */
  getAllUsers = async (): Promise<User[]> => {
    try {
      return Array.from(this.users.values());
    } catch (error) {
      qerrors.qerrors(error as Error, 'storage.getAllUsers', {
        userCount: this.users.size,
        operation: 'getAll',
      });
      throw error; // Re-throw to preserve error propagation
    }
  };

  /**
   * Updates a user record by identifier.
   *
   * @param id - Identifier to update.
   * @param updates - Partial user data to update.
   * @returns Updated user or undefined when not found.
   */
  updateUser = async (id: number, updates: Partial<InsertUser>): Promise<User | undefined> => {
    try {
      if (typeof id !== 'number' || id < 1) return undefined;
      const existingUser = this.users.get(id);
      if (!existingUser) return undefined;

      // Check for username conflict if username is being updated
      if (updates.username && updates.username.trim() !== existingUser.username) {
        const trimmedUsername = updates.username.trim();
        const existingUserWithSameName = await this.getUserByUsername(trimmedUsername);
        if (existingUserWithSameName) {
          throw new Error(`Username '${trimmedUsername}' already exists`);
        }
      }

      const updatedUser: User = {
        ...existingUser,
        ...updates,
        username: updates.username ? updates.username.trim() : existingUser.username,
      };

      this.users.set(id, updatedUser);
      return updatedUser;
    } catch (error) {
      qerrors.qerrors(error as Error, 'storage.updateUser', {
        id,
        updateFieldKeys: Object.keys(updates),
        hasUsernameUpdate: updates.username !== undefined,
        currentUsers: this.users.size,
      });
      throw error;
    }
  };

  /**
   * Removes a user record by identifier.
   *
   * @param id - Identifier to remove.
   * @returns True when deletion occurred, otherwise false.
   */
  deleteUser = async (id: number): Promise<boolean> => {
    try {
      if (typeof id !== 'number' || id < 1) return false;
      return this.users.delete(id);
    } catch (error) {
      qerrors.qerrors(error as Error, 'storage.deleteUser', {
        id,
        operation: 'delete',
      });
      throw error; // Re-throw to preserve error propagation
    }
  };

  /**
   * Clears the storage and resets the auto-incrementing counter.
   */
  clear = async (): Promise<void> => {
    try {
      this.users.clear();
      this.currentId = 1;
    } catch (error) {
      qerrors.qerrors(error as Error, 'storage.clear', {
        userCount: this.users.size,
        operation: 'clear',
      });
      throw error;
    }
  };
}

const storage = new MemStorage();
export { storage };
