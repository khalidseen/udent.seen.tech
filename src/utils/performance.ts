// Performance utilities for optimization

// Debounce function for search and input optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for scroll and resize events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Image lazy loading with intersection observer
export function createImageLazyLoader() {
  if (typeof window === 'undefined') return null;

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: '50px'
  });

  return {
    observe: (img: HTMLImageElement) => imageObserver.observe(img),
    unobserve: (img: HTMLImageElement) => imageObserver.unobserve(img),
    disconnect: () => imageObserver.disconnect()
  };
}

// Memory usage monitoring
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private observers: Array<(info: any) => void> = [];

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  subscribe(observer: (info: any) => void) {
    this.observers.push(observer);
    return () => {
      this.observers = this.observers.filter(obs => obs !== observer);
    };
  }

  getMemoryInfo() {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  startMonitoring(interval = 5000) {
    const monitor = () => {
      const memInfo = this.getMemoryInfo();
      if (memInfo) {
        this.observers.forEach(observer => observer(memInfo));
      }
    };

    monitor(); // Initial check
    return setInterval(monitor, interval);
  }
}

// Bundle size tracking
export function trackBundleSize() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const entries = performance.getEntriesByType('navigation');
    if (entries.length > 0) {
      const navigation = entries[0] as PerformanceNavigationTiming;
      return {
        transferSize: navigation.transferSize,
        encodedBodySize: navigation.encodedBodySize,
        decodedBodySize: navigation.decodedBodySize
      };
    }
  }
  return null;
}

// Component render tracking
export function trackComponentRender(componentName: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔄 ${componentName} rendered at ${new Date().toISOString()}`);
  }
}

// Network status monitoring
export function createNetworkMonitor() {
  const observers: Array<(online: boolean) => void> = [];

  const notifyObservers = (online: boolean) => {
    observers.forEach(observer => observer(online));
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => notifyObservers(true));
    window.addEventListener('offline', () => notifyObservers(false));
  }

  return {
    subscribe: (observer: (online: boolean) => void) => {
      observers.push(observer);
      return () => {
        const index = observers.indexOf(observer);
        if (index > -1) observers.splice(index, 1);
      };
    },
    isOnline: () => typeof navigator !== 'undefined' ? navigator.onLine : true
  };
}