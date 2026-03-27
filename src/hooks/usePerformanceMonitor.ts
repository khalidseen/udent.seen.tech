import { useEffect, useCallback, useState, useRef } from "react";

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  componentCount: number;
  lastUpdate: number;
}

// Hook لمراقبة الأداء
export function usePerformanceMonitor(componentName: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentCount: 0,
    lastUpdate: Date.now()
  });

  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const endTime = Date.now();
    const renderTime = endTime - startTimeRef.current;

    setMetrics(prev => ({
      renderTime,
      memoryUsage: (performance as unknown as { memory?: { usedJSHeapSize: number } })?.memory?.usedJSHeapSize || undefined,
      componentCount: prev.componentCount + 1,
      lastUpdate: endTime
    }));

    // تسجيل الأداء في وضع التطوير
    if (import.meta.env.DEV && renderTime > 500) {
      console.warn(`⚠️ Slow render detected in ${componentName}: ${renderTime}ms`);
    }

    // Reset start time for next render
    startTimeRef.current = Date.now();
  }, [componentName]);

  const logPerformance = useCallback(() => {
    if (import.meta.env.DEV) console.log(`📊 Performance metrics for ${componentName}:`, metrics);
  }, [componentName, metrics]);

  return {
    metrics,
    logPerformance
  };
}

// Hook لتحسين إعادة الرندر
export function useRenderOptimization<T>(value: T, deps: React.DependencyList) {
  const [cachedValue, setCachedValue] = useState(value);
  
  useEffect(() => {
    setCachedValue(value);
  }, [value, deps]);

  return cachedValue;
}