/**
 * Storage Implementations
 * Various storage mechanisms for user data
 */

interface User {
  id: number;
  username: string;
  displayName: string | null;
  githubId: string | null;
  avatar: string | null;
}

interface InsertUser {
  username: string;
  displayName?: string | null;
  githubId?: string | null;
  avatar?: string | null;
}

class MemStorage {
  private users: Map<number, User>;
  private currentId: number;
  private maxUsers: number;

  constructor(maxUsers: number = 10000) {
    console.log(`constructor is running with ${maxUsers}`);
    if (typeof maxUsers !== 'number' || !Number.isInteger(maxUsers) || maxUsers <= 0) throw new Error('maxUsers must be a positive integer'); // validation prevents memory issues
    this.users = new Map(); // using Map for O(1) lookups by ID
    this.currentId = 1; // auto-incrementing ID generator
    this.maxUsers = maxUsers; // memory usage limit for development safety
    console.log(`constructor has run resulting in a final value of ${this.maxUsers}`);
  }

  public getUser = async (id: number): Promise<User | undefined> => 
    (typeof id !== 'number' || id < 1) ? undefined : this.users.get(id); // direct Map lookup for performance

  public getUserByUsername = async (username: string): Promise<User | undefined> => 
    (typeof username !== 'string' || !username.trim().length) ? undefined : Array.from(this.users.values()).find(user => user.username === username.trim()); // O(n) search but necessary for username lookup

  private normalizeUserFields = (insertUser: InsertUser): Omit<User, 'id'> => ({
    username: insertUser.username.trim(),
    displayName: insertUser.displayName ?? null,
    githubId: insertUser.githubId ?? null,
    avatar: insertUser.avatar ?? null,
  });

  public createUser = async (insertUser: InsertUser): Promise<User> => {
    if (!insertUser || typeof insertUser.username !== 'string' || !insertUser.username.trim().length) throw new Error('Username is required and must be a non-empty string');
    
    const trimmedUsername = insertUser.username.trim(); // consistent storage prevents spacing issues
    
    if (this.users.size >= this.maxUsers) throw new Error('Maximum user limit reached');
    
    const existingUser = await this.getUserByUsername(trimmedUsername);
    if (existingUser) throw new Error(`Username '${trimmedUsername}' already exists`); // uniqueness constraint
    
    const id = this.currentId++; // atomic increment ensures unique IDs
    const normalizedFields = this.normalizeUserFields({ ...insertUser, username: trimmedUsername });
    const user: User = { id, ...normalizedFields }; // spread operator combines ID with normalized fields
    
    this.users.set(id, user); // Map storage for O(1) retrieval
    
    return user;
  };

  public getAllUsers = async (): Promise<User[]> => Array.from(this.users.values());

  public deleteUser = async (id: number): Promise<boolean> => {
    if (typeof id !== 'number' || id < 1) return false;
    return this.users.delete(id);
  };

  public clear = async (): Promise<void> => { 
    this.users.clear(); 
    this.currentId = 1; 
  };
}

const storage = new MemStorage();

export { MemStorage, storage };