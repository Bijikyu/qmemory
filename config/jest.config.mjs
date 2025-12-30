// jest.config.mjs - Clean TypeScript Jest configuration
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

export default {
  preset: 'ts-jest/presets/default-esm',
  rootDir: PROJECT_ROOT,
  testEnvironment: 'node',
  // Ensure CommonJS require() exists in ESM tests
  setupFiles: [path.join(PROJECT_ROOT, 'config', 'jest-require-polyfill.cjs')],
  setupFilesAfterEnv: [path.join(PROJECT_ROOT, 'config', 'jest-setup-simple.ts')],
  roots: [PROJECT_ROOT],
  testMatch: [
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
    '**/*.GenerateTest.test.ts',
    '**/*.GenerateTest.test.tsx',
    '**/*.GeneratedTest.test.ts',
    '**/*.GeneratedTest.test.tsx',
    '**/manual-tests/**/*.test.ts',
    '**/generated-tests/**/*GeneratedTest*.test.ts',
    '**/generated-tests/**/*GeneratedTest*.test.tsx',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/', '/__mocks__/'],
  // Harden ignores to avoid duplicate manual mocks and compiled artifacts
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/build/'],
  watchPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/build/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          jsx: 'react-jsx',
          typeRoots: ['<rootDir>', '<rootDir>/node_modules/@types'],
        },
      },
    ],
    '^.+\\.(js|jsx)$': [
      'babel-jest',
      {
        presets: [['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }]],
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!(?:qtests|@tanstack|@radix-ui|lucide-react|react-resizable-panels|cmdk|vaul)/)',
  ],
  moduleNameMapper: {
    // Map generated HTTP test helper used by generated tests
    '^\\.\\./utils/httpTest$': '<rootDir>/tests/generated-tests/utils/httpTest.ts',
    '^\\.\\./utils/httpTest\\.shim\\.js$': '<rootDir>/tests/generated-tests/utils/httpTest.shim.js',
    // Map qtests imports to avoid module resolution issues
    '^qtests/setup$': '<rootDir>/config/jest-setup-simple.ts',
  },
};
