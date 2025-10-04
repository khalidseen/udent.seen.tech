import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, TrendingUp, AlertCircle, CheckCircle, XCircle, Clock, Code } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  is_active: boolean;
  last_used?: string;
  created_at: string;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  success_count: number;
  failure_count: number;
  created_at: string;
}

interface ApiLog {
  id: string;
  endpoint: string;
  method: string;
  status: number;
  response_time: number;
  ip_address: string;
  timestamp: string;
}

interface OverviewTabProps {
  apiKeys: ApiKey[];
  webhooks: Webhook[];
  apiLogs: ApiLog[];
  stats: {
    totalRequests: number;
    successRate: number;
    avgResponseTime: number;
    activeKeys: number;
    activeWebhooks: number;
  };
}

const OverviewTab: React.FC<OverviewTabProps> = ({ apiKeys, webhooks, apiLogs, stats }) => {
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-800';
      case 'POST': return 'bg-green-100 text-green-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Start Guide */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            البدء السريع مع التكاملات
          </CardTitle>
          <CardDescription>
            دليل سريع لبدء استخدام API والتكاملات في 3 خطوات بسيطة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 border-2 border-dashed rounded-lg bg-white hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <div className="text-lg font-semibold mb-2">أنشئ API Key</div>
              <p className="text-sm text-muted-foreground mb-4">
                ابدأ بإنشاء مفتاح API جديد من تبويب "API Keys" وحدد الصلاحيات المطلوبة
              </p>
              <Button variant="outline" size="sm" className="w-full">
                إنشاء مفتاح →
              </Button>
            </div>

            <div className="p-6 border-2 border-dashed rounded-lg bg-white hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <div className="text-lg font-semibold mb-2">اختبر الاتصال</div>
              <p className="text-sm text-muted-foreground mb-4">
                استخدم المفتاح لإجراء أول طلب API واختبر الاتصال
              </p>
              <Button variant="outline" size="sm" className="w-full">
                عرض التوثيق →
              </Button>
            </div>

            <div className="p-6 border-2 border-dashed rounded-lg bg-white hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <div className="text-lg font-semibold mb-2">أضف Webhooks</div>
              <p className="text-sm text-muted-foreground mb-4">
                قم بإعداد webhooks لاستقبال الإشعارات الفورية عن الأحداث
              </p>
              <Button variant="outline" size="sm" className="w-full">
                إضافة Webhook →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Alert className={stats.successRate >= 99 ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>حالة النظام</AlertTitle>
          <AlertDescription>
            النظام يعمل بشكل طبيعي - معدل نجاح {stats.successRate}%
          </AlertDescription>
        </Alert>

        <Alert className="border-blue-200 bg-blue-50">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertTitle>الأداء</AlertTitle>
          <AlertDescription>
            متوسط وقت الاستجابة: {stats.avgResponseTime}ms
          </AlertDescription>
        </Alert>

        <Alert className="border-purple-200 bg-purple-50">
          <Activity className="h-4 w-4 text-purple-600" />
          <AlertTitle>الاستخدام</AlertTitle>
          <AlertDescription>
            {stats.totalRequests.toLocaleString()} طلب في آخر 30 يوم
          </AlertDescription>
        </Alert>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              النشاط الأخير
            </CardTitle>
            <Button variant="ghost" size="sm">
              عرض الكل
            </Button>
          </div>
          <CardDescription>
            آخر 10 طلبات API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {apiLogs.slice(0, 10).map((log) => (
              <div 
                key={log.id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Badge className={getMethodColor(log.method)}>
                    {log.method}
                  </Badge>
                  <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {log.endpoint}
                  </code>
                  <Badge 
                    variant={log.status >= 200 && log.status < 300 ? "default" : "destructive"}
                    className={`ml-auto ${log.status >= 200 && log.status < 300 ? 'bg-green-100 text-green-800' : ''}`}
                  >
                    {log.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mr-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {log.response_time}ms
                  </span>
                  <span>{new Date(log.timestamp).toLocaleTimeString('ar-SA')}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              حالة API Keys
            </CardTitle>
            <CardDescription>
              {apiKeys.length} مفتاح إجمالاً - {apiKeys.filter(k => k.is_active).length} نشط
            </CardDescription>
          </CardHeader>
          <CardContent>
            {apiKeys.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  لم يتم إنشاء أي API Keys بعد
                </p>
                <Button size="sm">إنشاء أول مفتاح</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium mb-1">{key.name}</div>
                      <div className="text-xs text-muted-foreground">
                        آخر استخدام: {key.last_used ? new Date(key.last_used).toLocaleDateString('ar-SA') : 'لم يتم الاستخدام'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={key.is_active ? "default" : "secondary"}
                        className={`gap-1 ${key.is_active ? 'bg-green-100 text-green-800' : ''}`}
                      >
                        {key.is_active ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {key.is_active ? "نشط" : "معطل"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              حالة Webhooks
            </CardTitle>
            <CardDescription>
              {webhooks.length} webhook إجمالاً - {webhooks.filter(w => w.is_active).length} نشط
            </CardDescription>
          </CardHeader>
          <CardContent>
            {webhooks.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  لم يتم إضافة أي Webhooks بعد
                </p>
                <Button size="sm">إضافة أول webhook</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium mb-1">{webhook.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {webhook.success_count} ناجح • {webhook.failure_count} فشل
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={webhook.is_active ? "default" : "secondary"}
                        className={`gap-1 ${webhook.is_active ? 'bg-green-100 text-green-800' : ''}`}
                      >
                        {webhook.is_active ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {webhook.is_active ? "نشط" : "معطل"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle>روابط سريعة</CardTitle>
          <CardDescription>
            موارد مفيدة للبدء مع التكاملات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto flex-col gap-2 p-4">
              <Activity className="w-5 h-5" />
              <span className="text-sm">توثيق API</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 p-4">
              <Code className="w-5 h-5" />
              <span className="text-sm">أمثلة الكود</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 p-4">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm">حالة النظام</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 p-4">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">الدعم الفني</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;