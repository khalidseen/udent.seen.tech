import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ADMIN_ROLES } from '@/constants/roles';

export function VisualEditorSettingsManager() {
  const { user } = useCurrentUser();
  const [isEnabled, setIsEnabled] = useState(false);

  const canUse = user && ADMIN_ROLES.includes(user.role);

  useEffect(() => {
    const saved = localStorage.getItem('visualEditorEnabled');
    setIsEnabled(saved === 'true');
  }, []);

  const handleToggle = (enabled: boolean) => {
    setIsEnabled(enabled);
    localStorage.setItem('visualEditorEnabled', enabled.toString());
    window.dispatchEvent(new CustomEvent('visualEditorToggle', { detail: { enabled } }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>المحرر المرئي</CardTitle>
        <CardDescription>
          تفعيل أو إلغاء تفعيل المحرر المرئي لتعديل النصوص والصور مباشرة من الواجهة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Switch
            id="visual-editor"
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={!canUse}
          />
          <Label htmlFor="visual-editor">
            {isEnabled ? 'مفعل' : 'معطل'}
          </Label>
        </div>
        <p className="text-sm text-muted-foreground">
          عند التفعيل، سيظهر زر ✏️ في أسفل يسار الشاشة يتيح لك تحرير النصوص والصور مباشرة بالنقر عليها
        </p>
        {!canUse && (
          <p className="text-sm text-destructive">
            هذه الميزة متاحة فقط للمشرفين والمديرين
          </p>
        )}
        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
          <p className="text-xs font-semibold text-foreground">اختصارات لوحة المفاتيح:</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px] font-mono">Ctrl+Shift+E</kbd>
            <span>تفعيل / إلغاء تفعيل المحرر</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px] font-mono">Enter</kbd>
            <span>حفظ التعديل</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px] font-mono">Esc</kbd>
            <span>إلغاء التعديل</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
