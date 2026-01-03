/**
 * Refactored Bounded Queue Implementation with Separated Concerns
 * Maintains backward compatibility while implementing SRP principles
 */

class CircularBuffer<T> {
  private buffer: (T | undefined)[];
  private head: number = 0;
  private tail: number = 0;
  private count: number = 0;
  private readonly capacity: number;
  private readonly mask: number;
  private readonly _maxSize: number;
  constructor(maxSize: number) {
    if (maxSize <= 0) throw new Error('Max size must be greater than 0');
    if (maxSize > 1073741824) throw new Error('Max size too large for bit masking optimization');
    this.capacity = Math.min(Math.pow(2, Math.ceil(Math.log2(maxSize))), 1073741824);
    this.mask = this.capacity - 1;
    this.buffer = new Array(this.capacity);
    this._maxSize = maxSize;
  }

  push(item: T): void {
    this.buffer[this.tail] = item;
    // Use bit masking for fast modulo operation (equivalent to tail % capacity)
    this.tail = (this.tail + 1) & this.mask;

    if (this.count < this._maxSize) {
      this.count++;
    } else {
      // Buffer is full, overwrite oldest element and advance head
      this.head = (this.head + 1) & this.mask;
    }

    // Clear iteration cache since buffer was modified
    QueueIteration.clearCache(this);
  }

  shift(): T | undefined {
    if (this.count === 0) {
      return undefined;
    }

    const item = this.buffer[this.head];
    // Clear the slot to help with garbage collection
    this.buffer[this.head] = undefined;
    // Advance head pointer using bit masking for fast modulo
    this.head = (this.head + 1) & this.mask;
    this.count--;

    // Clear iteration cache since buffer was modified
    QueueIteration.clearCache(this);

    return item;
  }

  peek(): T | undefined {
    if (this.count === 0) {
      return undefined;
    }
    return this.buffer[this.head];
  }

  peekLast(): T | undefined {
    if (this.count === 0) {
      return undefined;
    }
    // Calculate index of last element (tail - 1) with wrap-around using bit masking
    const lastIndex = (this.tail - 1 + this.capacity) & this.mask;
    return this.buffer[lastIndex];
  }

  clear(): void {
    // Clear all used slots for memory efficiency
    const currentCount = this.count;
    const currentHead = this.head;
    for (let i = 0; i < currentCount; i++) {
      const index = (currentHead + i) & this.mask;
      this.buffer[index] = undefined;
    }
    // Reset pointers
    this.head = 0;
    this.tail = 0;
    this.count = 0;

    // Clear iteration cache since buffer was modified
    QueueIteration.clearCache(this);
  }

  get length(): number {
    return this.count;
  }

  get isEmpty(): boolean {
    return this.count === 0;
  }

  get isFull(): boolean {
    return this.count === this._maxSize;
  }

  // Provide access for utilities
  getInternalState() {
    return {
      buffer: this.buffer,
      head: this.head,
      tail: this.tail,
      count: this.count,
      capacity: this.capacity,
      mask: this.mask,
      maxSize: this._maxSize,
    };
  }

  // Public getter for maxSize to support BoundedQueue API
  get maxSize(): number {
    return this._maxSize;
  }
}

/**
 * Queue iteration utilities with optimized caching
 */
class QueueIteration {
  // Cache for internal state to avoid repeated calls
  private static stateCache = new WeakMap<any, any>();
  private static cacheTimeout = 100; // 100ms cache timeout
  private static cacheTimestamps = new WeakMap<any, number>();

  /**
   * Get cached internal state or fetch fresh state
   */
  private static getCachedState<T>(buffer: CircularBuffer<T>) {
    const now = Date.now();
    const timestamp = this.cacheTimestamps.get(buffer) || 0;

    // Return cached state if still valid
    if (now - timestamp < this.cacheTimeout) {
      const cached = this.stateCache.get(buffer);
      if (cached) {
        // Validate cached state before returning
        if (
          cached &&
          typeof cached === 'object' &&
          'buffer' in cached &&
          'head' in cached &&
          'tail' in cached &&
          'count' in cached
        ) {
          return cached;
        }
      }
    }

    // Fetch fresh state and cache it
    const state = buffer.getInternalState();

    // Validate state before caching to prevent corruption
    if (
      state &&
      typeof state === 'object' &&
      'buffer' in state &&
      'head' in state &&
      'tail' in state &&
      'count' in state
    ) {
      this.stateCache.set(buffer, state);
      this.cacheTimestamps.set(buffer, now);
    }

    return state;
  }

  static toArray<T>(buffer: CircularBuffer<T>): T[] {
    const state = this.getCachedState(buffer);

    // Guard against invalid state
    if (
      !state ||
      typeof state !== 'object' ||
      !('buffer' in state) ||
      !('head' in state) ||
      !('tail' in state) ||
      !('count' in state)
    ) {
      return [];
    }

    const result: T[] = [];

    // Use safer approach without pre-allocation to avoid sparse arrays
    for (let i = 0; i < state.count; i++) {
      const index = (state.head + i) & state.mask;
      const item = state.buffer[index];
      if (item !== undefined) {
        result.push(item);
      }
    }

    return result;
  }

  static forEach<T>(buffer: CircularBuffer<T>, callback: (item: T, index: number) => void): void {
    const state = this.getCachedState(buffer);
    for (let i = 0; i < state.count; i++) {
      const index = (state.head + i) & state.mask;
      const item = state.buffer[index];
      if (item !== undefined) {
        callback(item, i);
      }
    }
  }

