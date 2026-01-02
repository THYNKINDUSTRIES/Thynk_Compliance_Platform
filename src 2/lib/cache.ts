/**
 * Client-side caching utility for regulations data
 * Supports IndexedDB for large datasets with localStorage fallback
 * Includes cache expiration, versioning, and automatic cleanup
 */

// Cache configuration
export const CACHE_CONFIG = {
  DB_NAME: 'RegulationsCache',
  DB_VERSION: 1,
  STORE_NAME: 'regulations',
  DEFAULT_TTL: 15 * 60 * 1000, // 15 minutes default TTL
  MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB max cache size
  CLEANUP_INTERVAL: 5 * 60 * 1000, // Cleanup every 5 minutes
};

// Cache entry interface
export interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt: number;
  size: number;
  version: string;
}

// Cache statistics
export interface CacheStats {
  hits: number;
  misses: number;
  totalEntries: number;
  totalSize: number;
  lastCleanup: number;
}

// Generate a cache key from filters
export const generateCacheKey = (prefix: string, filters: Record<string, any>): string => {
  const sortedFilters = Object.keys(filters)
    .sort()
    .reduce((acc, key) => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '' && 
          !(Array.isArray(value) && value.length === 0)) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
  
  return `${prefix}:${JSON.stringify(sortedFilters)}`;
};

// Calculate approximate size of data in bytes
const calculateSize = (data: any): number => {
  return new Blob([JSON.stringify(data)]).size;
};

// IndexedDB wrapper class
class IndexedDBCache {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    totalEntries: 0,
    totalSize: 0,
    lastCleanup: Date.now(),
  };

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(CACHE_CONFIG.DB_NAME, CACHE_CONFIG.DB_VERSION);

      request.onerror = () => {
        console.warn('IndexedDB not available, falling back to localStorage');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store for cache entries
        if (!db.objectStoreNames.contains(CACHE_CONFIG.STORE_NAME)) {
          const store = db.createObjectStore(CACHE_CONFIG.STORE_NAME, { keyPath: 'key' });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create object store for stats
        if (!db.objectStoreNames.contains('stats')) {
          db.createObjectStore('stats', { keyPath: 'id' });
        }
      };
    });

    return this.dbPromise;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const db = await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(CACHE_CONFIG.STORE_NAME, 'readonly');
        const store = transaction.objectStore(CACHE_CONFIG.STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          const entry = request.result as CacheEntry<T> | undefined;
          
          if (!entry) {
            this.stats.misses++;
            resolve(null);
            return;
          }

          // Check if expired
          if (Date.now() > entry.expiresAt) {
            this.stats.misses++;
            this.delete(key); // Clean up expired entry
            resolve(null);
            return;
          }

          this.stats.hits++;
          console.log(`📦 Cache HIT for key: ${key.substring(0, 50)}...`);
          resolve(entry.data);
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('IndexedDB get failed:', error);
      return null;
    }
  }

  async set<T>(key: string, data: T, ttl: number = CACHE_CONFIG.DEFAULT_TTL): Promise<void> {
    try {
      const db = await this.init();
      const size = calculateSize(data);
      
      const entry: CacheEntry<T> = {
        key,
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
        size,
        version: '1.0',
      };

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(CACHE_CONFIG.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CACHE_CONFIG.STORE_NAME);
        const request = store.put(entry);

        request.onsuccess = () => {
          this.stats.totalEntries++;
          this.stats.totalSize += size;
          console.log(`💾 Cache SET for key: ${key.substring(0, 50)}... (${(size / 1024).toFixed(2)} KB, TTL: ${ttl / 1000}s)`);
          resolve();
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('IndexedDB set failed:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const db = await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(CACHE_CONFIG.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CACHE_CONFIG.STORE_NAME);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('IndexedDB delete failed:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(CACHE_CONFIG.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CACHE_CONFIG.STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          this.stats.totalEntries = 0;
          this.stats.totalSize = 0;
          console.log('🗑️ Cache cleared');
          resolve();
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('IndexedDB clear failed:', error);
    }
  }

  async cleanup(): Promise<number> {
    try {
      const db = await this.init();
      const now = Date.now();
      let deletedCount = 0;

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(CACHE_CONFIG.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CACHE_CONFIG.STORE_NAME);
        const index = store.index('expiresAt');
        const range = IDBKeyRange.upperBound(now);
        const request = index.openCursor(range);

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            deletedCount++;
            cursor.continue();
          }
        };

        transaction.oncomplete = () => {
          this.stats.lastCleanup = now;
          if (deletedCount > 0) {
            console.log(`🧹 Cache cleanup: removed ${deletedCount} expired entries`);
          }
          resolve(deletedCount);
        };

        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.warn('IndexedDB cleanup failed:', error);
      return 0;
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      const db = await this.init();
      
      return new Promise((resolve) => {
        const transaction = db.transaction(CACHE_CONFIG.STORE_NAME, 'readonly');
        const store = transaction.objectStore(CACHE_CONFIG.STORE_NAME);
        const countRequest = store.count();
        
        let totalSize = 0;
        const cursorRequest = store.openCursor();
        
        cursorRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            totalSize += (cursor.value as CacheEntry<any>).size || 0;
            cursor.continue();
          }
        };

        transaction.oncomplete = () => {
          resolve({
            ...this.stats,
            totalEntries: countRequest.result || 0,
            totalSize,
          });
        };
      });
    } catch (error) {
      return this.stats;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const db = await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(CACHE_CONFIG.STORE_NAME, 'readonly');
        const store = transaction.objectStore(CACHE_CONFIG.STORE_NAME);
        const request = store.getAllKeys();

        request.onsuccess = () => resolve(request.result as string[]);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      return [];
    }
  }
}

