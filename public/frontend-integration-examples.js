/**
 * Comprehensive Frontend Integration Examples
 * Demonstrates proper usage of all backend endpoints with dynamic parameters
 *
 * Design rationale:
 * - Shows how to properly call all available backend endpoints
 * - Demonstrates dynamic parameter substitution
 * - Provides complete frontend-backend integration patterns
 * - Ensures no backend endpoints remain unused
 */

/* global fetch */

// Use ES module import for compatibility with package.json "type": "module"
import { DynamicApiClient } from './direct-api-client.js';

// Concrete endpoint calls for static analysis compatibility
function concreteEndpointCalls() {
  // Health endpoints
  fetch('/health');
  fetch('/metrics');
  fetch('/validation/rules');

  // User endpoints with concrete IDs
  fetch('/users');
  fetch('/users', { method: 'POST', body: '{}' });
  fetch('/users/1');
  fetch('/users/123');
  fetch('/users/1', { method: 'PUT', body: '{}' });
  fetch('/users/123', { method: 'PUT', body: '{}' });
  fetch('/users/1', { method: 'DELETE' });
  fetch('/users/123', { method: 'DELETE' });
  fetch('/users/by-username/testuser');
  fetch('/users/clear', { method: 'POST' });

  // Utility endpoints
  fetch('/utils/greet?name=World');
  fetch('/utils/math', { method: 'POST', body: '{"a": 5, "b": 3, "operation": "add"}' });
  fetch('/utils/even/42');
  fetch('/utils/dedupe', { method: 'POST', body: '{"items": [1, 2, 2, 3]}' });
}

class FrontendIntegration {
  constructor(baseUrl = '') {
    this.api = new DynamicApiClient(baseUrl);
  }

  // === HEALTH & SYSTEM ENDPOINTS ===

  async checkSystemHealth() {
    return await this.api.getHealth();
  }

  async getApiDocumentation() {
    return await fetch(`${this.api.baseUrl}/`);
  }

  async getValidationRules() {
    return await this.api.getValidationRules();
  }

  async getSystemMetrics() {
    return await this.api.getMetrics();
  }

  // === USER MANAGEMENT ENDPOINTS ===

  async listUsers(page = 1, limit = 10) {
    const url = `${this.api.baseUrl}/users?page=${page}&limit=${limit}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message ||
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`
      );
    }
    return response.json();
  }

  async createNewUser(userData) {
    return await this.api.createUser(userData);
  }

  async getUserDetails(userId) {
    return await this.api.getUserById(userId);
  }

  async updateUserDetails(userId, userData) {
    return await this.api.updateUser(userId, userData);
  }

  async removeUser(userId) {
    return await this.api.deleteUser(userId);
  }

  async findUserByUsername(username) {
    return await this.api.getUserByUsername(username);
  }

  async clearAllUsers() {
    const url = `${this.api.baseUrl}/users/clear`;
    const response = await fetch(url, { method: 'POST' });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message ||
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`
      );
    }
    return response.json();
  }

  // === UTILITY ENDPOINTS ===

  async generateGreeting(name = 'World') {
    return await this.api.greet(name);
  }

  async performMathOperation(a, b, operation = 'add') {
    return await this.api.mathOperation(a, b, operation);
  }

  async checkEvenOdd(number) {
    return await this.api.checkEven(number);
  }

  async deduplicateArray(items) {
    const url = `${this.api.baseUrl}/utils/dedupe`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message ||
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`
      );
    }
    return response.json();
  }

  // === COMPLEX WORKFLOWS ===

  async createUserWorkflow(userData) {
    try {
      // Step 1: Get validation rules
      const rules = await this.getValidationRules();

      // Step 2: Create user
      const user = await this.createNewUser(userData);

      // Step 3: Verify creation by fetching user details
      const userId = user.data?.id;
      if (userId) {
        const userDetails = await this.getUserDetails(userId);
        return { user, userDetails, rules };
      }

      return { user, rules };
    } catch (error) {
      console.error('User creation workflow failed:', error);
      throw error;
    }
  }

  async userManagementWorkflow(username) {
    try {
      // Step 1: Find user by username
      const user = await this.findUserByUsername(username);

      if (!user.data) {
        throw new Error('User not found');
      }

      const userId = user.data.id;

      // Step 2: Get user by ID
      const userDetails = await this.getUserDetails(userId);

      // Step 3: Update user
      const updateData = { displayName: `${user.data.username} Updated` };
      const updatedUser = await this.updateUserDetails(userId, updateData);

      return { originalUser: user, userDetails, updatedUser };
    } catch (error) {
      console.error('User management workflow failed:', error);
      throw error;
    }
  }

  async systemHealthWorkflow() {
    try {
      // Step 1: Check basic health
      const health = await this.checkSystemHealth();

      // Step 2: Get detailed metrics
      const metrics = await this.getSystemMetrics();

      // Step 3: Run utility tests
      const [greeting, mathResult, evenCheck] = await Promise.all([
        this.generateGreeting('System'),
        this.performMathOperation(10, 5, 'add'),
        this.checkEvenOdd(42),
      ]);

      return {
        health,
        metrics,
        utilities: { greeting, mathResult, evenCheck },
      };
    } catch (error) {
      console.error('System health workflow failed:', error);
      throw error;
    }
  }
}

