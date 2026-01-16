/**
 * Memory-optimized LRU cache for scalability
 * Provides bounded memory usage with automatic cleanup
 *
 * Unique features over basic LRU caches:
 * - Memory-based eviction (maxMemoryMB) in addition to item count
 * - Memory size estimation for values
 * - Detailed statistics tracking (hits, misses, evictions)
 * - Automatic cleanup timer for expired items
 * - Memory usage monitoring with warnings
 */

import qerrors from 'qerrors';

// qerrors is consumed through multiple module systems (ESM/CJS via Jest/ts-jest),
// so we defensively resolve logging functions to avoid runtime interop mismatches.
// Rationale: cache functionality must not crash simply because logging wiring differs.
const logInfo =
  typeof (qerrors as any)?.logInfo === 'function'
    ? ((qerrors as any).logInfo as (...args: unknown[]) => void)
    : (...args: unknown[]) => console.info(...args);
const logWarn =
  typeof (qerrors as any)?.logWarn === 'function'
    ? ((qerrors as any).logWarn as (...args: unknown[]) => void)
    : (...args: unknown[]) => console.warn(...args);

interface CacheNode<V> {
  key: string;
  value: V;
  prev: CacheNode<V> | null;
  next: CacheNode<V> | null;
  size: number;
  accessCount: number;
  lastAccess: number;
}

export interface MemoryOptimizedCacheConfig {
  maxSize?: number;
  maxMemoryMB?: number;
  cleanupIntervalMs?: number;
  evictionPolicy?: 'lru' | 'ttl';
  defaultTtlMs?: number;
  enableMemoryMonitoring?: boolean;
}

export interface CacheMemoryStats {
  itemsCount: number;
  memoryUsageMB: number;
  memoryUsageBytes: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  averageItemSize: number;
  oldestItemAge: number;
  newestItemAge: number;
}

