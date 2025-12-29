/**
 * Storage Interfaces
 *
 * Defines common interfaces for binary storage implementations.
 * This separation prevents circular dependencies between storage modules.
 */

export interface StorageStats {
  type: string;
  itemCount: number;
  totalSize: number;
  maxSize?: number;
  utilizationPercent?: number;
  storageDir?: string;
  bucketName?: string;
  storagePrefix?: string;
  keys?: string[];
  error?: string;
}

export interface IStorageInterface {
  save(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getStats(): Promise<StorageStats>;
}

export interface StorageOptions {
  type?: string;
  config?: {
    maxSize?: number;
    storageDir?: string;
    [key: string]: any;
  };
}

export interface ObjectMetadata {
  originalKey: string;
  size: number;
  contentType: string;
  created: string;
  objectPath?: string;
}

/**
 * IStorage Base Class
 *
 * Base class that implements IStorageInterface.
 * All storage implementations should extend this class.
 * Default implementations throw errors for abstract methods.
 */
export class IStorage implements IStorageInterface {
  /**
   * Save binary data with given key
   * @param key - Storage key
   * @param data - Binary data to store
   */
  async save(key: string, data: Buffer): Promise<void> {
    throw new Error('save method must be implemented by subclass');
  }

  /**
   * Retrieve binary data by key
   * @param key - Storage key
   * @returns Binary data or null if not found
   */
  async get(key: string): Promise<Buffer | null> {
    throw new Error('get method must be implemented by subclass');
  }

  /**
   * Delete binary data by key
   * @param key - Storage key
   */
  async delete(key: string): Promise<void> {
    throw new Error('delete method must be implemented by subclass');
  }

  /**
   * Check if data exists for given key
   * @param key - Storage key
   * @returns True if data exists
   */
  async exists(key: string): Promise<boolean> {
    throw new Error('exists method must be implemented by subclass');
  }

  /**
   * Get storage statistics (optional method for monitoring)
   * @returns Storage usage statistics
   */
  async getStats(): Promise<StorageStats> {
    return {
      type: 'unknown',
      itemCount: 0,
      totalSize: 0,
    };
  }
}
