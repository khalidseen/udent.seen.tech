/**
 * Performance Optimization Utilities
 * أدوات تحسين الأداء
 */

// Debounce function to reduce excessive function calls
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function to limit function execution rate
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Lazy load images
export const lazyLoadImage = (img: HTMLImageElement) => {
  const src = img.dataset.src;
  if (!src) return;
  
  img.src = src;
  img.classList.add('loaded');
};

// Intersection Observer for lazy loading
export const observeElements = (
  elements: NodeListOf<Element>,
  callback: (entry: IntersectionObserverEntry) => void
) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: '50px',
    }
  );

  elements.forEach((el) => observer.observe(el));
  return observer;
};

// Memoization helper
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// Performance monitoring
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
};

// Check if device has low resources
export const isLowEndDevice = () => {
  // @ts-ignore
  const memory = (navigator as any).deviceMemory;
  // @ts-ignore
  const cores = navigator.hardwareConcurrency;
  
  return memory < 4 || cores < 4;
};

// Reduce motion for accessibility and performance
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Virtual scrolling helper
export const calculateVisibleItems = (
  scrollTop: number,
  itemHeight: number,
  containerHeight: number,
  totalItems: number
) => {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight)
  );
  
  return { startIndex, endIndex };
};

// Batch DOM updates
export const batchDOMUpdates = (updates: (() => void)[]) => {
  requestAnimationFrame(() => {
    updates.forEach((update) => update());
  });
};

// Optimize images
export const optimizeImage = (
  src: string,
  width?: number,
  quality?: number
): string => {
  // If using Supabase storage, add transformations
  if (src.includes('supabase')) {
    const url = new URL(src);
    if (width) url.searchParams.set('width', width.toString());
    if (quality) url.searchParams.set('quality', quality.toString());
    return url.toString();
  }
  return src;
};

// Preload critical resources
export const preloadResource = (href: string, as: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
};

// Check network quality
export const getNetworkQuality = (): 'fast' | 'slow' | 'offline' => {
  if (!navigator.onLine) return 'offline';
  
  // @ts-ignore
  const connection = (navigator as any).connection;
  if (!connection) return 'fast';
  
  const effectiveType = connection.effectiveType;
  if (effectiveType === '4g') return 'fast';
  if (effectiveType === '3g' || effectiveType === '2g') return 'slow';
  
  return 'fast';
};

export default {
  debounce,
  throttle,
  lazyLoadImage,
  observeElements,
  memoize,
  measurePerformance,
  isLowEndDevice,
  prefersReducedMotion,
  calculateVisibleItems,
  batchDOMUpdates,
  optimizeImage,
  preloadResource,
  getNetworkQuality,
};
