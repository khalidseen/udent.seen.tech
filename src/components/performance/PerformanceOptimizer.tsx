import React, { memo, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Database, 
  Wifi, 
  HardDrive, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'excellent' | 'good' | 'average' | 'poor';
  description: string;
}

// مُحسّن للأداء مع React.memo
export const PerformanceOptimizer: React.FC = memo(() => {
  const { isOnline } = useNetworkStatus();

  // استخدام useMemo لتجنب إعادة حساب المقاييس في كل render
  const performanceMetrics = useMemo((): PerformanceMetric[] => {
    const metrics = [];

    // قياس سرعة الشبكة
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      metrics.push({
        name: 'سرعة الاتصال',
        value: connection?.downlink || 0,
        unit: 'Mbps',
        status: connection?.downlink > 10 ? 'excellent' : 
                connection?.downlink > 5 ? 'good' : 
                connection?.downlink > 1 ? 'average' : 'poor',
        description: 'سرعة تحميل البيانات'
      });
    }

    // قياس استخدام الذاكرة
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      metrics.push({
        name: 'استخدام الذاكرة',
        value: memoryUsage,
        unit: '%',
        status: memoryUsage < 50 ? 'excellent' : 
                memoryUsage < 70 ? 'good' : 
                memoryUsage < 85 ? 'average' : 'poor',
        description: 'نسبة استخدام ذاكرة JavaScript'
      });
    }

    // قياس زمن الاستجابة
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      metrics.push({
        name: 'زمن التحميل',
        value: loadTime,
        unit: 'ms',
        status: loadTime < 1000 ? 'excellent' : 
                loadTime < 2000 ? 'good' : 
                loadTime < 3000 ? 'average' : 'poor',
        description: 'زمن تحميل الصفحة'
      });
    }

    return metrics;
  }, []);

  // استخدام useCallback لتجنب إعادة إنشاء الدالة
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'average': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'good': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'average': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'poor': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Settings className="w-4 h-4 text-gray-600" />;
    }
  }, []);

  const optimizePerformance = useCallback(async () => {
    try {
      // تنظيف ذاكرة التخزين المؤقت
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // تنظيف localStorage القديمة
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('temp_') || key.includes('cache_')) {
          localStorage.removeItem(key);
        }
      });

      // إجبار garbage collection إذا كان متاحاً
      if ('gc' in window && typeof (window as any).gc === 'function') {
        (window as any).gc();
      }

      // إعادة تحميل الصفحة للتطبيق النظيف
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Error optimizing performance:', error);
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          مُحسِّن الأداء
        </CardTitle>
        <CardDescription>
          مراقبة وتحسين أداء النظام في الوقت الفعلي
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* حالة الاتصال */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Wifi className={`w-4 h-4 ${isOnline ? 'text-green-600' : 'text-red-600'}`} />
            <span className="font-medium">حالة الاتصال</span>
          </div>
          <div className="text-left">
            <Badge variant={isOnline ? 'default' : 'destructive'}>
            {isOnline ? 'متصل' : 'غير متصل'}
          </Badge>
          </div>
        </div>

        {/* مقاييس الأداء */}
        <div className="space-y-3">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(metric.status)}
                  <span className="font-medium">{metric.name}</span>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${getStatusColor(metric.status)}`}>
                    {metric.value.toFixed(1)} {metric.unit}
                  </span>
                </div>
              </div>
              <Progress 
                value={metric.status === 'excellent' ? 90 : 
                       metric.status === 'good' ? 70 : 
                       metric.status === 'average' ? 50 : 30} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {metric.description}
              </p>
            </div>
          ))}
        </div>

        {/* أزرار التحكم */}
        <div className="flex gap-2 pt-4">
          <Button 
            onClick={optimizePerformance}
            className="flex-1"
            variant="default"
          >
            <Zap className="w-4 h-4 mr-2" />
            تحسين النظام
          </Button>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            إعادة تحميل
          </Button>
        </div>

        {/* نصائح الأداء */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">💡 نصائح لتحسين الأداء:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• استخدم اتصال Wi-Fi مستقر لأفضل أداء</li>
            <li>• أغلق التبويبات غير المستخدمة لتوفير الذاكرة</li>
            <li>• قم بتحديث المتصفح إلى أحدث إصدار</li>
            <li>• فعّل وضع الحفظ إذا كان الاتصال بطيئاً</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
});

PerformanceOptimizer.displayName = 'PerformanceOptimizer';