/**
 * نظام تخزين مؤقت للصور مع ضغط تلقائي
 */

interface CachedImage {
  blob: Blob;
  url: string;
  timestamp: number;
}

class ImageCache {
  private cache: Map<string, CachedImage> = new Map();
  private readonly MAX_CACHE_SIZE = 50; // Maximum cached images
  private readonly MAX_AGE = 1000 * 60 * 30; // 30 minutes

  async get(url: string): Promise<string | null> {
    const cached = this.cache.get(url);
    
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.MAX_AGE) {
      this.delete(url);
      return null;
    }
    
    return cached.url;
  }

  async set(url: string, blob: Blob): Promise<string> {
    // Clean old entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanOldest();
    }

    const objectUrl = URL.createObjectURL(blob);
    
    this.cache.set(url, {
      blob,
      url: objectUrl,
      timestamp: Date.now()
    });

    return objectUrl;
  }

  delete(url: string): void {
    const cached = this.cache.get(url);
    if (cached) {
      URL.revokeObjectURL(cached.url);
      this.cache.delete(url);
    }
  }

  private cleanOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    this.cache.forEach((value, key) => {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  clear(): void {
    this.cache.forEach((value) => {
      URL.revokeObjectURL(value.url);
    });
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      usage: (this.cache.size / this.MAX_CACHE_SIZE) * 100
    };
  }
}

export const imageCache = new ImageCache();

/**
 * تحميل صورة مع التخزين المؤقت التلقائي
 */
export async function loadOptimizedImage(url: string): Promise<string> {
  // Check cache first
  const cachedUrl = await imageCache.get(url);
  if (cachedUrl) return cachedUrl;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch image');

    const blob = await response.blob();
    return await imageCache.set(url, blob);
  } catch (error) {
    console.error('Failed to load optimized image:', error);
    return url; // Fallback to original URL
  }
}

/**
 * Hook للصور المحسنة
 */
export function useOptimizedImage(src: string | undefined) {
  const [optimizedSrc, setOptimizedSrc] = React.useState<string | undefined>(src);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!src) {
      setOptimizedSrc(undefined);
      return;
    }

    setLoading(true);
    loadOptimizedImage(src)
      .then(setOptimizedSrc)
      .finally(() => setLoading(false));
  }, [src]);

  return { src: optimizedSrc, loading };
}

// Add React import for hook
import React from 'react';
