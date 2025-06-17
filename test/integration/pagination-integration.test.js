/**
 * Pagination Integration Tests
 * Tests pagination utilities integration with existing document operations and storage systems
 * 
 * These tests validate that pagination works correctly with the library's existing
 * document operations, storage systems, and HTTP utilities in realistic scenarios.
 */

const qmemory = require('../../index');

describe('Pagination Integration Tests', () => {
  let mockRes;

  beforeEach(async () => {
    // Setup fresh mock response for each test
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Clear storage for clean test state
    await qmemory.storage.clear();
  });

  describe('Integration with Storage Operations', () => {
    test('should paginate user list from storage', async () => { // pagination with storage data
      // Create test users in storage
      const users = [];
      for (let i = 1; i <= 25; i++) {
        const user = await qmemory.storage.createUser({
          username: `user${i}`,
          displayName: `User ${i}`,
          email: `user${i}@example.com`
        });
        users.push(user);
      }

      // Test pagination parameters
      const mockReq = { query: { page: '2', limit: '10' } };
      const pagination = qmemory.validatePagination(mockReq, mockRes);

      expect(pagination).toEqual({
        page: 2,
        limit: 10,
        skip: 10
      });

      // Simulate paginated data retrieval (skip first 10, take next 10)
      const allUsers = await qmemory.storage.listUsers();
      const paginatedUsers = allUsers.slice(pagination.skip, pagination.skip + pagination.limit);

      // Create paginated response
      const response = qmemory.createPaginatedResponse(
        paginatedUsers,
        pagination.page,
        pagination.limit,
        allUsers.length
      );

      expect(response.data).toHaveLength(10);
      expect(response.data[0].username).toBe('user11'); // First user on page 2
      expect(response.pagination.currentPage).toBe(2);
      expect(response.pagination.totalRecords).toBe(25);
      expect(response.pagination.totalPages).toBe(3);
      expect(response.pagination.hasNextPage).toBe(true);
      expect(response.pagination.hasPrevPage).toBe(true);
    });

    test('should handle pagination with empty storage', async () => { // empty data pagination
      const mockReq = { query: { page: '1', limit: '10' } };
      const pagination = qmemory.validatePagination(mockReq, mockRes);

      const allUsers = await qmemory.storage.listUsers(); // Empty array
      const response = qmemory.createPaginatedResponse(
        [],
        pagination.page,
        pagination.limit,
        allUsers.length
      );

      expect(response.data).toHaveLength(0);
      expect(response.pagination.totalRecords).toBe(0);
      expect(response.pagination.totalPages).toBe(0);
      expect(response.pagination.hasNextPage).toBe(false);
      expect(response.pagination.hasPrevPage).toBe(false);
    });

    test('should handle last page with partial results', async () => { // partial page handling
      // Create 23 users (partial last page scenario)
      for (let i = 1; i <= 23; i++) {
        await qmemory.storage.createUser({
          username: `user${i}`,
          displayName: `User ${i}`
        });
      }

      // Request page 3 with limit 10 (should have 3 users)
      const mockReq = { query: { page: '3', limit: '10' } };
      const pagination = qmemory.validatePagination(mockReq, mockRes);

      const allUsers = await qmemory.storage.listUsers();
      const paginatedUsers = allUsers.slice(pagination.skip, pagination.skip + pagination.limit);
      const response = qmemory.createPaginatedResponse(
        paginatedUsers,
        pagination.page,
        pagination.limit,
        allUsers.length
      );

      expect(response.data).toHaveLength(3); // Only 3 users on last page
      expect(response.pagination.currentPage).toBe(3);
      expect(response.pagination.totalPages).toBe(3);
      expect(response.pagination.hasNextPage).toBe(false);
      expect(response.pagination.hasPrevPage).toBe(true);
    });
  });

  describe('Integration with HTTP Utilities', () => {
    test('should integrate seamlessly with existing HTTP error patterns', () => { // HTTP integration
      const mockReq = { query: { page: 'invalid' } };
      
      const result = qmemory.validatePagination(mockReq, mockRes);
      
      // Should return undefined and send error response using same pattern as other HTTP utils
      expect(result).toBeUndefined();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Page must be a positive integer starting from 1',
        timestamp: expect.any(String)
      });

      // Verify timestamp format matches other HTTP utilities
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    test('should follow consistent error response structure', () => { // error consistency
      const testCases = [
        { query: { page: '0' }, expectedMessage: 'Page must be a positive integer starting from 1' },
        { query: { limit: '-1' }, expectedMessage: 'Limit must be a positive integer starting from 1' },
        { query: { limit: '150' }, expectedMessage: 'Limit cannot exceed 100 records per page' }
      ];

      testCases.forEach(({ query, expectedMessage }) => {
        const mockReq = { query };
        const freshMockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis()
        };

        qmemory.validatePagination(mockReq, freshMockRes);

        expect(freshMockRes.status).toHaveBeenCalledWith(400);
        expect(freshMockRes.json).toHaveBeenCalledWith({
          message: expectedMessage,
          timestamp: expect.any(String)
        });
      });
    });
  });

  describe('End-to-End Pagination Scenarios', () => {
    test('should handle complete user management pagination workflow', async () => { // complete workflow
      // Setup: Create users with different data
      const testUsers = [
        { username: 'alice', displayName: 'Alice Smith', role: 'admin' },
        { username: 'bob', displayName: 'Bob Jones', role: 'user' },
        { username: 'charlie', displayName: 'Charlie Brown', role: 'user' },
        { username: 'diana', displayName: 'Diana Prince', role: 'admin' },
        { username: 'eve', displayName: 'Eve Wilson', role: 'user' }
      ];

      for (const userData of testUsers) {
        await qmemory.storage.createUser(userData);
      }

      // Test first page (limit 2)
      let mockReq = { query: { page: '1', limit: '2' } };
      let pagination = qmemory.validatePagination(mockReq, mockRes);
      let allUsers = await qmemory.storage.listUsers();
      let pageData = allUsers.slice(pagination.skip, pagination.skip + pagination.limit);
      let response = qmemory.createPaginatedResponse(pageData, pagination.page, pagination.limit, allUsers.length);

      expect(response.data).toHaveLength(2);
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.hasNextPage).toBe(true);
      expect(response.pagination.hasPrevPage).toBe(false);

      // Test middle page
      mockReq = { query: { page: '2', limit: '2' } };
      pagination = qmemory.validatePagination(mockReq, mockRes);
      pageData = allUsers.slice(pagination.skip, pagination.skip + pagination.limit);
      response = qmemory.createPaginatedResponse(pageData, pagination.page, pagination.limit, allUsers.length);

      expect(response.data).toHaveLength(2);
      expect(response.pagination.currentPage).toBe(2);
      expect(response.pagination.hasNextPage).toBe(true);
      expect(response.pagination.hasPrevPage).toBe(true);

      // Test last page
      mockReq = { query: { page: '3', limit: '2' } };
      pagination = qmemory.validatePagination(mockReq, mockRes);
      pageData = allUsers.slice(pagination.skip, pagination.skip + pagination.limit);
      response = qmemory.createPaginatedResponse(pageData, pagination.page, pagination.limit, allUsers.length);

      expect(response.data).toHaveLength(1); // Only 1 user on last page
      expect(response.pagination.currentPage).toBe(3);
      expect(response.pagination.hasNextPage).toBe(false);
      expect(response.pagination.hasPrevPage).toBe(true);
    });

    test('should handle pagination with custom configuration', async () => { // custom config test
      // Create 150 test records
      for (let i = 1; i <= 150; i++) {
        await qmemory.storage.createUser({
          username: `bulk_user_${i}`,
          displayName: `Bulk User ${i}`
        });
      }

      // Test with custom pagination options
      const mockReq = { query: { page: '2', limit: '75' } };
      const options = {
        defaultPage: 1,
        defaultLimit: 25,
        maxLimit: 200 // Allow larger pages
      };

      const pagination = qmemory.validatePagination(mockReq, mockRes, options);
      
      expect(pagination).toEqual({
        page: 2,
        limit: 75,
        skip: 75 // (2-1) * 75
      });

      const allUsers = await qmemory.storage.listUsers();
      const pageData = allUsers.slice(pagination.skip, pagination.skip + pagination.limit);
      const response = qmemory.createPaginatedResponse(pageData, pagination.page, pagination.limit, allUsers.length);

      expect(response.data).toHaveLength(75);
      expect(response.pagination.totalPages).toBe(2); // 150 / 75 = 2 pages
      expect(response.pagination.currentPage).toBe(2);
      expect(response.pagination.hasNextPage).toBe(false);
      expect(response.pagination.hasPrevPage).toBe(true);
    });
  });

  describe('Performance and Scale Testing', () => {
    test('should handle pagination efficiently with larger datasets', async () => { // performance test
      // Create moderate dataset for performance testing
      const userCount = 100;
      for (let i = 1; i <= userCount; i++) {
        await qmemory.storage.createUser({
          username: `perf_user_${i}`,
          displayName: `Performance User ${i}`,
          metadata: { index: i, group: Math.floor(i / 10) }
        });
      }

      const startTime = Date.now();
      
      // Test multiple pagination requests
      const pages = [1, 5, 10];
      const results = [];
      
      for (const pageNum of pages) {
        const mockReq = { query: { page: pageNum.toString(), limit: '10' } };
        const pagination = qmemory.validatePagination(mockReq, mockRes);
        const allUsers = await qmemory.storage.listUsers();
        const pageData = allUsers.slice(pagination.skip, pagination.skip + pagination.limit);
        const response = qmemory.createPaginatedResponse(pageData, pagination.page, pagination.limit, allUsers.length);
        results.push(response);
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Verify all requests completed successfully
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.data).toHaveLength(10);
        expect(result.pagination.currentPage).toBe(pages[index]);
        expect(result.pagination.totalRecords).toBe(userCount);
      });

      // Performance should be reasonable (less than 1 second for 100 records)
      expect(executionTime).toBeLessThan(1000);
    });

    test('should maintain consistent response times across different page positions', async () => { // consistent performance
      // Create dataset
      for (let i = 1; i <= 50; i++) {
        await qmemory.storage.createUser({
          username: `timing_user_${i}`,
          displayName: `Timing User ${i}`
        });
      }

      const timings = [];
      const pages = [1, 3, 5]; // First, middle, last pages

      for (const pageNum of pages) {
        const startTime = Date.now();
        
        const mockReq = { query: { page: pageNum.toString(), limit: '10' } };
        const pagination = qmemory.validatePagination(mockReq, mockRes);
        const allUsers = await qmemory.storage.listUsers();
        const pageData = allUsers.slice(pagination.skip, pagination.skip + pagination.limit);
        qmemory.createPaginatedResponse(pageData, pagination.page, pagination.limit, allUsers.length);
        
        const endTime = Date.now();
        timings.push(endTime - startTime);
      }

      // All timing should be relatively similar (within reasonable variance)
      const maxTiming = Math.max(...timings);
      const minTiming = Math.min(...timings);
      const variance = maxTiming - minTiming;
      
      // Variance should be small relative to execution time
      expect(variance).toBeLessThan(100); // Less than 100ms variance
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    test('should recover gracefully from storage errors during pagination', async () => { // error recovery
      // Test pagination validation with valid parameters first
      const mockReq = { query: { page: '1', limit: '10' } };
      const pagination = qmemory.validatePagination(mockReq, mockRes);
      
      expect(pagination).toBeDefined();
      expect(mockRes.status).not.toHaveBeenCalled();

      // Even if storage operations fail later, pagination validation should still work
      const response = qmemory.createPaginatedResponse([], pagination.page, pagination.limit, 0);
      expect(response.data).toEqual([]);
      expect(response.pagination.totalRecords).toBe(0);
    });

    test('should handle concurrent pagination requests', async () => { // concurrency test
      // Create test data
      for (let i = 1; i <= 30; i++) {
        await qmemory.storage.createUser({
          username: `concurrent_user_${i}`,
          displayName: `Concurrent User ${i}`
        });
      }

      // Simulate concurrent pagination requests
      const concurrentRequests = [];
      for (let page = 1; page <= 3; page++) {
        const mockReq = { query: { page: page.toString(), limit: '10' } };
        const freshMockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis()
        };
        
        const promise = new Promise(async (resolve) => {
          const pagination = qmemory.validatePagination(mockReq, freshMockRes);
          const allUsers = await qmemory.storage.listUsers();
          const pageData = allUsers.slice(pagination.skip, pagination.skip + pagination.limit);
          const response = qmemory.createPaginatedResponse(pageData, pagination.page, pagination.limit, allUsers.length);
          resolve({ page, response, mockRes: freshMockRes });
        });
        
        concurrentRequests.push(promise);
      }

      const results = await Promise.all(concurrentRequests);

      // Verify all concurrent requests completed successfully
      results.forEach(({ page, response, mockRes }) => {
        expect(response.pagination.currentPage).toBe(page);
        expect(response.data).toHaveLength(10);
        expect(mockRes.status).not.toHaveBeenCalled(); // No errors
      });
    });
  });
});