  static *iterator<T>(buffer: CircularBuffer<T>): Iterator<T> {
    const state = this.getCachedState(buffer);
    for (let i = 0; i < state.count; i++) {
      const index = (state.head + i) & state.mask;
      const item = state.buffer[index];
      if (item !== undefined) {
        yield item;
      }
    }
  }

  /**
   * Clear cache for a specific buffer (call when buffer is modified)
   */
  static clearCache<T>(buffer: CircularBuffer<T>): void {
    this.stateCache.delete(buffer);
    this.cacheTimestamps.delete(buffer);
  }

  /**
   * Clear all caches and perform cleanup
   */
  static clearAllCaches(): void {
    // Clear WeakMaps to aid garbage collection
    this.stateCache = new WeakMap();
    this.cacheTimestamps = new WeakMap();
  }
}

/**
 * Queue search utilities
 */
class QueueSearch {
  static includes<T>(buffer: CircularBuffer<T>, item: T): boolean {
    const state = buffer.getInternalState();

    // Early exit for empty buffer
    if (state.count === 0) {
      return false;
    }

    // Optimized search with direct array access and bounds checking
    for (let i = 0; i < state.count; i++) {
      const index = (state.head + i) & state.mask;
      const currentItem = state.buffer[index];
      if (currentItem !== undefined && currentItem === item) {
        return true;
      }
    }
    return false;
  }

  static find<T>(buffer: CircularBuffer<T>, predicate: (item: T) => boolean): T | undefined {
    const state = buffer.getInternalState();

    // Early exit for empty buffer
    if (state.count === 0) {
      return undefined;
    }

    // Optimized search with early termination on first match
    for (let i = 0; i < state.count; i++) {
      const index = (state.head + i) & state.mask;
      const item = state.buffer[index];
      if (item !== undefined && predicate(item)) {
        return item;
      }
    }
    return undefined;
  }

  static indexOf<T>(buffer: CircularBuffer<T>, item: T): number {
    const state = buffer.getInternalState();

    // Early exit for empty buffer
    if (state.count === 0) {
      return -1;
    }

    for (let i = 0; i < state.count; i++) {
      const index = (state.head + i) & state.mask;
      const currentItem = state.buffer[index];
      if (currentItem !== undefined && currentItem === item) {
        return i;
      }
    }
    return -1;
  }

  static count<T>(buffer: CircularBuffer<T>, predicate: (item: T) => boolean): number {
    const state = buffer.getInternalState();
    let count = 0;
    for (let i = 0; i < state.count; i++) {
      const index = (state.head + i) & state.mask;
      const item = state.buffer[index];
      if (item !== undefined && predicate(item)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Optimized bulk search for multiple items - reduces multiple linear searches
   *
   * This method efficiently searches for multiple items in a single pass,
   * which is more performant than calling includes() multiple times.
   *
   * @param buffer - The circular buffer to search
   * @param items - Array of items to search for
   * @returns Set of found items
   */
  static findMultiple<T>(buffer: CircularBuffer<T>, items: T[]): Set<T> {
    const state = buffer.getInternalState();
    const found = new Set<T>();

    // Early exit for empty buffer or no items
    if (state.count === 0 || items.length === 0) {
      return found;
    }

    // Convert search items to Set for O(1) lookup
    const searchSet = new Set(items);

    // Single pass through buffer to find all matching items
    for (let i = 0; i < state.count; i++) {
      const index = (state.head + i) & state.mask;
      const currentItem = state.buffer[index];
      if (currentItem !== undefined && searchSet.has(currentItem)) {
        found.add(currentItem);

        // Early exit if all items found
        if (found.size === items.length) {
          break;
        }
      }
    }

    return found;
  }
}

/**
 * Refactored BoundedQueue with separated concerns
 * Maintains the same public API for backward compatibility
 *
 * @template T - Type of items stored in queue
 *
 * @example
 * const queue = new BoundedQueue<string>(100);
 * queue.push('item1');
 * queue.push('item2');
 * console.log(queue.shift()); // 'item1'
 * console.log(queue.length); // 1
 */
export class BoundedQueue<T> {
  private buffer: CircularBuffer<T>;

  constructor(maxSize: number) {
    this.buffer = new CircularBuffer<T>(maxSize);
  }

  // Core operations - delegate to CircularBuffer
  push(item: T): void {
    this.buffer.push(item);
  }

  shift(): T | undefined {
    return this.buffer.shift();
  }

  peek(): T | undefined {
    return this.buffer.peek();
  }

  peekLast(): T | undefined {
    return this.buffer.peekLast();
  }

  clear(): void {
    this.buffer.clear();
  }

  get length(): number {
    return this.buffer.length;
  }

  get size(): number {
    return this.buffer.length;
  }

  get maxSize(): number {
    return this.buffer.maxSize;
  }

  get isEmpty(): boolean {
    return this.buffer.isEmpty;
  }

  get isFull(): boolean {
    return this.buffer.isFull;
  }

  // Iteration operations - delegate to QueueIteration
  toArray(): T[] {
    return QueueIteration.toArray(this.buffer);
  }

  forEach(callback: (item: T, index: number) => void): void {
    QueueIteration.forEach(this.buffer, callback);
  }

  [Symbol.iterator](): Iterator<T> {
    return QueueIteration.iterator(this.buffer);
  }

  // Search operations - delegate to QueueSearch
  includes(item: T): boolean {
    return QueueSearch.includes(this.buffer, item);
  }

  find(predicate: (item: T) => boolean): T | undefined {
    return QueueSearch.find(this.buffer, predicate);
  }

  indexOf(item: T): number {
    return QueueSearch.indexOf(this.buffer, item);
  }

  countMatching(predicate: (item: T) => boolean): number {
    return QueueSearch.count(this.buffer, predicate);
  }
}
