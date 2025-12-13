/**
 * Storage Implementations
 * Various storage mechanisms for user data
 */

class MemStorage {
  constructor(maxUsers = 10000) {
    console.log(`constructor is running with ${maxUsers}`);
    if (typeof maxUsers !== 'number' || !Number.isInteger(maxUsers) || maxUsers <= 0) throw new Error('maxUsers must be a positive integer');
    this.users = new Map();
    this.currentId = 1;
    this.maxUsers = maxUsers;
    console.log(`constructor has run resulting in a final value of ${this.maxUsers}`);
  }

  getUser = async (id) => (typeof id !== 'number' || id < 1) ? undefined : this.users.get(id);

  getUserByUsername = async (username) => (typeof username !== 'string' || !username.trim().length) ? undefined : Array.from(this.users.values()).find(user => user.username === username.trim());

  normalizeUserFields = (insertUser) => ({
    username: insertUser.username.trim(),
    displayName: insertUser.displayName ?? null,
    githubId: insertUser.githubId ?? null,
    avatar: insertUser.avatar ?? null,
  });

  createUser = async (insertUser) => {
    if (!insertUser || typeof insertUser.username !== 'string' || !insertUser.username.trim().length) throw new Error('Username is required and must be a non-empty string');
    
    const trimmedUsername = insertUser.username.trim();
    
    if (this.users.size >= this.maxUsers) throw new Error('Maximum user limit reached');
    
    const existingUser = await this.getUserByUsername(trimmedUsername);
    if (existingUser) throw new Error(`Username '${trimmedUsername}' already exists`);
    
    if (this.users.size >= this.maxUsers) throw new Error('Maximum user limit reached');
    
    const id = this.currentId++;
    const normalizedFields = this.normalizeUserFields({ ...insertUser, username: trimmedUsername });
    const user = { id, ...normalizedFields };
    
    this.users.set(id, user);
    
    return user;
  };

  getAllUsers = async () => Array.from(this.users.values());

  deleteUser = async (id) => (typeof id !== 'number' || id < 1) ? false : this.users.delete(id);

  clear = async () => { this.users.clear(); this.currentId = 1; };
}

const storage = new MemStorage();

module.exports = {
  MemStorage,
  storage
};