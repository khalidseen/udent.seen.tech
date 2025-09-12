import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertCircle, Eye, EyeOff, Settings, Link, BarChart3 } from 'lucide-react';
import { validateDashboardCards, getUnusedRoutes } from '@/utils/dashboardValidation';
import { useSettings } from '@/hooks/useSettingsHook';

interface DashboardLinkValidationProps {
  cards: CardInfo[];
}

interface CardInfo {
  id?: string;
  title?: string;
  route?: string;
  validation?: {
    component?: string;
  } | null;
}

export const DashboardLinkValidation: React.FC<DashboardLinkValidationProps> = ({ cards }) => {
  const [showDetails, setShowDetails] = useState(false);
  const { linkValidationAlertEnabled, setLinkValidationAlertEnabled } = useSettings();
  
  const { valid, invalid, summary } = validateDashboardCards(cards);
  const unusedRoutes = getUnusedRoutes(cards);

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5 text-blue-500" />
              فحص صحة روابط لوحة التحكم
            </CardTitle>
            <CardDescription>
              التحقق من صحة ربط مربعات لوحة التحكم بالصفحات المتاحة
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={invalid.length > 0 ? "destructive" : "default"}>
              {summary}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2"
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* إعدادات التحكم */}
        <div className="p-4 bg-white rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="alert-toggle" className="text-sm font-medium">
                عرض تنبيه في لوحة التحكم عند وجود روابط خاطئة
              </Label>
              <p className="text-xs text-muted-foreground">
                عند التفعيل، سيظهر تنبيه في لوحة التحكم عندما تكون هناك روابط غير صحيحة
              </p>
            </div>
            <Switch
              id="alert-toggle"
              checked={linkValidationAlertEnabled}
              onCheckedChange={setLinkValidationAlertEnabled}
            />
          </div>
        </div>

        {/* الملخص السريع */}
        <div className="p-4 bg-white rounded-lg border">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            ملخص الحالة
          </h3>
          <div className="flex gap-4">
            <Badge variant="default" className="bg-green-100 text-green-800">
              ✅ صحيح: {valid.length}
            </Badge>
            <Badge variant="destructive">
              ❌ خاطئ: {invalid.length}
            </Badge>
            <Badge variant="secondary">
              📋 المجموع: {cards.length}
            </Badge>
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
              🔗 غير مستخدم: {unusedRoutes.length}
            </Badge>
          </div>
        </div>

        {/* التفاصيل الكاملة */}
        {showDetails && (
          <div className="space-y-4">
            {/* المربعات الصحيحة */}
            {valid.length > 0 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold mb-2 text-green-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  المربعات المرتبطة بشكل صحيح ({valid.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {valid.map((card, index) => (
                    <div key={index} className="text-sm p-2 bg-white rounded border">
                      <div className="font-medium">{card.title}</div>
                      <div className="text-gray-600">{card.route}</div>
                      <div className="text-xs text-green-600">
                        → {card.validation?.component}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* المربعات الخاطئة */}
            {invalid.length > 0 && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h3 className="font-semibold mb-2 text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  المربعات غير المرتبطة ({invalid.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {invalid.map((card, index) => (
                    <div key={index} className="text-sm p-2 bg-white rounded border border-red-200">
                      <div className="font-medium">{card.title}</div>
                      <div className="text-red-600">{card.route} ❌</div>
                      <div className="text-xs text-red-500">
                        هذا المسار غير موجود في التطبيق
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* المسارات غير المستخدمة */}
            {unusedRoutes.length > 0 && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h3 className="font-semibold mb-2 text-yellow-800">
                  📋 صفحات متاحة لم يتم إضافتها كمربعات ({unusedRoutes.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {unusedRoutes.slice(0, 8).map((route, index) => (
                    <div key={index} className="text-sm p-2 bg-white rounded border">
                      <div className="font-medium">{route.description}</div>
                      <div className="text-gray-600">{route.route}</div>
                      <div className="text-xs text-yellow-600">
                        → {route.component}
                      </div>
                    </div>
                  ))}
                  {unusedRoutes.length > 8 && (
                    <div className="text-sm p-2 bg-white rounded border text-center text-gray-500">
                      ... و {unusedRoutes.length - 8} صفحات أخرى
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* نصائح التحسين */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold mb-2 text-blue-800">💡 نصائح للتحسين</h3>
              <ul className="text-sm space-y-1 text-blue-700">
                <li>• تأكد من أن جميع المربعات مرتبطة بصفحات موجودة فعلاً</li>
                <li>• يمكنك إضافة مربعات للصفحات المتاحة التي لم يتم إضافتها بعد</li>
                <li>• استخدم زر التحرير لتصحيح المسارات الخاطئة</li>
                <li>• تحقق من وحدة التحكم (Console) لمزيد من التفاصيل</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
