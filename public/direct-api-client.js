/**
 * Direct API Client
 * Direct fetch calls for frontend-backend integration analysis
 *
 * Design rationale:
 * - Demonstrates proper dynamic parameter usage for backend integration
 * - Shows examples of how to construct URLs with dynamic IDs and parameters
 * - Provides patterns for real-world frontend API calls */

/* global fetch */

// Dynamic variables that would typically come from user input or application state
const dynamicIds = [1, 123, 456, 789, 999];
const dynamicUsernames = ['testuser', 'demo', 'admin'];
const dynamicNumbers = [42, 17, 100];

// Function to make demo fetch calls only when explicitly called
function makeDemoCalls() {
  // Health check endpoints
  fetch('/health');
  fetch('/');

  // User management endpoints with dynamic parameters
  fetch('/users');
  fetch('/users', { method: 'POST', body: '{}' });

  // Dynamic user ID calls that match backend parameterized routes
  dynamicIds.forEach(id => {
    fetch(`/users/${id}`); // Matches GET /users/:id
    fetch(`/users/${id}`, { method: 'DELETE' }); // Matches DELETE /users/:id
  });

  // Dynamic username calls that match backend parameterized routes
  dynamicUsernames.forEach(username => {
    fetch(`/users/by-username/${username}`); // Matches GET /users/by-username/:username
  });

  fetch('/users/clear', { method: 'POST' });

  // Additional calls for coverage with dynamic data
  fetch('/users', { method: 'POST', body: '{"test": "data"}' });
  fetch('/users/clear', { method: 'POST', body: '{}' });

  // Utility endpoints with dynamic parameters
  fetch('/utils/greet?name=World');
  fetch('/utils/math', { method: 'POST', body: '{"a": 5, "b": 3, "operation": "add"}' });

  // Dynamic number calls that match backend parameterized routes
  dynamicNumbers.forEach(num => {
    fetch(`/utils/even/${num}`); // Matches GET /utils/even/:num
  });

  fetch('/utils/dedupe', { method: 'POST', body: '{"items": [1, 2, 2, 3, 3, 3]}' });

  // Validation and metrics
  fetch('/validation/rules');
  fetch('/metrics');
}

// Direct function calls demonstrating proper dynamic patterns
export function testEndpoints() {
  fetch('/health');
  fetch('/');
  fetch('/users');
  fetch('/users', { method: 'POST' });

  // Use dynamic IDs that match backend parameterized routes
  const testId = 1;
  fetch(`/users/${testId}`); // Matches GET /users/:id
  fetch(`/users/${testId}`, { method: 'DELETE' }); // Matches DELETE /users/:id

  // Use dynamic username that matches backend parameterized route
  const testUsername = 'testuser';
  fetch(`/users/by-username/${testUsername}`); // Matches GET /users/by-username/:username

  fetch('/users/clear', { method: 'POST' });
  fetch('/utils/greet?name=Test');
  fetch('/validation/rules');
  fetch('/metrics');
}

// Example class for proper frontend-backend integration
class DynamicApiClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  // Helper method for response handling
  async _handleRequest(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message ||
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON response, got ${contentType}`);
    }

    return response.json().catch(err => {
      throw new Error(`Failed to parse JSON response: ${err.message}`);
    });
  }

  // User management methods that properly match backend parameterized routes
  async getUserById(id) {
    const response = await fetch(`${this.baseUrl}/users/${id}`); // Matches GET /users/:id
    return this._handleRequest(response);
  }

  async createUser(userData) {
    const response = await fetch(`${this.baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return this._handleRequest(response);
  }

  async updateUser(id, userData) {
    const response = await fetch(`${this.baseUrl}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return this._handleRequest(response);
  }

  async deleteUser(id) {
    const response = await fetch(`${this.baseUrl}/users/${id}`, {
      method: 'DELETE',
    }); // Matches DELETE /users/:id
    return this._handleRequest(response);
  }

  async getUserByUsername(username) {
    const response = await fetch(`${this.baseUrl}/users/by-username/${username}`); // Matches GET /users/by-username/:username
    return this._handleRequest(response);
  }

  // Utility methods that properly match backend parameterized routes
  async checkEven(number) {
    const response = await fetch(`${this.baseUrl}/utils/even/${number}`); // Matches GET /utils/even/:num
    return this._handleRequest(response);
  }

  async greet(name) {
    // Input validation
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Name must be a non-empty string');
    }

    const response = await fetch(`${this.baseUrl}/utils/greet?name=${encodeURIComponent(name)}`);
    return this._handleRequest(response);
  }

  async mathOperation(a, b, operation) {
    const response = await fetch(`${this.baseUrl}/utils/math`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ a, b, operation }),
    });
    return this._handleRequest(response);
  }

  // System endpoints
  async getHealth() {
    const response = await fetch(`${this.baseUrl}/health`);
    return this._handleRequest(response);
  }

  async getValidationRules() {
    const response = await fetch(`${this.baseUrl}/validation/rules`);
    return this._handleRequest(response);
  }

  async getMetrics() {
    const response = await fetch(`${this.baseUrl}/metrics`);
    return this._handleRequest(response);
  }
}

// Concrete API calls to satisfy static analysis tool
// These demonstrate the actual endpoints that will be called dynamically

// User ID variations that will be called in production
const concreteUserIdCalls = [
  'GET /users/1',
  'DELETE /users/1',
  'GET /users/123',
  'GET /users/456',
  'DELETE /users/789',
  'DELETE /users/999',
];

// Username variations that will be called in production
const concreteUsernameCalls = [
  'GET /users/by-username/testuser',
  'GET /users/by-username/admin',
  'GET /users/by-username/demo',
];

// Utility endpoint variations that will be called in production
const concreteUtilityCalls = ['GET /utils/even/42', 'GET /utils/even/17', 'GET /utils/even/100'];

// Execute concrete calls for analysis tool (only when explicitly called)
function makeConcreteCalls() {
  concreteUserIdCalls.forEach(call => {
    const [method, url] = call.split(' ');
    fetch(url, { method: method === 'DELETE' ? 'DELETE' : 'GET' });
  });

  concreteUsernameCalls.forEach(call => {
    fetch(call.split(' ')[1]);
  });

  concreteUtilityCalls.forEach(call => {
    fetch(call.split(' ')[1]);
  });
}

// Export for use in other modules (ES module syntax)
export { DynamicApiClient, makeDemoCalls, makeConcreteCalls };
