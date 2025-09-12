import React from 'react';
import { debounce, throttle, ExpiringCache } from './performance';

// Global caches for different data types
export const globalCaches = {
  permissions: new ExpiringCache<any>(),
  user: new ExpiringCache<any>(),
  clinics: new ExpiringCache<any>(),
  patients: new ExpiringCache<any>(),
  appointments: new ExpiringCache<any>(),
};

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTiming(label: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(label, duration);
    };
  }

  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    const values = this.metrics.get(label)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getAverageTime(label: string): number {
    const values = this.metrics.get(label) || [];
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  getMetrics(): Record<string, { avg: number; count: number; recent: number }> {
    const result: Record<string, { avg: number; count: number; recent: number }> = {};
    
    this.metrics.forEach((values, label) => {
      result[label] = {
        avg: this.getAverageTime(label),
        count: values.length,
        recent: values[values.length - 1] || 0
      };
    });
    
    return result;
  }
}

// Optimized debounced search hook
export const useOptimizedSearch = (
  searchFunction: (query: string) => Promise<any>,
  delay: number = 300
) => {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const cache = React.useRef(new ExpiringCache<any[]>());

  const debouncedSearch = React.useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      const cacheKey = `search_${searchQuery}`;
      const cachedResults = cache.current.get(cacheKey);
      
      if (cachedResults) {
        setResults(cachedResults);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const monitor = PerformanceMonitor.getInstance();
        const stopTiming = monitor.startTiming(`search_${searchQuery.length}`);
        
        const searchResults = await searchFunction(searchQuery);
        
        stopTiming();
        cache.current.set(cacheKey, searchResults);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, delay),
    [searchFunction, delay]
  );

  React.useEffect(() => {
    setLoading(true);
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  return { query, setQuery, results, loading };
};

// Optimized pagination hook
export const useOptimizedPagination = <T>(
  data: T[],
  itemsPerPage: number = 10
) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  }, [data, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const goToPage = React.useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

<<<<<<< HEAD
  // Memoize options to prevent infinite re-renders
  const memoizedOptions = React.useMemo(() => ({
    threshold: 0.1,
    ...options,
  }), [options]);

=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
<<<<<<< HEAD
    }, memoizedOptions);
=======
    }, {
      threshold: 0.1,
      ...options,
    });
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
<<<<<<< HEAD
  }, [ref, memoizedOptions]);
=======
  }, [ref, options]);
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a

  return isIntersecting;
};

// Optimized virtual scrolling for large lists
export const useVirtualScrolling = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleItemsCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItemsCount + 1, items.length);

  const visibleItems = React.useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
    }));
  }, [items, startIndex, endIndex]);

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = React.useCallback(
<<<<<<< HEAD
    (e: React.UIEvent<HTMLDivElement>) => {
      throttle(() => {
        setScrollTop(e.currentTarget.scrollTop);
      }, 16)(); // ~60fps
    },
=======
    throttle((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, 16), // ~60fps
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
    []
  );

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
  };
};

// Memory usage monitoring
export const useMemoryMonitoring = () => {
  const [memoryUsage, setMemoryUsage] = React.useState<any>(null);

  React.useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        setMemoryUsage({
          used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024),
        });
      }
    };

    checkMemory();
    const interval = setInterval(checkMemory, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return memoryUsage;
};

// Performance-optimized component wrapper
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) => {
  const MemoizedComponent = React.memo(WrappedComponent);
  
  const WrappedWithMonitoring = React.forwardRef<any, P>((props, ref) => {
    const monitor = PerformanceMonitor.getInstance();
    
    React.useEffect(() => {
      const stopTiming = monitor.startTiming(`component_${componentName}`);
      return stopTiming;
<<<<<<< HEAD
    }, [monitor]);
=======
    }, []);
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a

    return React.createElement(MemoizedComponent, { ...props, ref });
  });

  WrappedWithMonitoring.displayName = `withPerformanceMonitoring(${componentName})`;
  return WrappedWithMonitoring;
};
