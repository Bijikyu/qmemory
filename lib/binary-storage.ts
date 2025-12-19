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
// 🚩AI: ENTRY_POINT_FOR_BINARY_STORAGE_IMPLEMENTATIONS
// 🚩AI: MUST_UPDATE_IF_STORAGE_FACTORY_BEHAVIOR_CHANGES

import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { createHash } from 'crypto';

type ObjectStorageBinaryStorageCtor = typeof import('./object-storage-binary.js').ObjectStorageBinaryStorage; // Describe optional object storage constructor shape

let ObjectStorageBinaryStorageClass: ObjectStorageBinaryStorageCtor | null = null; // Cache optional object storage class once loaded
let objectStorageImportError: Error | null = null; // Preserve import failure details for downstream logging

try {
  const module = await import('./object-storage-binary.js') as { ObjectStorageBinaryStorage?: ObjectStorageBinaryStorageCtor }; // Narrow imported module shape for safer optional dependency handling
  ObjectStorageBinaryStorageClass = module?.ObjectStorageBinaryStorage ?? null; // Store constructor to keep factory synchronous
} catch (error: unknown) {
  objectStorageImportError = error instanceof Error ? error : new Error(String(error)); // Normalize error so logging remains predictable
}

/**
 * Storage statistics interface
 */
