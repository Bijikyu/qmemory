/**
 * Production Validation Tests
 * Comprehensive tests simulating real-world production scenarios
 * 
 * These tests validate the library's behavior under production conditions,
 * including error scenarios, edge cases, and integration patterns that
 * would occur in live applications.
 */

const {
  createUserDoc,
  updateUserDoc,
  fetchUserDocOr404,
  deleteUserDocOr404,
  listUserDocs,
  sendNotFound,
  sendConflict,
  sendInternalServerError,
  sendServiceUnavailable,
  ensureMongoDB,
  ensureUnique,
  MemStorage,
  storage,
  logFunctionEntry,
  logFunctionExit,
  greet,
  add,
  isEven
} = require('../../index');

describe('Production Validation Tests', () => {
  
  describe('Environment Detection', () => {
    let originalEnv;
    
    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
    });
    
    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });
    
    test('should adapt logging behavior based on NODE_ENV', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Test development logging
      process.env.NODE_ENV = 'development';
      logFunctionEntry('testFunction', { param: 'value' });
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockClear();
      
      // Test production logging (should be silent)
      process.env.NODE_ENV = 'production';
      logFunctionEntry('testFunction', { param: 'value' });
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
    
    test('should handle undefined NODE_ENV gracefully', () => {
      delete process.env.NODE_ENV;
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      expect(() => {
        logFunctionEntry('testFunction', {});
      }).not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('HTTP Response Edge Cases', () => {
    let mockRes;
    
    beforeEach(() => {
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
    });
    
    test('should handle extremely long error messages', () => {
      const longMessage = 'Error: ' + 'x'.repeat(10000);
      
      expect(() => {
        sendInternalServerError(mockRes, longMessage);
      }).not.toThrow();
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: longMessage.trim(),
        timestamp: expect.any(String)
      });
    });
    
    test('should handle special characters in error messages', () => {
      const specialMessage = 'Error with üñîçödé and "quotes" and <tags>';
      
      sendNotFound(mockRes, specialMessage);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        message: specialMessage,
        timestamp: expect.any(String)
      });
    });
    
    test('should handle concurrent response calls', () => {
      // Simulate rapid consecutive calls
      for (let i = 0; i < 100; i++) {
        sendNotFound(mockRes, `Message ${i}`);
      }
      
      expect(mockRes.status).toHaveBeenCalledTimes(100);
      expect(mockRes.json).toHaveBeenCalledTimes(100);
    });
    
    test('should include retry headers for service unavailable', () => {
      sendServiceUnavailable(mockRes, 'Database temporarily down');
      
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Database temporarily down',
        timestamp: expect.any(String),
        retryAfter: '300'
      });
    });
  });
  
  describe('Memory Storage Production Scenarios', () => {
    let memStorage;
    
    beforeEach(() => {
      memStorage = new MemStorage();
    });
    
    test('should handle high-volume user creation', async () => {
      const users = [];
      
      // Create 1000 users rapidly
      for (let i = 0; i < 1000; i++) {
        const user = await memStorage.createUser({
          username: `user${i}`,
          email: `user${i}@example.com`,
          role: i % 3 === 0 ? 'admin' : 'user'
        });
        users.push(user);
      }
      
      expect(users).toHaveLength(1000);
      expect((await memStorage.getAllUsers())).toHaveLength(1000);
      
      // Verify ID sequence
      users.forEach((user, index) => {
        expect(user.id).toBe(index + 1);
      });
    });
    
    test('should maintain performance with large user base', async () => {
      // Create large user base
      for (let i = 0; i < 5000; i++) {
        await memStorage.createUser({
          username: `user${i}`,
          data: `value${i}`
        });
      }
      
      const start = Date.now();
      
      // Test lookup performance
      for (let i = 0; i < 100; i++) {
        const randomUsername = `user${Math.floor(Math.random() * 5000)}`;
        await memStorage.getUserByUsername(randomUsername);
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200); // Should complete in under 200ms
    });
    
    test('should handle memory cleanup operations', async () => {
      // Fill storage
      for (let i = 0; i < 1000; i++) {
        await memStorage.createUser({
          username: `user${i}`,
          data: 'test'
        });
      }
      
      // Delete half the users
      for (let i = 0; i < 500; i++) {
        await memStorage.deleteUser(i + 1);
      }
      
      expect((await memStorage.getAllUsers())).toHaveLength(500);
      
      // Clear all
      await memStorage.clear();
      expect((await memStorage.getAllUsers())).toHaveLength(0);
      expect(memStorage.currentId).toBe(1);
    });
  });
  
  describe('Input Validation Edge Cases', () => {
    test('should handle boundary value inputs in utility functions', () => {
      // Test number boundaries
      expect(add(Number.MAX_SAFE_INTEGER, 0)).toBe(Number.MAX_SAFE_INTEGER);
      expect(add(Number.MIN_SAFE_INTEGER, 0)).toBe(Number.MIN_SAFE_INTEGER);
      
      // Test integer boundaries for isEven
      expect(isEven(0)).toBe(true);
      expect(isEven(-2)).toBe(true);
      expect(isEven(Number.MAX_SAFE_INTEGER - 1)).toBe(true);
      
      // Test string edge cases for greet
      expect(greet('')).toBe('Hello, !');
      expect(greet('   ')).toBe('Hello,    !');
      expect(greet(null)).toBe('Hello, null!');
    });
    
    test('should properly validate types in production scenarios', () => {
      // Test add function with invalid inputs
      expect(() => add('5', 3)).toThrow('Both parameters must be numbers');
      expect(() => add(5, null)).toThrow('Both parameters must be numbers');
      expect(() => add(undefined, 5)).toThrow('Both parameters must be numbers');
      
      // Test isEven with invalid inputs
      expect(() => isEven(3.14)).toThrow('Parameter must be an integer');
      expect(() => isEven('5')).toThrow('Parameter must be an integer');
      expect(() => isEven(NaN)).toThrow('Parameter must be an integer');
    });
  });
  
  describe('Error Propagation and Recovery', () => {
    test('should handle malformed Express response objects', () => {
      const invalidResponses = [
        null,
        undefined,
        {},
        { status: 'not a function' },
        { json: 'not a function' },
        { status: jest.fn() } // missing json method
      ];
      
      invalidResponses.forEach(res => {
        expect(() => {
          sendNotFound(res, 'test message');
        }).toThrow('Invalid Express response object');
      });
    });
  });
  
  describe('Production Configuration Scenarios', () => {
    test('should handle missing environment variables gracefully', () => {
      const originalEnv = { ...process.env };
      
      // Remove environment variables
      delete process.env.NODE_ENV;
      delete process.env.MONGODB_URI;
      
      // Should not throw errors
      expect(() => {
        logFunctionEntry('test', {});
        const storage = new MemStorage();
      }).not.toThrow();
      
      // Restore environment
      process.env = originalEnv;
    });
    
    test('should provide meaningful error messages for common mistakes', async () => {
      const storage = new MemStorage();
      
      // Test duplicate username error
      await storage.createUser({ username: 'testuser' });
      
      await expect(async () => {
        await storage.createUser({ username: 'testuser' });
      }).rejects.toThrow("Username 'testuser' already exists");
      
      // Test invalid username types
      await expect(async () => {
        await storage.createUser({ username: null });
      }).rejects.toThrow('Username is required and must be a non-empty string');
      
      await expect(async () => {
        await storage.createUser({ username: '' });
      }).rejects.toThrow('Username is required and must be a non-empty string');
    });
  });
  
  describe('Concurrent Access Patterns', () => {
    test('should handle rapid storage operations', async () => {
      const storage = new MemStorage();
      const operations = [];
      
      // Simulate concurrent user creation
      for (let i = 0; i < 50; i++) {
        operations.push(Promise.resolve().then(() => {
          return storage.createUser({ username: `user${i}`, index: i });
        }));
      }
      
      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(50);
      expect((await storage.getAllUsers())).toHaveLength(50);
      
      // Verify all users were created with unique IDs
      const ids = results.map(user => user.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(50);
    });
    
    test('should maintain data consistency during mixed operations', async () => {
      const storage = new MemStorage();
      
      // Create initial users
      for (let i = 0; i < 20; i++) {
        await storage.createUser({ username: `user${i}`, value: i });
      }
      
      // Mix of operations
      const user5 = await storage.getUser(5);
      await storage.deleteUser(10);
      const userByName = await storage.getUserByUsername('user15');
      await storage.deleteUser(3);
      const allUsers = await storage.getAllUsers();
      
      expect(user5).toBeTruthy();
      expect(user5.username).toBe('user4'); // 0-indexed creation
      expect(userByName).toBeTruthy();
      expect(userByName.username).toBe('user15');
      expect(allUsers).toHaveLength(18); // 20 - 2 deleted
    });
  });
  
  describe('Integration Patterns', () => {
    test('should support chaining HTTP response methods', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        header: jest.fn().mockReturnThis()
      };
      
      // Should support method chaining
      const result = sendNotFound(mockRes, 'Resource not found');
      
      expect(result).toBe(mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalled();
    });
    
    test('should integrate properly with Express middleware patterns', () => {
      const mockReq = { params: { username: 'testuser' } };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();
      
      // Simulate middleware usage
      const middleware = (req, res, next) => {
        if (!req.params.username) {
          return sendNotFound(res, 'Username required');
        }
        next();
      };
      
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      
      // Test error case
      const invalidReq = { params: {} };
      middleware(invalidReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
  
  describe('Performance Benchmarks', () => {
    test('should meet performance expectations for common operations', async () => {
      const storage = new MemStorage();
      const iterations = 1000;
      
      // Benchmark user creation
      const start = Date.now();
      for (let i = 0; i < iterations; i++) {
        await storage.createUser({ username: `user${i}`, data: `value${i}` });
      }
      const creationTime = Date.now() - start;
      
      // Should create 1000 users in under 100ms
      expect(creationTime).toBeLessThan(100);
      
      // Benchmark lookups
      const lookupStart = Date.now();
      for (let i = 0; i < iterations; i++) {
        await storage.getUserByUsername(`user${i}`);
      }
      const lookupTime = Date.now() - lookupStart;
      
      // Should lookup 1000 users in under 200ms
      expect(lookupTime).toBeLessThan(200);
    });
  });
});