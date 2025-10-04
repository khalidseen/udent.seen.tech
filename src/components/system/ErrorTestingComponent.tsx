/**
 * Error Testing Component
 * 
 * مكون لاختبار نظام تتبع الأخطاء (Sentry)
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bug, 
  AlertTriangle, 
  Info, 
  Zap, 
  Network, 
  Users,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { 
  captureError, 
  captureMessage, 
  setUser, 
  clearUser,
  addBreadcrumb,
  trackApiCall,
  trackUserAction,
  isMonitoringEnabled,
  getCurrentSession
} from '@/services/monitoring';
import { useToast } from '@/hooks/use-toast';

export const ErrorTestingComponent = () => {
  const { toast } = useToast();
  const [sessionInfo, setSessionInfo] = useState(getCurrentSession());
  const enabled = isMonitoringEnabled();

  const testError = () => {
    try {
      throw new Error('هذا خطأ تجريبي لاختبار Sentry');
    } catch (error) {
      if (error instanceof Error) {
        const eventId = captureError(error, {
          level: 'error',
          tags: {
            test: 'true',
            component: 'ErrorTestingComponent',
          },
          extra: {
            description: 'تجربة إرسال خطأ إلى Sentry',
            timestamp: new Date().toISOString(),
          },
        });

        toast({
          title: "تم إرسال الخطأ إلى Sentry",
          description: `Event ID: ${eventId}`,
        });
      }
    }
  };

  const testWarning = () => {
    const eventId = captureMessage('هذا تحذير تجريبي', 'warning', {
      tags: { test: 'true' },
    });

    toast({
      title: "تم إرسال التحذير",
      description: `Event ID: ${eventId}`,
      variant: 'default',
    });
  };

  const testInfo = () => {
    const eventId = captureMessage('هذه رسالة معلوماتية', 'info', {
      tags: { test: 'true' },
    });

    toast({
      title: "تم إرسال الرسالة",
      description: `Event ID: ${eventId}`,
    });
  };

  const testSetUser = () => {
    setUser({
      id: '123',
      email: 'test@udent.com',
      username: 'Dr. Test',
      clinicId: 'clinic-456',
      role: 'doctor',
    });

    setSessionInfo(getCurrentSession());

    toast({
      title: "تم تعيين معلومات المستخدم",
      description: "سيتم إرفاق معلومات المستخدم مع جميع الأخطاء",
    });
  };

  const testClearUser = () => {
    clearUser();
    setSessionInfo(getCurrentSession());

    toast({
      title: "تم مسح معلومات المستخدم",
    });
  };

  const testBreadcrumb = () => {
    addBreadcrumb({
      message: 'المستخدم ضغط على زر الاختبار',
      category: 'user-action',
      level: 'info',
      data: {
        button: 'test-breadcrumb',
        timestamp: new Date().toISOString(),
      },
    });

    toast({
      title: "تم إضافة Breadcrumb",
      description: "سيظهر في سياق الأخطاء التالية",
    });
  };

  const testApiCall = () => {
    trackApiCall(
      '/api/patients',
      'GET',
      200,
      150
    );

    toast({
      title: "تم تتبع API Call",
      description: "تم تسجيل طلب API ناجح",
    });
  };

  const testUserAction = () => {
    trackUserAction(
      'نقر على زر الاختبار',
      'testing',
      {
        page: 'error-testing',
        timestamp: new Date().toISOString(),
      }
    );

    toast({
      title: "تم تتبع عملية المستخدم",
    });
  };

  const testComponentError = () => {
    // هذا سيسبب خطأ في React
    throw new Error('خطأ React تجريبي - سيتم التقاطه بواسطة Error Boundary');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">اختبار نظام تتبع الأخطاء</h2>
          <p className="text-muted-foreground mt-1">
            استخدم هذه الأدوات لاختبار Sentry وتتبع الأخطاء
          </p>
        </div>
        
        <Badge variant={enabled ? 'default' : 'destructive'} className="text-sm">
          {enabled ? '✅ Sentry مفعّل' : '❌ Sentry معطّل'}
        </Badge>
      </div>

      {!enabled && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="text-yellow-600 dark:text-yellow-500">
              ⚠️ Sentry غير مفعّل
            </CardTitle>
            <CardDescription>
              لتفعيل Sentry، أضف VITE_SENTRY_DSN إلى ملف .env
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* معلومات الجلسة */}
      {enabled && sessionInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              معلومات الجلسة الحالية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessionInfo.sessionId && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Session ID:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {sessionInfo.sessionId}
                </code>
              </div>
            )}
            {sessionInfo.user?.id && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">User ID:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {sessionInfo.user.id}
                </code>
              </div>
            )}
            {sessionInfo.user?.email && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {sessionInfo.user.email}
                </code>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* اختبار الأخطاء */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            اختبار الأخطاء
          </CardTitle>
          <CardDescription>
            اختبر أنواع مختلفة من الأخطاء والرسائل
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Button onClick={testError} variant="destructive" className="w-full">
            <Bug className="w-4 h-4 ml-2" />
            خطأ Error
          </Button>

          <Button onClick={testWarning} variant="outline" className="w-full">
            <AlertTriangle className="w-4 h-4 ml-2" />
            تحذير Warning
          </Button>

          <Button onClick={testInfo} variant="outline" className="w-full">
            <Info className="w-4 h-4 ml-2" />
            معلومة Info
          </Button>

          <Button onClick={testComponentError} variant="destructive" className="w-full">
            <Zap className="w-4 h-4 ml-2" />
            خطأ React
          </Button>
        </CardContent>
      </Card>

      {/* اختبار السياق */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            اختبار السياق (Context)
          </CardTitle>
          <CardDescription>
            إضافة معلومات إضافية للأخطاء
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button onClick={testSetUser} variant="outline" className="w-full">
            <Users className="w-4 h-4 ml-2" />
            تعيين مستخدم
          </Button>

          <Button onClick={testClearUser} variant="outline" className="w-full">
            <Users className="w-4 h-4 ml-2" />
            مسح مستخدم
          </Button>

          <Button onClick={testBreadcrumb} variant="outline" className="w-full">
            <CheckCircle2 className="w-4 h-4 ml-2" />
            إضافة Breadcrumb
          </Button>
        </CardContent>
      </Card>

      {/* اختبار التتبع */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            اختبار التتبع (Tracking)
          </CardTitle>
          <CardDescription>
            تتبع العمليات والـ API calls
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button onClick={testApiCall} variant="outline" className="w-full">
            <Network className="w-4 h-4 ml-2" />
            تتبع API Call
          </Button>

          <Button onClick={testUserAction} variant="outline" className="w-full">
            <Activity className="w-4 h-4 ml-2" />
            تتبع عملية مستخدم
          </Button>
        </CardContent>
      </Card>

      {/* معلومات */}
      <Card>
        <CardHeader>
          <CardTitle>💡 نصائح</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• جميع الأخطاء سيتم إرسالها إلى Sentry تلقائياً</p>
          <p>• استخدم Breadcrumbs لتتبع سياق الأخطاء</p>
          <p>• معلومات المستخدم تساعد في فهم من واجه المشكلة</p>
          <p>• في بيئة الإنتاج، يتم تتبع 20% من الطلبات فقط</p>
          <p>• Session Replay متاح لإعادة مشاهدة ما حدث قبل الخطأ</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorTestingComponent;