export interface StorageStats<TKey extends string = string, TExtra extends Record<string, unknown> | undefined = undefined> {
  type: string;
  itemCount: number;
  totalSize: number;
  maxSize?: number;
  utilizationPercent?: number;
  keys?: TKey[];
  storageDir?: string;
  error?: string;
  extra?: TExtra;
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
export interface StorageOptions<TKey extends string = string, TDomain = Buffer, TRuntime extends Buffer = Buffer> {
  type?: 'memory' | 'filesystem' | 'file' | 'object' | 'cloud';
  config?: StorageConfig;
  codec?: StorageCodec<TDomain, TRuntime>;
}

/**
 * Codec abstraction that translates consumer-facing payloads into the concrete
 * runtime representation used by the storage engine (typically Buffer) and back.
 * This keeps storage implementations agnostic of the application-level payload type.
 */
export interface StorageCodec<TDomain, TRuntime extends Buffer = Buffer> {
  encode(data: TDomain): TRuntime;
  decode(payload: TRuntime): TDomain;
}

const defaultBufferCodec: StorageCodec<Buffer> = {
  encode(data) {
    return data;
  },
  decode(payload) {
    return Buffer.from(payload);
  }
};

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
export class IStorage<
  TKey extends string = string,
  TDomain = Buffer,
  TRuntime extends Buffer = Buffer,
  TStats extends StorageStats<TKey> = StorageStats<TKey>
> {
  protected readonly codec: StorageCodec<TDomain, TRuntime>;

  protected constructor(codec?: StorageCodec<TDomain, TRuntime>) {
    this.codec = codec ?? (defaultBufferCodec as StorageCodec<TDomain, TRuntime>);
  }

  protected encode(data: TDomain): TRuntime {
    return this.codec.encode(data);
  }

  protected decode(payload: TRuntime): TDomain {
    return this.codec.decode(payload);
  }

  /**
   * Store binary data with a unique key
   * @param key - Unique identifier for the stored data
   * @param data - Binary data to store (e.g., processed images)
   */
  async save(key: TKey, _data: TDomain): Promise<void> {
    throw new Error('save method must be implemented');
  }

  /**
   * Retrieve binary data by key
   * @param key - Unique identifier for the data to retrieve
   * @returns Binary data if found, null if not found
   */
  async get(key: TKey): Promise<TDomain | null> {
    throw new Error('get method must be implemented');
  }

  /**
   * Remove stored data by key
   * @param key - Unique identifier for the data to delete
   */
  async delete(key: TKey): Promise<void> {
    throw new Error('delete method must be implemented');
  }

  /**
   * Check if data exists for the given key
   * @param key - Unique identifier to check for existence
   * @returns True if data exists, false otherwise
   */
  async exists(key: TKey): Promise<boolean> {
    throw new Error('exists method must be implemented');
  }

  /**
   * Get storage statistics (optional method for monitoring)
   * @returns Storage usage statistics
   */
  async getStats(): Promise<TStats> {
    return {
      type: 'unknown',
      itemCount: 0,
      totalSize: 0
    } as TStats;
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
export class MemoryBinaryStorage<
  TKey extends string = string,
  TDomain = Buffer,
  TRuntime extends Buffer = Buffer
> extends IStorage<TKey, TDomain, TRuntime> {
  private storage: Map<TKey, Buffer> = new Map();
  private maxSize: number;
  private currentSize: number = 0;

  constructor(maxSize: number = 100 * 1024 * 1024, codec?: StorageCodec<TDomain, TRuntime>) { // 100MB default limit
    super(codec);
    this.maxSize = maxSize;
    console.log(`Initialized MemoryBinaryStorage with ${maxSize} bytes limit`);
  }

  /**
   * Validate key format and ensure it's safe for storage
   */
  private _validateKey(key: TKey): void {
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
   * Encode data via codec and return a defensive Buffer copy.
   */
  private _encodeData(data: TDomain): Buffer {
    const encoded = this.encode(data);
    if (!Buffer.isBuffer(encoded)) {
      throw new Error('Storage codec must produce Buffer instances');
    }
    return Buffer.from(encoded);
  }

  /**
   * Check if adding new data would exceed size limit
   */
  private _checkSizeLimit(newDataSize: number): void {
    if (this.currentSize + newDataSize > this.maxSize) {
      throw new Error(`Storage size limit exceeded. Current: ${this.currentSize}, New: ${newDataSize}, Limit: ${this.maxSize}`);
    }
  }

  override async save(key: TKey, data: TDomain): Promise<void> {
    this._validateKey(key);
    const encoded = this._encodeData(data);

    const existingSize = this.storage.has(key) ? this.storage.get(key)!.length : 0;
    const sizeDifference = encoded.length - existingSize;
    this._checkSizeLimit(sizeDifference);

    this.storage.set(key, encoded);
    this.currentSize += sizeDifference;
    console.log(`Stored ${encoded.length} bytes at key '${key}'. Total storage: ${this.currentSize} bytes`);
  }

  override async get(key: TKey): Promise<TDomain | null> {
    this._validateKey(key);
    const data = this.storage.get(key);
    if (!data) {
      return null;
    }
    return this.decode(Buffer.from(data) as TRuntime);
  }

  override async delete(key: TKey): Promise<void> {
    this._validateKey(key);
    const data = this.storage.get(key);
    if (data) {
      this.currentSize -= data.length;
      this.storage.delete(key);
      console.log(`Deleted data at key '${key}'. Remaining storage: ${this.currentSize} bytes`);
    }
  }

  override async exists(key: TKey): Promise<boolean> {
    this._validateKey(key);
    return this.storage.has(key);
  }

  override async getStats(): Promise<StorageStats<TKey>> {
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
export class FileSystemBinaryStorage<
  TDomain = Buffer,
  TRuntime extends Buffer = Buffer
> extends IStorage<string, TDomain, TRuntime> {
  private storageDir: string;

  constructor(storageDir: string = './data/binary-storage', codec?: StorageCodec<TDomain, TRuntime>) {
    super(codec);
    this.storageDir = resolve(storageDir);
    this._ensureDirectoryExists();
    console.log(`Initialized FileSystemBinaryStorage at ${this.storageDir}`);
  }

  private async _ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error); // Inline normalization maintains sanitized errors
      throw new Error(`Failed to create storage directory: ${message}`);
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

  override async save(key: string, data: TDomain): Promise<void> {
    this._validateKey(key);

    const encoded = this.encode(data);
    if (!Buffer.isBuffer(encoded)) {
      throw new Error('Storage codec must produce Buffer instances');
    }

    const filePath = this._getFilePath(key);
    const tempPath = `${filePath}.tmp`;

    try {
      // Atomic write: write to temp file then rename
      await fs.writeFile(tempPath, encoded);
      await fs.rename(tempPath, filePath);
      
      // Store key mapping for reverse lookup
      const metaPath = `${filePath}.meta`;
      const metadata: FileMetadata = { 
        key, 
        size: encoded.length, 
        created: new Date().toISOString() 
      };
      await fs.writeFile(metaPath, JSON.stringify(metadata));
      
      console.log(`Stored ${encoded.length} bytes at key '${key}' in file system`);
    } catch (error: unknown) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempPath);
      } catch (cleanupError: unknown) {
        // Ignore cleanup errors
      }
      const message = error instanceof Error ? error.message : String(error); // Inline sanitize failure detail for safe logging
      throw new Error(`Failed to save data: ${message}`);
    }
  }

  override async get(key: string): Promise<TDomain | null> {
    this._validateKey(key);
    
    const filePath = this._getFilePath(key);
    
    try {
      const data = await fs.readFile(filePath);
      return this.decode(data as TRuntime);
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'ENOENT') {
        return null; // File doesn't exist
      }
      const message = error instanceof Error ? error.message : String(error); // Inline conversion keeps responses consistent
      throw new Error(`Failed to read data: ${message}`);
    }
  }

  override async delete(key: string): Promise<void> {
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
    } catch (error: unknown) {
      if (!(typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'ENOENT')) {
        const message = error instanceof Error ? error.message : String(error); // Inline message ensures sanitized error propagation
        throw new Error(`Failed to delete data: ${message}`);
      }
      // File doesn't exist, which is fine for delete operation
    }
  }

