/**
 * Jest configuration
 * Defines how tests are executed and how coverage is collected.
 *
 * Rationale: Centralizing test settings keeps the project consistent
 * and makes it easy for developers to understand the testing strategy.
 */
module.exports = {
  testEnvironment: 'node', // Use Node environment for server-side testing
  collectCoverageFrom: [
    'lib/**/*.js', // Include all library files for coverage metrics
    'index.js',    // Include the main entry file in coverage
    '!**/node_modules/**' // Exclude dependencies from coverage
  ],
  testMatch: [
    '**/test/**/*.test.js' // Look for tests in any test folder
  ],
  setupFilesAfterEnv: ['<rootDir>/config/jest-require-polyfill.cjs'], // Use CommonJS setup for compatibility
  verbose: true, // Show individual test results for clarity
  clearMocks: true, // Reset mocks automatically between tests
  coverageDirectory: 'coverage', // Output folder for coverage reports
  coverageReporters: ['text', 'lcov', 'html'], // Formats for coverage output
  collectCoverage: true, // Enable coverage collection
  coverageThreshold: {
    global: {
      branches: 80,  // Require 80% branch coverage across project
      functions: 80, // Require 80% function coverage
      lines: 80,     // Require 80% line coverage
      statements: 80 // Require 80% statement coverage
    }
  },
  transform: {}, // No transformation needed for plain JS
  transformIgnorePatterns: [
    'node_modules/(?!(opossum|email-validator|change-case|pluralize|@godaddy\\/terminus|bee-queue)/)' // Transform the new ES modules
  ],
  moduleFileExtensions: ['js', 'json'], // Resolve only JS and JSON modules
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/' // Ignore tests inside node_modules
  ],
  errorOnDeprecated: true // Fail tests if deprecated APIs are used
};