export class MemoryOptimizedCache<V = unknown> {
  private config: Required<MemoryOptimizedCacheConfig>;
  private cache: Map<string, CacheNode<V>>;
  private head: CacheNode<V> | null;
  private tail: CacheNode<V> | null;
  private cleanupTimer: ReturnType<typeof setInterval> | null;

  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalMemoryBytes: 0,
    createdAt: Date.now(),
  };

  constructor(config: MemoryOptimizedCacheConfig = {}) {
    this.config = {
      maxSize: 1000,
      maxMemoryMB: 100,
      cleanupIntervalMs: 30000,
      evictionPolicy: 'lru',
      defaultTtlMs: 300000,
      enableMemoryMonitoring: true,
      ...config,
    };

    this.cache = new Map();
    this.head = null;
    this.tail = null;

    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupIntervalMs);
    // Prevent the cleanup timer from keeping the Node.js event loop alive in short-lived processes (e.g., tests/CLIs).
    this.cleanupTimer && typeof (this.cleanupTimer as any).unref === 'function' && (this.cleanupTimer as any).unref();

    logInfo('Memory-optimized cache initialized', {
      maxSize: this.config.maxSize,
      maxMemoryMB: this.config.maxMemoryMB,
      evictionPolicy: this.config.evictionPolicy,
    });
  }

  get(key: string): V | undefined {
    const node = this.cache.get(key);

    if (!node) {
      this.stats.misses++;
      return undefined;
    }

    if (this.config.evictionPolicy === 'ttl' && this.isExpired(node)) {
      this.delete(key);
      this.stats.misses++;
      return undefined;
    }

    node.accessCount++;
    node.lastAccess = Date.now();

    if (this.config.evictionPolicy === 'lru') {
      this.moveToFront(node);
    }

    this.stats.hits++;
    return node.value;
  }

  set(key: string, value: V, _ttlMs?: number): void {
    const existingNode = this.cache.get(key);
    const size = this.estimateSize(value);
    const now = Date.now();

    this.ensureCapacity(size);

    if (existingNode) {
      this.stats.totalMemoryBytes -= existingNode.size;
      existingNode.value = value;
      existingNode.size = size;
      existingNode.lastAccess = now;
      existingNode.accessCount++;
      this.stats.totalMemoryBytes += size;

      if (this.config.evictionPolicy === 'lru') {
        this.moveToFront(existingNode);
      }
    } else {
      const node: CacheNode<V> = {
        key,
        value,
        prev: null,
        next: null,
        size,
        accessCount: 1,
        lastAccess: now,
      };

      this.cache.set(key, node);
      this.addToFront(node);
      this.stats.totalMemoryBytes += size;
    }

    this.checkMemoryUsage();
  }

  delete(key: string): boolean {
    const node = this.cache.get(key);
    if (!node) {
      return false;
    }

    this.cache.delete(key);
    this.removeFromList(node);
    this.stats.totalMemoryBytes -= node.size;
    return true;
  }

  has(key: string): boolean {
    const node = this.cache.get(key);
    if (!node) {
      return false;
    }

    if (this.config.evictionPolicy === 'ttl' && this.isExpired(node)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.stats.totalMemoryBytes = 0;
    this.stats.evictions = 0;
    logInfo('Memory-optimized cache cleared');
  }

  get size(): number {
    return this.cache.size;
  }

  getMemoryStats(): CacheMemoryStats {
    const now = Date.now();
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    const missRate = totalRequests > 0 ? this.stats.misses / totalRequests : 0;

    let oldestItemAge = 0;
    let newestItemAge = 0;

    if (this.head) {
      oldestItemAge = now - this.head.lastAccess;
    }
    if (this.tail) {
      newestItemAge = now - this.tail.lastAccess;
    }

    const totalSize = this.stats.totalMemoryBytes;
    const averageItemSize = this.cache.size > 0 ? totalSize / this.cache.size : 0;

    return {
      itemsCount: this.cache.size,
      memoryUsageMB: this.stats.totalMemoryBytes / (1024 * 1024),
      memoryUsageBytes: this.stats.totalMemoryBytes,
      hitRate: Math.round(hitRate * 100) / 100,
      missRate: Math.round(missRate * 100) / 100,
      evictionCount: this.stats.evictions,
      averageItemSize: Math.round(averageItemSize),
      oldestItemAge,
      newestItemAge,
    };
  }

  private ensureCapacity(newItemSize: number): void {
    const maxMemoryBytes = this.config.maxMemoryMB * 1024 * 1024;

    while (this.stats.totalMemoryBytes + newItemSize > maxMemoryBytes && this.tail) {
      this.evictItem(this.tail);
    }

    while (this.cache.size >= this.config.maxSize && this.tail) {
      this.evictItem(this.tail);
    }
  }

  private evictItem(node: CacheNode<V>): void {
    this.cache.delete(node.key);
    this.removeFromList(node);
    this.stats.totalMemoryBytes -= node.size;
    this.stats.evictions++;
  }

  private addToFront(node: CacheNode<V>): void {
    node.prev = null;
    node.next = this.head;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private moveToFront(node: CacheNode<V>): void {
    if (node === this.head) {
      return;
    }

    this.removeFromList(node);
    this.addToFront(node);
  }

  private removeFromList(node: CacheNode<V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private estimateSize(value: V): number {
    if (value === null || value === undefined) {
      return 0;
    }

    if (typeof value === 'string') {
      return (value as string).length * 2;
    }

    if (typeof value === 'number') {
      return 8;
    }

    if (typeof value === 'boolean') {
      return 4;
    }

    if (value instanceof ArrayBuffer) {
      return (value as ArrayBuffer).byteLength;
    }

    if (Array.isArray(value)) {
      const arr = value as unknown[];
      let arrSize = 24;
      for (const item of arr) {
        arrSize += this.estimateSize(item as V);
      }
      return arrSize;
    }

    if (typeof value === 'object') {
      try {
        const jsonString = JSON.stringify(value);
        return jsonString.length * 2 + 24;
      } catch {
        return 1024;
      }
    }

    return 64;
  }

  private isExpired(node: CacheNode<V>): boolean {
    const age = Date.now() - node.lastAccess;
    return age > this.config.defaultTtlMs;
  }

  private checkMemoryUsage(): void {
    if (!this.config.enableMemoryMonitoring) {
      return;
    }

    const memoryUsageMB = this.stats.totalMemoryBytes / (1024 * 1024);
    const maxMemoryMB = this.config.maxMemoryMB;
    const usagePercent = maxMemoryMB > 0 ? (memoryUsageMB / maxMemoryMB) * 100 : 0;

    if (usagePercent > 90) {
      logWarn('Cache memory usage critical', {
        memoryUsageMB: Math.round(memoryUsageMB * 100) / 100,
        maxMemoryMB,
        usagePercent: Math.round(usagePercent * 100) / 100,
        itemsCount: this.cache.size,
      });
    } else if (usagePercent > 75) {
      logInfo('Cache memory usage high', {
        memoryUsageMB: Math.round(memoryUsageMB * 100) / 100,
        maxMemoryMB,
        usagePercent: Math.round(usagePercent * 100) / 100,
        itemsCount: this.cache.size,
      });
    }
  }

  private performCleanup(): void {
    if (this.config.evictionPolicy !== 'ttl') {
      return;
    }

    let cleanedCount = 0;
    const expiredKeys: string[] = [];

    this.cache.forEach((node, key) => {
      if (this.isExpired(node)) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach((key) => {
      if (this.delete(key)) {
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      logInfo('Cache cleanup completed', {
        cleanedCount,
        remainingItems: this.cache.size,
        memoryUsageMB: this.stats.totalMemoryBytes / (1024 * 1024),
      });
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
    logInfo('Memory-optimized cache destroyed');
  }
}

export function createMemoryOptimizedCache<V = unknown>(
  config?: MemoryOptimizedCacheConfig
): MemoryOptimizedCache<V> {
  return new MemoryOptimizedCache<V>(config);
}

export interface GlobalCacheInstances {
  sessions: MemoryOptimizedCache<unknown>;
  users: MemoryOptimizedCache<unknown>;
  challenges: MemoryOptimizedCache<unknown>;
}

export const globalCaches: GlobalCacheInstances = {
  sessions: createMemoryOptimizedCache({
    maxSize: 1000,
    maxMemoryMB: 1,
    evictionPolicy: 'lru',
    defaultTtlMs: 1800000,
  }),
  users: createMemoryOptimizedCache({
    maxSize: 5000,
    maxMemoryMB: 10,
    evictionPolicy: 'lru',
    defaultTtlMs: 3600000,
  }),
  challenges: createMemoryOptimizedCache({
    maxSize: 100,
    maxMemoryMB: 0.5,
    evictionPolicy: 'ttl',
    defaultTtlMs: 300000,
  }),
};
