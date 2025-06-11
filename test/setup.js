
/**
 * Test setup and configuration
 * Configures Jest environment and shared test utilities.
 */

// Mock console methods to reduce noise during testing and allow assertions on logging
global.console = {
  ...console,
  log: jest.fn(), // silence standard logging during tests
  error: jest.fn(), // capture errors without printing to stdout
  warn: jest.fn(), // capture warnings for assertions
  info: jest.fn() // prevent info logs from cluttering test output
};

// Setup global test utilities
beforeEach(() => {
  // clear all mocks before each test to avoid state leakage
  jest.clearAllMocks();
});

// Global test helpers
// Create lightweight mock Express response
global.createMockResponse = () => ({
  status: jest.fn().mockReturnThis(), // Mimic Express res.status chainability
  json: jest.fn().mockReturnThis(), // Capture JSON body for assertions
  send: jest.fn().mockReturnThis() // Support res.send when used in tests
});

// Create generic mock model with chained query helpers
global.createMockModel = () => ({
  findOne: jest.fn(), // Mocked findOne for queries
  findOneAndDelete: jest.fn(), // Mocked deletion helper
  find: jest.fn().mockReturnValue({
    sort: jest.fn() // Allows chaining .sort in tests
  }),
  create: jest.fn(), // Mock document creation
  findById: jest.fn() // Mock find by ID
});

// Test timeout configuration for async operations
jest.setTimeout(10000); // increase Jest timeout for async operations
