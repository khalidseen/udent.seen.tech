<<<<<<< HEAD
import { useEffect, useCallback, useState, useRef } from "react";
=======
import { useEffect, useCallback, useState } from "react";
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a

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

<<<<<<< HEAD
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const endTime = Date.now();
    const renderTime = endTime - startTimeRef.current;

    setMetrics(prev => ({
      renderTime,
      memoryUsage: (performance as unknown as { memory?: { usedJSHeapSize: number } })?.memory?.usedJSHeapSize || undefined,
=======
  const startTime = Date.now();

  useEffect(() => {
    const endTime = Date.now();
    const renderTime = endTime - startTime;

    setMetrics(prev => ({
      renderTime,
      memoryUsage: (performance as any)?.memory?.usedJSHeapSize || undefined,
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
      componentCount: prev.componentCount + 1,
      lastUpdate: endTime
    }));

    // تسجيل الأداء في وضع التطوير
<<<<<<< HEAD
    if (process.env.NODE_ENV === 'development' && renderTime > 500) {
      console.warn(`⚠️ Slow render detected in ${componentName}: ${renderTime}ms`);
    }

    // Reset start time for next render
    startTimeRef.current = Date.now();
  }, [componentName]);
=======
    if (process.env.NODE_ENV === 'development' && renderTime > 100) {
      console.warn(`⚠️ Slow render detected in ${componentName}: ${renderTime}ms`);
    }
  }, [componentName, startTime]);
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a

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
<<<<<<< HEAD
  }, [value, deps]);
=======
  }, deps);
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a

  return cachedValue;
}