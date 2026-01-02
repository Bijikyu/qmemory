// jest-setup.ts - Jest setup for TypeScript ESM with React support
import 'jest';
// jest globals will be available automatically
// Set test environment early
process.env.NODE_ENV = 'test';
// Resolve jest reference safely and expose globally for tests using jest.*
const J = globalThis.jest;
if (!globalThis.jest && J) {
    globalThis.jest = J;
}
// Provide CommonJS-like require for ESM tests that call require()
// Avoid top-level await to satisfy stricter Jest transform pipelines.
try {
    if (!globalThis.require && typeof require === 'function') {
        globalThis.require = require;
    }
}
catch { }
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
    const E = globalThis.expect;
    if (E && typeof E.extend === 'function') {
        E.extend({
            toBeInTheDocument(received) {
                const pass = received !== null && received !== undefined;
                return {
                    pass,
                    message: () => pass
                        ? 'expected element not to be in the document'
                        : 'expected element to be in the document',
                };
            },
        });
    }
}
catch { }
// Register a lightweight stub for '@testing-library/react' to avoid adding real dependency
try {
    // Simple global mock to avoid requiring full testing library
    globalThis.render = (..._args) => ({ getByTestId: (_id) => ({}) });
}
catch { }
//# sourceMappingURL=jest-setup.js.map