import { memo, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { performanceMonitor } from "@/lib/performance-monitor";
import { Activity, Zap, Database, Clock } from "lucide-react";

interface PerformanceMetrics {
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    usedPercentage: number;
  } | null;
  renderCount: number;
  slowRenders: number;
  averageRenderTime: number;
}

export const PerformanceDashboard = memo(() => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memory: null,
    renderCount: 0,
    slowRenders: 0,
    averageRenderTime: 0,
  });

  useEffect(() => {
    const updateMetrics = () => {
      const memory = performanceMonitor.getMemoryUsage();
      const report = performanceMonitor.getPerformanceReport();

      setMetrics({
        memory,
        renderCount: Object.keys(report).length,
        slowRenders: Object.values(report).filter((m: any) => m.avg > 500).length,
        averageRenderTime:
          Object.values(report).reduce((acc: number, m: any) => acc + m.avg, 0) /
          Object.keys(report).length || 0,
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

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
    if (metrics.memory.usedPercentage > 70) return "secondary";
    return "default";
  };

  if (process.env.NODE_ENV !== "development") {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80 space-y-2">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            مراقبة الأداء
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Memory Usage */}
          {metrics.memory && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Database className="h-3 w-3" />
                  <span>استهلاك الذاكرة</span>
                </div>
                <Badge variant={getMemoryColor() as any}>
                  {getMemoryStatus()}
                </Badge>
              </div>
              <Progress value={metrics.memory.usedPercentage} />
              <p className="text-xs text-muted-foreground">
                {(metrics.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB /{" "}
                {(metrics.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          {/* Render Performance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3" />
                <span>أداء الرندر</span>
              </div>
              <Badge variant={metrics.slowRenders > 0 ? "destructive" : "default"}>
                {metrics.slowRenders} بطيء
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>عدد المكونات:</span>
                <span className="font-medium">{metrics.renderCount}</span>
              </div>
              <div className="flex justify-between">
                <span>متوسط الوقت:</span>
                <span className="font-medium">
                  {metrics.averageRenderTime.toFixed(2)}ms
                </span>
              </div>
            </div>
          </div>

          {/* Performance Tips */}
          {metrics.slowRenders > 0 && (
            <div className="p-2 bg-destructive/10 rounded-md">
              <div className="flex items-start gap-2">
                <Clock className="h-3 w-3 mt-0.5 text-destructive" />
                <p className="text-xs text-destructive">
                  تم اكتشاف عمليات رندر بطيئة. استخدم React.memo أو تحقق من
                  Dependencies.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

PerformanceDashboard.displayName = "PerformanceDashboard";
