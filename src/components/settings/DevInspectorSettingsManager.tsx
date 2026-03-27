import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function DevInspectorSettingsManager() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Load initial state from localStorage
    const saved = localStorage.getItem('dev-inspector-show');
    setIsEnabled(saved === 'on');
  }, []);

  const handleToggle = (enabled: boolean) => {
    setIsEnabled(enabled);
    localStorage.setItem('dev-inspector-show', enabled ? 'on' : 'off');

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('devInspectorShowToggle', { detail: { show: enabled } }));
  };

  return (
    <Card data-dev-inspector="true">
      <CardHeader>
        <CardTitle>خريطة المكونات المرئية</CardTitle>
        <CardDescription>
          تفعيل أو إلغاء تفعيل زر الخريطة المرئية لمكونات التطبيق في أسفل يسار الشاشة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6 pt-0">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Switch
            id="dev-inspector"
            checked={isEnabled}
            onCheckedChange={handleToggle}
          />
          <Label htmlFor="dev-inspector">
            {isEnabled ? 'مفعل' : 'معطل'}
          </Label>
        </div>
        <p className="text-sm text-muted-foreground">
          عند التفعيل، سيظهر زر في أسفل يسار الشاشة يتيح لك رؤية خريطة مرئية لمكونات التطبيق
        </p>
      </CardContent>
    </Card>
  );
}
