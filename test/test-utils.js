/**
 * Test Helper Utilities
 * Centralized test setup and assertion helpers to reduce duplication
 */

const createRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
};

/**
 * Creates a standardized mock model for testing database operations
 */
const createMockModel = (modelName = 'TestModel') => ({
  modelName,
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  deleteMany: jest.fn(),
  updateMany: jest.fn(),
  lean: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis()
});

/**
 * Standard test setup function to clear mocks and create common test objects
 */
const setupTestEnvironment = () => {
  jest.clearAllMocks();
  
  const mockRes = createRes();
  const mockModel = createMockModel();
  const consoleSpy = {
    log: jest.spyOn(console, 'log').mockImplementation(() => {}),
    warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
    error: jest.spyOn(console, 'error').mockImplementation(() => {}),
    debug: jest.spyOn(console, 'debug').mockImplementation(() => {})
  };

  return { mockRes, mockModel, consoleSpy };
};

/**
 * Asserts standard HTTP error response structure
 */
const expectErrorResponse = (mockRes, expectedStatus, expectedType, expectedMessagePattern) => {
  expect(mockRes.status).toHaveBeenCalledWith(expectedStatus);
  expect(mockRes.json).toHaveBeenCalledWith(
    expect.objectContaining({
      error: expect.objectContaining({
        type: expectedType,
        message: expectedMessagePattern || expect.any(String),
        timestamp: expect.any(String),
        requestId: expect.any(String),
      }),
    })
  );
};

/**
 * Asserts 404 Not Found response
 */
const expectNotFoundResponse = (mockRes, message) => {
  expectErrorResponse(mockRes, 404, 'NOT_FOUND', message);
};

/**
 * Asserts 409 Conflict response
 */
const expectConflictResponse = (mockRes, message) => {
  expectErrorResponse(mockRes, 409, 'CONFLICT', message);
};

/**
 * Asserts 500 Internal Server Error response
 */
const expectInternalServerErrorResponse = (mockRes, message) => {
  expectErrorResponse(mockRes, 500, 'INTERNAL_SERVER_ERROR', message);
};

/**
 * Asserts 503 Service Unavailable response
 */
const expectServiceUnavailableResponse = (mockRes, message) => {
  expectErrorResponse(mockRes, 503, 'SERVICE_UNAVAILABLE', message);
};

/**
 * Creates a mock safeDbOperation function for testing
 */
const createMockSafeDbOperation = () => jest.fn();

/**
 * Resets all console spies
 */
const resetConsoleSpies = (consoleSpy) => {
  Object.values(consoleSpy).forEach(spy => spy.mockRestore());
};

module.exports = {
  createMockModel,
  setupTestEnvironment,
  expectErrorResponse,
  expectNotFoundResponse,
  expectConflictResponse,
  expectInternalServerErrorResponse,
  expectServiceUnavailableResponse,
  createMockSafeDbOperation,
  resetConsoleSpies
};