  override async exists(key: string): Promise<boolean> {
    this._validateKey(key);
    
    const filePath = this._getFilePath(key);
    
    try {
      await fs.access(filePath);
      return true;
    } catch (_error: unknown) {
      return false;
    }
  }

  override async getStats(): Promise<StorageStats<string>> {
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
    } catch (error: unknown) {
      return {
        type: 'filesystem',
        itemCount: 0,
        totalSize: 0,
        error: error instanceof Error ? error.message : String(error)
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
  static createStorage<TKey extends string = string, TDomain = Buffer, TRuntime extends Buffer = Buffer>(
    options: StorageOptions<TKey, TDomain, TRuntime> = {}
  ): IStorage<TKey, TDomain, TRuntime> {
    const { type = 'memory', config = {}, codec } = options;
    const resolvedCodec = (codec ?? (defaultBufferCodec as StorageCodec<TDomain, TRuntime>));
    const normalizedType = (type || 'memory').toLowerCase();

    switch (normalizedType) {
      case 'memory':
        return new MemoryBinaryStorage<TKey, TDomain, TRuntime>(config.maxSize, resolvedCodec);

      case 'filesystem':
      case 'file':
        return new FileSystemBinaryStorage<TDomain, TRuntime>(config.storageDir, resolvedCodec) as unknown as IStorage<TKey, TDomain, TRuntime>;

      case 'object':
      case 'cloud':
        if (ObjectStorageBinaryStorageClass) {
          return new ObjectStorageBinaryStorageClass() as unknown as IStorage<TKey, TDomain, TRuntime>; // Optional dependency provides its own typing
        }
        if (objectStorageImportError) {
          console.warn(`Failed to initialize object storage: ${objectStorageImportError.message}, falling back to memory storage`);
        } else {
          console.warn('Object storage module unavailable, falling back to memory storage');
        }
        return new MemoryBinaryStorage<TKey, TDomain, TRuntime>(config.maxSize, resolvedCodec);

      default:
        console.warn(`Unknown storage type '${type}', falling back to memory storage`);
        return new MemoryBinaryStorage<TKey, TDomain, TRuntime>(config.maxSize, resolvedCodec);
    }
  }

  /**
   * Create storage based on environment variables
   */
  static createFromEnvironment<TKey extends string = string, TDomain = Buffer, TRuntime extends Buffer = Buffer>(): IStorage<TKey, TDomain, TRuntime> {
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

    return StorageFactory.createStorage<TKey, TDomain, TRuntime>({ type: storageType as any, config });
  }
}

// Default storage instance for easy access
let defaultStorage: IStorage<string, Buffer> | null = null;

/**
 * Get the default storage instance
 * Creates one if it doesn't exist yet
 */
export function getDefaultStorage(): IStorage<string, Buffer> {
  if (!defaultStorage) {
    defaultStorage = StorageFactory.createFromEnvironment();
  }
  return defaultStorage;
}
