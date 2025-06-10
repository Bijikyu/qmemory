// MongoDB initialization script for production deployment
db = db.getSiblingDB('qmemory');

// Create collections with proper indexing for production performance
db.createCollection('documents');

// Essential indexes for user-owned document operations
db.documents.createIndex({ "username": 1, "createdAt": -1 });
db.documents.createIndex({ "username": 1, "title": 1 }, { unique: true });
db.documents.createIndex({ "username": 1, "updatedAt": -1 });

// Create application user with limited permissions
db.createUser({
  user: "qmemory_app",
  pwd: "secure_app_password",
  roles: [
    {
      role: "readWrite",
      db: "qmemory"
    }
  ]
});

print("MongoDB initialized successfully for qmemory application");