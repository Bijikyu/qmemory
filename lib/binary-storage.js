/**
 * Binary Storage Interface and Implementations
 * 
 * Provides a unified interface for storing and retrieving binary data (Buffer objects)
 * with multiple implementation strategies:
 * - In-memory storage for development and testing
 * - Object storage for production persistence
 * - File system storage for local persistence
 * 
 * Design Philosophy:
 * - Simple, async interface for all storage operations
 * - Graceful error handling with meaningful error messages
 * - Environment-aware implementation selection
 * - Buffer-based binary data handling for maximum flexibility
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * IStorage Interface Definition (JavaScript implementation)
 * 
 * This interface defines the contract for binary data storage operations.
 * All implementations must provide these four core methods.
 */
class IStorage {
  /**
   * Store binary data with a unique key
   * @param {string} key - Unique identifier for the stored data
   * @param {Buffer} data - Binary data to store (e.g., processed images)
   * @returns {Promise<void>}
   */
  async save(key, data) {
    throw new Error('save method must be implemented by storage provider');
  }

  /**
   * Retrieve binary data by key
   * @param {string} key - Unique identifier for the data to retrieve
   * @returns {Promise<Buffer|null>} Binary data if found, null if not found
   */
  async get(key) {
    throw new Error('get method must be implemented by storage provider');
  }

  /**
   * Remove stored data by key
   * @param {string} key - Unique identifier for the data to delete
   * @returns {Promise<void>}
   */
  async delete(key) {
    throw new Error('delete method must be implemented by storage provider');
  }

  /**
   * Check if data exists for the given key
   * @param {string} key - Unique identifier to check for existence
   * @returns {Promise<boolean>} True if data exists, false otherwise
   */
  async exists(key) {
    throw new Error('exists method must be implemented by storage provider');
  }

  /**
   * Get storage statistics (optional method for monitoring)
   * @returns {Promise<Object>} Storage usage statistics
   */
  async getStats() {
    return {
      type: 'unknown',
      itemCount: 0,
      totalSize: 0
    };
  }
}

/**
 * In-Memory Binary Storage Implementation
 * 
 * Fast, volatile storage using JavaScript Map.
 * Perfect for development, testing, and caching scenarios.
 * Data is lost when the process restarts.
 * 
 * Features:
 * - O(1) read/write performance
 * - Built-in size tracking
 * - Memory usage monitoring
 * - Automatic cleanup capabilities
 */
class MemoryBinaryStorage extends IStorage {
  constructor(maxSize = 100 * 1024 * 1024) { // 100MB default limit
    super();
    this.storage = new Map(); // key -> Buffer mapping
    this.maxSize = maxSize; // Maximum total storage size in bytes
    this.currentSize = 0; // Current total size in bytes
    console.log(`Initialized MemoryBinaryStorage with ${maxSize} bytes limit`);
  }

  /**
   * Validate key format and ensure it's safe for storage
   */
  _validateKey(key) {
    if (typeof key !== 'string' || key.length === 0) {
      throw new Error('Key must be a non-empty string');
    }
    if (key.length > 250) {
      throw new Error('Key must be 250 characters or less');
    }
    // Prevent path traversal and ensure safe key format
    if (key.includes('..') || key.includes('/') || key.includes('\\')) {
      throw new Error('Key cannot contain path separators or relative paths');
    }
  }

  /**
   * Validate data is a Buffer object
   */
  _validateData(data) {
    if (!Buffer.isBuffer(data)) {
      throw new Error('Data must be a Buffer object');
    }
  }

  /**
   * Check if adding new data would exceed size limit
   */
  _checkSizeLimit(newDataSize) {
    if (this.currentSize + newDataSize > this.maxSize) {
      throw new Error(`Storage size limit exceeded. Current: ${this.currentSize}, New: ${newDataSize}, Limit: ${this.maxSize}`);
    }
  }

