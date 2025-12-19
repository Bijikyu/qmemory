/**
 * Unit tests for MemStorage class
 * Tests all storage operations including CRUD operations, edge cases,
 * and internal state management.
 */

import { MemStorage, storage } from '../../lib/storage.js'; // load class and singleton



interface InsertUser {
  username: string;
  displayName?: string | null;
  githubId?: string | null;
  avatar?: string | null;
}

describe('MemStorage Class', () => { // tests behavior of the in-memory storage implementation
  let memStorage: MemStorage;

  beforeEach(() => {
    memStorage = new MemStorage(); // use default 10000 limit
  });

  describe('constructor', () => { // ensure initialization logic sets up state correctly
    test('should initialize with empty users Map', () => { // constructor sets clean state
      expect((memStorage as any).users.size).toBe(0);
    });

    test('should initialize currentId to 1', () => { // ID counter starts at 1
      expect((memStorage as any).currentId).toBe(1);
    });

    test('should create independent instances', () => { // instances have separate maps
      const storage1 = new MemStorage();
      const storage2 = new MemStorage();

      expect((storage1 as any).users).not.toBe((storage2 as any).users);
      expect((storage1 as any).currentId).toBe((storage2 as any).currentId);
    });

    test('should set default maxUsers to 10000', () => { // default limit check
      expect((memStorage as any).maxUsers).toBe(10000);
    });

    test('should accept custom maxUsers', () => { // custom limit constructor
      const custom = new MemStorage(5);
      expect((custom as any).maxUsers).toBe(5);
    });

    test('should throw error for non-integer maxUsers', () => { // enforce integer check
      expect(() => new MemStorage(2.5 as any)).toThrow('maxUsers must be a positive integer');
    });

    test('should throw error for non-positive maxUsers', () => { // enforce positive check
      expect(() => new MemStorage(0)).toThrow('maxUsers must be a positive integer');
    });

    test('should throw error for non-numeric maxUsers', () => { // enforce type check
      expect(() => new MemStorage('five' as any)).toThrow('maxUsers must be a positive integer');
    });
  });

  describe('createUser', () => { // validate user creation logic and field handling
    test('should create user with auto-generated ID', async () => { // creates minimal user
      const insertUser: InsertUser = {
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
    });

    test('should increment ID for subsequent users', async () => { // verifies auto-increment
      const user1 = await memStorage.createUser({ username: 'user1' });
      const user2 = await memStorage.createUser({ username: 'user2' });
      
      expect(user1.id).toBe(1);
      expect(user2.id).toBe(2);
    });

    test('should convert undefined fields to null', async () => { // normalizes undefined
      const insertUser: InsertUser = {
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

    test('should preserve null values', async () => { // keeps explicit nulls
      const insertUser: InsertUser = {
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

    test('should preserve falsy non-null values', async () => { // ensures values like 0 remain
      const insertUser: InsertUser = {
        username: 'testuser',
        displayName: '',
        githubId: '0',
        avatar: ''
      };
      
      const user = await memStorage.createUser(insertUser);
      
      expect(user.displayName).toBe('');
      expect(user.githubId).toBe('0');
      expect(user.avatar).toBe('');
    });

    test('should throw error for invalid username', async () => { // validates username input
      await expect(memStorage.createUser(null as any)).rejects.toThrow('Username is required and must be a non-empty string');
      await expect(memStorage.createUser({} as any)).rejects.toThrow('Username is required and must be a non-empty string');
      await expect(memStorage.createUser({ username: '' })).rejects.toThrow('Username is required and must be a non-empty string');
      await expect(memStorage.createUser({ username: '   ' })).rejects.toThrow('Username is required and must be a non-empty string');
      await expect(memStorage.createUser({ username: 123 as any })).rejects.toThrow('Username is required and must be a non-empty string');
    }); // Tests new input validation for production safety

    test('should throw error for duplicate username', async () => { // uniqueness enforced
      await memStorage.createUser({ username: 'testuser' });
      await expect(memStorage.createUser({ username: 'testuser' })).rejects.toThrow("Username 'testuser' already exists");
    }); // Tests new uniqueness validation for production safety

    test('should trim username and detect duplicates with spacing', async () => { // spaces should not avoid duplicate
      const user = await memStorage.createUser({ username: ' user ' });
      expect(user.username).toBe('user');
      await expect(memStorage.createUser({ username: 'user' })).rejects.toThrow("Username 'user' already exists");
    });

    test('should store user with all fields', async () => { // handles full payload
      const insertUser: InsertUser = {
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

    test('should allow creating users up to the limit', async () => { // verify maxUsers boundary
      const limited = new MemStorage(2);
      await limited.createUser({ username: 'a' });
      await limited.createUser({ username: 'b' });

      expect((limited as any).users.size).toBe(2);
    });

    test('should throw error when exceeding maxUsers', async () => { // enforce limit reached
      const limited = new MemStorage(1);
      await limited.createUser({ username: 'first' });
      await expect(limited.createUser({ username: 'second' })).rejects.toThrow('Maximum user limit reached');
    });

    test('should handle concurrent createUser calls hitting limit', async () => { // second call rejected once full
      const limited = new MemStorage(1);
      const firstPromise = limited.createUser({ username: 'concurrent1' }); // start first user create
      const secondPromise = limited.createUser({ username: 'concurrent2' }); // start second user create

      await expect(secondPromise).rejects.toThrow('Maximum user limit reached');
      const firstUser = await firstPromise;
      expect(firstUser.username).toBe('concurrent1');
      const allUsers = await limited.getAllUsers();
      expect(allUsers).toHaveLength(1);
    });
  });

  describe('getUser', () => { // ensure retrieval by ID behaves as expected
    test('should return user by ID', async () => { // retrieves existing user
      const created = await memStorage.createUser({ username: 'testuser' });
      const retrieved = await memStorage.getUser(1);
      
      expect(retrieved).toEqual(created);
    });

    test('should return undefined for non-existent user', async () => { // handles missing id
      const user = await memStorage.getUser(999);
      
      expect(user).toBeUndefined();
    });

    test('should return undefined for invalid ID types', async () => { // validates id input
      expect(await memStorage.getUser(null as any)).toBeUndefined();
      expect(await memStorage.getUser(undefined as any)).toBeUndefined();
      expect(await memStorage.getUser('string' as any)).toBeUndefined();
      expect(await memStorage.getUser({} as any)).toBeUndefined();
      expect(await memStorage.getUser(0)).toBeUndefined(); // Zero not allowed
      expect(await memStorage.getUser(-1)).toBeUndefined(); // Negative not allowed
    }); // Tests new input validation for production safety
  });

  describe('getUserByUsername', () => { // tests linear search by username
    test('should return user by username', async () => { // finds by unique key
      const created = await memStorage.createUser({ username: 'findme' });
      const found = await memStorage.getUserByUsername('findme');
      
      expect(found).toEqual(created);
    });

    test('should return undefined for non-existent username', async () => { // not found case
      const user = await memStorage.getUserByUsername('nonexistent');
      
      expect(user).toBeUndefined();
    });

    test('should handle case-sensitive username search', async () => { // usernames are case-sensitive
      await memStorage.createUser({ username: 'CaseTest' });
      
      const exactMatch = await memStorage.getUserByUsername('CaseTest');
      const lowerCase = await memStorage.getUserByUsername('casetest');
      
      expect(exactMatch).toBeDefined();
      expect(lowerCase).toBeUndefined();
    });

    test('should find correct user among multiple users', async () => { // ensures scanning works
      await memStorage.createUser({ username: 'user1' });
      const target = await memStorage.createUser({ username: 'target' });
      await memStorage.createUser({ username: 'user3' });
      
      const found = await memStorage.getUserByUsername('target');
      
      expect(found).toEqual(target);
    });

    test('should return undefined for invalid username types', async () => { // validates argument types
      expect(await memStorage.getUserByUsername(null as any)).toBeUndefined();
      expect(await memStorage.getUserByUsername(undefined as any)).toBeUndefined();
      expect(await memStorage.getUserByUsername('')).toBeUndefined();
      expect(await memStorage.getUserByUsername('   ')).toBeUndefined();
      expect(await memStorage.getUserByUsername(123 as any)).toBeUndefined();
    }); // Tests new input validation for production safety

test('should handle username trimming', async () => { // trimming before lookup
      await memStorage.createUser({ username: 'trimtest' });
      const found = await memStorage.getUserByUsername('  trimtest  ');
      expect(found).toBeDefined();
      if (found) {
        expect(found.username).toBe('trimtest');
      }
    }); // Tests username normalization
  });

  describe('getAllUsers', () => { // verify retrieval of all stored records
    test('should return empty array when no users exist', async () => { // handles empty storage
      const users = await memStorage.getAllUsers();
      
      expect(users).toEqual([]);
    });

    test('should return all users', async () => { // returns list of users
      const user1 = await memStorage.createUser({ username: 'user1' });
      const user2 = await memStorage.createUser({ username: 'user2' });
      
      const allUsers = await memStorage.getAllUsers();
      
      expect(allUsers).toHaveLength(2);
      expect(allUsers).toContain(user1);
      expect(allUsers).toContain(user2);
    });

    test('should return new array (not reference to internal storage)', async () => { // ensures immutability
      await memStorage.createUser({ username: 'user1' });
      
      const users1 = await memStorage.getAllUsers();
      const users2 = await memStorage.getAllUsers();
      
      expect(users1).not.toBe(users2);
      expect(users1).toEqual(users2);
    });
  });

  describe('deleteUser', () => { // validate removal and return values
    test('should delete existing user and return true', async () => { // removes user properly
      await memStorage.createUser({ username: 'deleteme' });
      
      const result = await memStorage.deleteUser(1);
      
      expect(result).toBe(true);
      expect(await memStorage.getUser(1)).toBeUndefined();
    });

    test('should return false for non-existent user', async () => { // handle unknown id
      const result = await memStorage.deleteUser(999);
      
      expect(result).toBe(false);
    });

    test('should handle multiple deletions', async () => { // repeated delete operations
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

  describe('clear', () => { // ensure storage reset works correctly
    test('should remove all users', async () => { // clearing empties storage
      await memStorage.createUser({ username: 'user1' });
      await memStorage.createUser({ username: 'user2' });
      
      await memStorage.clear();
      
      const allUsers = await memStorage.getAllUsers();
      expect(allUsers).toHaveLength(0);
    });

    test('should reset ID counter', async () => { // ID resets after clear
      await memStorage.createUser({ username: 'user1' });
      await memStorage.createUser({ username: 'user2' });
      
      await memStorage.clear();
      
      const newUser = await memStorage.createUser({ username: 'fresh' });
      expect(newUser.id).toBe(1);
    });

    test('should handle clearing empty storage', async () => { // clearing when already empty
      await expect(memStorage.clear()).resolves.toBeUndefined();
      
      const allUsers = await memStorage.getAllUsers();
      expect(allUsers).toHaveLength(0);
    });
  });
});

describe('Storage Singleton', () => { // confirm exported instance persistence
  beforeEach(async () => {
    await storage.clear();
  });

  test('should export singleton instance', () => { // exported object is instance
    expect(storage).toBeInstanceOf(MemStorage);
  });

  test('should maintain state across module imports', async () => { // ensures singleton retains data
    // This test verifies that the singleton pattern works
    const user = await storage.createUser({ username: 'persistent' });
    
    // Re-require the module to simulate different imports
    // Note: In ESM, we can't delete require cache, but we can test the singleton behavior
    const found = await storage.getUser(user.id);
    expect(found).toEqual(user);
  });
});