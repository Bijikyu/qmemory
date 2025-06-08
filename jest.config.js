
/**
 * Jest testing configuration
 * Configures test environment, coverage, and test file patterns.
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],

  // Test file patterns
  testMatch: [
    '<rootDir>/test/**/*.test.js'
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Include all source files for coverage
  collectCoverageFrom: [
    'lib/**/*.js',
    'index.js',
    '!**/node_modules/**',
    '!coverage/**',
    '!test/**'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Handle CommonJS modules
  transform: {},

  // Module file extensions
  moduleFileExtensions: ['js', 'json'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/'
  ],

  // Mock patterns for external dependencies
  moduleNameMapping: {},

  // Error handling
  errorOnDeprecated: true
};
