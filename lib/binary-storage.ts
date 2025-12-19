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

import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { createHash } from 'crypto';

/**
 * Storage statistics interface
 */
export interface StorageStats {
  type: string;
  itemCount: number;
  totalSize: number;
  maxSize?: number;
  utilizationPercent?: number;
  keys?: string[];
  storageDir?: string;
  error?: string;
}

/**
 * Storage configuration interface
 */
export interface StorageConfig {
  maxSize?: number;
  storageDir?: string;
}

/**
 * Storage options interface
 */
export interface StorageOptions {
  type?: 'memory' | 'filesystem' | 'file' | 'object' | 'cloud';
  config?: StorageConfig;
}

/**
 * File metadata interface
 */
export interface FileMetadata {
  key: string;
  size: number;
  created: string;
}

/**
 * IStorage Interface Definition
 * 
 * This interface defines the contract for binary data storage operations.
 * All implementations must provide these four core methods.
 */
export abstract class IStorage {
  /**
   * Store binary data with a unique key
   * @param key - Unique identifier for the stored data
   * @param data - Binary data to store (e.g., processed images)
   */
  abstract save(key: string, data: Buffer): Promise<void>;

  /**
   * Retrieve binary data by key
   * @param key - Unique identifier for the data to retrieve
   * @returns Binary data if found, null if not found
   */
  abstract get(key: string): Promise<Buffer | null>;

  /**
   * Remove stored data by key
   * @param key - Unique identifier for the data to delete
   */
  abstract delete(key: string): Promise<void>;

  /**
   * Check if data exists for the given key
   * @param key - Unique identifier to check for existence
   * @returns True if data exists, false otherwise
   */
  abstract exists(key: string): Promise<boolean>;

  /**
   * Get storage statistics (optional method for monitoring)
   * @returns Storage usage statistics
   */
  async getStats(): Promise<StorageStats> {
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
export class MemoryBinaryStorage extends IStorage {
  private storage: Map<string, Buffer> = new Map();
  private maxSize: number;
  private currentSize: number = 0;

  constructor(maxSize: number = 100 * 1024 * 1024) { // 100MB default limit
    super();
    this.maxSize = maxSize;
    console.log(`Initialized MemoryBinaryStorage with ${maxSize} bytes limit`);
  }

  /**
   * Validate key format and ensure it's safe for storage
   */
  private _validateKey(key: string): void {
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
  private _validateData(data: Buffer): void {
    if (!Buffer.isBuffer(data)) {
      throw new Error('Data must be a Buffer object');
    }
  }

  /**
   * Check if adding new data would exceed size limit
   */
  private _checkSizeLimit(newDataSize: number): void {
    if (this.currentSize + newDataSize > this.maxSize) {
      throw new Error(`Storage size limit exceeded. Current: ${this.currentSize}, New: ${newDataSize}, Limit: ${this.maxSize}`);
    }
  }

  async save(key: string, data: Buffer): Promise<void> {
    this._validateKey(key);
    this._validateData(data);
    
    // Calculate size difference for existing vs new data
    const existingSize = this.storage.has(key) ? this.storage.get(key)!.length : 0;
    const sizeDifference = data.length - existingSize;
    
    this._checkSizeLimit(sizeDifference);
    
    // Store the data and update size tracking
    this.storage.set(key, Buffer.from(data)); // Create copy to prevent external mutations
    this.currentSize += sizeDifference;
    
    console.log(`Stored ${data.length} bytes at key '${key}'. Total storage: ${this.currentSize} bytes`);
  }

  async get(key: string): Promise<Buffer | null> {
    this._validateKey(key);
    
    const data = this.storage.get(key);
    if (!data) {
      return null;
    }
    
    // Return a copy to prevent external mutations
    return Buffer.from(data);
  }

  async delete(key: string): Promise<void> {
    this._validateKey(key);
    
    const data = this.storage.get(key);
    if (data) {
      this.currentSize -= data.length;
      this.storage.delete(key);
      console.log(`Deleted data at key '${key}'. Remaining storage: ${this.currentSize} bytes`);
    }
  }

  async exists(key: string): Promise<boolean> {
    this._validateKey(key);
    return this.storage.has(key);
  }

  override async getStats(): Promise<StorageStats> {
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
  async clear(): Promise<void> {
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
export class FileSystemBinaryStorage extends IStorage {
  private storageDir: string;

  constructor(storageDir: string = './data/binary-storage') {
    super();
    this.storageDir = resolve(storageDir);
    this._ensureDirectoryExists();
    console.log(`Initialized FileSystemBinaryStorage at ${this.storageDir}`);
  }

  private async _ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error: any) {
      throw new Error(`Failed to create storage directory: ${error.message}`);
    }
  }

  private _validateKey(key: string): void {
    if (typeof key !== 'string' || key.length === 0) {
      throw new Error('Key must be a non-empty string');
    }
    // Ensure safe file names
    if (key.includes('..') || key.includes('/') || key.includes('\\') || key.includes('\0')) {
      throw new Error('Key contains invalid characters for file system storage');
    }
  }

  private _getFilePath(key: string): string {
    // Hash the key to ensure safe file names and avoid conflicts
    const hash = createHash('sha256').update(key).digest('hex');
    return join(this.storageDir, `${hash}.bin`);
  }

  async save(key: string, data: Buffer): Promise<void> {
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
      const metadata: FileMetadata = { 
        key, 
        size: data.length, 
        created: new Date().toISOString() 
      };
      await fs.writeFile(metaPath, JSON.stringify(metadata));
      
      console.log(`Stored ${data.length} bytes at key '${key}' in file system`);
    } catch (error: any) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      throw new Error(`Failed to save data: ${error.message}`);
    }
  }

  async get(key: string): Promise<Buffer | null> {
    this._validateKey(key);
    
    const filePath = this._getFilePath(key);
    
    try {
      const data = await fs.readFile(filePath);
      return data;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      throw new Error(`Failed to read data: ${error.message}`);
    }
  }

  async delete(key: string): Promise<void> {
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
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw new Error(`Failed to delete data: ${error.message}`);
      }
      // File doesn't exist, which is fine for delete operation
    }
  }

