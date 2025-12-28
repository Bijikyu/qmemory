/**
 * Queue Search Utilities
 * Provides search and includes functionality for BoundedQueue
 */

import type { BoundedQueue } from './bounded-queue-core';

/**
 * Queue search utilities
 */
export class QueueSearch {
  /**
   * Check if queue contains an item
   *
   * @param queue - BoundedQueue to search in
   * @param item - Item to search for
   * @returns True if item is found
   */
  static includes<T>(queue: BoundedQueue<T>, item: T): boolean {
    const internal = queue.getInternalBuffer();
    for (let i = 0; i < internal.count; i++) {
      const index = (internal.head + i) & internal.mask;
      if (internal.buffer[index] === item) {
        return true;
      }
    }
    return false;
  }

  /**
   * Find first occurrence of item that matches predicate
   *
   * @param queue - BoundedQueue to search in
   * @param predicate - Function to test each item
   * @returns First matching item or undefined
   */
  static find<T>(queue: BoundedQueue<T>, predicate: (item: T) => boolean): T | undefined {
    const internal = queue.getInternalBuffer();
    for (let i = 0; i < internal.count; i++) {
      const index = (internal.head + i) & internal.mask;
      const item = internal.buffer[index];
      if (item !== undefined && predicate(item as T)) {
        return item as T;
      }
    }
    return undefined;
  }

  /**
   * Get index of item in queue
   *
   * @param queue - BoundedQueue to search in
   * @param item - Item to find
   * @returns Index of item or -1 if not found
   */
  static indexOf<T>(queue: BoundedQueue<T>, item: T): number {
    const internal = queue.getInternalBuffer();
    for (let i = 0; i < internal.count; i++) {
      const index = (internal.head + i) & internal.mask;
      if (internal.buffer[index] === item) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Count items matching predicate
   *
   * @param queue - BoundedQueue to search in
   * @param predicate - Function to test each item
   * @returns Count of matching items
   */
  static count<T>(queue: BoundedQueue<T>, predicate: (item: T) => boolean): number {
    const internal = queue.getInternalBuffer();
    let count = 0;
    for (let i = 0; i < internal.count; i++) {
      const index = (internal.head + i) & internal.mask;
      const item = internal.buffer[index];
      if (item !== undefined && predicate(item as T)) {
        count++;
      }
    }
    return count;
  }
}
