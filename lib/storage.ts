import qerrors from 'qerrors';

export interface User {
  id: number;
  username: string;
  displayName: string | null;
  githubId: string | null;
  avatar: string | null;
}

export interface InsertUser {
  username: string;
  displayName?: string | null;
  githubId?: string | null;
  avatar?: string | null;
}

export class MemStorage {
  private users: Map<number, User>;
  private usernameIndex: Map<string, number>;
  private currentId: number;
  private maxUsers: number;

  constructor(maxUsers: number = 10000) {
    console.log(`constructor is running with ${maxUsers}`);
    if (typeof maxUsers !== 'number' || !Number.isInteger(maxUsers) || maxUsers <= 0)
      throw new Error('maxUsers must be a positive integer');
    this.users = new Map();
    this.usernameIndex = new Map();
    this.currentId = 1;
    this.maxUsers = maxUsers;
    console.log(`constructor has run resulting in a final value of ${this.maxUsers}`);
  }

  getUser = async (id: number): Promise<User | undefined> => {
    try {
      return typeof id !== 'number' || id < 1 ? undefined : this.users.get(id);
    } catch (error) {
      qerrors.qerrors(error as Error, 'storage.getUser', { id, operation: 'get' });
      throw error;
    }
  };

  getUserByUsername = async (username: string): Promise<User | undefined> => {
    try {
      if (typeof username !== 'string' || !username.trim().length) return undefined;
      const trimmedUsername = username.trim();
      const userId = this.usernameIndex.get(trimmedUsername);
      return userId !== undefined ? this.users.get(userId) : undefined;
    } catch (error) {
      qerrors.qerrors(error as Error, 'storage.getUserByUsername', {
        username: typeof username === 'string' ? username.trim() : username,
        operation: 'getByUsername',
      });
      throw error;
    }
  };

  private normalizeUserFields = (insertUser: InsertUser): Omit<User, 'id'> => ({
    username: insertUser.username.trim(),
    displayName: insertUser.displayName ?? null,
    githubId: insertUser.githubId ?? null,
    avatar: insertUser.avatar ?? null,
  });

  createUser = async (insertUser: InsertUser): Promise<User> => {
    try {
      if (
        !insertUser ||
        typeof insertUser.username !== 'string' ||
        !insertUser.username.trim().length
      )
        throw new Error('Username is required and must be a non-empty string');
      const trimmedUsername = insertUser.username.trim();
      if (this.users.size >= this.maxUsers) throw new Error('Maximum user limit reached');
      const existingUser = await this.getUserByUsername(trimmedUsername);
      if (existingUser) throw new Error(`Username '${trimmedUsername}' already exists`);
      const id = this.currentId++;
      const normalizedFields = this.normalizeUserFields({
        ...insertUser,
        username: trimmedUsername,
      });
      const user = { id, ...normalizedFields };
      this.users.set(id, user);
      this.usernameIndex.set(trimmedUsername, id);
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

  getAllUsers = async (): Promise<User[]> => {
    try {
      return Array.from(this.users.values());
    } catch (error) {
      qerrors.qerrors(error as Error, 'storage.getAllUsers', {
        userCount: this.users.size,
        operation: 'getAll',
      });
      throw error;
    }
  };

  updateUser = async (id: number, updates: Partial<InsertUser>): Promise<User | undefined> => {
    try {
      if (typeof id !== 'number' || id < 1) return undefined;
      const existingUser = this.users.get(id);
      if (!existingUser) return undefined;

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

  deleteUser = async (id: number): Promise<boolean> => {
    try {
      if (typeof id !== 'number' || id < 1) return false;
      const user = this.users.get(id);
      if (user) {
        this.usernameIndex.delete(user.username);
      }
      return this.users.delete(id);
    } catch (error) {
      qerrors.qerrors(error as Error, 'storage.deleteUser', { id, operation: 'delete' });
      throw error;
    }
  };

  clear = async (): Promise<void> => {
    try {
      this.users.clear();
      this.usernameIndex.clear();
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
