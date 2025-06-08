
# My NPM Module

A simple Node.js module with basic utility functions.

## Installation

```bash
npm install my-npm-module
```

## Usage

```javascript
const { greet, add, isEven, ensureMongoDB } = require('my-npm-module');

// Greet function
console.log(greet()); // "Hello, World!"
console.log(greet('Alice')); // "Hello, Alice!"

// Add function
console.log(add(2, 3)); // 5

// IsEven function
console.log(isEven(4)); // true
console.log(isEven(5)); // false

// Database validation (requires Express response object)
// Use in Express routes to check MongoDB connectivity
app.get('/users', (req, res) => {
  if (!ensureMongoDB(res)) return; // Exits early if DB unavailable
  // Proceed with database operations...
});
```

## API

### greet(name)
- `name` (string, optional): Name to greet. Defaults to 'World'.
- Returns: Greeting message string

### add(a, b)
- `a` (number): First number
- `b` (number): Second number
- Returns: Sum of the two numbers

### isEven(num)
- `num` (number): Number to check
- Returns: Boolean indicating if the number is even

### ensureMongoDB(res)
- `res` (Express Response object): Express response object for error handling
- Returns: Boolean indicating if MongoDB connection is available
- Side effects: Sends HTTP error responses (503/500) when database is unavailable
- Note: Requires mongoose to be connected to MongoDB

## Dependencies

- `mongoose`: Required for MongoDB connection validation

## License

ISC
