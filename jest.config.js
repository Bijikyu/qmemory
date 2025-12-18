/**
 * Jest configuration for TypeScript
 */
/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: 'tsconfig.json'
    }
  },
  collectCoverageFrom: [
    'lib/**/*.ts',
    'lib/**/*.js',
    'index.ts',
    'index.js',
    '!**/node_modules/**',
    '!**/*.d.ts',
    '!dist/**'
  ],
  testMatch: [
    '**/test/**/*.test.ts',
    '**/test/**/*.test.js',
    '**/*.test.ts',
    '**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/config/jest-require-polyfill.cjs'],
  verbose: true,
  clearMocks: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  transform: {},
  transformIgnorePatterns: [
    'node_modules/(?!(opossum|email-validator|change-case|pluralize|@godaddy\\/terminus|bee-queue)/)'
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/'
  ],
  errorOnDeprecated: true
};