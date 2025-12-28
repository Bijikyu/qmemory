/**
 * Core Bounded Queue Implementation
 * Memory-safe circular buffer queue with overflow handling and LRU semantics
 */

/**
 * Core bounded circular buffer queue - handles only basic queue operations
 * Overwrites oldest entries when full (LRU behavior)
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
  private buffer: (T | undefined)[];
  private head: number = 0;
  private tail: number = 0;
  private count: number = 0;
  private readonly capacity: number;
  private readonly mask: number;

  /**
   * Creates a new BoundedQueue
   *
   * @param maxSize - Maximum number of items (must be > 0, internally rounded up to power of 2)
   * @throws Error if maxSize is not greater than 0
   */
  constructor(maxSize: number) {
    if (maxSize <= 0) {
      throw new Error('Max size must be greater than 0');
    }
    this.capacity = Math.pow(2, Math.ceil(Math.log2(maxSize)));
    this.mask = this.capacity - 1;
    this.buffer = new Array(this.capacity);
  }

  /**
   * Add item to end of queue
   * If queue is full, overwrites oldest entry (head)
   *
   * @param item - Item to add
   */
  push(item: T): void {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) & this.mask;

    if (this.count < this.capacity) {
      this.count++;
    } else {
      this.head = (this.head + 1) & this.mask;
    }
  }

  /**
   * Remove and return the oldest item from the queue
   *
   * @returns The oldest item, or undefined if queue is empty
   */
  shift(): T | undefined {
    if (this.count === 0) {
      return undefined;
    }

    const item = this.buffer[this.head];
    this.buffer[this.head] = undefined;
    this.head = (this.head + 1) & this.mask;
    this.count--;

    return item;
  }

  /**
   * Peek at the oldest item without removing it
   *
   * @returns The oldest item, or undefined if queue is empty
   */
  peek(): T | undefined {
    if (this.count === 0) {
      return undefined;
    }
    return this.buffer[this.head];
  }

  /**
   * Peek at the newest item without removing it
   *
   * @returns The newest item, or undefined if queue is empty
   */
  peekLast(): T | undefined {
    if (this.count === 0) {
      return undefined;
    }
    const lastIndex = (this.tail - 1 + this.capacity) & this.mask;
    return this.buffer[lastIndex];
  }

  /**
   * Clear all items from the queue
   * Releases references to help garbage collection
   */
  clear(): void {
    this.head = 0;
    this.tail = 0;
    this.count = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      this.buffer[i] = undefined;
    }
  }

  /**
   * Number of items currently in the queue
   */
  get length(): number {
    return this.count;
  }

  /**
   * Alias for length - matches LockFreeQueue API
   */
  get size(): number {
    return this.count;
  }

  /**
   * Maximum capacity of the queue (power of 2)
   */
  get maxSize(): number {
    return this.capacity;
  }

  /**
   * Whether the queue is empty
   */
  get isEmpty(): boolean {
    return this.count === 0;
  }

  /**
   * Whether the queue is at capacity
   */
  get isFull(): boolean {
    return this.count === this.capacity;
  }

  /**
   * Get direct access to internal buffer for advanced operations
   * @internal - Use utility classes instead for better separation of concerns
   */
  getInternalBuffer(): {
    buffer: (T | undefined)[];
    head: number;
    tail: number;
    count: number;
    capacity: number;
    mask: number;
  } {
    return {
      buffer: this.buffer,
      head: this.head,
      tail: this.tail,
      count: this.count,
      capacity: this.capacity,
      mask: this.mask,
    };
  }
}
