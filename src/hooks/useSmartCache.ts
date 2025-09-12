import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface CacheOptions {
  key: string;
  ttl?: number; // Time to live in minutes
  version?: string;
}

// Smart caching system with versioning and cleanup
export function useSmartCache() {
  const queryClient = useQueryClient();
  const [cacheSize, setCacheSize] = useState(0);

  // Calculate cache size
  const calculateCacheSize = useCallback(() => {
    let size = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cache_')) {
        size += localStorage.getItem(key)?.length || 0;
      }
    }
    setCacheSize(size);
  }, []);

  useEffect(() => {
    calculateCacheSize();
  }, [calculateCacheSize]);

  const setCache = useCallback((options: CacheOptions, data: any) => {
    const { key, ttl = 30, version = '1.0' } = options;
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl: ttl * 60 * 1000, // Convert to milliseconds
      version
    };
    
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
      calculateCacheSize();
    } catch (error) {
      // Handle quota exceeded
      cleanOldCache();
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
      } catch (e) {
        console.warn('Cache storage failed:', e);
      }
    }
  }, [calculateCacheSize]);

  const getCache = useCallback((key: string, currentVersion = '1.0') => {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const parsedCache = JSON.parse(cached);
      const now = Date.now();
      
      // Check if expired
      if (now - parsedCache.timestamp > parsedCache.ttl) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      // Check version compatibility
      if (parsedCache.version !== currentVersion) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return parsedCache.data;
    } catch (error) {
      localStorage.removeItem(`cache_${key}`);
      return null;
    }
  }, []);

  const clearCache = useCallback((key?: string) => {
    if (key) {
      localStorage.removeItem(`cache_${key}`);
      queryClient.removeQueries({ queryKey: [key] });
    } else {
      // Clear all cache
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('cache_')) {
          keys.push(key);
        }
      }
      keys.forEach(key => localStorage.removeItem(key));
      queryClient.clear();
    }
    calculateCacheSize();
  }, [queryClient, calculateCacheSize]);

  const cleanOldCache = useCallback(() => {
    const keys = [];
    const now = Date.now();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cache_')) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const parsedCache = JSON.parse(cached);
            if (now - parsedCache.timestamp > parsedCache.ttl) {
              keys.push(key);
            }
          }
        } catch (e) {
          keys.push(key);
        }
      }
    }
    
    keys.forEach(key => localStorage.removeItem(key));
    calculateCacheSize();
  }, [calculateCacheSize]);

  // Clean old cache on mount
  useEffect(() => {
    cleanOldCache();
  }, [cleanOldCache]);

  return {
    setCache,
    getCache,
    clearCache,
    cleanOldCache,
    cacheSize: Math.round(cacheSize / 1024) // KB
  };
}