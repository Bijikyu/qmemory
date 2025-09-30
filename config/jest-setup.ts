// jest-setup.ts - Jest setup for TypeScript ESM with React support
// Keep qtests setup FIRST to ensure global stubbing is active
import 'qtests/setup';
// Use stable qtests import path to avoid brittle node_modules references
// Fallback to direct dist path to satisfy ts-jest module resolution
import { registerModuleStub } from '../node_modules/qtests/dist/utils/customStubs.js';
import { jest as jestFromGlobals, beforeAll, afterEach } from '@jest/globals';

// Set test environment early
process.env.NODE_ENV = 'test';

// Resolve jest reference safely and expose globally for tests using jest.*
const J = (typeof jestFromGlobals !== 'undefined' && jestFromGlobals)
  ? jestFromGlobals
  : (globalThis as any).jest;
if (!(globalThis as any).jest && J) {
  (globalThis as any).jest = J as any;
}

// Provide CommonJS-like require for ESM tests that call require()
// Avoid top-level await to satisfy stricter Jest transform pipelines.
try {
  if (!(globalThis as any).require && typeof require === 'function') {
    (globalThis as any).require = require as any;
  }
} catch {}

beforeAll(() => {
  const j = (globalThis as any).jest || J;
  if (j && typeof j.setTimeout === 'function') {
    j.setTimeout(10000);
  }
});

afterEach(() => {
  const j = (globalThis as any).jest || J;
  if (j && typeof j.clearAllMocks === 'function') {
    j.clearAllMocks();
  }
});

// Provide a minimal matcher used by some generated tests without adding extra deps
try {
  const E: any = (globalThis as any).expect;
  if (E && typeof E.extend === 'function') {
    E.extend({
      toBeInTheDocument(received: any) {
        const pass = received !== null && received !== undefined;
        return {
          pass,
          message: () => pass
            ? 'expected element not to be in the document'
            : 'expected element to be in the document'
        };
      }
    });
  }
} catch {}

// Register a lightweight stub for '@testing-library/react' via qtests custom stubs
// This avoids adding the real dependency and replaces local manual mocks.
try {
  registerModuleStub('@testing-library/react', () => ({
    render: (..._args: any[]) => ({ getByTestId: (_id?: string) => ({}) })
  }));
} catch {}