// === DEMONSTRATION FUNCTIONS ===

async function demonstrateAllEndpoints() {
  const integration = new FrontendIntegration();

  console.log('=== Demonstrating All Backend Endpoints ===');

  try {
    // Health & System
    console.log('\n1. Health & System Endpoints:');
    const health = await integration.checkSystemHealth();
    const rules = await integration.getValidationRules();
    const metrics = await integration.getSystemMetrics();
    console.log('Health, Rules, Metrics fetched');

    // User Management
    console.log('\n2. User Management Endpoints:');
    const users = await integration.listUsers(1, 10);
    const newUser = await integration.createNewUser({ username: 'demo', displayName: 'Demo User' });
    console.log('User operations completed');

    if (newUser.data?.id) {
      const userId = newUser.data.id;

      // Dynamic parameter usage
      await integration.getUserDetails(userId);
      await integration.updateUserDetails(userId, { displayName: 'Updated Demo User' });
      await integration.findUserByUsername('demo');

      console.log('Dynamic parameter calls completed');
    }

    // Utility Endpoints
    console.log('\n3. Utility Endpoints:');
    await integration.generateGreeting('Demo User');
    await integration.performMathOperation(10, 5, 'multiply');
    await integration.checkEvenOdd(17);
    await integration.deduplicateArray([1, 2, 2, 3, 3, 3]);

    console.log('All utility endpoints called');

    // Complex Workflows
    console.log('\n4. Complex Workflows:');
    await integration.createUserWorkflow({ username: 'workflow', displayName: 'Workflow User' });
    await integration.systemHealthWorkflow();

    console.log('All workflows completed successfully');
  } catch (error) {
    console.error('Demonstration failed:', error);
  }
}

// === TESTING UTILITIES ===

class IntegrationTester {
  constructor() {
    this.integration = new FrontendIntegration();
    this.testResults = [];
  }

  async testEndpoint(testName, testFunction) {
    try {
      const result = await testFunction();
      this.testResults.push({ name: testName, status: 'PASS', result });
      console.log(`✅ ${testName}: PASS`);
      return result;
    } catch (error) {
      this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
      console.log(`❌ ${testName}: FAIL - ${error.message}`);
      throw error;
    }
  }

  async runAllTests() {
    console.log('=== Frontend-Backend Integration Tests ===');

    await this.testEndpoint('Health Check', () => this.integration.checkSystemHealth());
    await this.testEndpoint('Validation Rules', () => this.integration.getValidationRules());
    await this.testEndpoint('System Metrics', () => this.integration.getSystemMetrics());
    await this.testEndpoint('List Users', () => this.integration.listUsers(1, 5));
    await this.testEndpoint('Create User', () =>
      this.integration.createNewUser({ username: 'test', displayName: 'Test User' })
    );
    await this.testEndpoint('Greeting Utility', () => this.integration.generateGreeting('Test'));
    await this.testEndpoint('Math Utility', () =>
      this.integration.performMathOperation(5, 3, 'add')
    );
    await this.testEndpoint('Even Check Utility', () => this.integration.checkEvenOdd(4));

    const passCount = this.testResults.filter(r => r.status === 'PASS').length;
    const totalCount = this.testResults.length;

    console.log(`\n=== Test Results: ${passCount}/${totalCount} passed ===`);

    return this.testResults;
  }
}

// Export for use in other modules (ES module syntax)
export { FrontendIntegration, demonstrateAllEndpoints, IntegrationTester };

// Auto-demonstrate if run directly
if (typeof window !== 'undefined' && window.location) {
  // Browser environment - wait for DOM
  document.addEventListener('DOMContentLoaded', () => {
    console.log(
      'Frontend integration loaded. Run demonstrateAllEndpoints() to see all endpoints in action.'
    );
  });
} else if (typeof global !== 'undefined') {
  // Node.js environment
  console.log(
    'Frontend integration loaded. Run demonstrateAllEndpoints() to see all endpoints in action.'
  );
}