  async save(key, data) {
    this._validateKey(key);
    this._validateData(data);
    
    // Calculate size difference for existing vs new data
    const existingSize = this.storage.has(key) ? this.storage.get(key).length : 0;
    const sizeDifference = data.length - existingSize;
    
    this._checkSizeLimit(sizeDifference);
    
    // Store the data and update size tracking
    this.storage.set(key, Buffer.from(data)); // Create copy to prevent external mutations
    this.currentSize += sizeDifference;
    
    console.log(`Stored ${data.length} bytes at key '${key}'. Total storage: ${this.currentSize} bytes`);
  }

  async get(key) {
    this._validateKey(key);
    
    const data = this.storage.get(key);
    if (!data) {
      return null;
    }
    
    // Return a copy to prevent external mutations
    return Buffer.from(data);
  }

  async delete(key) {
    this._validateKey(key);
    
    const data = this.storage.get(key);
    if (data) {
      this.currentSize -= data.length;
      this.storage.delete(key);
      console.log(`Deleted data at key '${key}'. Remaining storage: ${this.currentSize} bytes`);
    }
  }

  async exists(key) {
    this._validateKey(key);
    return this.storage.has(key);
  }

  async getStats() {
    return {
      type: 'memory',
      itemCount: this.storage.size,
      totalSize: this.currentSize,
      maxSize: this.maxSize,
      utilizationPercent: Math.round((this.currentSize / this.maxSize) * 100),
      keys: Array.from(this.storage.keys())
    };
  }

  /**
   * Clear all stored data (useful for testing)
   */
  async clear() {
    this.storage.clear();
    this.currentSize = 0;
    console.log('Cleared all data from memory storage');
  }
}

/**
 * File System Binary Storage Implementation
 * 
 * Persistent storage using the local file system.
 * Good for local development and single-server deployments.
 * 
 * Features:
 * - Persistent across application restarts
 * - Configurable storage directory
 * - Atomic write operations
 * - Automatic directory creation
 */
class FileSystemBinaryStorage extends IStorage {
  constructor(storageDir = './data/binary-storage') {
    super();
    this.storageDir = path.resolve(storageDir);
    this._ensureDirectoryExists();
    console.log(`Initialized FileSystemBinaryStorage at ${this.storageDir}`);
  }

