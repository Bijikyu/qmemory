/**
 * Jest Configuration for QMemory Library Testing
 *
 * This configuration provides comprehensive test setup for the QMemory library
 * including TypeScript support, coverage collection, and module resolution.
 * It's optimized for both development and CI/CD environments.
 *
 * Key Features:
 * - TypeScript compilation with ts-jest preset
 * - ESM module support for modern import syntax
 * - Comprehensive coverage collection from TypeScript and JavaScript files
 * - Optimized module resolution and transformation
 * - Mock clearing for test isolation
 * - Performance optimizations with caching and selective transformation
 *
 * @type {import('jest').Config}
 */
export default {
  /**
   * Use TypeScript preset for Jest
   * This provides TypeScript compilation, source map support,
   * and modern TypeScript features in the test environment.
   */
  preset: 'ts-jest',

  /**
   * Test environment for Node.js applications
   * Node.js environment provides access to Node.js APIs and globals
   * that are needed for testing server-side code.
   */
  testEnvironment: 'node',

  /**
   * Treat TypeScript files as ES modules
   * This enables proper import/export syntax and top-level await
   * for modern JavaScript module system.
   */
  extensionsToTreatAsEsm: ['.ts'],

  /**
   * Global configuration for ts-jest
   * These settings control TypeScript compilation behavior in Jest tests.
   * ESM mode is enabled for compatibility with modern module syntax.
   */
  globals: {
    'ts-jest': {
      useESM: true, // Enable ES module syntax in tests
      tsconfig: 'tsconfig.json', // Use project TypeScript configuration
    },
  },

  /**
   * Coverage collection settings
   * Collect coverage from both TypeScript and JavaScript files
   * Exclude dependencies and build artifacts from coverage calculation
   */
  collectCoverageFrom: [
    'lib/**/*.ts', // Main library source files
    'lib/**/*.js', // JavaScript library files
    'index.ts', // Main entry point
    'index.js', // Compiled main entry point
    '!**/node_modules/**', // Exclude external dependencies
    '!**/*.d.ts', // Exclude type definition files
    '!dist/**', // Exclude build output
    '!**/cache/**', // Exclude cache directories
  ],

  /**
   * Test file matching patterns
   * Include both unit and integration tests with various file extensions
   * Supports both .test.ts and .test.js naming conventions.
   */
  testMatch: [
    '**/test/**/*.test.ts', // Unit tests in test directory
    '**/test/**/*.test.js', // JavaScript unit tests
    '**/*.test.ts', // Root-level test files
    '**/*.test.js', // Root-level JavaScript test files
  ],

  /**
   * Test setup and teardown
   * Setup files run after test environment is established
   * Polyfills ensure compatibility with older Node.js versions.
   */
  setupFilesAfterEnv: ['<rootDir>/config/jest-require-polyfill.cjs'],

  /**
   * Output and logging configuration
   * Control verbosity, mock behavior, and reporting for optimal
   * development and CI/CD experience.
   */
  verbose: false, // Reduce output noise while maintaining error reporting
  clearMocks: true, // Ensure clean test isolation by clearing mocks
  coverageDirectory: 'coverage', // Store coverage reports in coverage directory
  coverageReporters: ['text', 'lcov', 'html'], // Multiple report formats
  collectCoverage: false, // Coverage collection disabled by default (enable with --coverage)

  /**
   * Module transformation settings
   * Optimize performance by transforming only necessary files
   * Exclude test utilities and well-behaved dependencies from transformation
   */
  transform: {}, // No custom transformations needed
  transformIgnorePatterns: [
    // Don't transform these well-behaved dependencies for performance
    'node_modules/(?!(opossum|email-validator|change-case|pluralize|@godaddy/terminus|bee-queue|lru-cache|redis|mongoose|@google-cloud|@uppy)/)',
    'node_modules/qerrors/.*', // qerrors module doesn't need transformation
  ],

  /**
   * Module resolution settings
   * Optimize module resolution for performance and compatibility
   * Configure file extensions and ignore patterns for efficient operation.
   */
  moduleFileExtensions: ['ts', 'js', 'json'], // Support multiple file types
  modulePathIgnorePatterns: ['<rootDir>/.cache/', '<rootDir>/cache/'], // Ignore cache directories

  /**
   * Haste module system settings
   * Configure Haste for faster module resolution in large codebases
   * Disable module collision throwing for better development experience.
   */
  haste: {
    throwOnModuleCollision: false, // Allow duplicate module names for better DX
  },

  /**
   * Test path exclusions
   * Exclude directories that don't contain test files
   * This improves test discovery performance and avoids irrelevant files.
   */
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/', // External dependencies
    '<rootDir>/dist/', // Build output directory
    '<rootDir>/.cache/', // Cache directories
    '<rootDir>/cache/', // Additional cache directory
    '<rootDir>/temp-storage/', // Temporary storage
    '<rootDir>/factory-storage/', // Factory storage cache
  ],

  /**
   * Error handling and deprecation settings
   * Ensure robust error handling and prevent deprecation warnings
   * Configure resolver for optimal module resolution behavior.
   */
  errorOnDeprecated: true, // Fail fast on deprecated features
  resolver: undefined, // Use default Node.js resolver

  /**
   * Module name mapping for relative imports
   * Map module paths for correct resolution of relative imports
   * This is especially useful for monorepo structures.
   */
  moduleNameMapper: {
    // Handle relative imports in nested directories
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // Map scoped packages to local paths
    '^@/(.*)$': '<rootDir>/$1',
  },
};
