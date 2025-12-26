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
    'node_modules/(?!(opossum|email-validator|change-case|pluralize|@godaddy\\/terminus|bee-queue|lru-cache|redis|mongoose|@google-cloud|@uppy))',
    'node_modules/qerrors/**',
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  modulePathIgnorePatterns: ['<rootDir>/.cache/', '<rootDir>/cache/'],
  haste: {
    throwOnModuleCollision: false,
  },
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
    '^@/(.*)$': '<rootDir>/$1',
  },
};
