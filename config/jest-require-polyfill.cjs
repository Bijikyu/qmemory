// Ensure a global require exists for ESM tests that use CommonJS require().
// Executed by Jest via setupFiles BEFORE test files are evaluated.
try {
  if (typeof global.require === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createRequire } = require('module');
    let req;
    try {
      req = createRequire(process.cwd() + '/package.json');
    } catch {
      req = createRequire(__filename);
    }
    Object.defineProperty(global, 'require', {
      value: req,
      writable: false,
      configurable: true,
      enumerable: false,
    });
  }
} catch {}

// Prevent `qerrors` from initializing external/logging side effects during tests (winston transports, AI model init, etc.).
try {
  // eslint-disable-next-line no-undef
  if (typeof jest !== 'undefined' && typeof jest.mock === 'function') {
    // eslint-disable-next-line no-undef
    jest.mock('qerrors', () => {
      // eslint-disable-next-line no-undef
      const qerrorsFn = typeof jest.fn === 'function' ? jest.fn() : () => {};
      const mockedModule = {
        qerrors: qerrorsFn,
      };
      return {
        __esModule: true,
        default: mockedModule,
        ...mockedModule,
      };
    });
  }
} catch {}
