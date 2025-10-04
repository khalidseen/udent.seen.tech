import React, { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Progress } from './progress';
import { useSmartCache } from '@/hooks/useSmartCache';
import { Loader2, Zap, Database, Network, Gauge } from 'lucide-react';

interface PerformanceMetrics {
  renderTime: number;
  dataFetchTime: number;
  cacheHitRate: number;
  networkLatency: number;
}

// Performance Dashboard Component
export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    dataFetchTime: 0,
    cacheHitRate: 0,
    networkLatency: 0
  });
  
  const { cacheSize, cleanOldCache } = useSmartCache();
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      // Simulate gathering real metrics
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      setMetrics({
        renderTime: Math.round(performance.now()),
        dataFetchTime: navigation ? Math.round(navigation.responseEnd - navigation.requestStart) : 0,
        cacheHitRate: Math.random() * 100, // This would be real cache metrics
        networkLatency: navigation ? Math.round(navigation.responseStart - navigation.requestStart) : 0
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const optimizePerformance = async () => {
    setIsOptimizing(true);
    
    try {
      // Clear old cache
      await cleanOldCache();
      
      // Preload critical resources
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        // Service worker optimizations
        if (registration.active) {
          registration.active.postMessage({ type: 'CACHE_OPTIMIZATION' });
        }
      }
      
      // Force garbage collection if available
      if ('gc' in window) {
        (window as any).gc();
      }
      
      toast.success('تم تحسين الأداء بنجاح');
    } catch (error) {
      toast.error('فشل في تحسين الأداء');
    } finally {
      setIsOptimizing(false);
    }
  };

  const getPerformanceStatus = (value: number, type: 'time' | 'percentage') => {
    if (type === 'time') {
      if (value < 100) return { color: 'bg-green-500', label: 'ممتاز' };
      if (value < 300) return { color: 'bg-yellow-500', label: 'جيد' };
      return { color: 'bg-red-500', label: 'بطيء' };
    } else {
      if (value > 80) return { color: 'bg-green-500', label: 'ممتاز' };
      if (value > 60) return { color: 'bg-yellow-500', label: 'جيد' };
      return { color: 'bg-red-500', label: 'ضعيف' };
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="w-5 h-5" />
          لوحة مراقبة الأداء
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">وقت التصيير</span>
            </div>
            <div className="text-2xl font-bold">{metrics.renderTime}ms</div>
            <Badge className={getPerformanceStatus(metrics.renderTime, 'time').color}>
              {getPerformanceStatus(metrics.renderTime, 'time').label}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="text-sm font-medium">جلب البيانات</span>
            </div>
            <div className="text-2xl font-bold">{metrics.dataFetchTime}ms</div>
            <Badge className={getPerformanceStatus(metrics.dataFetchTime, 'time').color}>
              {getPerformanceStatus(metrics.dataFetchTime, 'time').label}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              <span className="text-sm font-medium">معدل التخزين المؤقت</span>
            </div>
            <div className="text-2xl font-bold">{Math.round(metrics.cacheHitRate)}%</div>
            <Badge className={getPerformanceStatus(metrics.cacheHitRate, 'percentage').color}>
              {getPerformanceStatus(metrics.cacheHitRate, 'percentage').label}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              <span className="text-sm font-medium">زمن الاستجابة</span>
            </div>
            <div className="text-2xl font-bold">{metrics.networkLatency}ms</div>
            <Badge className={getPerformanceStatus(metrics.networkLatency, 'time').color}>
              {getPerformanceStatus(metrics.networkLatency, 'time').label}
            </Badge>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">حجم التخزين المؤقت</span>
            <span className="text-sm text-muted-foreground">{cacheSize} KB</span>
          </div>
          <Progress value={(cacheSize / 1024) * 100} className="w-full" />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={optimizePerformance} 
            disabled={isOptimizing}
            className="flex items-center gap-2"
          >
            {isOptimizing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            تحسين الأداء
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            إعادة تحميل
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced Error Boundary with Performance Monitoring
interface EnhancedErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
  performanceData?: PerformanceMetrics;
}

export class EnhancedErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<any> },
  EnhancedErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): EnhancedErrorBoundaryState {
    return {
      hasError: true,
      error,
      performanceData: {
        renderTime: performance.now(),
        dataFetchTime: 0,
        cacheHitRate: 0,
        networkLatency: 0
      }
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({
      error,
      errorInfo,
      performanceData: {
        renderTime: performance.now(),
        dataFetchTime: 0,
        cacheHitRate: 0,
        networkLatency: 0
      }
    });

    // Log error with performance context
    console.error('Enhanced Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} />;
      }

      return (
        <Card className="w-full max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="text-red-600">حدث خطأ في النظام</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.
            </p>
            
            <div className="bg-muted p-3 rounded-md">
              <p className="text-xs font-mono">
                {this.state.error?.message}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
              >
                إعادة تحميل الصفحة
              </Button>
              
              <Button 
                onClick={() => this.setState({ hasError: false })}
              >
                المحاولة مرة أخرى
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}