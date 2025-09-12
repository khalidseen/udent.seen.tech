import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { validateDashboardCards, getUnusedRoutes } from '@/utils/dashboardValidation';
import { useSettings } from '@/hooks/useSettingsHook';
import { useEffect } from 'react';

interface DashboardValidatorProps {
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

export const DashboardValidator: React.FC<DashboardValidatorProps> = ({ cards }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { linkValidationAlertEnabled, setDashboardDismissedServer } = useSettings();
  const [dismissedOnDashboard, setDismissedOnDashboard] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('dashboard_link_validation_dismissed');
      return v ? JSON.parse(v) : false;
    } catch {
      return false;
    }
  });
  // Prefer server-side dismissal flag when available
  const [serverDismissLoaded, setServerDismissLoaded] = useState(false);

  useEffect(() => {
    // Try to read server-stored flag from localStorage (SettingsProvider mirrors it there)
    try {
      const v = localStorage.getItem('dashboard_link_validation_dismissed');
      if (v !== null) {
        setDismissedOnDashboard(JSON.parse(v));
      }
    } catch {
      // ignore
    }
    setServerDismissLoaded(true);
  }, []);
  
  const { valid, invalid, summary } = validateDashboardCards(cards);
  const unusedRoutes = getUnusedRoutes(cards);

  // If there are no invalid links, show the compact card (unless dismissed permanently)
  if (!isVisible) {
    // If there are invalid links and the settings toggle is enabled and not dismissed, show the alert badge
    if (invalid.length > 0 && linkValidationAlertEnabled && !dismissedOnDashboard) {
      return (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="font-medium">تحذير: روابط خاطئة في لوحة القيادة</span>
                <Badge variant="destructive">{summary}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsVisible(true)} className="flex items-center gap-2">
                  <Eye className="w-4 h-4" /> عرض التفاصيل
                </Button>
                <Button variant="ghost" size="sm" onClick={async () => {
                  // استخدام helper من SettingsContext لحفظ العلم
                  if (setDashboardDismissedServer) {
                    await setDashboardDismissedServer(true);
                  } else {
                    // fallback إذا لم تكن الدالة متوفرة
                    localStorage.setItem('dashboard_link_validation_dismissed', 'true');
                  }
                  setDismissedOnDashboard(true);
                }}>
                  إخفاء من لوحة التحكم
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Default compact view when either no invalids or alerts disabled/dismissed
    return (
      <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium">فحص صحة الربط</span>
              <Badge variant={invalid.length > 0 ? "destructive" : "default"}>{summary}</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(true)}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              عرض التفاصيل
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              تقرير فحص مربعات لوحة التحكم
            </CardTitle>
            <CardDescription>
              التحقق من صحة ربط المربعات بالصفحات المتاحة
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="flex items-center gap-2"
          >
            <EyeOff className="w-4 h-4" />
            إخفاء
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* الملخص */}
        <div className="p-4 bg-white rounded-lg border">
          <h3 className="font-semibold mb-2">📊 ملخص الحالة</h3>
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
          </div>
        </div>

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
                    → {card.validation.component}
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
      </CardContent>
    </Card>
  );
};
