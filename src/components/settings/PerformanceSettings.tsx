import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { performanceMonitor } from "@/lib/performance-monitor";
import { Activity, Zap, Database, Clock, Download, Trash2, AlertCircle } from "lucide-react";

interface PerformanceMetrics {
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    usedPercentage: number;
  } | null;
  renderCount: number;
  slowRenders: number;
  averageRenderTime: number;
  totalMeasurements: number;
  slowOperations: any[];
}

export function PerformanceSettings() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memory: null,
    renderCount: 0,
    slowRenders: 0,
    averageRenderTime: 0,
    totalMeasurements: 0,
    slowOperations: [],
  });

  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const updateMetrics = () => {
      const memory = performanceMonitor.getMemoryUsage();
      const fullReport = performanceMonitor.getPerformanceReport();

      setReport(fullReport);
      setMetrics({
        memory,
        renderCount: Object.keys(fullReport).length,
        slowRenders: Object.values(fullReport).filter((m: any) => m.avg > 500).length,
        averageRenderTime:
          Object.values(fullReport).reduce((acc: number, m: any) => acc + m.avg, 0) /
          Object.keys(fullReport).length || 0,
        totalMeasurements: fullReport.totalMeasurements || 0,
        slowOperations: fullReport.slowOperations || [],
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 2000);

    return () => clearInterval(interval);
  }, []);

  const getMemoryStatus = () => {
    if (!metrics.memory) return "غير متاح";
    if (metrics.memory.usedPercentage > 90) return "خطر";
    if (metrics.memory.usedPercentage > 70) return "تحذير";
    return "جيد";
  };

  const getMemoryColor = () => {
    if (!metrics.memory) return "secondary";
    if (metrics.memory.usedPercentage > 90) return "destructive";
    if (metrics.memory.usedPercentage > 70) return "default";
    return "default";
  };

  const handleExport = () => {
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    performanceMonitor.disconnect();
    setReport(null);
    setMetrics({
      memory: null,
      renderCount: 0,
      slowRenders: 0,
      averageRenderTime: 0,
      totalMeasurements: 0,
      slowOperations: [],
    });
  };

  if (process.env.NODE_ENV !== "development") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            مراقبة الأداء
          </CardTitle>
          <CardDescription>
            مراقبة أداء التطبيق والذاكرة المستخدمة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              مراقبة الأداء متاحة فقط في وضع التطوير
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            مراقبة الأداء
          </CardTitle>
          <CardDescription>
            مراقبة أداء التطبيق والذاكرة المستخدمة في الوقت الفعلي
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="outline">آخر تحديث: {new Date().toLocaleTimeString()}</Badge>
            <Badge variant="secondary">وضع التطوير</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Memory Usage */}
      {metrics.memory && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-4 w-4" />
              استهلاك الذاكرة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">الحالة</span>
              <Badge variant={getMemoryColor() as any}>
                {getMemoryStatus()}
              </Badge>
            </div>
            <Progress value={metrics.memory.usedPercentage} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>المستخدم: {(metrics.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB</span>
              <span>الإجمالي: {(metrics.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <div className="text-center text-lg font-bold">
              {metrics.memory.usedPercentage.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      )}

      {/* Render Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-4 w-4" />
            أداء الرندر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">عدد المكونات</p>
              <p className="text-2xl font-bold">{metrics.renderCount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">متوسط الوقت</p>
              <p className="text-2xl font-bold">{metrics.averageRenderTime.toFixed(2)}ms</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">عمليات بطيئة</span>
            </div>
            <Badge variant={metrics.slowRenders > 0 ? "destructive" : "default"}>
              {metrics.slowRenders}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Slow Operations */}
      {metrics.slowOperations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              العمليات البطيئة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {metrics.slowOperations.map((op: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-sm truncate flex-1">{op.name}</span>
                  <Badge variant="destructive" className="ml-2">
                    {op.duration?.toFixed(2)}ms
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">الإحصائيات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">إجمالي القياسات</p>
              <p className="text-xl font-bold">{metrics.totalMeasurements}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">العمليات البطيئة</p>
              <p className="text-xl font-bold">{metrics.slowOperations.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">الإجراءات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" className="flex-1">
              <Download className="h-4 w-4 ml-2" />
              تصدير التقرير
            </Button>
            <Button onClick={handleClear} variant="outline">
              <Trash2 className="h-4 w-4 ml-2" />
              مسح البيانات
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
