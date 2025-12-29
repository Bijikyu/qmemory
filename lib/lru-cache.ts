/**
 * LRU Cache Module
 *
 * Purpose: Provides a consistent interface to the LRU (Least Recently Used) cache
 * implementation from the lru-cache library. This module serves as a thin wrapper
 * to maintain import consistency across the application while leveraging the
 * robust upstream implementation.
 *
 * Design Philosophy:
 * - Minimal wrapper: Avoid adding unnecessary abstraction layers
 * - Consistency: Provides the same import pattern as other utility modules
 * - Performance: Direct re-export maintains zero overhead
 * - Compatibility: Maintains backward compatibility with existing code
 *
 * Integration Notes:
 * - Used throughout the system for memory-efficient caching with size limits
 * - Integrates seamlessly with the upstream lru-cache library features
 * - Follows the same import patterns as other utility modules in the codebase
 * - Provides access to all upstream LRU cache functionality without modification
 *
 * Performance Considerations:
 * - Zero overhead: Direct re-export adds no performance penalty
 * - Memory efficient: Uses the upstream library's optimized implementation
 * - Size-based eviction: Automatically removes least recently used items
 * - O(1) operations: Get, set, and delete operations are constant time
 *
 * Architecture Decision: Why re-export instead of creating a wrapper?
 * - The upstream library is already well-optimized and feature-complete
 * - Adding a wrapper would introduce unnecessary complexity and potential bugs
 * - Direct re-export maintains full API compatibility and performance
 * - Allows the application to benefit from upstream improvements automatically
 *
 * Migration Rationale:
 * This module was created to provide import consistency after refactoring other
 * utility modules to use factory patterns and wrapper classes. The LRU cache
 * didn't need modification, so a simple re-export maintains the architectural
 * consistency while preserving all functionality.
 *
 * @author System Architecture Team
 * @version 1.0.0
 */

import { LRUCache as LRUCacheBase } from 'lru-cache';

/**
 * Re-export of the upstream LRUCache class
 *
 * This provides a consistent import surface across the application while
 * maintaining full access to the upstream library's features and performance.
 *
 * The LRUCache provides:
 * - Size-based eviction when capacity is exceeded
 * - O(1) get, set, and delete operations
 * - TTL (Time To Live) support for automatic expiration
 * - Memory-efficient storage with minimal overhead
 * - Comprehensive statistics and monitoring capabilities
 *
 * @example
 * import { LRUCache } from './lru-cache';
 *
 * const cache = new LRUCache({
 *   max: 1000, // Maximum number of items
 *   ttl: 1000 * 60 * 5, // 5 minute TTL
 * });
 *
 * cache.set('key', 'value');
 * const value = cache.get('key');
 */
export { LRUCacheBase as LRUCache };
