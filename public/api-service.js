/**
 * Frontend API Service
 * Provides a clean interface between frontend and backend APIs
 *
 * Design rationale:
 * - Centralizes all API calls for better maintainability
 * - Provides consistent error handling across the application
 * - Abstracts away fetch details and response formatting
 * - Enables easy testing and mocking of API interactions
 */

class ApiService {
  constructor(baseUrl = window.location.origin) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic request method with error handling
   */
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message ||
            errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Health check endpoints
  async getHealth() {
    return this.request('/health');
  }

  async getServerInfo() {
    return this.request('/');
  }

  // User management endpoints
  async getUsers(page = 1, limit = 10) {
    return this.request(`/users?page=${page}&limit=${limit}`);
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUserById(id) {
    return this.request(`/users/${id}`);
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async clearAllUsers() {
    return this.request('/users/clear', {
      method: 'POST',
    });
  }
}

// Export singleton instance
const apiService = new ApiService();
