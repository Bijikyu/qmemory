
/**
 * Test setup and configuration
 * Configures Jest environment and shared test utilities.
 */

// Mock console methods to reduce noise during testing
global.console = {
  ...console,
  log: jest.fn(), // Silence standard logging during tests
  error: jest.fn(), // Capture errors without printing to stdout
  warn: jest.fn(), // Capture warnings for assertions
  info: jest.fn() // Prevent info logs from cluttering test output
};

// Setup global test utilities
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

// Global test helpers
global.createMockResponse = () => ({
  status: jest.fn().mockReturnThis(), // Mimic Express res.status chainability
  json: jest.fn().mockReturnThis(), // Capture JSON body for assertions
  send: jest.fn().mockReturnThis() // Support res.send when used in tests
});

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
jest.setTimeout(10000); // Increase Jest timeout for async operations
