
/**
 * Unit tests for MemStorage class
 * Tests all storage operations including CRUD operations, edge cases,
 * and internal state management.
 */

const { MemStorage, storage } = require('../../lib/storage'); // load class and singleton

describe('MemStorage Class', () => { // Tests behavior of the in-memory storage implementation
  let memStorage;

  beforeEach(() => {
    memStorage = new MemStorage();
  });

  describe('constructor', () => { // Ensure initialization logic sets up state correctly
    test('should initialize with empty users Map', () => {
      expect(memStorage.users.size).toBe(0);
    });

    test('should initialize currentId to 1', () => {
      expect(memStorage.currentId).toBe(1);
    });

    test('should create independent instances', () => {
      const storage1 = new MemStorage();
      const storage2 = new MemStorage();
      
      expect(storage1.users).not.toBe(storage2.users);
      expect(storage1.currentId).toBe(storage2.currentId);
    });
  });

  describe('createUser', () => { // Validate user creation logic and field handling
    test('should create user with auto-generated ID', async () => {
      const insertUser = {
        username: 'testuser', // Minimal required field
        displayName: 'Test User' // Optional field included for completeness
      };

      const user = await memStorage.createUser(insertUser);

      expect(user).toMatchObject({
        id: 1,
        username: 'testuser',
        displayName: 'Test User',
        githubId: null,
        avatar: null // Defaults should be null when not provided
      });
      expect(console.log).toHaveBeenCalledWith('MemStorage.createUser is running with username: testuser'); // start log
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('MemStorage.createUser is returning')); // return log
    });

    test('should increment ID for subsequent users', async () => {
      const user1 = await memStorage.createUser({ username: 'user1' });
      const user2 = await memStorage.createUser({ username: 'user2' });
      
      expect(user1.id).toBe(1);
      expect(user2.id).toBe(2);
    });

    test('should convert undefined fields to null', async () => {
      const insertUser = {
        username: 'testuser',
        displayName: undefined,
        githubId: undefined,
        avatar: undefined
      };
      
      const user = await memStorage.createUser(insertUser);
      
      expect(user.displayName).toBeNull();
      expect(user.githubId).toBeNull();
      expect(user.avatar).toBeNull();
    });

    test('should preserve null values', async () => {
      const insertUser = {
        username: 'testuser',
        displayName: null,
        githubId: null,
        avatar: null
      };
      
      const user = await memStorage.createUser(insertUser);
      
      expect(user.displayName).toBeNull();
      expect(user.githubId).toBeNull();
      expect(user.avatar).toBeNull();
    });

    test('should preserve falsy non-null values', async () => {
      const insertUser = {
        username: 'testuser',
        displayName: '',
        githubId: '0',
        avatar: false
      };
      
      const user = await memStorage.createUser(insertUser);
      
      expect(user.displayName).toBe('');
      expect(user.githubId).toBe('0');
      expect(user.avatar).toBe(false);
    });

    test('should store user with all fields', async () => {
      const insertUser = {
        username: 'fulluser',
        displayName: 'Full User',
        githubId: 'github123',
        avatar: 'https://example.com/avatar.jpg'
      };
      
      const user = await memStorage.createUser(insertUser);
      
      expect(user).toMatchObject({
        id: 1,
        username: 'fulluser',
        displayName: 'Full User',
        githubId: 'github123',
        avatar: 'https://example.com/avatar.jpg'
      });
    });
  });

  describe('getUser', () => { // Ensure retrieval by ID behaves as expected
    test('should return user by ID', async () => {
      const created = await memStorage.createUser({ username: 'testuser' });
      const retrieved = await memStorage.getUser(1);
      
      expect(retrieved).toEqual(created);
    });

    test('should return undefined for non-existent user', async () => {
      const user = await memStorage.getUser(999);
      
      expect(user).toBeUndefined();
    });

    test('should return undefined for invalid ID types', async () => {
      const results = await Promise.all([
        memStorage.getUser(null),
        memStorage.getUser(undefined),
        memStorage.getUser('string'),
        memStorage.getUser({})
      ]);
      
      results.forEach(result => expect(result).toBeUndefined());
    });
  });

  describe('getUserByUsername', () => { // Tests linear search by username
    test('should return user by username', async () => {
      const created = await memStorage.createUser({ username: 'findme' });
      const found = await memStorage.getUserByUsername('findme');
      
      expect(found).toEqual(created);
    });

    test('should return undefined for non-existent username', async () => {
      const user = await memStorage.getUserByUsername('nonexistent');
      
      expect(user).toBeUndefined();
    });

    test('should handle case-sensitive username search', async () => {
      await memStorage.createUser({ username: 'CaseTest' });
      
      const exactMatch = await memStorage.getUserByUsername('CaseTest');
      const lowerCase = await memStorage.getUserByUsername('casetest');
      
      expect(exactMatch).toBeDefined();
      expect(lowerCase).toBeUndefined();
    });

    test('should find correct user among multiple users', async () => {
      await memStorage.createUser({ username: 'user1' });
      const target = await memStorage.createUser({ username: 'target' });
      await memStorage.createUser({ username: 'user3' });
      
      const found = await memStorage.getUserByUsername('target');
      
      expect(found).toEqual(target);
    });
  });

  describe('getAllUsers', () => { // Verify retrieval of all stored records
    test('should return empty array when no users exist', async () => {
      const users = await memStorage.getAllUsers();
      
      expect(users).toEqual([]);
    });

    test('should return all users', async () => {
      const user1 = await memStorage.createUser({ username: 'user1' });
      const user2 = await memStorage.createUser({ username: 'user2' });
      
      const allUsers = await memStorage.getAllUsers();
      
      expect(allUsers).toHaveLength(2);
      expect(allUsers).toContain(user1);
      expect(allUsers).toContain(user2);
    });

    test('should return new array (not reference to internal storage)', async () => {
      await memStorage.createUser({ username: 'user1' });
      
      const users1 = await memStorage.getAllUsers();
      const users2 = await memStorage.getAllUsers();
      
      expect(users1).not.toBe(users2);
      expect(users1).toEqual(users2);
    });
  });

  describe('deleteUser', () => { // Validate removal and return values
    test('should delete existing user and return true', async () => {
      await memStorage.createUser({ username: 'deleteme' });
      
      const result = await memStorage.deleteUser(1);
      
      expect(result).toBe(true);
      expect(await memStorage.getUser(1)).toBeUndefined();
    });

    test('should return false for non-existent user', async () => {
      const result = await memStorage.deleteUser(999);
      
      expect(result).toBe(false);
    });

    test('should handle multiple deletions', async () => {
      await memStorage.createUser({ username: 'user1' });
      await memStorage.createUser({ username: 'user2' });
      
      const result1 = await memStorage.deleteUser(1);
      const result2 = await memStorage.deleteUser(2);
      const result3 = await memStorage.deleteUser(1); // Already deleted
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(false);
    });
  });

  describe('clear', () => { // Ensure storage reset works correctly
    test('should remove all users', async () => {
      await memStorage.createUser({ username: 'user1' });
      await memStorage.createUser({ username: 'user2' });
      
      await memStorage.clear();
      
      const allUsers = await memStorage.getAllUsers();
      expect(allUsers).toHaveLength(0);
    });

    test('should reset ID counter', async () => {
      await memStorage.createUser({ username: 'user1' });
      await memStorage.createUser({ username: 'user2' });
      
      await memStorage.clear();
      
      const newUser = await memStorage.createUser({ username: 'fresh' });
      expect(newUser.id).toBe(1);
    });

    test('should handle clearing empty storage', async () => {
      await expect(memStorage.clear()).resolves.toBeUndefined();
      
      const allUsers = await memStorage.getAllUsers();
      expect(allUsers).toHaveLength(0);
    });
  });
});

describe('Storage Singleton', () => {
  beforeEach(async () => {
    await storage.clear();
  });

  test('should export singleton instance', () => {
    expect(storage).toBeInstanceOf(MemStorage);
  });

  test('should maintain state across module imports', async () => {
    // This test verifies that the singleton pattern works
    const user = await storage.createUser({ username: 'persistent' });
    
    // Re-require the module to simulate different imports
    delete require.cache[require.resolve('../../lib/storage')];
    const { storage: reimportedStorage } = require('../../lib/storage'); // import again to verify singleton
    
    const found = await reimportedStorage.getUser(user.id);
    expect(found).toEqual(user);
  });
});