  async exists(key: string): Promise<boolean> {
    this._validateKey(key);
    
    const filePath = this._getFilePath(key);
    
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  override async getStats(): Promise<StorageStats> {
    try {
      const files = await fs.readdir(this.storageDir);
      const dataFiles = files.filter(f => f.endsWith('.bin'));
      
      let totalSize = 0;
      const keys: string[] = [];
      
      for (const file of dataFiles) {
        const filePath = join(this.storageDir, file);
        const metaPath = `${filePath}.meta`;
        
        try {
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
          
          // Try to read the original key from meta file
          try {
            const metaData = await fs.readFile(metaPath, 'utf8');
            const meta = JSON.parse(metaData) as FileMetadata;
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
    } catch (error: any) {
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
export class StorageFactory {
  /**
   * Create a storage instance based on configuration
   * @param options - Configuration options
   * @returns Storage implementation instance
   */
  static createStorage(options: StorageOptions = {}): IStorage {
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
          // Dynamic import for optional dependency
          const objectStorageModule = require('./object-storage-binary.js');
          const { ObjectStorageBinaryStorage } = objectStorageModule;
          return new ObjectStorageBinaryStorage();
        } catch (error: any) {
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
  static createFromEnvironment(): IStorage {
    const storageType = process.env.BINARY_STORAGE_TYPE || 'memory';
    const config: StorageConfig = {};
    
    if (storageType === 'filesystem') {
      const storageDir = process.env.BINARY_STORAGE_DIR;
      if (storageDir) {
        config.storageDir = storageDir;
      }
    } else if (storageType === 'memory') {
      const maxSizeStr = process.env.BINARY_STORAGE_MAX_SIZE;
      if (maxSizeStr) {
        config.maxSize = parseInt(maxSizeStr);
      }
    }
    
    return StorageFactory.createStorage({ type: storageType as any, config });
  }
}

// Default storage instance for easy access
let defaultStorage: IStorage | null = null;

/**
 * Get the default storage instance
 * Creates one if it doesn't exist yet
 */
export function getDefaultStorage(): IStorage {
  if (!defaultStorage) {
    defaultStorage = StorageFactory.createFromEnvironment();
  }
  return defaultStorage;
}