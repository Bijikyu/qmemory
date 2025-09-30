// Ambient declarations to satisfy generated tests using TS
declare module '@testing-library/react' {
  export const render: any;
}

// Allow TS to resolve the generated test helper import path
declare module '../utils/httpTest' {
  export const createMockApp: any;
  export const supertest: any;
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
    }
  }
  // Provide minimal Jest globals for TS in generated tests
  // These are loose types to satisfy TS when using ts-jest without @types/jest
  var describe: any;
  var it: any;
  var test: any;
  var beforeAll: any;
  var beforeEach: any;
  var afterAll: any;
  var afterEach: any;
  var expect: any;
  // Allow using jest as a value (e.g., jest.useFakeTimers())
  var jest: any;
}

export {};

// Provide ambient types for qtests internal utils used in Jest setup
declare module 'qtests/utils/customStubs' {
  export function registerModuleStub(moduleId: string, stub: any): void;
  export function unregisterModuleStub(moduleId: string): void;
  export function clearAllModuleStubs(): void;
  export function listModuleStubs(): string[];
}
