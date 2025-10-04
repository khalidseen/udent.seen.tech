import { useEffect, useState } from 'react';
import { performanceMonitor } from '@/lib/performance-monitor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Download, Trash2 } from 'lucide-react';

/**
 * لوحة مراقبة الأداء - للمطورين فقط
 */
export function PerformanceMonitor() {
  const [report, setReport] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    const interval = setInterval(() => {
      const newReport = performanceMonitor.getPerformanceReport();
      setReport(newReport);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="fixed bottom-4 right-4 z-50"
        onClick={() => setIsVisible(true)}
      >
        <Activity className="h-4 w-4" />
      </Button>
    );
  }

  if (!report) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-96 z-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle className="text-lg">مراقب الأداء</CardTitle>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsVisible(false)}
          >
            ✕
          </Button>
        </div>
        <CardDescription>
          آخر تحديث: {new Date(report.timestamp).toLocaleTimeString('ar-EG')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">عدد القياسات</p>
            <p className="text-2xl font-bold">{report.totalMeasurements}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">متوسط الوقت</p>
            <p className="text-2xl font-bold">
              {report.averageDuration?.toFixed(2) || 0}ms
            </p>
          </div>
        </div>

        {report.memoryUsage && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">استخدام الذاكرة</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>المستخدمة</span>
                <span>{(report.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>النسبة</span>
                <Badge variant={report.memoryUsage.usedPercentage > 80 ? 'destructive' : 'secondary'}>
                  {report.memoryUsage.usedPercentage.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </div>
        )}

        {report.slowOperations.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">عمليات بطيئة</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {report.slowOperations.map((op: any, idx: number) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="truncate flex-1">{op.name}</span>
                  <Badge variant="destructive" className="ml-2">
                    {op.duration?.toFixed(2)}ms
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => {
              const json = JSON.stringify(report, null, 2);
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `performance-report-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4 mr-1" />
            تصدير
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              performanceMonitor.disconnect();
              setReport(null);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