// LocalStorage fallback for browsers without IndexedDB support
class LocalStorageCache {
  private prefix = 'reg_cache_';
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    totalEntries: 0,
    totalSize: 0,
    lastCleanup: Date.now(),
  };

  private getKey(key: string): string {
    return this.prefix + btoa(key).substring(0, 50);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const stored = localStorage.getItem(this.getKey(key));
      if (!stored) {
        this.stats.misses++;
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(stored);
      
      if (Date.now() > entry.expiresAt) {
        this.stats.misses++;
        this.delete(key);
        return null;
      }

      this.stats.hits++;
      console.log(`📦 Cache HIT (localStorage) for key: ${key.substring(0, 50)}...`);
      return entry.data;
    } catch (error) {
      return null;
    }
  }

  async set<T>(key: string, data: T, ttl: number = CACHE_CONFIG.DEFAULT_TTL): Promise<void> {
    try {
      const size = calculateSize(data);
      const entry: CacheEntry<T> = {
        key,
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
        size,
        version: '1.0',
      };

      localStorage.setItem(this.getKey(key), JSON.stringify(entry));
      this.stats.totalEntries++;
      this.stats.totalSize += size;
      console.log(`💾 Cache SET (localStorage) for key: ${key.substring(0, 50)}...`);
    } catch (error) {
      // localStorage might be full, try to clean up
      if ((error as any)?.name === 'QuotaExceededError') {
        await this.cleanup();
        try {
          const size = calculateSize(data);
          const entry: CacheEntry<T> = {
            key,
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + ttl,
            size,
            version: '1.0',
          };
          localStorage.setItem(this.getKey(key), JSON.stringify(entry));
        } catch {
          console.warn('localStorage quota exceeded even after cleanup');
        }
      }
    }
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.getKey(key));
  }

  async clear(): Promise<void> {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
    keys.forEach(k => localStorage.removeItem(k));
    this.stats.totalEntries = 0;
    this.stats.totalSize = 0;
    console.log('🗑️ Cache cleared (localStorage)');
  }

  async cleanup(): Promise<number> {
    const now = Date.now();
    let deletedCount = 0;
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));

    keys.forEach(k => {
      try {
        const stored = localStorage.getItem(k);
        if (stored) {
          const entry: CacheEntry<any> = JSON.parse(stored);
          if (now > entry.expiresAt) {
            localStorage.removeItem(k);
            deletedCount++;
          }
        }
      } catch {
        localStorage.removeItem(k);
        deletedCount++;
      }
    });

    this.stats.lastCleanup = now;
    if (deletedCount > 0) {
      console.log(`🧹 Cache cleanup (localStorage): removed ${deletedCount} expired entries`);
    }
    return deletedCount;
  }

  async getStats(): Promise<CacheStats> {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
    let totalSize = 0;

    keys.forEach(k => {
      const item = localStorage.getItem(k);
      if (item) totalSize += item.length * 2; // Approximate UTF-16 size
    });

    return {
      ...this.stats,
      totalEntries: keys.length,
      totalSize,
    };
  }

  async getAllKeys(): Promise<string[]> {
    return Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
  }
}

