import { useEffect, useCallback, useState } from "react";

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

  const startTime = Date.now();

  useEffect(() => {
    const endTime = Date.now();
    const renderTime = endTime - startTime;

    setMetrics(prev => ({
      renderTime,
      memoryUsage: (performance as any)?.memory?.usedJSHeapSize || undefined,
      componentCount: prev.componentCount + 1,
      lastUpdate: endTime
    }));

    // تسجيل الأداء في وضع التطوير
    if (process.env.NODE_ENV === 'development' && renderTime > 100) {
      console.warn(`⚠️ Slow render detected in ${componentName}: ${renderTime}ms`);
    }
  }, [componentName, startTime]);

  const logPerformance = useCallback(() => {
    console.log(`📊 Performance metrics for ${componentName}:`, metrics);
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
  }, deps);

  return cachedValue;
}