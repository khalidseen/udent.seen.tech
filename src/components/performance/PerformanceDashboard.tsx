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
  // تم نقل مراقبة الأداء إلى صفحة الإعدادات
  return null;
});

PerformanceDashboard.displayName = "PerformanceDashboard";
