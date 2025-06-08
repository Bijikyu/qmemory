
/**
 * Integration tests for the main module exports
 * Tests that all functions and classes are properly exported and can work together
 * in real scenarios.
 */

const qmemory = require('../../index');

describe('QMemory Module Integration', () => {
  test('should export all expected functions and classes', () => {
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

  test('should provide working storage singleton', async () => {
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

  test('should allow multiple MemStorage instances', async () => {
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

  test('should provide consistent HTTP response helpers', () => {
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    qmemory.sendNotFound(mockRes, 'Integration test message');

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Integration test message'
    });
  });
});
