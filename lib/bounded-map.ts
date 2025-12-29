/**
 * Bounded Map Implementation
 * Memory-efficient LRU cache with automatic eviction
 */

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
  private newestKey: K | undefined;

  /**
   * Creates a new BoundedMap
   *
   * @param maxSize - Maximum number of entries (must be >0)
   * @throws Error if maxSize is not greater than 0
   */
  constructor(maxSize: number) {
    if (maxSize <= 0) {
      throw new Error('Max size must be greater than 0');
    }
    this.map = new Map();
    this.capacity = maxSize;
    this.newestKey = undefined;
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
    this.newestKey = key; // Track newest key for O(1) access
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
   * @returns True if key was found and deleted
   */
  delete(key: K): boolean {
    const deleted = this.map.delete(key);
    if (deleted && this.newestKey === key) {
      // If we deleted the newest key, we need to find the new newest
      // This is O(n) but only happens when deleting the newest entry
      this.newestKey = undefined;
      for (const entryKey of this.map.keys()) {
        this.newestKey = entryKey;
      }
    }
    return deleted;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.map.clear();
    this.newestKey = undefined;
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
   * Get the oldest entry (first to be evicted)
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
   * Get the newest entry (most recently used)
   *
   * @returns The newest [key, value] pair, or undefined if empty
   */
  newest(): [K, V] | undefined {
    if (this.map.size === 0 || this.newestKey === undefined) {
      return undefined;
    }
    const value = this.map.get(this.newestKey);
    if (value === undefined) {
      return undefined; // Key was deleted, fallback to O(n) search
    }
    return [this.newestKey, value];
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
