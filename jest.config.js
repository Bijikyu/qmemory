/**
 * Jest configuration for TypeScript with ESM support
 */
/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: 'tsconfig.json',
    },
  },
  collectCoverageFrom: [
    'lib/**/*.ts',
    'lib/**/*.js',
    'index.ts',
    'index.js',
    '!**/node_modules/**',
    '!**/*.d.ts',
    '!dist/**',
    '!**/cache/**',
  ],
  testMatch: ['**/test/**/*.test.ts', '**/test/**/*.test.js', '**/*.test.ts', '**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/config/jest-require-polyfill.cjs'],
  verbose: false,
  clearMocks: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverage: false,
  transform: {},
  transformIgnorePatterns: [
    'node_modules/(?!(opossum|email-validator|change-case|pluralize|@godaddy\\/terminus|bee-queue|qerrors|lru-cache|redis|mongoose)/)',
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/.cache/',
    '<rootDir>/cache/',
    '<rootDir>/temp-storage/',
    '<rootDir>/factory-storage/',
  ],
  errorOnDeprecated: true,
  resolver: undefined,
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '<rootDir>/$1',
  },
};
