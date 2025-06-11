
/**
 * Integration tests for the main module exports
 * Tests that all functions and classes are properly exported and can work together
 * in real scenarios.
 */

const qmemory = require('../../index'); // import library entry point

describe('QMemory Module Integration', () => { // Ensures exported API works together
  test('should export all expected functions and classes', () => { // verifies public API surface
    // HTTP utilities
    expect(typeof qmemory.sendNotFound).toBe('function');

    // Database utilities
    expect(typeof qmemory.ensureMongoDB).toBe('function');
    expect(typeof qmemory.ensureUnique).toBe('function');

    // Document operations
    expect(typeof qmemory.performUserDocOp).toBe('function');
    expect(typeof qmemory.findUserDoc).toBe('function');
    expect(typeof qmemory.deleteUserDoc).toBe('function');
    expect(typeof qmemory.userDocActionOr404).toBe('function');
    expect(typeof qmemory.fetchUserDocOr404).toBe('function');
    expect(typeof qmemory.deleteUserDocOr404).toBe('function');
    expect(typeof qmemory.listUserDocs).toBe('function');
    expect(typeof qmemory.createUniqueDoc).toBe('function');
    expect(typeof qmemory.updateUserDoc).toBe('function');

    // Storage
    expect(typeof qmemory.MemStorage).toBe('function'); // Constructor
    expect(typeof qmemory.storage).toBe('object');
    expect(qmemory.storage.constructor.name).toBe('MemStorage');
  });

  test('should provide working storage singleton', async () => { // tests basic CRUD on singleton
    // Clear any existing data
    await qmemory.storage.clear();

    // Test basic CRUD operations
    const user = await qmemory.storage.createUser({
      username: 'testuser',
      displayName: 'Test User'
    });

    expect(user.id).toBe(1);
    expect(user.username).toBe('testuser');

    const retrieved = await qmemory.storage.getUser(1);
    expect(retrieved).toEqual(user);

    const deleted = await qmemory.storage.deleteUser(1);
    expect(deleted).toBe(true);

    const notFound = await qmemory.storage.getUser(1);
    expect(notFound).toBeUndefined();
  });

  test('should allow multiple MemStorage instances', async () => { // instances operate independently
    const storage1 = new qmemory.MemStorage();
    const storage2 = new qmemory.MemStorage();

    const user1 = await storage1.createUser({ username: 'user1' });
    const user2 = await storage2.createUser({ username: 'user2' });

    expect(user1.id).toBe(1);
    expect(user2.id).toBe(1); // Independent ID counters

    // Check isolation
    const fromStorage1 = await storage1.getUser(1);
    const fromStorage2 = await storage2.getUser(1);

    expect(fromStorage1.username).toBe('user1');
    expect(fromStorage2.username).toBe('user2');
  });

  test('should provide consistent HTTP response helpers', () => { // ensure helper output
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    qmemory.sendNotFound(mockRes, 'Integration test message');

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Integration test message',
      timestamp: expect.any(String)
    });
  });

  test('should handle cross-module interactions', async () => { // modules work together
    // Test that HTTP utils work with storage operations
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    await qmemory.storage.clear();
    
    // Create a user
    const user = await qmemory.storage.createUser({
      username: 'integration_user',
      displayName: 'Integration Test User'
    });

    // Verify user exists
    const found = await qmemory.storage.getUserByUsername('integration_user');
    expect(found).toEqual(user);

    // Test sending not found for non-existent user
    qmemory.sendNotFound(mockRes, 'User not found');
    expect(mockRes.status).toHaveBeenCalledWith(404);
  });

  test('should maintain singleton state across multiple imports', async () => { // reimport uses same instance
    await qmemory.storage.clear();
    
    // Create user with singleton
    const user = await qmemory.storage.createUser({
      username: 'persistent_user'
    });

    // Import again to verify singleton behavior
    delete require.cache[require.resolve('../../index')];
    const qmemoryReimport = require('../../index');

    // Should find the same user
    const found = await qmemoryReimport.storage.getUser(user.id);
    expect(found).toEqual(user);
  });

  test('should handle error scenarios gracefully', async () => { // covers null/edge data
    const mockRes = createMockResponse();
    
    // Test with undefined/null values
    qmemory.sendNotFound(mockRes, null);
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ 
      message: 'Resource not found',
      timestamp: expect.any(String)
    });

    // Test storage with edge cases
    await qmemory.storage.clear();
    
    const userWithNulls = await qmemory.storage.createUser({
      username: 'null_user',
      displayName: null,
      githubId: undefined,
      avatar: ''
    });

    expect(userWithNulls.displayName).toBeNull();
    expect(userWithNulls.githubId).toBeNull();
    expect(userWithNulls.avatar).toBe('');
  });
});
