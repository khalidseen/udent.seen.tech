import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AppPerformanceMetrics {
  totalRenderTime: number;
  totalQueries: number;
  cacheHitRate: number;
  networkRequests: number;
  errorCount: number;
  memoryUsage: number;
}

interface PerformanceReport {
  metrics: AppPerformanceMetrics;
  recommendations: string[];
  score: number; // 0-100
}

export function useAppPerformance() {
  const queryClient = useQueryClient();
  const [metrics, setMetrics] = useState<AppPerformanceMetrics>({
    totalRenderTime: 0,
    totalQueries: 0,
    cacheHitRate: 0,
    networkRequests: 0,
    errorCount: 0,
    memoryUsage: 0
  });

  const [performanceHistory, setPerformanceHistory] = useState<AppPerformanceMetrics[]>([]);

  // Collect performance metrics
  const collectMetrics = useCallback(() => {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const memory = (performance as any).memory;
      
      const currentMetrics: AppPerformanceMetrics = {
        totalRenderTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
        totalQueries: queryClient.getQueryCache().getAll().length,
        cacheHitRate: calculateCacheHitRate(),
        networkRequests: performance.getEntriesByType('resource').length,
        errorCount: getErrorCount(),
        memoryUsage: memory ? memory.usedJSHeapSize / 1024 / 1024 : 0 // MB
      };

      setMetrics(currentMetrics);
      
      // Keep history of last 10 measurements
      setPerformanceHistory(prev => {
        const newHistory = [...prev, currentMetrics].slice(-10);
        return newHistory;
      });

    } catch (error) {
      console.warn('Failed to collect performance metrics:', error);
    }
  }, [queryClient]);

  // Calculate cache hit rate from React Query
  const calculateCacheHitRate = useCallback(() => {
    const queries = queryClient.getQueryCache().getAll();
    if (queries.length === 0) return 0;
    
    const cachedQueries = queries.filter(query => 
      query.state.data !== undefined && 
      query.state.dataUpdateCount > 0
    );
    
    return (cachedQueries.length / queries.length) * 100;
  }, [queryClient]);

  // Get error count from session storage
  const getErrorCount = useCallback(() => {
    try {
      const errors = sessionStorage.getItem('app_errors');
      return errors ? JSON.parse(errors).length : 0;
    } catch {
      return 0;
    }
  }, []);

  // Generate performance report with recommendations
  const generateReport = useCallback((): PerformanceReport => {
    const recommendations: string[] = [];
    let score = 100;

    // Analyze render time
    if (metrics.totalRenderTime > 3000) {
      recommendations.push('تحسين وقت التحميل الأولي للتطبيق');
      score -= 20;
    } else if (metrics.totalRenderTime > 1500) {
      recommendations.push('تحسين سرعة التحميل');
      score -= 10;
    }

    // Analyze cache hit rate
    if (metrics.cacheHitRate < 50) {
      recommendations.push('تحسين استراتيجية التخزين المؤقت');
      score -= 15;
    } else if (metrics.cacheHitRate < 80) {
      recommendations.push('زيادة كفاءة التخزين المؤقت');
      score -= 5;
    }

    // Analyze memory usage
    if (metrics.memoryUsage > 100) {
      recommendations.push('تحسين استخدام الذاكرة');
      score -= 10;
    } else if (metrics.memoryUsage > 50) {
      recommendations.push('مراقبة استخدام الذاكرة');
      score -= 5;
    }

    // Analyze error count
    if (metrics.errorCount > 5) {
      recommendations.push('إصلاح الأخطاء المتكررة');
      score -= 20;
    } else if (metrics.errorCount > 0) {
      recommendations.push('مراجعة الأخطاء الموجودة');
      score -= 5;
    }

    // Analyze network requests
    if (metrics.networkRequests > 100) {
      recommendations.push('تقليل عدد طلبات الشبكة');
      score -= 10;
    }

    if (recommendations.length === 0) {
      recommendations.push('الأداء ممتاز! استمر في المراقبة');
    }

    return {
      metrics,
      recommendations,
      score: Math.max(0, score)
    };
  }, [metrics]);

  // Optimize app performance
  const optimizePerformance = useCallback(async () => {
    try {
      // Clear React Query cache selectively
      const staleCacheTime = 5 * 60 * 1000; // 5 minutes
      const now = Date.now();
      
      queryClient.getQueryCache().getAll().forEach(query => {
        if (query.state.dataUpdatedAt < now - staleCacheTime) {
          queryClient.removeQueries({ queryKey: query.queryKey });
        }
      });

      // Clear session storage errors
      sessionStorage.removeItem('app_errors');

      // Trigger garbage collection if available
      if ('gc' in window) {
        (window as any).gc();
      }

      // Update metrics after optimization
      setTimeout(collectMetrics, 1000);

      toast.success('تم تحسين أداء التطبيق بنجاح');
      
      return true;
    } catch (error) {
      console.error('Performance optimization failed:', error);
      toast.error('فشل في تحسين الأداء');
      return false;
    }
  }, [queryClient, collectMetrics]);

  // Monitor critical metrics and alert if needed
  const monitorCriticalMetrics = useCallback(() => {
    const report = generateReport();
    
    if (report.score < 50) {
      toast.warning('أداء التطبيق منخفض - يُنصح بالتحسين', {
        action: {
          label: 'تحسين الآن',
          onClick: optimizePerformance
        }
      });
    }
    
    if (metrics.errorCount > 10) {
      toast.error('عدد كبير من الأخطاء - يتطلب المراجعة');
    }
  }, [generateReport, metrics.errorCount, optimizePerformance]);

  // Collect metrics on mount and periodically
  useEffect(() => {
    collectMetrics();
    
    const interval = setInterval(collectMetrics, 30000); // Every 30 seconds
    const monitorInterval = setInterval(monitorCriticalMetrics, 60000); // Every minute
    
    return () => {
      clearInterval(interval);
      clearInterval(monitorInterval);
    };
  }, [collectMetrics, monitorCriticalMetrics]);

  // Listen for page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        collectMetrics();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [collectMetrics]);

  return {
    metrics,
    performanceHistory,
    generateReport,
    optimizePerformance,
    collectMetrics,
    cacheHitRate: metrics.cacheHitRate
  };
}
