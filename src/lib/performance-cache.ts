/**
 * Advanced caching system with LRU eviction and size limits
 */

interface CacheEntry<T> {
  value: T;
  expires: number;
  size: number;
  lastAccessed: number;
}

export class AdvancedCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private maxEntries: number;
  private currentSize: number = 0;

  constructor(
    maxSizeMB: number = 50,
    maxEntries: number = 1000
  ) {
    this.maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
    this.maxEntries = maxEntries;
  }

  /**
   * Estimate the size of a value in bytes
   */
  private estimateSize(value: T): number {
    try {
      return new Blob([JSON.stringify(value)]).size;
    } catch {
      return 1024; // Default 1KB if can't estimate
    }
  }

  /**
   * Remove least recently used entries when needed
   */
  private evictLRU(): void {
    if (this.cache.size === 0) return;

    // Sort by last accessed time
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    // Remove oldest 10% of entries
    const toRemove = Math.max(1, Math.floor(entries.length * 0.1));
    
    for (let i = 0; i < toRemove; i++) {
      const [key, entry] = entries[i];
      this.currentSize -= entry.size;
      this.cache.delete(key);
    }
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: T, ttlMs: number = 5 * 60 * 1000): void {
    const size = this.estimateSize(value);
    
    // Check if we need to evict entries
    if (this.cache.size >= this.maxEntries || 
        this.currentSize + size > this.maxSize) {
      this.evictLRU();
    }

    // Remove old entry if exists
    const oldEntry = this.cache.get(key);
    if (oldEntry) {
      this.currentSize -= oldEntry.size;
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + ttlMs,
      size,
      lastAccessed: Date.now(),
    });

    this.currentSize += size;
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expires) {
      this.currentSize -= entry.size;
      this.cache.delete(key);
      return null;
    }

    // Update last accessed time
    entry.lastAccessed = Date.now();
    return entry.value;
  }

  /**
   * Check if a key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
    }
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      entries: this.cache.size,
      maxEntries: this.maxEntries,
      sizeMB: (this.currentSize / (1024 * 1024)).toFixed(2),
      maxSizeMB: (this.maxSize / (1024 * 1024)).toFixed(2),
      utilizationPercent: ((this.currentSize / this.maxSize) * 100).toFixed(2),
    };
  }

  /**
   * Clean expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expires) {
        toDelete.push(key);
      }
    });

    toDelete.forEach(key => this.delete(key));
  }
}

// Global cache instances
export const dataCache = new AdvancedCache<any>(50, 1000);
export const queryCache = new AdvancedCache<any>(30, 500);
export const imageCache = new AdvancedCache<string>(100, 200);

// Auto cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    dataCache.cleanup();
    queryCache.cleanup();
    imageCache.cleanup();
  }, 5 * 60 * 1000);
}
