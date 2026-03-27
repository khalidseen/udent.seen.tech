// مراقب الأداء العام للتطبيق

interface PerformanceEntry {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private entries: Map<string, PerformanceEntry> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  // بدء قياس الأداء
  start(name: string, metadata?: Record<string, any>) {
    const entry: PerformanceEntry = {
      name,
      startTime: performance.now(),
      metadata
    };
    
    this.entries.set(name, entry);
    
    if (import.meta.env.DEV) {
      console.log(`🚀 Started measuring: ${name}`);
    }
  }

  // انتهاء قياس الأداء
  end(name: string) {
    const entry = this.entries.get(name);
    if (!entry) {
      if (import.meta.env.DEV) console.warn(`⚠️ No performance entry found for: ${name}`);
      return;
    }

    entry.endTime = performance.now();
    entry.duration = entry.endTime - entry.startTime;

    if (import.meta.env.DEV) {
      const color = entry.duration > 100 ? '🔴' : entry.duration > 50 ? '🟡' : '🟢';
      console.log(`${color} ${name}: ${entry.duration.toFixed(2)}ms`);
    }

    // إرسال البيانات للمراقبة في الإنتاج
    this.reportPerformance(entry);
    
    return entry;
  }

  // قياس دالة معينة
  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.start(name, metadata);
    try {
      const result = fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  // قياس دالة async
  async measureAsync<T>(
    name: string, 
    fn: () => Promise<T>, 
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(name, metadata);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  // مراقبة Web Vitals
  private initializeObservers() {
    if (typeof window === 'undefined') return;

    try {
      // مراقبة Paint Timing
      const paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.logWebVital(entry.name, entry.startTime);
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);

      // مراقبة Navigation Timing
      const navigationObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const nav = entry as PerformanceNavigationTiming;
            this.logWebVital('DOM Content Loaded', nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart);
            this.logWebVital('Load Event', nav.loadEventEnd - nav.loadEventStart);
          }
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);

      // مراقبة Resource Timing
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (import.meta.env.DEV && entry.duration > 1000) {
            console.warn(`🐌 Slow resource: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

    } catch (error) {
      // Performance Observer not supported
    }
  }

  // تسجيل Web Vitals
  private logWebVital(name: string, value: number) {
    if (import.meta.env.DEV) {
      console.log(`📊 Web Vital - ${name}: ${value.toFixed(2)}ms`);
    }
    
    // يمكن إرسال هذه البيانات لخدمة المراقبة
    this.reportWebVital(name, value);
  }

  // إرسال بيانات الأداء
  private reportPerformance(entry: PerformanceEntry) {
    // يمكن تطبيق إرسال البيانات لخدمة مراقبة مثل Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_measure', {
        event_category: 'Performance',
        event_label: entry.name,
        value: Math.round(entry.duration || 0),
        custom_map: entry.metadata
      });
    }
  }

  // إرسال Web Vitals
  private reportWebVital(name: string, value: number) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', name.replace(/\s+/g, '_').toLowerCase(), {
        event_category: 'Web Vitals',
        value: Math.round(value)
      });
    }
  }

  // الحصول على إحصائيات الذاكرة
  getMemoryUsage() {
    if (typeof window !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usedPercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  }

  // تنظيف المراقبين
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.entries.clear();
  }

  // الحصول على تقرير أداء شامل
  getPerformanceReport() {
    const memoryUsage = this.getMemoryUsage();
    const allEntries = Array.from(this.entries.values());
    
    return {
      timestamp: new Date().toISOString(),
      entries: allEntries,
      memoryUsage,
      slowOperations: allEntries.filter(entry => (entry.duration || 0) > 100),
      totalMeasurements: allEntries.length,
      averageDuration: allEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / allEntries.length
    };
  }
}

// إنشاء مثيل عام
export const performanceMonitor = new PerformanceMonitor();

// Decorator للقياس التلقائي
export function measurePerformance(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const measureName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      return performanceMonitor.measure(measureName, () => {
        return originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}

// Hook للتطبيقات React
export function usePerformanceReport() {
  return {
    getReport: () => performanceMonitor.getPerformanceReport(),
    getMemory: () => performanceMonitor.getMemoryUsage(),
    start: (name: string, metadata?: Record<string, any>) => 
      performanceMonitor.start(name, metadata),
    end: (name: string) => performanceMonitor.end(name)
  };
}