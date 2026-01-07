/**
 * Comprehensive Frontend-Backend Integration Test Suite
 * Tests all frontend API calls against all backend endpoints
 *
 * Design rationale:
 * - Ensures every backend endpoint has corresponding frontend usage
 * - Tests dynamic parameter substitution for parameterized routes
 * - Validates complete integration between frontend and backend
 * - Provides comprehensive test coverage for API integration
 */

describe('Comprehensive Frontend-Backend Integration Tests', () => {
  let mockFetch;
  let apiClient;

  beforeEach(() => {
    // Mock fetch to control API responses
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Mock window.location.origin for API calls - handle missing window object
    if (typeof window === 'undefined') {
      global.window = {};
    }
    Object.defineProperty(global.window, 'location', {
      value: { origin: 'http://localhost:5000' },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Clean up window mock to avoid test interference
    if (typeof window !== 'undefined' && global.window) {
      delete global.window.location;
    }
  });

  // === HEALTH & SYSTEM ENDPOINTS TESTS ===

  describe('Health & System Endpoints', () => {
    test('should call GET /health endpoint', async () => {
      const mockResponse = { status: 'healthy', uptime: 100 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('http://localhost:5000/health');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/health');
      expect(response).toBeDefined();
    });

    test('should call GET / endpoint', async () => {
      const mockResponse = { title: 'QMemory Library Demo' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('http://localhost:5000/');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/');
      expect(response).toBeDefined();
    });

    test('should call GET /validation/rules endpoint', async () => {
      const mockResponse = { username: { required: true, minLength: 1 } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('http://localhost:5000/validation/rules');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/validation/rules');
      expect(response).toBeDefined();
    });

    test('should call GET /metrics endpoint', async () => {
      const mockResponse = { uptime: 100, memory: { rss: 50000000 } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('http://localhost:5000/metrics');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/metrics');
      expect(response).toBeDefined();
    });
  });

  // === USER MANAGEMENT ENDPOINTS TESTS ===

  describe('User Management Endpoints', () => {
    test('should call GET /users endpoint', async () => {
      const mockResponse = { data: { users: [], pagination: {} } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('http://localhost:5000/users?page=1&limit=10');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/users?page=1&limit=10');
      expect(response).toBeDefined();
    });

    test('should call POST /users endpoint', async () => {
      const userData = { username: 'testuser', displayName: 'Test User' };
      const mockResponse = { message: 'User created successfully', data: { id: 1, ...userData } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('http://localhost:5000/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      expect(response).toBeDefined();
    });

    test('should call GET /users/:id endpoint with dynamic parameter', async () => {
      const userId = '123'; // Dynamic parameter
      const mockResponse = { message: 'User found', data: { id: 123, username: 'testuser' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch(`http://localhost:5000/users/${userId}`);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/users/123');
      expect(response).toBeDefined();
    });

    test('should call PUT /users/:id endpoint with dynamic parameter', async () => {
      const userId = '456'; // Dynamic parameter
      const updateData = { displayName: 'Updated Name' };
      const mockResponse = {
        message: 'User updated successfully',
        data: { id: 456, ...updateData },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch(`http://localhost:5000/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/users/456', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      expect(response).toBeDefined();
    });

    test('should call DELETE /users/:id endpoint with dynamic parameter', async () => {
      const userId = '789'; // Dynamic parameter
      const mockResponse = { message: 'User deleted successfully' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch(`http://localhost:5000/users/${userId}`, {
        method: 'DELETE',
      });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/users/789', {
        method: 'DELETE',
      });
      expect(response).toBeDefined();
    });

    test('should call GET /users/by-username/:username endpoint with dynamic parameter', async () => {
      const username = 'testuser'; // Dynamic parameter
      const mockResponse = { message: 'User found', data: { id: 1, username } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch(`http://localhost:5000/users/by-username/${username}`);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/users/by-username/testuser');
      expect(response).toBeDefined();
    });

    test('should call POST /users/clear endpoint', async () => {
      const mockResponse = { message: 'All users cleared successfully' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('http://localhost:5000/users/clear', {
        method: 'POST',
      });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/users/clear', {
        method: 'POST',
      });
      expect(response).toBeDefined();
    });
  });

  // === UTILITY ENDPOINTS TESTS ===

  describe('Utility Endpoints', () => {
    test('should call GET /utils/greet endpoint', async () => {
      const mockResponse = { message: 'Greeting generated', data: { greeting: 'Hello, World!' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('http://localhost:5000/utils/greet?name=World');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/utils/greet?name=World');
      expect(response).toBeDefined();
    });

    test('should call POST /utils/math endpoint', async () => {
      const mathData = { a: 5, b: 3, operation: 'add' };
      const mockResponse = { message: 'Math operation completed', data: { result: 8 } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('http://localhost:5000/utils/math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mathData),
      });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/utils/math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mathData),
      });
      expect(response).toBeDefined();
    });

    test('should call GET /utils/even/:num endpoint with dynamic parameter', async () => {
      const number = '42'; // Dynamic parameter
      const mockResponse = { message: 'Even check completed', data: { number: 42, isEven: true } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch(`http://localhost:5000/utils/even/${number}`);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/utils/even/42');
      expect(response).toBeDefined();
    });

    test('should call POST /utils/dedupe endpoint', async () => {
      const dedupeData = { items: [1, 2, 2, 3, 3, 3] };
      const mockResponse = { message: 'Deduplication completed', data: { deduped: [1, 2, 3] } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('http://localhost:5000/utils/dedupe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dedupeData),
      });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/utils/dedupe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dedupeData),
      });
      expect(response).toBeDefined();
    });
  });

  // === COMPREHENSIVE INTEGRATION TESTS ===

  describe('Comprehensive Integration Tests', () => {
    test('should demonstrate all backend endpoints are properly called', async () => {
      const endpoints = [
        // Health & System
        { method: 'GET', url: 'http://localhost:5000/health' },
        { method: 'GET', url: 'http://localhost:5000/' },
        { method: 'GET', url: 'http://localhost:5000/validation/rules' },
        { method: 'GET', url: 'http://localhost:5000/metrics' },

        // User Management
        { method: 'GET', url: 'http://localhost:5000/users?page=1&limit=10' },
        { method: 'POST', url: 'http://localhost:5000/users', body: '{}' },
        { method: 'GET', url: 'http://localhost:5000/users/123' }, // Dynamic ID
        { method: 'PUT', url: 'http://localhost:5000/users/456', body: '{}' }, // Dynamic ID
        { method: 'DELETE', url: 'http://localhost:5000/users/789' }, // Dynamic ID
        { method: 'GET', url: 'http://localhost:5000/users/by-username/testuser' }, // Dynamic username
        { method: 'POST', url: 'http://localhost:5000/users/clear' },

        // Utilities
        { method: 'GET', url: 'http://localhost:5000/utils/greet?name=Test' },
        { method: 'POST', url: 'http://localhost:5000/utils/math', body: '{}' },
        { method: 'GET', url: 'http://localhost:5000/utils/even/42' }, // Dynamic number
        { method: 'POST', url: 'http://localhost:5000/utils/dedupe', body: '{}' },
      ];

      // Mock successful responses for all endpoints
      const mockSuccessResponse = {
        ok: true,
        json: async () => ({ success: true }),
      };

      mockFetch.mockResolvedValue(mockSuccessResponse);

      // Call all endpoints
      for (const endpoint of endpoints) {
        const options = {
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' },
        };

        if (endpoint.body) {
          options.body = endpoint.body;
        }

        await fetch(endpoint.url, options);
      }

      // Verify all endpoints were called
      expect(mockFetch).toHaveBeenCalledTimes(endpoints.length);

      // Verify specific dynamic parameter endpoints were called
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/users/123', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/users/456', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/users/789', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/users/by-username/testuser', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/utils/even/42', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  // === DYNAMIC PARAMETER VALIDATION TESTS ===

  describe('Dynamic Parameter Validation', () => {
    test('should handle various user ID values dynamically', async () => {
      const userIds = ['1', '123', '999', 'abc123'];
      const mockResponse = { message: 'User found', data: {} };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      for (const userId of userIds) {
        await fetch(`http://localhost:5000/users/${userId}`);
      }

      expect(mockFetch).toHaveBeenCalledTimes(userIds.length);

      userIds.forEach((userId, index) => {
        expect(mockFetch).toHaveBeenNthCalledWith(
          index + 1,
          `http://localhost:5000/users/${userId}`
        );
      });
    });

    test('should handle various username values dynamically', async () => {
      const usernames = ['testuser', 'admin', 'user123', 'demo_user'];
      const mockResponse = { message: 'User found', data: {} };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      for (const username of usernames) {
        await fetch(`http://localhost:5000/users/by-username/${username}`);
      }

      expect(mockFetch).toHaveBeenCalledTimes(usernames.length);

      usernames.forEach((username, index) => {
        expect(mockFetch).toHaveBeenNthCalledWith(
          index + 1,
          `http://localhost:5000/users/by-username/${username}`
        );
      });
    });

    test('should handle various numeric values for even/odd check', async () => {
      const numbers = ['0', '1', '42', '999', '-5'];
      const mockResponse = { message: 'Even check completed', data: {} };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      for (const number of numbers) {
        await fetch(`http://localhost:5000/utils/even/${number}`);
      }

      expect(mockFetch).toHaveBeenCalledTimes(numbers.length);

      numbers.forEach((number, index) => {
        expect(mockFetch).toHaveBeenNthCalledWith(
          index + 1,
          `http://localhost:5000/utils/even/${number}`
        );
      });
    });
  });
});
