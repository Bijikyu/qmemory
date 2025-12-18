import { LRUCache as LRUCacheBase } from 'lru-cache';

export type LRUOptions = {
  max?: number;
  maxSize?: number;
  ttl?: number;
  ttlResolution?: number;
  ttlAutopurge?: boolean;
  updateAgeOnGet?: boolean;
  allowStale?: boolean;
  stale?: boolean;
  dispose?: (key: string, value: any) => void;
  disposeAfter?: (key: string, value: any) => void;
  noDisposeOnSet?: boolean;
  noUpdateTTL?: boolean;
  maxEntrySize?: number;
  sizeCalculation?: (value: any, key: string) => number;
  [key: string]: any;
};

export { LRUCacheBase as LRUCache };

export type LRUCacheInstance = LRUCacheBase<string, any>;