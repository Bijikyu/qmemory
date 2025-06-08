
/**
 * Integration tests for critical workflows
 * Tests complete user scenarios and interactions between modules.
 */

const { MemStorage } = require('../../lib/storage');
const { sendNotFound } = require('../../lib/http-utils');

describe('Critical Workflows Integration', () => {
  let storage;
  let mockRes;

  beforeEach(async () => {
    storage = new MemStorage();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('User Management Workflow', () => {
    test('should handle complete user lifecycle', async () => {
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

      const emptyList = await storage.getAllUsers();
      expect(emptyList).toHaveLength(0);
    });

    test('should handle multiple users correctly', async () => {
      // Create multiple users
      const user1 = await storage.createUser({ username: 'user1' });
      const user2 = await storage.createUser({ username: 'user2' });
      const user3 = await storage.createUser({ username: 'user3' });

      expect(user1.id).toBe(1);
      expect(user2.id).toBe(2);
      expect(user3.id).toBe(3);

      // Delete middle user
      await storage.deleteUser(2);

      // Verify remaining users
      const remaining = await storage.getAllUsers();
      expect(remaining).toHaveLength(2);
      expect(remaining.map(u => u.username)).toEqual(['user1', 'user3']);

      // Create new user - should get next available ID
      const user4 = await storage.createUser({ username: 'user4' });
      expect(user4.id).toBe(4);
    });
  });

  describe('Error Handling Workflow', () => {
    test('should gracefully handle missing resources', async () => {
      // Try to get non-existent user
      const notFound = await storage.getUser(999);
      expect(notFound).toBeUndefined();

      // Try to delete non-existent user
      const deleteResult = await storage.deleteUser(999);
      expect(deleteResult).toBe(false);

      // Try to find by non-existent username
      const byUsername = await storage.getUserByUsername('nonexistent');
      expect(byUsername).toBeUndefined();

      // Should still be able to create users normally
      const newUser = await storage.createUser({ username: 'normal_user' });
      expect(newUser.id).toBe(1);
    });

    test('should handle HTTP error responses consistently', () => {
      // Test 404 response helper
      sendNotFound(mockRes, 'User not found');
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found' });

      // Reset mocks
      mockRes.status.mockClear();
      mockRes.json.mockClear();

      // Test different error message
      sendNotFound(mockRes, 'Document not found');
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Document not found' });
    });
  });

  describe('Data Consistency Workflow', () => {
    test('should maintain data consistency across operations', async () => {
      // Create users with various field combinations
      const fullUser = await storage.createUser({
        username: 'full_user',
        displayName: 'Full User',
        githubId: 'full123',
        avatar: 'https://example.com/full.jpg'
      });

      const partialUser = await storage.createUser({
        username: 'partial_user',
        displayName: 'Partial User'
        // githubId and avatar undefined
      });

      const minimalUser = await storage.createUser({
        username: 'minimal_user'
        // All optional fields undefined
      });

      // Verify field handling
      expect(fullUser.displayName).toBe('Full User');
      expect(fullUser.githubId).toBe('full123');
      expect(fullUser.avatar).toBe('https://example.com/full.jpg');

      expect(partialUser.displayName).toBe('Partial User');
      expect(partialUser.githubId).toBeNull();
      expect(partialUser.avatar).toBeNull();

      expect(minimalUser.displayName).toBeNull();
      expect(minimalUser.githubId).toBeNull();
      expect(minimalUser.avatar).toBeNull();

      // Verify all users are findable
      const allUsers = await storage.getAllUsers();
      expect(allUsers).toHaveLength(3);

      const usernames = allUsers.map(u => u.username);
      expect(usernames).toContain('full_user');
      expect(usernames).toContain('partial_user');
      expect(usernames).toContain('minimal_user');
    });

    test('should handle clear operation properly', async () => {
      // Create some users
      await storage.createUser({ username: 'user1' });
      await storage.createUser({ username: 'user2' });
      await storage.createUser({ username: 'user3' });

      expect(storage.currentId).toBe(4); // Next ID would be 4

      // Clear all data
      await storage.clear();

      // Verify everything is reset
      const users = await storage.getAllUsers();
      expect(users).toHaveLength(0);
      expect(storage.currentId).toBe(1);

      // Verify new users get correct IDs
      const newUser = await storage.createUser({ username: 'reset_user' });
      expect(newUser.id).toBe(1);
    });
  });

  describe('Performance and Scalability Workflow', () => {
    test('should handle bulk operations efficiently', async () => {
      const userCount = 100;
      const createdUsers = [];

      // Create many users
      for (let i = 1; i <= userCount; i++) {
        const user = await storage.createUser({
          username: `user${i}`,
          displayName: `User ${i}`
        });
        createdUsers.push(user);
      }

      expect(createdUsers).toHaveLength(userCount);
      expect(storage.currentId).toBe(userCount + 1);

      // Test batch retrieval
      const allUsers = await storage.getAllUsers();
      expect(allUsers).toHaveLength(userCount);

      // Test individual lookups
      for (let i = 1; i <= 10; i++) { // Test first 10
        const user = await storage.getUser(i);
        expect(user.username).toBe(`user${i}`);
      }

      // Test username lookups
      for (let i = 1; i <= 10; i++) { // Test first 10
        const user = await storage.getUserByUsername(`user${i}`);
        expect(user.id).toBe(i);
      }

      // Test bulk deletion
      for (let i = 1; i <= userCount; i += 2) { // Delete odd IDs
        const deleted = await storage.deleteUser(i);
        expect(deleted).toBe(true);
      }

      const remaining = await storage.getAllUsers();
      expect(remaining).toHaveLength(userCount / 2);

      // Verify only even IDs remain
      remaining.forEach(user => {
        expect(user.id % 2).toBe(0);
      });
    });
  });
});
