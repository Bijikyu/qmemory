
/**
 * Test setup and configuration
 * Configures Jest environment and shared test utilities.
 */

// Mock console methods to reduce noise during testing
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// Setup global test utilities
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

// Global test helpers
global.createMockResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis()
});

global.createMockModel = () => ({
  findOne: jest.fn(),
  findOneAndDelete: jest.fn(),
  find: jest.fn().mockReturnValue({
    sort: jest.fn()
  }),
  create: jest.fn(),
  findById: jest.fn()
});

// Test timeout configuration for async operations
jest.setTimeout(10000);
