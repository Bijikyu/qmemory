/**
 * Storage Interfaces Module
 *
 * Purpose: Defines common interfaces and contracts for all binary storage implementations
 * throughout the application. This module provides the foundation for storage
 * abstraction, allowing for multiple storage backends while maintaining consistent APIs.
 *
 * Design Philosophy:
 * - Interface segregation: Separate concerns into focused interfaces
 * - Multiple implementations: Support for local, cloud, and hybrid storage
 * - Type safety: Provide compile-time guarantees for storage operations
 * - Extensibility: Allow for new storage implementations without breaking changes
 * - Performance awareness: Include statistics and metadata for optimization
 * - Error handling: Provide consistent error patterns across implementations
 *
 * Integration Notes:
 * - Used throughout application for all binary storage operations
 * - Prevents circular dependencies between storage modules
 * - Provides foundation for storage factory patterns
 * - Enables easy switching between storage backends
 * - Supports both file system and object storage implementations
 *
 * Performance Considerations:
 * - Buffer-based operations for binary data efficiency
 * - Async operations to prevent blocking main thread
 * - Statistics interface for performance monitoring
 * - Metadata tracking for optimization decisions
 * - Type-safe operations to prevent runtime errors
 *
 * Error Handling Strategy:
 * - Consistent Promise-based error handling across all implementations
 * - Standardized error types and message formats
 * - Graceful handling of missing keys and storage failures
 * - Detailed statistics including error states for monitoring
 *
 * Architecture Decision: Why separate interfaces from implementations?
 * - Prevents circular dependencies between different storage modules
 * - Enables compile-time checking of storage implementation contracts
 * - Allows for dependency injection and testing with mock implementations
 * - Provides clear contracts for new storage backend development
 * - Supports multiple storage backends with unified API
 *
 * @author System Architecture Team
 * @version 1.0.0
 */

/**
 * Storage statistics interface
 *
 * Defines comprehensive statistics structure for monitoring storage utilization,
 * performance, and health. This interface provides insights for optimization
 * and capacity planning across different storage implementations.
 *
 * @interface StorageStats
 */
export interface StorageStats {
  type: string; // Storage backend type (local, cloud, hybrid)
  itemCount: number; // Number of items currently stored
  totalSize: number; // Total size of all stored items in bytes
  maxSize?: number; // Maximum storage capacity in bytes (if applicable)
  utilizationPercent?: number; // Storage utilization percentage (0-100)
  storageDir?: string; // Local storage directory path (for local storage)
  bucketName?: string; // Cloud storage bucket name (for cloud storage)
  storagePrefix?: string; // Key prefix for organization
  keys?: string[]; // List of stored keys (if available)
  error?: string; // Error message if stats collection failed
  truncated?: boolean; // Indicates if results were truncated due to limits
}

/**
 * Core storage interface
 *
 * Defines the contract that all storage implementations must follow.
 * This interface ensures consistent behavior across different storage backends
 * and enables easy switching between implementations.
 *
 * @interface IStorageInterface
 */
export interface IStorageInterface {
  save(key: string, data: Buffer): Promise<void>; // Store binary data with key
  get(key: string): Promise<Buffer | null>; // Retrieve binary data by key
  delete(key: string): Promise<void>; // Remove data by key
  exists(key: string): Promise<boolean>; // Check if key exists
  getStats(): Promise<StorageStats>; // Get storage statistics
}

/**
 * Storage configuration options interface
 *
 * Defines configuration structure for different storage implementations.
 * This interface allows for flexible configuration while maintaining
 * type safety for common configuration options.
 *
 * @interface StorageOptions
 */
export interface StorageOptions {
  type?: string; // Storage backend type selector
  config?: {
    maxSize?: number; // Maximum storage size in bytes
    storageDir?: string; // Local storage directory path
    [key: string]: any; // Implementation-specific options
  };
}

/**
 * Object metadata interface
 *
 * Defines metadata structure for stored objects, providing
 * information about storage properties and content details.
 * This interface is used by cloud storage implementations for
 * tracking object properties.
 *
 * @interface ObjectMetadata
 */
export interface ObjectMetadata {
  originalKey: string; // Original key used to store object
  size: number; // Object size in bytes
  contentType: string; // MIME type of stored content
  created: string; // Creation timestamp
  objectPath?: string; // Full path to object in storage
}

/**
 * Storage base class
 *
 * Provides abstract base implementation of IStorageInterface.
 * All storage implementations should extend this class to ensure
 * consistent behavior and enable common functionality sharing.
 *
 * @class IStorage
 * @implements IStorageInterface
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