  async _ensureDirectoryExists() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create storage directory: ${error.message}`);
    }
  }

  _validateKey(key) {
    if (typeof key !== 'string' || key.length === 0) {
      throw new Error('Key must be a non-empty string');
    }
    // Ensure safe file names
    if (key.includes('..') || key.includes('/') || key.includes('\\') || key.includes('\0')) {
      throw new Error('Key contains invalid characters for file system storage');
    }
  }

  _getFilePath(key) {
    // Hash the key to ensure safe file names and avoid conflicts
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    return path.join(this.storageDir, `${hash}.bin`);
  }

  async save(key, data) {
    this._validateKey(key);
    if (!Buffer.isBuffer(data)) {
      throw new Error('Data must be a Buffer object');
    }

    const filePath = this._getFilePath(key);
    const tempPath = `${filePath}.tmp`;

    try {
      // Atomic write: write to temp file then rename
      await fs.writeFile(tempPath, data);
      await fs.rename(tempPath, filePath);
      
      // Store key mapping for reverse lookup
      const metaPath = `${filePath}.meta`;
      await fs.writeFile(metaPath, JSON.stringify({ 
        key, 
        size: data.length, 
        created: new Date().toISOString() 
      }));
      
      console.log(`Stored ${data.length} bytes at key '${key}' in file system`);
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      throw new Error(`Failed to save data: ${error.message}`);
    }
  }

  async get(key) {
    this._validateKey(key);
    
    const filePath = this._getFilePath(key);
    
    try {
      const data = await fs.readFile(filePath);
      return data;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      throw new Error(`Failed to read data: ${error.message}`);
    }
  }

  async delete(key) {
    this._validateKey(key);
    
    const filePath = this._getFilePath(key);
    const metaPath = `${filePath}.meta`;
    
    try {
      await fs.unlink(filePath);
      try {
        await fs.unlink(metaPath);
      } catch (metaError) {
        // Meta file might not exist, ignore error
      }
      console.log(`Deleted data at key '${key}' from file system`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error(`Failed to delete data: ${error.message}`);
      }
      // File doesn't exist, which is fine for delete operation
    }
  }

  async exists(key) {
    this._validateKey(key);
    
    const filePath = this._getFilePath(key);
    
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getStats() {
    try {
      const files = await fs.readdir(this.storageDir);
      const dataFiles = files.filter(f => f.endsWith('.bin'));
      
      let totalSize = 0;
      const keys = [];
      
      for (const file of dataFiles) {
        const filePath = path.join(this.storageDir, file);
        const metaPath = `${filePath}.meta`;
        
        try {
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
          
          // Try to read the original key from meta file
          try {
            const metaData = await fs.readFile(metaPath, 'utf8');
            const meta = JSON.parse(metaData);
            keys.push(meta.key);
          } catch (metaError) {
            keys.push(file.replace('.bin', ''));
          }
        } catch (statError) {
          // Skip files we can't read
        }
      }
      
      return {
        type: 'filesystem',
        itemCount: dataFiles.length,
        totalSize,
        storageDir: this.storageDir,
        keys
      };
    } catch (error) {
      return {
        type: 'filesystem',
        itemCount: 0,
        totalSize: 0,
        error: error.message
      };
    }
  }
}

/**
 * Storage Factory
 * 
 * Creates the appropriate storage implementation based on environment
 * and configuration. Provides a unified way to get storage instances.
 */
class StorageFactory {
  /**
   * Create a storage instance based on configuration
   * @param {Object} options - Configuration options
   * @param {string} options.type - Storage type: 'memory', 'filesystem', 'object'
   * @param {Object} options.config - Type-specific configuration
   * @returns {IStorage} Storage implementation instance
   */
  static createStorage(options = {}) {
    const { type = 'memory', config = {} } = options;
    
    switch (type.toLowerCase()) {
      case 'memory':
        return new MemoryBinaryStorage(config.maxSize);
        
      case 'filesystem':
      case 'file':
        return new FileSystemBinaryStorage(config.storageDir);
        
      case 'object':
      case 'cloud':
        try {
          const { ObjectStorageBinaryStorage } = require('./object-storage-binary');
          return new ObjectStorageBinaryStorage();
        } catch (error) {
          console.warn(`Failed to initialize object storage: ${error.message}, falling back to memory storage`);
          return new MemoryBinaryStorage();
        }
        
      default:
        console.warn(`Unknown storage type '${type}', falling back to memory storage`);
        return new MemoryBinaryStorage();
    }
  }

  /**
   * Create storage based on environment variables
   */
  static createFromEnvironment() {
    const storageType = process.env.BINARY_STORAGE_TYPE || 'memory';
    const config = {};
    
    if (storageType === 'filesystem') {
      config.storageDir = process.env.BINARY_STORAGE_DIR;
    } else if (storageType === 'memory') {
      config.maxSize = process.env.BINARY_STORAGE_MAX_SIZE ? 
        parseInt(process.env.BINARY_STORAGE_MAX_SIZE) : undefined;
    }
    
    return StorageFactory.createStorage({ type: storageType, config });
  }
}

// Default storage instance for easy access
let defaultStorage = null;

/**
 * Get the default storage instance
 * Creates one if it doesn't exist yet
 */
function getDefaultStorage() {
  if (!defaultStorage) {
    defaultStorage = StorageFactory.createFromEnvironment();
  }
  return defaultStorage;
}

module.exports = {
  IStorage,
  MemoryBinaryStorage,
  FileSystemBinaryStorage,
  StorageFactory,
  getDefaultStorage
};