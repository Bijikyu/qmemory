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
import {
  BINARY_STORAGE_TYPE,
  BINARY_STORAGE_DIR,
  BINARY_STORAGE_MAX_SIZE,
} from '../config/localVars.js';
import qerrors from 'qerrors';
import { StorageStats, IStorageInterface, StorageOptions, IStorage } from './storage-interfaces.js';

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
  private currentSize: number = 0;
  private maxSize: number;

  constructor(maxSize: number = 100 * 1024 * 1024) {
    super();
    this.storage = new Map();
    this.currentSize = 0;
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
  private _validateData(data: any): asserts data is Buffer {
    if (!Buffer.isBuffer(data)) {
      throw new Error('Data must be a Buffer object');
    }
  }
  /**
   * Check if adding new data would exceed size limit
   */
  private _checkSizeLimit(newDataSize: number): void {
    if (this.currentSize + newDataSize > this.maxSize) {
      throw new Error(
        `Storage size limit exceeded. Current: ${this.currentSize}, New: ${newDataSize}, Limit: ${this.maxSize}`
      );
    }
  }
  async save(key: string, data: Buffer): Promise<void> {
    this._validateKey(key);
    this._validateData(data);
    // Calculate size difference for existing vs new data
    const existingSize = this.storage.has(key) ? this.storage.get(key).length : 0;
    const sizeDifference = data.length - existingSize;
    this._checkSizeLimit(sizeDifference);
    // Store the data and update size tracking
    this.storage.set(key, data); // Zero-copy storage for better performance
    this.currentSize += sizeDifference;
    console.log(
      `Stored ${data.length} bytes at key '${key}'. Total storage: ${this.currentSize} bytes`
    );
  }
  async get(key: string): Promise<Buffer | null> {
    this._validateKey(key);
    const data = this.storage.get(key);
    if (!data) {
      return null;
    }
    // Return a copy to prevent external mutations (required for safety)
    // Note: Consider read-only Buffer views for future optimization
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
  async getStats() {
    return {
      type: 'memory',
      itemCount: this.storage.size,
      totalSize: this.currentSize,
      maxSize: this.maxSize,
      utilizationPercent: Math.round((this.currentSize / this.maxSize) * 100),
      keys: Array.from(this.storage.keys()),
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
export class FileSystemBinaryStorage extends IStorage {
  private storageDir: string;

  constructor(storageDir = './data/binary-storage') {
    super();
    this.storageDir = resolve(storageDir);
    this._ensureDirectoryExists();
    console.log(`Initialized FileSystemBinaryStorage at ${this.storageDir}`);
  }
  async _ensureDirectoryExists() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error) {
      qerrors.qerrors(
        error as Error,
        'binary-storage.FileSystemBinaryStorage._ensureDirectoryExists',
        {
          storageDir: this.storageDir,
          errorCode: error && typeof error === 'object' && 'code' in error ? error.code : undefined,
        }
      );
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
      const metadata = {
        key,
        size: data.length,
        created: new Date().toISOString(),
      };
      await fs.writeFile(metaPath, JSON.stringify(metadata));
      console.log(`Stored ${data.length} bytes at key '${key}' in file system`);
    } catch (error) {
      qerrors.qerrors(error as Error, 'binary-storage.FileSystemBinaryStorage.save', {
        key,
        dataSize: data.length,
        filePath,
        tempPath,
        storageDir: this.storageDir,
      });
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
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      qerrors.qerrors(error as Error, 'binary-storage.FileSystemBinaryStorage.get', {
        key,
        filePath,
        storageDir: this.storageDir,
        errorCode: error && typeof error === 'object' && 'code' in error ? error.code : undefined,
      });
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
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT') {
        qerrors.qerrors(error as Error, 'binary-storage.FileSystemBinaryStorage.delete', {
          key,
          filePath,
          metaPath,
          storageDir: this.storageDir,
          errorCode: error && typeof error === 'object' && 'code' in error ? error.code : undefined,
        });
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
  async getStats() {
    try {
      const files = await fs.readdir(this.storageDir);
      const dataFiles = files.filter(f => f.endsWith('.bin'));
      let totalSize = 0;
      const keys = [];
      for (const file of dataFiles) {
        const filePath = join(this.storageDir, file);
        const metaPath = `${filePath}.meta`;
        try {
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
          // Try to read the original key from meta file
          try {
            const metaData = await fs.readFile(metaPath, 'utf8');
            // Validate metadata size to prevent memory exhaustion
            if (metaData.length > 10000) {
              throw new Error('Metadata too large');
            }

            // Safe JSON parsing with validation
            const meta = JSON.parse(metaData);

            // Validate parsed object structure
            if (typeof meta !== 'object' || meta === null) {
              throw new Error('Invalid metadata format');
            }

            // Prevent prototype pollution
            if (meta.__proto__ || meta.constructor || meta.prototype) {
              throw new Error('Invalid metadata structure');
            }

            // Validate key property exists and is string
            if (typeof meta.key !== 'string') {
              throw new Error('Invalid key in metadata');
            }

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
        keys,
      };
    } catch (error) {
      return {
        type: 'filesystem',
        itemCount: 0,
        totalSize: 0,
        error: error.message,
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
        // For object storage, we need to handle async loading differently
        // Return memory storage initially and warn about async nature
        console.warn(
          'Object storage requires async initialization. Use createObjectStorage() method instead.'
        );
        return new MemoryBinaryStorage();
      default:
        console.warn(`Unknown storage type '${type}', falling back to memory storage`);
        return new MemoryBinaryStorage();
    }
  }

  /**
   * Create object storage instance with async loading
   * @param config - Optional configuration
   * @returns Promise resolving to ObjectStorageBinaryStorage instance
   */
  static async createObjectStorage(): Promise<IStorage> {
    try {
      const objectStorage = await import('./object-storage-binary.js');
      return new objectStorage.ObjectStorageBinaryStorage();
    } catch (error) {
      console.warn(
        `Failed to load object storage: ${error instanceof Error ? error.message : String(error)}, falling back to memory storage`
      );
      return new MemoryBinaryStorage();
    }
  }
  /**
   * Create storage based on environment variables
   */
  static createFromEnvironment(): IStorage {
    const storageType = BINARY_STORAGE_TYPE;
    const config: { maxSize?: number; storageDir?: string; [key: string]: any } = {};
    if (storageType === 'filesystem') {
      const storageDir = BINARY_STORAGE_DIR;
      if (storageDir) {
        config.storageDir = storageDir;
      }
    } else if (storageType === 'memory') {
      const maxSizeStr = BINARY_STORAGE_MAX_SIZE;
      if (maxSizeStr) {
        config.maxSize = parseInt(maxSizeStr);
      }
    } else if (storageType === 'object' || storageType === 'cloud') {
      // Special handling for object storage - return memory storage and warn
      console.warn(
        'Object storage detected in environment. Use createObjectStorageFromEnvironment() for async initialization.'
      );
    }
    return StorageFactory.createStorage({ type: storageType, config });
  }

  /**
   * Create object storage from environment variables with async loading
   */
  static async createObjectStorageFromEnvironment(): Promise<IStorage> {
    const storageType = BINARY_STORAGE_TYPE;
    if (storageType === 'object' || storageType === 'cloud') {
      return await StorageFactory.createObjectStorage();
    }
    // Fall back to regular environment-based creation
    return StorageFactory.createFromEnvironment();
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
