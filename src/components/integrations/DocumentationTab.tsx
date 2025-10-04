import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Book,
  Code,
  Copy,
  CheckCircle,
  Shield,
  Database,
  Activity,
  AlertCircle,
  Zap
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DocumentationTab: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock: React.FC<{ code: string; language: string; id: string }> = ({ code, language, id }) => (
    <div className="relative group">
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={() => copyToClipboard(code, id)}
      >
        {copiedCode === id ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
      <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );

  const curlExample = `curl -X GET "https://api.udent.com/v1/patients?page=1&limit=20" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`;

  const jsExample = `const response = await fetch('https://api.udent.com/v1/patients', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`;

  const pythonExample = `import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.udent.com/v1/patients',
    headers=headers
)

data = response.json()
print(data)`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Book className="w-6 h-6" />
          توثيق API
        </h3>
        <p className="text-muted-foreground mt-1">
          دليل شامل لاستخدام API وإعداد التكاملات
        </p>
      </div>

      {/* Quick Start */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            البدء السريع
          </CardTitle>
          <CardDescription>
            ابدأ في استخدام API في 3 خطوات بسيطة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-1">احصل على API Key</h4>
                <p className="text-sm text-muted-foreground">
                  من تبويب "API Keys"، أنشئ مفتاح جديد وحدد الصلاحيات المطلوبة
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-1">أضف المفتاح في Headers</h4>
                <p className="text-sm text-muted-foreground">
                  استخدم المفتاح في header Authorization مع كل طلب
                </p>
                <CodeBlock
                  id="auth-header"
                  language="bash"
                  code='Authorization: Bearer YOUR_API_KEY'
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-1">ابدأ في إرسال الطلبات</h4>
                <p className="text-sm text-muted-foreground">
                  استخدم base URL التالي لجميع طلبات API
                </p>
                <CodeBlock
                  id="base-url"
                  language="text"
                  code='https://api.udent.com/v1'
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            المصادقة (Authentication)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            جميع طلبات API تتطلب مصادقة باستخدام API key في header Authorization:
          </p>
          <CodeBlock
            id="auth-example"
            language="bash"
            code='Authorization: Bearer udent_key_abc123xyz456'
          />
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-2">
              <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <strong>تنبيه أمني:</strong> لا تشارك API key مع أحد ولا تقم بنشره في الأماكن العامة. 
                احفظه في متغيرات البيئة (environment variables) في تطبيقك.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            أمثلة الأكواد
          </CardTitle>
          <CardDescription>
            أمثلة عملية بلغات البرمجة المختلفة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="curl" dir="rtl">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
            </TabsList>
            <TabsContent value="curl" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                استخدم cURL لاختبار API من Terminal:
              </p>
              <CodeBlock id="curl-ex" language="bash" code={curlExample} />
            </TabsContent>
            <TabsContent value="javascript" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                مثال باستخدام Fetch API في JavaScript:
              </p>
              <CodeBlock id="js-ex" language="javascript" code={jsExample} />
            </TabsContent>
            <TabsContent value="python" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                مثال باستخدام مكتبة requests في Python:
              </p>
              <CodeBlock id="py-ex" language="python" code={pythonExample} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            نقاط النهاية الرئيسية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-blue-100 text-blue-800">GET</Badge>
                <code className="text-sm">/api/v1/patients</code>
              </div>
              <p className="text-sm text-muted-foreground">الحصول على قائمة المرضى</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-green-100 text-green-800">POST</Badge>
                <code className="text-sm">/api/v1/patients</code>
              </div>
              <p className="text-sm text-muted-foreground">إضافة مريض جديد</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-blue-100 text-blue-800">GET</Badge>
                <code className="text-sm">/api/v1/appointments</code>
              </div>
              <p className="text-sm text-muted-foreground">الحصول على المواعيد</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-green-100 text-green-800">POST</Badge>
                <code className="text-sm">/api/v1/appointments</code>
              </div>
              <p className="text-sm text-muted-foreground">حجز موعد جديد</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-blue-100 text-blue-800">GET</Badge>
                <code className="text-sm">/api/v1/invoices</code>
              </div>
              <p className="text-sm text-muted-foreground">الحصول على الفواتير</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Webhooks
          </CardTitle>
          <CardDescription>
            كيفية استقبال الإشعارات الفورية عن الأحداث
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            عند حدوث أي حدث تم تحديده في إعدادات webhook، سنرسل طلب POST إلى URL المحدد
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <Zap className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <strong>نصيحة:</strong> يجب أن يرد endpoint الخاص بك بـ 200 OK خلال 5 ثواني.
                إذا فشل الطلب، سنعيد المحاولة 3 مرات مع تأخير متزايد.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Codes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            رموز الأخطاء (Error Codes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Badge className="bg-yellow-100 text-yellow-800">400</Badge>
              <div>
                <div className="font-semibold">Bad Request</div>
                <div className="text-sm text-muted-foreground">
                  الطلب غير صحيح أو ناقص معاملات مطلوبة
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Badge className="bg-yellow-100 text-yellow-800">401</Badge>
              <div>
                <div className="font-semibold">Unauthorized</div>
                <div className="text-sm text-muted-foreground">
                  API key غير صحيح أو منتهي الصلاحية
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Badge className="bg-yellow-100 text-yellow-800">403</Badge>
              <div>
                <div className="font-semibold">Forbidden</div>
                <div className="text-sm text-muted-foreground">
                  لا تملك صلاحية الوصول لهذا المورد
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Badge className="bg-yellow-100 text-yellow-800">404</Badge>
              <div>
                <div className="font-semibold">Not Found</div>
                <div className="text-sm text-muted-foreground">
                  المورد المطلوب غير موجود
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Badge className="bg-red-100 text-red-800">429</Badge>
              <div>
                <div className="font-semibold">Too Many Requests</div>
                <div className="text-sm text-muted-foreground">
                  تجاوزت حد الطلبات المسموح به (Rate Limit)
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Badge className="bg-red-100 text-red-800">500</Badge>
              <div>
                <div className="font-semibold">Internal Server Error</div>
                <div className="text-sm text-muted-foreground">
                  خطأ في الخادم، حاول مرة أخرى لاحقاً
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentationTab;