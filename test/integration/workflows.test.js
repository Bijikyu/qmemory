/**
 * Integration tests for critical workflows
 * Tests end-to-end interactions between modules and common usage patterns.
 */

// Mock mongoose before importing modules
const mongoose = {
  connection: { readyState: 1 }
};
jest.doMock('mongoose', () => mongoose); // ensure mock applied before imports

const {
  storage,
  MemStorage,
  sendNotFound,
  ensureMongoDB,
  ensureUnique
} = require('../../index'); // load API for integration tests

// Mock mongoose for database tests
jest.mock('mongoose', () => ({ // mock entire mongoose module
  connection: {
    readyState: 1 // Default to connected
  },
  Error: {
    CastError: class CastError extends Error {
      constructor(message) {
        super(message);
        this.name = 'CastError';
      }
    }
  }
}));

describe('Critical Workflows Integration', () => { // simulates end-to-end module interactions
  let storage;
  let mockRes;

  beforeEach(async () => {
    storage = new MemStorage();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const mongoose = require('mongoose');
    mongoose.connection.readyState = 1; //(reset connection state for each test)
  });

  afterEach(() => {
    mongoose.connection.readyState = 1; // reset connection state on mock
    require('mongoose').connection.readyState = 1; // also reset on imported module
  });

  describe('User Management Workflow', () => { // manage users through full lifecycle
    test('should handle complete user lifecycle', async () => { // create, fetch and delete flow
      // Create user
      const newUser = await storage.createUser({
        username: 'lifecycle_user',
        displayName: 'Lifecycle Test User',
        githubId: 'lifecycle123',
        avatar: 'https://example.com/avatar.jpg'
      });

      expect(newUser).toMatchObject({
        id: 1,
        username: 'lifecycle_user',
        displayName: 'Lifecycle Test User',
        githubId: 'lifecycle123',
        avatar: 'https://example.com/avatar.jpg'
      });

      // Retrieve by ID
      const byId = await storage.getUser(1);
      expect(byId).toEqual(newUser);

      // Retrieve by username
      const byUsername = await storage.getUserByUsername('lifecycle_user');
      expect(byUsername).toEqual(newUser);

      // List all users
      const allUsers = await storage.getAllUsers();
      expect(allUsers).toHaveLength(1);
      expect(allUsers[0]).toEqual(newUser);

      // Delete user
      const deleted = await storage.deleteUser(1);
      expect(deleted).toBe(true);

      // Verify deletion
      const afterDelete = await storage.getUser(1);
      expect(afterDelete).toBeUndefined();

      const afterDeleteByUsername = await storage.getUserByUsername('lifecycle_user');
      expect(afterDeleteByUsername).toBeUndefined();

      // Verify empty list
      const emptyList = await storage.getAllUsers();
      expect(emptyList).toHaveLength(0);
    });

    test('should handle multiple users independently', async () => { // verify parallel data sets
      // Create multiple users
      const users = [];
      for (let i = 1; i <= 5; i++) {
        const user = await storage.createUser({
          username: `user${i}`,
          displayName: `User ${i}`,
          githubId: `github${i}`
        });
        users.push(user);
        expect(user.id).toBe(i);
      }

      // Verify all users exist
      const allUsers = await storage.getAllUsers();
      expect(allUsers).toHaveLength(5);

      // Delete middle user
      const deleted = await storage.deleteUser(3);
      expect(deleted).toBe(true);

      // Verify remaining users
      const remainingUsers = await storage.getAllUsers();
      expect(remainingUsers).toHaveLength(4);
      expect(remainingUsers.map(u => u.id)).toEqual([1, 2, 4, 5]);

      // Verify specific users still exist
      expect(await storage.getUser(1)).toBeDefined();
      expect(await storage.getUser(2)).toBeDefined();
      expect(await storage.getUser(3)).toBeUndefined();
      expect(await storage.getUser(4)).toBeDefined();
      expect(await storage.getUser(5)).toBeDefined();
    });
  });

  describe('Error Handling Workflow', () => { // ensure consistent error messaging
    test('should handle HTTP error responses consistently', () => { // verifies helpers for various texts
      const errorMessages = [
        'User not found',
        'Document does not exist',
        'Access denied',
        '',
        null,
        undefined
      ];

      errorMessages.forEach(message => {
        const localMockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        sendNotFound(localMockRes, message);

        expect(localMockRes.status).toHaveBeenCalledWith(404);
        expect(localMockRes.json).toHaveBeenCalledWith({ 
          message: message || 'Resource not found',
          timestamp: expect.any(String)
        });
      });
    });

    test('should handle storage edge cases', async () => { // unusual usernames
      // Test edge cases for user creation - now with proper validation
      const validEdgeCases = [
        { username: 'special_chars', displayName: 'Special Chars' },
        { username: 'numeric123', displayName: 'Numeric String' },
        { username: 'very_long_username_that_exceeds_normal_length_expectations' }
      ];

      // Test invalid cases that should throw errors
      await expect(storage.createUser({ username: '', displayName: 'Empty Username' }))
        .rejects.toThrow('Username is required and must be a non-empty string');
      await expect(storage.createUser({ username: '   ', displayName: 'Whitespace Username' }))
        .rejects.toThrow('Username is required and must be a non-empty string');

      // Clear storage before testing valid cases
      await storage.clear();

      for (let i = 0; i < validEdgeCases.length; i++) {
        const user = await storage.createUser(validEdgeCases[i]);
        expect(user.id).toBe(i + 1);
        expect(user.username).toBe(validEdgeCases[i].username);

        // Verify retrieval works
        const retrieved = await storage.getUserByUsername(validEdgeCases[i].username);
        expect(retrieved).toEqual(user);
      }
    });

    test('should handle concurrent operations', async () => { // stress concurrency
      // Simulate concurrent user creation
      const createPromises = [];
      for (let i = 1; i <= 10; i++) {
        createPromises.push(storage.createUser({
          username: `concurrent_user_${i}`,
          displayName: `Concurrent User ${i}`
        }));
      }

      const users = await Promise.all(createPromises);

      // Verify all users were created with unique IDs
      const ids = users.map(u => u.id);
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds).toHaveLength(10);
      expect(Math.max(...ids)).toBe(10);
      expect(Math.min(...ids)).toBe(1);

      // Verify all users are retrievable
      const allUsers = await storage.getAllUsers();
      expect(allUsers).toHaveLength(10);
    });
  });

  describe('Database Integration Workflow', () => { // MongoDB state and uniqueness paths
    test('should validate database connectivity states', () => { // checks each readyState case
      const mongoose = require('mongoose');

      // Test different connection states
      const connectionStates = [
        { state: 0, shouldPass: false, status: 503 }, // Disconnected
        { state: 1, shouldPass: true, status: null },  // Connected
        { state: 2, shouldPass: false, status: 503 }, // Connecting
        { state: 3, shouldPass: false, status: 503 }  // Disconnecting
      ];

      connectionStates.forEach(({ state, shouldPass, status }) => {
        const localMockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        mongoose.connection.readyState = state;

        const result = ensureMongoDB(localMockRes);

        expect(result).toBe(shouldPass);
        if (!shouldPass) {
          expect(localMockRes.status).toHaveBeenCalledWith(status);
          expect(localMockRes.json).toHaveBeenCalledWith({
            message: 'Database functionality unavailable',
            timestamp: expect.any(String),
            retryAfter: '300'
          });
        } else {
          expect(localMockRes.status).not.toHaveBeenCalled();
        }
      });
    });

    test('should handle uniqueness validation workflow', async () => { // ensures duplicate detection
      const mockModel = {
        findOne: jest.fn()
      };

      // Test unique scenario
      mockModel.findOne.mockResolvedValueOnce(null);
      const uniqueResult = await ensureUnique(
        mockModel, 
        { username: 'unique_user' }, 
        mockRes, 
        'Duplicate user'
      );

      expect(uniqueResult).toBe(true);
      expect(mockRes.status).not.toHaveBeenCalled();

      // Test duplicate scenario
      mockModel.findOne.mockResolvedValueOnce({ _id: '123', username: 'duplicate_user' });
      const duplicateResult = await ensureUnique(
        mockModel, 
        { username: 'duplicate_user' }, 
        mockRes, 
        'User already exists'
      );

      expect(duplicateResult).toBe(false);
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User already exists',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Full Stack Workflow Simulation', () => { // simulate API request lifecycle
    test('should simulate complete API request workflow', async () => { // happy path sequence
      // Simulate the full workflow of an API request

      // 1. Check database connectivity
      const dbOk = ensureMongoDB(mockRes);
      expect(dbOk).toBe(true);

      // 2. Create user in storage
      const newUser = await storage.createUser({
        username: 'api_user',
        displayName: 'API Test User',
        githubId: 'api123'
      });
      expect(newUser.id).toBe(1);

      // 3. Retrieve user (simulating authentication)
      const authUser = await storage.getUserByUsername('api_user');
      expect(authUser).toEqual(newUser);

      // 4. Perform user operations
      const allUserDocs = await storage.getAllUsers();
      expect(allUserDocs).toContain(newUser);

      // 5. Clean up (simulating logout/deletion)
      const deleteResult = await storage.deleteUser(newUser.id);
      expect(deleteResult).toBe(true);

      // 6. Verify cleanup
      const afterCleanup = await storage.getUser(newUser.id);
      expect(afterCleanup).toBeUndefined();
    });

    test('should handle error scenarios in full workflow', async () => { // covers db down and not found
      // Simulate database unavailable
      const mongoose = require('mongoose');
      mongoose.connection.readyState = 0; // Disconnected

      const dbResult = ensureMongoDB(mockRes);
      expect(dbResult).toBe(false);
      expect(mockRes.status).toHaveBeenCalledWith(503);

      // Reset to connected state
      mongoose.connection.readyState = 1;

      // Simulate user not found scenario
      const nonExistentUser = await storage.getUserByUsername('nonexistent');
      expect(nonExistentUser).toBeUndefined();

      // Send appropriate error response
      sendNotFound(mockRes, 'User not found');
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User not found',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Performance and Load Testing', () => { // ensures scaling performance
    test('should handle bulk operations efficiently', async () => { // measure high volume actions
      const startTime = Date.now();

      // Create 1000 users
      const createPromises = [];
      for (let i = 1; i <= 1000; i++) {
        createPromises.push(storage.createUser({
          username: `bulk_user_${i}`,
          displayName: `Bulk User ${i}`
        }));
      }

      await Promise.all(createPromises);

      const creationTime = Date.now() - startTime;
      expect(creationTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify all users were created
      const allUsers = await storage.getAllUsers();
      expect(allUsers).toHaveLength(1000);

      // Test bulk retrieval
      const retrievalStart = Date.now();
      const retrievalPromises = [];
      for (let i = 1; i <= 1000; i++) {
        retrievalPromises.push(storage.getUser(i));
      }

      const retrievedUsers = await Promise.all(retrievalPromises);
      const retrievalTime = Date.now() - retrievalStart;

      expect(retrievalTime).toBeLessThan(1000); // Should complete within 1 second
      expect(retrievedUsers.filter(u => u !== undefined)).toHaveLength(1000);

      // Test bulk deletion
      const deletionStart = Date.now();
      const deletionPromises = [];
      for (let i = 1; i <= 1000; i++) {
        deletionPromises.push(storage.deleteUser(i));
      }

      await Promise.all(deletionPromises);
      const deletionTime = Date.now() - deletionStart;

      expect(deletionTime).toBeLessThan(2000); // Should complete within 2 seconds

      // Verify all users were deleted
      const afterDeletion = await storage.getAllUsers();
      expect(afterDeletion).toHaveLength(0);
    });
  });
});
