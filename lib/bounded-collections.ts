/**
 * Bounded Collections
 * Memory-safe bounded queue and map data structures that guard against runaway arrays
 * while providing LRU eviction semantics.
 *
 * BoundedQueue: Circular buffer for buffering entries in order with automatic overflow handling
 * BoundedMap: LRU-style key-value cache with automatic eviction of oldest entries
 *
 * Both throw when initialized with a non-positive capacity and keep memory consumption predictable.
 */

/**
 * Memory-safe bounded circular buffer queue
 * Overwrites oldest entries when full (LRU behavior)
 *
 * @template T - Type of items stored in the queue
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
   * Add item to the end of the queue
   * If queue is full, overwrites the oldest entry (head)
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
   * Get all items in order (oldest to newest) without removing them
   *
   * @returns Array of items in queue order
   */
  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      const index = (this.head + i) & this.mask;
      result.push(this.buffer[index] as T);
    }
    return result;
  }

  /**
   * Iterator for for...of loops
   * Yields items from oldest to newest
   */
  *[Symbol.iterator](): Iterator<T> {
    for (let i = 0; i < this.count; i++) {
      const index = (this.head + i) & this.mask;
      yield this.buffer[index] as T;
    }
  }

  /**
   * Execute a callback for each item in the queue (oldest to newest)
   *
   * @param callback - Function to call for each item
   */
  forEach(callback: (item: T, index: number) => void): void {
    for (let i = 0; i < this.count; i++) {
      const index = (this.head + i) & this.mask;
      callback(this.buffer[index] as T, i);
    }
  }

  /**
   * Check if queue contains an item
   *
   * @param item - Item to search for
   * @returns True if item is found
   */
  includes(item: T): boolean {
    for (let i = 0; i < this.count; i++) {
      const index = (this.head + i) & this.mask;
      if (this.buffer[index] === item) {
        return true;
      }
    }
    return false;
  }
}

/**
 * Memory-efficient bounded map with LRU eviction
 * Evicts oldest entries when capacity is reached
 * Moves accessed entries to most-recently-used position
 *
 * @template K - Type of keys
 * @template V - Type of values
 *
 * @example
 * const cache = new BoundedMap<string, object>(1000);
 * cache.set('key1', { data: 'value' });
 * const value = cache.get('key1'); // Moves key1 to most recently used
 */
export class BoundedMap<K, V> {
  private map: Map<K, V>;
  private readonly capacity: number;

  /**
   * Creates a new BoundedMap
   *
   * @param maxSize - Maximum number of entries (must be > 0)
   * @throws Error if maxSize is not greater than 0
   */
  constructor(maxSize: number) {
    if (maxSize <= 0) {
      throw new Error('Max size must be greater than 0');
    }
    this.map = new Map();
    this.capacity = maxSize;
  }

  /**
   * Set a key-value pair
   * If key exists, it's moved to most recently used
   * If at capacity, oldest entry is evicted
   *
   * @param key - Key to set
   * @param value - Value to store
   */
  set(key: K, value: V): this {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      const firstKey = this.map.keys().next().value;
      if (firstKey !== undefined) {
        this.map.delete(firstKey);
      }
    }
    this.map.set(key, value);
    return this;
  }

  /**
   * Get a value by key
   * Moves the accessed entry to most recently used position
   *
   * @param key - Key to look up
   * @returns The value, or undefined if not found
   */
  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value !== undefined) {
      this.map.delete(key);
      this.map.set(key, value);
    }
    return value;
  }

  /**
   * Peek at a value without updating its LRU position
   *
   * @param key - Key to look up
   * @returns The value, or undefined if not found
   */
  peek(key: K): V | undefined {
    return this.map.get(key);
  }

  /**
   * Check if a key exists
   *
   * @param key - Key to check
   * @returns True if key exists
   */
  has(key: K): boolean {
    return this.map.has(key);
  }

  /**
   * Delete a key-value pair
   *
   * @param key - Key to delete
   * @returns True if the key was found and deleted
   */
  delete(key: K): boolean {
    return this.map.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.map.clear();
  }

  /**
   * Number of entries currently in the map
   */
  get size(): number {
    return this.map.size;
  }

  /**
   * Maximum capacity of the map
   */
  get maxSize(): number {
    return this.capacity;
  }

  /**
   * Whether the map is empty
   */
  get isEmpty(): boolean {
    return this.map.size === 0;
  }

  /**
   * Whether the map is at capacity
   */
  get isFull(): boolean {
    return this.map.size >= this.capacity;
  }

  /**
   * Get an iterator over all keys
   */
  keys(): IterableIterator<K> {
    return this.map.keys();
  }

  /**
   * Get an iterator over all values
   */
  values(): IterableIterator<V> {
    return this.map.values();
  }

  /**
   * Get an iterator over all entries
   */
  entries(): IterableIterator<[K, V]> {
    return this.map.entries();
  }

  /**
   * Iterator for for...of loops
   */
  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.map.entries();
  }

  /**
   * Execute a callback for each entry
   *
   * @param callback - Function to call for each entry
   */
  forEach(callback: (value: V, key: K, map: BoundedMap<K, V>) => void): void {
    this.map.forEach((value, key) => {
      callback(value, key, this);
    });
  }

  /**
   * Get oldest entry (first to be evicted)
   *
   * @returns The oldest [key, value] pair, or undefined if empty
   */
  oldest(): [K, V] | undefined {
    const entry = this.map.entries().next();
    if (entry.done) {
      return undefined;
    }
    return entry.value;
  }

  /**
   * Get newest entry (most recently used)
   *
   * @returns The newest [key, value] pair, or undefined if empty
   */
  newest(): [K, V] | undefined {
    if (this.map.size === 0) {
      return undefined;
    }
    const entries = Array.from(this.map.entries());
    return entries[entries.length - 1];
  }

  /**
   * Convert to a plain object (for JSON serialization)
   * Note: Only works when K extends string | number | symbol
   */
  toObject(): Record<string, V> {
    const obj: Record<string, V> = {};
    this.map.forEach((value, key) => {
      obj[String(key)] = value;
    });
    return obj;
  }
}
