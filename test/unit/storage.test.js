
/**
 * Unit tests for MemStorage class
 * Tests all storage operations including CRUD operations, edge cases,
 * and internal state management.
 */

const { MemStorage } = require('../../lib/storage');

describe('MemStorage Class', () => {
  let storage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  describe('constructor', () => {
    test('should initialize with empty users and ID starting at 1', () => {
      expect(storage.users.size).toBe(0);
      expect(storage.currentId).toBe(1);
    });
  });

  describe('createUser', () => {
    test('should create user with auto-generated ID', async () => {
      const insertUser = {
        username: 'alice',
        displayName: 'Alice Smith',
        githubId: 'alice123',
        avatar: 'https://example.com/avatar.jpg'
      };

      const user = await storage.createUser(insertUser);

      expect(user).toEqual({
        id: 1,
        username: 'alice',
        displayName: 'Alice Smith',
        githubId: 'alice123',
        avatar: 'https://example.com/avatar.jpg'
      });
      expect(storage.currentId).toBe(2);
    });

    test('should convert undefined fields to null', async () => {
      const insertUser = {
        username: 'bob',
        displayName: undefined,
        githubId: undefined,
        avatar: undefined
      };

      const user = await storage.createUser(insertUser);

      expect(user).toEqual({
        id: 1,
        username: 'bob',
        displayName: null,
        githubId: null,
        avatar: null
      });
    });

    test('should preserve falsy values that are not undefined', async () => {
      const insertUser = {
        username: 'charlie',
        displayName: '',
        githubId: '0',
        avatar: null
      };

      const user = await storage.createUser(insertUser);

      expect(user).toEqual({
        id: 1,
        username: 'charlie',
        displayName: '',
        githubId: '0',
        avatar: null
      });
    });

    test('should increment ID for multiple users', async () => {
      const user1 = await storage.createUser({ username: 'user1' });
      const user2 = await storage.createUser({ username: 'user2' });
      const user3 = await storage.createUser({ username: 'user3' });

      expect(user1.id).toBe(1);
      expect(user2.id).toBe(2);
      expect(user3.id).toBe(3);
      expect(storage.currentId).toBe(4);
    });
  });

  describe('getUser', () => {
    test('should return user by ID', async () => {
      const created = await storage.createUser({ username: 'alice' });
      const retrieved = await storage.getUser(1);

      expect(retrieved).toEqual(created);
    });

    test('should return undefined for non-existent ID', async () => {
      const result = await storage.getUser(999);
      expect(result).toBeUndefined();
    });

    test('should return undefined for invalid ID types', async () => {
      const result1 = await storage.getUser('invalid');
      const result2 = await storage.getUser(null);
      const result3 = await storage.getUser(undefined);

      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
      expect(result3).toBeUndefined();
    });
  });

  describe('getUserByUsername', () => {
    beforeEach(async () => {
      await storage.createUser({ username: 'alice', displayName: 'Alice' });
      await storage.createUser({ username: 'bob', displayName: 'Bob' });
    });

    test('should return user by username', async () => {
      const user = await storage.getUserByUsername('alice');

      expect(user).toBeDefined();
      expect(user.username).toBe('alice');
      expect(user.displayName).toBe('Alice');
    });

    test('should return undefined for non-existent username', async () => {
      const result = await storage.getUserByUsername('charlie');
      expect(result).toBeUndefined();
    });

    test('should be case sensitive', async () => {
      const result = await storage.getUserByUsername('ALICE');
      expect(result).toBeUndefined();
    });

    test('should handle empty string username', async () => {
      const result = await storage.getUserByUsername('');
      expect(result).toBeUndefined();
    });
  });

  describe('getAllUsers', () => {
    test('should return empty array when no users', async () => {
      const users = await storage.getAllUsers();
      expect(users).toEqual([]);
    });

    test('should return all users', async () => {
      await storage.createUser({ username: 'alice' });
      await storage.createUser({ username: 'bob' });

      const users = await storage.getAllUsers();

      expect(users).toHaveLength(2);
      expect(users[0].username).toBe('alice');
      expect(users[1].username).toBe('bob');
    });

    test('should return new array (not reference to internal storage)', async () => {
      await storage.createUser({ username: 'alice' });
      
      const users1 = await storage.getAllUsers();
      const users2 = await storage.getAllUsers();

      expect(users1).not.toBe(users2);
      expect(users1).toEqual(users2);
    });
  });

  describe('deleteUser', () => {
    beforeEach(async () => {
      await storage.createUser({ username: 'alice' });
      await storage.createUser({ username: 'bob' });
    });

    test('should delete existing user and return true', async () => {
      const result = await storage.deleteUser(1);
      const user = await storage.getUser(1);

      expect(result).toBe(true);
      expect(user).toBeUndefined();
    });

    test('should return false for non-existent user', async () => {
      const result = await storage.deleteUser(999);
      expect(result).toBe(false);
    });

    test('should not affect other users', async () => {
      await storage.deleteUser(1);
      const remainingUser = await storage.getUser(2);

      expect(remainingUser).toBeDefined();
      expect(remainingUser.username).toBe('bob');
    });

    test('should handle invalid ID types', async () => {
      const result1 = await storage.deleteUser('invalid');
      const result2 = await storage.deleteUser(null);

      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });
  });

  describe('clear', () => {
    beforeEach(async () => {
      await storage.createUser({ username: 'alice' });
      await storage.createUser({ username: 'bob' });
    });

    test('should remove all users', async () => {
      await storage.clear();
      const users = await storage.getAllUsers();

      expect(users).toHaveLength(0);
    });

    test('should reset ID counter', async () => {
      await storage.clear();
      const newUser = await storage.createUser({ username: 'charlie' });

      expect(newUser.id).toBe(1);
      expect(storage.currentId).toBe(2);
    });

    test('should be idempotent', async () => {
      await storage.clear();
      await storage.clear();
      
      const users = await storage.getAllUsers();
      expect(users).toHaveLength(0);
      expect(storage.currentId).toBe(1);
    });
  });
});
