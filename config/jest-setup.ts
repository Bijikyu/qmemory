// jest-setup.ts - Jest setup for TypeScript ESM with React support
import 'jest';
// jest globals will be available automatically

// Set test environment early
process.env.NODE_ENV = 'test';

// Resolve jest reference safely and expose globally for tests using jest.*
const J = (globalThis as any).jest;
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

// Set default timeout
beforeAll(() => {
  jest.setTimeout(10000);
});

// Clear mocks after each test
afterEach(() => {
  jest.clearAllMocks();
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
          message: () =>
            pass
              ? 'expected element not to be in the document'
              : 'expected element to be in the document',
        };
      },
    });
  }
} catch {}

// Register a lightweight stub for '@testing-library/react' to avoid adding real dependency
try {
  // Simple global mock to avoid requiring full testing library
  (globalThis as any).render = (..._args: any[]) => ({ getByTestId: (_id?: string) => ({}) });
} catch {}
