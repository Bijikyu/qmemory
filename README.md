
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

### MongoDB Document Utilities

#### findUserDoc(model, id, username)
- Finds a document by ID that belongs to a specific user
- Returns: Document or null if not found/invalid ID

#### deleteUserDoc(model, id, username)
- Deletes a document by ID that belongs to a specific user
- Returns: Deleted document or null if not found

#### fetchUserDocOr404(model, id, user, res, msg)
- Fetches a user document or sends 404 response if not found
- Returns: Document or undefined (with 404 response sent)

#### deleteUserDocOr404(model, id, user, res, msg)
- Deletes a user document or sends 404 response if not found
- Returns: Deleted document or undefined (with 404 response sent)

#### listUserDocs(model, username, sort)
- Lists all documents owned by a user with optional sorting
- Returns: Array of documents

#### createUniqueDoc(model, fields, uniqueQuery, res, duplicateMsg)
- Creates a new document after checking for uniqueness
- Returns: Created document or undefined (with 409 response if duplicate)

#### updateUserDoc(model, id, username, fieldsToUpdate, uniqueQuery, res, duplicateMsg)
- Updates a user-owned document with optional uniqueness validation
- Returns: Updated document or undefined

#### Helper Functions
- `sendNotFound(res, message)`: Sends 404 response
- `ensureUnique(model, query, res, duplicateMsg)`: Checks document uniqueness

## Dependencies

- `mongoose`: Required for MongoDB connection validation

## License

ISC
