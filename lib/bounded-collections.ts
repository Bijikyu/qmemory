/**
 * Bounded Collections
 * Barrel export for bounded data structures with memory safety guarantees
 *
 * This module exports two separate, focused implementations:
 * - BoundedQueue: Circular buffer for ordered data with overflow handling
 * - BoundedMap: LRU cache with automatic eviction
 *
 * Refactored for Single Responsibility Principle - each class handles one specific use case
 */

// Re-export focused implementations
export { BoundedQueue } from './bounded-queue.js';
export { BoundedMap } from './bounded-map.js';
