// Jest manual mock for mongoose used by generated tests
// Provides minimal surface used by our code/tests without requiring a real DB

class CastError extends Error {
  constructor(message = 'Cast to ObjectId failed', value = undefined, path = '_id') {
    super(message);
    this.name = 'CastError';
    this.value = value;
    this.path = path;
  }
}

module.exports = {
  // Simulate a connected state by default; tests can override readyState
  connection: { readyState: 1 },
  Error: { CastError }
};