// Cache manager that handles both IndexedDB and localStorage
class CacheManager {
  private indexedDBCache: IndexedDBCache;
  private localStorageCache: LocalStorageCache;
  private useIndexedDB: boolean = true;
  private initialized: boolean = false;
  private cleanupInterval: number | null = null;

  constructor() {
    this.indexedDBCache = new IndexedDBCache();
    this.localStorageCache = new LocalStorageCache();
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if IndexedDB is available
      if (!window.indexedDB) {
        throw new Error('IndexedDB not supported');
      }
      await this.indexedDBCache.init();
      this.useIndexedDB = true;
      console.log('✅ Cache initialized with IndexedDB');
    } catch (error) {
      this.useIndexedDB = false;
      console.log('⚠️ Falling back to localStorage cache');
    }

    this.initialized = true;

    // Start periodic cleanup
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    if (this.cleanupInterval) return;
    
    this.cleanupInterval = window.setInterval(() => {
      this.cleanup();
    }, CACHE_CONFIG.CLEANUP_INTERVAL);
  }

  private getCache() {
    return this.useIndexedDB ? this.indexedDBCache : this.localStorageCache;
  }

  async get<T>(key: string): Promise<T | null> {
    await this.init();
    return this.getCache().get<T>(key);
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    await this.init();
    return this.getCache().set(key, data, ttl);
  }

  async delete(key: string): Promise<void> {
    await this.init();
    return this.getCache().delete(key);
  }

  async clear(): Promise<void> {
    await this.init();
    return this.getCache().clear();
  }

  async cleanup(): Promise<number> {
    await this.init();
    return this.getCache().cleanup();
  }

  async getStats(): Promise<CacheStats> {
    await this.init();
    return this.getCache().getStats();
  }

  async invalidateByPrefix(prefix: string): Promise<void> {
    await this.init();
    const keys = await this.getCache().getAllKeys();
    const matchingKeys = keys.filter(k => k.startsWith(prefix));
    
    for (const key of matchingKeys) {
      await this.delete(key);
    }
    
    console.log(`🔄 Invalidated ${matchingKeys.length} cache entries with prefix: ${prefix}`);
  }

  isUsingIndexedDB(): boolean {
    return this.useIndexedDB;
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

// Convenience functions
export const getFromCache = <T>(key: string) => cacheManager.get<T>(key);
export const setInCache = <T>(key: string, data: T, ttl?: number) => cacheManager.set(key, data, ttl);
export const deleteFromCache = (key: string) => cacheManager.delete(key);
export const clearCache = () => cacheManager.clear();
export const getCacheStats = () => cacheManager.getStats();
export const invalidateCacheByPrefix = (prefix: string) => cacheManager.invalidateByPrefix(prefix);

// Cache TTL presets
export const CACHE_TTL = {
  SHORT: 5 * 60 * 1000,      // 5 minutes - for frequently changing data
  MEDIUM: 15 * 60 * 1000,    // 15 minutes - default
  LONG: 60 * 60 * 1000,      // 1 hour - for stable data
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours - for rarely changing data
};

export default cacheManager;
