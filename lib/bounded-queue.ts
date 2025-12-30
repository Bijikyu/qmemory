/**
 * Refactored Bounded Queue Implementation with Separated Concerns
 * Maintains backward compatibility while implementing SRP principles
 */

/**
 * Core circular buffer operations - separated for SRP compliance
 */
class CircularBuffer<T> {
  private buffer: (T | undefined)[];
  private head: number = 0;
  private tail: number = 0;
  private count: number = 0;
  private readonly capacity: number;
  private readonly mask: number;
  private readonly _maxSize: number; // Store original maxSize for bounded behavior enforcement

  constructor(maxSize: number) {
    if (maxSize <= 0) {
      throw new Error('Max size must be greater than 0');
    }
    // Prevent integer overflow in bit masking operations and Math.pow
    if (maxSize > 1073741824) {
      // 2^30, safe limit for bitwise operations
      throw new Error('Max size too large for bit masking optimization');
    }

    // Round up to next power of 2 for efficient bit masking with overflow protection
    this.capacity = Math.min(Math.pow(2, Math.ceil(Math.log2(maxSize))), 1073741824);
    // Create bit mask for fast modulo operations (capacity is always power of 2)
    this.mask = this.capacity - 1;
    // Initialize buffer with calculated capacity
    this.buffer = new Array(this.capacity);
    // Store original maxSize for bounded behavior enforcement
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
 * Queue iteration utilities
 */
class QueueIteration {
  static toArray<T>(buffer: CircularBuffer<T>): T[] {
    const state = buffer.getInternalState();
    const result: T[] = [];
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
    const state = buffer.getInternalState();
    for (let i = 0; i < state.count; i++) {
      const index = (state.head + i) & state.mask;
      const item = state.buffer[index];
      if (item !== undefined) {
        callback(item, i);
      }
    }
  }

  static *iterator<T>(buffer: CircularBuffer<T>): Iterator<T> {
    const state = buffer.getInternalState();
    for (let i = 0; i < state.count; i++) {
      const index = (state.head + i) & state.mask;
      const item = state.buffer[index];
      if (item !== undefined) {
        yield item;
      }
    }
  }
}

/**
 * Queue search utilities
 */
class QueueSearch {
  static includes<T>(buffer: CircularBuffer<T>, item: T): boolean {
    const state = buffer.getInternalState();
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
