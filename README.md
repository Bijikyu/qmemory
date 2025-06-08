
# My NPM Module

A simple Node.js module with basic utility functions.

## Installation

```bash
npm install my-npm-module
```

## Usage

```javascript
const { greet, add, isEven } = require('my-npm-module');

// Greet function
console.log(greet()); // "Hello, World!"
console.log(greet('Alice')); // "Hello, Alice!"

// Add function
console.log(add(2, 3)); // 5

// IsEven function
console.log(isEven(4)); // true
console.log(isEven(5)); // false
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

## License

ISC
