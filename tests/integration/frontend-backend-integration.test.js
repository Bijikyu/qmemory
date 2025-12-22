/**
 * Frontend-Backend Integration Tests
 * Tests the interaction between frontend API service and backend endpoints
 *
 * Design rationale:
 * - Verifies API service correctly calls backend endpoints
 * - Tests error handling and response parsing
 * - Ensures frontend properly consumes backend responses
 * - Validates data flow between layers
 */

// Import API service functions
// Note: In a real setup, these would be properly imported
// For demo purposes, we'll reference the global functions from demo.html

describe('Frontend-Backend Integration Tests', () => {
  let mockFetch;

  beforeEach(() => {
    // Mock fetch to control API responses
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('API Service Functions', () => {
    test('should make health check request', async () => {
      const mockHealthResponse = {
        status: 'healthy',
        uptime: 123,
        userCount: 5,
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealthResponse,
      });

      // This would normally call the API service function
      const response = await apiRequest('/health');

      expect(mockFetch).toHaveBeenCalledWith(`${window.location.origin}/health`, {
        headers: { 'Content-Type': 'application/json' },
      });
      expect(response).toEqual(mockHealthResponse);
    });

    test('should handle health check errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Server error' } }),
      });

      await expect(apiRequest('/health')).rejects.toThrow('Server error');
    });

    test('should create user with correct payload', async () => {
      const userData = { username: 'testuser', displayName: 'Test User' };
      const mockUserResponse = {
        message: 'User created successfully',
        data: { id: 1, ...userData },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserResponse,
      });

      const response = await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      expect(mockFetch).toHaveBeenCalledWith(`${window.location.origin}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      expect(response).toEqual(mockUserResponse);
    });

    test('should get users with pagination', async () => {
      const mockUsersResponse = {
        data: {
          users: [{ id: 1, username: 'user1' }],
          pagination: { page: 1, limit: 10, total: 1 },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsersResponse,
      });

      const response = await apiRequest('/users?page=1&limit=10');

      expect(mockFetch).toHaveBeenCalledWith(`${window.location.origin}/users?page=1&limit=10`, {
        headers: { 'Content-Type': 'application/json' },
      });
      expect(response).toEqual(mockUsersResponse);
    });

    test('should get user by ID', async () => {
      const mockUserResponse = {
        message: 'User found',
        data: { id: 1, username: 'testuser' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserResponse,
      });

      const response = await apiRequest('/users/1');

      expect(mockFetch).toHaveBeenCalledWith(`${window.location.origin}/users/1`, {
        headers: { 'Content-Type': 'application/json' },
      });
      expect(response).toEqual(mockUserResponse);
    });

    test('should delete user by ID', async () => {
      const mockDeleteResponse = {
        message: 'User deleted successfully',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDeleteResponse,
      });

      const response = await apiRequest('/users/1', {
        method: 'DELETE',
      });

      expect(mockFetch).toHaveBeenCalledWith(`${window.location.origin}/users/1`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(response).toEqual(mockDeleteResponse);
    });

    test('should clear all users', async () => {
      const mockClearResponse = {
        message: 'All users cleared successfully',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockClearResponse,
      });

      const response = await apiRequest('/users/clear', {
        method: 'POST',
      });

      expect(mockFetch).toHaveBeenCalledWith(`${window.location.origin}/users/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(response).toEqual(mockClearResponse);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiRequest('/health')).rejects.toThrow('Network error');
    });

    test('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      // Should still succeed but with empty error object
      const response = await apiRequest('/health');
      expect(response).toBeUndefined();
    });

    test('should handle HTTP error status without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      });

      await expect(apiRequest('/nonexistent')).rejects.toThrow('HTTP 404: Not Found');
    });

    test('should handle HTTP error with custom error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Custom validation error' } }),
      });

      await expect(apiRequest('/users')).rejects.toThrow('Custom validation error');
    });
  });

  describe('Response Data Validation', () => {
    test('should handle paginated user responses correctly', async () => {
      const paginatedResponse = {
        data: {
          users: [
            { id: 1, username: 'user1', displayName: 'User One' },
            { id: 2, username: 'user2', displayName: 'User Two' },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => paginatedResponse,
      });

      const response = await apiRequest('/users?page=1&limit=10');

      expect(response.data.users).toHaveLength(2);
      expect(response.data.pagination.page).toBe(1);
      expect(response.data.pagination.total).toBe(2);
    });

    test('should handle user creation response', async () => {
      const createResponse = {
        message: 'User created successfully',
        timestamp: '2024-01-01T00:00:00.000Z',
        data: {
          id: 123,
          username: 'newuser',
          displayName: 'New User',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createResponse,
      });

      const response = await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({ username: 'newuser', displayName: 'New User' }),
      });

      expect(response.data.id).toBe(123);
      expect(response.data.username).toBe('newuser');
      expect(response.message).toBe('User created successfully');
    });
  });
});
