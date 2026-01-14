/**
 * LocalStorage Utilities
 * Safe localStorage operations with validation and fallbacks
 *
 * Features:
 * - Safe JSON parse/stringify with error handling
 * - Environment detection for SSR/Node compatibility
 * - Configurable fallback values
 * - Boolean convenience methods
 * - Dev mode to disable persistent storage
 *
 * Note: This module is designed for isomorphic use (browser + SSR).
 * In Node.js environments, all operations gracefully return fallback values.
 */

interface StorageInterface {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  key(index: number): string | null;
  readonly length: number;
}

interface WindowWithStorage {
  localStorage: StorageInterface;
}

declare const window: WindowWithStorage | undefined;

const DEV_DISABLE_PERSISTENT_STORAGE = false;

function hasLocalStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function safeParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function validateKey(key: unknown, functionName: string): asserts key is string {
  if (typeof key !== 'string' || key.length === 0) {
    throw new Error(`${functionName}: key must be a non-empty string`);
  }
}

export function isLocalStorageAvailable(): boolean {
  return hasLocalStorage() && !DEV_DISABLE_PERSISTENT_STORAGE;
}

export function getLocalStorageItem<T = unknown>(key: string, fallback: T | null = null): T | null {
  validateKey(key, 'getLocalStorageItem');

  if (DEV_DISABLE_PERSISTENT_STORAGE || !hasLocalStorage()) {
    return fallback;
  }

  try {
    const item = window.localStorage.getItem(key);
    if (item === null) {
      return fallback;
    }
    return safeParse<T>(item, fallback as T);
  } catch {
    return fallback;
  }
}

export function setLocalStorageItem(key: string, value: unknown): boolean {
  validateKey(key, 'setLocalStorageItem');

  if (DEV_DISABLE_PERSISTENT_STORAGE || !hasLocalStorage()) {
    return false;
  }

  try {
    window.localStorage.setItem(key, safeStringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeLocalStorageItem(key: string): boolean {
  validateKey(key, 'removeLocalStorageItem');

  if (DEV_DISABLE_PERSISTENT_STORAGE || !hasLocalStorage()) {
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function getLocalStorageBoolean(key: string, defaultValue = false): boolean {
  const val = getLocalStorageItem<string | boolean>(key);

  if (val === null) {
    return defaultValue;
  }

  if (typeof val === 'boolean') {
    return val;
  }

  if (typeof val === 'string') {
    const lower = val.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
  }

  return defaultValue;
}

export function setLocalStorageBoolean(key: string, value: boolean): boolean {
  return setLocalStorageItem(key, value ? 'true' : 'false');
}

export function clearLocalStorage(): boolean {
  if (DEV_DISABLE_PERSISTENT_STORAGE || !hasLocalStorage()) {
    return false;
  }

  try {
    window.localStorage.clear();
    return true;
  } catch {
    return false;
  }
}

export function getLocalStorageKeys(): string[] {
  if (DEV_DISABLE_PERSISTENT_STORAGE || !hasLocalStorage()) {
    return [];
  }

  try {
    return Object.keys(window.localStorage);
  } catch {
    return [];
  }
}

export function getLocalStorageSize(): number {
  if (DEV_DISABLE_PERSISTENT_STORAGE || !hasLocalStorage()) {
    return 0;
  }

  try {
    let size = 0;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key) {
        const value = window.localStorage.getItem(key);
        size += key.length + (value?.length || 0);
      }
    }
    return size * 2;
  } catch {
    return 0;
  }
}
