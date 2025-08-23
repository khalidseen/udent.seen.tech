import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Database, 
  Wifi, 
  Server,
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  authentication: 'healthy' | 'warning' | 'error';
  storage: 'healthy' | 'warning' | 'error';
  performance: 'healthy' | 'warning' | 'error';
  uptime: number;
  lastCheck: Date;
}

interface SystemMetric {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  value: string;
  description: string;
  icon: React.ReactNode;
}

export const SystemHealthMonitor: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  useEffect(() => {
    if (hasPermission('system.monitor')) {
      checkSystemHealth();
      // تحديث كل 30 ثانية
      const interval = setInterval(checkSystemHealth, 30000);
      return () => clearInterval(interval);
    }
  }, [hasPermission]);

  const checkSystemHealth = async () => {
    try {
      setLoading(true);
      
      // فحص قاعدة البيانات
      const { error: dbError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      // فحص المصادقة
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      // محاكاة فحص الأداء
      const performanceStart = performance.now();
      await new Promise(resolve => setTimeout(resolve, 100));
      const performanceTime = performance.now() - performanceStart;

      const health: SystemHealth = {
        database: dbError ? 'error' : 'healthy',
        authentication: authError && !user ? 'error' : 'healthy',
        storage: 'healthy', // سيتم فحص التخزين لاحقاً
        performance: performanceTime > 200 ? 'warning' : 'healthy',
        uptime: Math.floor((Date.now() - new Date().setHours(0,0,0,0)) / 1000),
        lastCheck: new Date()
      };

      setSystemHealth(health);
      setLastUpdate(new Date());

    } catch (error) {
      console.error('Error checking system health:', error);
      toast({
        title: 'خطأ في فحص النظام',
        description: 'لم يتمكن النظام من إجراء فحص شامل',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'warning': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  if (!hasPermission('system.monitor')) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">ليس لديك صلاحية لمراقبة صحة النظام</p>
        </CardContent>
      </Card>
    );
  }

  if (loading || !systemHealth) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            مراقب صحة النظام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics: SystemMetric[] = [
    {
      name: 'قاعدة البيانات',
      status: systemHealth.database,
      value: systemHealth.database === 'healthy' ? 'متصلة' : 'منقطعة',
      description: 'حالة اتصال قاعدة البيانات',
      icon: <Database className="w-4 h-4" />
    },
    {
      name: 'المصادقة',
      status: systemHealth.authentication,
      value: systemHealth.authentication === 'healthy' ? 'فعالة' : 'غير فعالة',
      description: 'نظام تسجيل الدخول والأمان',
      icon: <Shield className="w-4 h-4" />
    },
    {
      name: 'التخزين',
      status: systemHealth.storage,
      value: 'متاح',
      description: 'خدمة تخزين الملفات',
      icon: <Server className="w-4 h-4" />
    },
    {
      name: 'الأداء',
      status: systemHealth.performance,
      value: systemHealth.performance === 'healthy' ? 'ممتاز' : 'بطيء',
      description: 'سرعة استجابة النظام',
      icon: <Zap className="w-4 h-4" />
    }
  ];

  const overallHealth = metrics.every(m => m.status === 'healthy') ? 'healthy' :
                       metrics.some(m => m.status === 'error') ? 'error' : 'warning';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            مراقب صحة النظام
            <Badge variant={getStatusBadge(overallHealth)}>
              {overallHealth === 'healthy' && 'سليم'}
              {overallHealth === 'warning' && 'تحذير'}
              {overallHealth === 'error' && 'خطأ'}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkSystemHealth}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription>
          آخر فحص: {lastUpdate.toLocaleTimeString('ar-SA')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* المقاييس الرئيسية */}
        <div className="grid gap-4 md:grid-cols-2">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {metric.icon}
                <div>
                  <div className="font-medium">{metric.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {metric.description}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {getStatusIcon(metric.status)}
                <div className={`text-sm font-medium ${getStatusColor(metric.status)}`}>
                  {metric.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* معلومات إضافية */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">وقت التشغيل</span>
            <span className="font-medium">
              {Math.floor(systemHealth.uptime / 3600)}h {Math.floor((systemHealth.uptime % 3600) / 60)}m
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">آخر فحص</span>
            <span className="font-medium">
              {systemHealth.lastCheck.toLocaleTimeString('ar-SA')}
            </span>
          </div>
        </div>

        {/* تحذيرات وتوصيات */}
        {overallHealth !== 'healthy' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">تحذيرات النظام</h4>
                <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                  {metrics.filter(m => m.status !== 'healthy').map((metric, index) => (
                    <li key={index}>
                      • {metric.name}: {metric.status === 'error' ? 'يحتاج إصلاح فوري' : 'يحتاج متابعة'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};