/**
 * Queue Iterator Implementation
 * Provides iteration capabilities for BoundedQueue
 */

import type { BoundedQueue } from './bounded-queue-core';

/**
 * Iterator for BoundedQueue implementing Iterator protocol
 * Yields items from oldest to newest
 */
export class QueueIterator<T> implements Iterator<T>, Iterable<T> {
  private currentIndex: number;
  private readonly internal: ReturnType<BoundedQueue<T>['getInternalBuffer']>;

  constructor(queue: BoundedQueue<T>) {
    this.internal = queue.getInternalBuffer();
    this.currentIndex = 0;
  }

  next(): IteratorResult<T> {
    if (this.currentIndex >= this.internal.count) {
      return { done: true, value: undefined };
    }

    const index = (this.internal.head + this.currentIndex) & this.internal.mask;
    const value = this.internal.buffer[index] as T;
    this.currentIndex++;

    return { done: false, value };
  }

  [Symbol.iterator](): Iterator<T> {
    return this;
  }
}

/**
 * Queue iteration utilities
 */
export class QueueIteration {
  /**
   * Execute a callback for each item in queue (oldest to newest)
   *
   * @param queue - BoundedQueue to iterate over
   * @param callback - Function to call for each item
   */
  static forEach<T>(queue: BoundedQueue<T>, callback: (item: T, index: number) => void): void {
    const internal = queue.getInternalBuffer();
    for (let i = 0; i < internal.count; i++) {
      const index = (internal.head + i) & internal.mask;
      callback(internal.buffer[index] as T, i);
    }
  }

  /**
   * Create an array from queue items (oldest to newest)
   *
   * @param queue - BoundedQueue to convert
   * @returns Array of items in queue order
   */
  static toArray<T>(queue: BoundedQueue<T>): T[] {
    const internal = queue.getInternalBuffer();
    const result: T[] = [];
    for (let i = 0; i < internal.count; i++) {
      const index = (internal.head + i) & internal.mask;
      result.push(internal.buffer[index] as T);
    }
    return result;
  }

  /**
   * Create iterator from queue
   *
   * @param queue - BoundedQueue to iterate over
   * @returns QueueIterator instance
   */
  static createIterator<T>(queue: BoundedQueue<T>): QueueIterator<T> {
    return new QueueIterator<T>(queue);
  }
}
