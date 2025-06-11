// MongoDB initialization script for production deployment
db = db.getSiblingDB('qmemory'); // switch context to application database

// Create collections with proper indexing for production performance
db.createCollection('documents'); // create collection for user documents

// Essential indexes for user-owned document operations
db.documents.createIndex({ "username": 1, "createdAt": -1 }); // allow fast retrieval by creation date
db.documents.createIndex({ "username": 1, "title": 1 }, { unique: true }); // prevent duplicate titles per user
db.documents.createIndex({ "username": 1, "updatedAt": -1 }); // enable sorting by last update

// Create application user with limited permissions
db.createUser({ // application user for database access
  user: "qmemory_app",
  pwd: "secure_app_password",
  roles: [
    {
      role: "readWrite", // user can read and write only
      db: "qmemory"
    }
  ]
}); // finish user creation

print("MongoDB initialized successfully for qmemory application"); // confirm script completion
