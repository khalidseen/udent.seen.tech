import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useSettings } from "@/hooks/useSettingsHook";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Monitor, Moon, Sun, Languages, Type, Layout, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InterfaceSettings() {
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const {
    fontWeight,
    setFontWeight,
    sidebarIconSize,
    setSidebarIconSize,
    collapsedIconSize,
    setCollapsedIconSize,
    showDashboardBoxes,
    setShowDashboardBoxes,
    boxesPerRow,
    setBoxesPerRow,
    boxSize,
    setBoxSize
  ,
  linkValidationAlertEnabled,
  setLinkValidationAlertEnabled
  } = useSettings();

  return (
    <div className="space-y-6">
      {/* إعدادات المظهر */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            إعدادات المظهر
          </CardTitle>
          <CardDescription>
            تخصيص مظهر واجهة النظام
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>السمة</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    فاتح
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    داكن
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    تلقائي
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              سماكة الخط
            </Label>
            <Select value={fontWeight} onValueChange={setFontWeight}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">عادي</SelectItem>
                <SelectItem value="bold">عريض</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* إعدادات الشريط الجانبي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            إعدادات الشريط الجانبي
          </CardTitle>
          <CardDescription>
            تخصيص مظهر وسلوك الشريط الجانبي
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>حجم أيقونات الشريط الجانبي</Label>
            <Select value={sidebarIconSize} onValueChange={setSidebarIconSize}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">صغير</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="large">كبير</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>حجم الأيقونات عند الطي</Label>
            <Select value={collapsedIconSize} onValueChange={setCollapsedIconSize}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">صغير</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="large">كبير</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* إعدادات لوحة القيادة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid className="h-5 w-5" />
            إعدادات لوحة القيادة
          </CardTitle>
          <CardDescription>
            تخصيص عرض البيانات في لوحة القيادة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>إظهار صناديق لوحة القيادة</Label>
              <p className="text-sm text-muted-foreground">
                عرض الإحصائيات في شكل صناديق
              </p>
            </div>
            <Switch
              checked={showDashboardBoxes}
              onCheckedChange={setShowDashboardBoxes}
            />
          </div>

          {showDashboardBoxes && (
            <>
              <div className="space-y-2">
                <Label>عدد الصناديق في الصف: {boxesPerRow}</Label>
                <Slider
                  value={[boxesPerRow]}
                  onValueChange={([value]) => setBoxesPerRow(value)}
                  max={6}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>حجم الصناديق: {boxSize}px</Label>
                <Slider
                  value={[boxSize]}
                  onValueChange={([value]) => setBoxSize(value)}
                  max={300}
                  min={150}
                  step={10}
                  className="w-full"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>تنبيه فحص صحة الربط في لوحة القيادة</Label>
              <p className="text-sm text-muted-foreground">
                إظهار تنبيه في الإعدادات فقط عندما يوجد رابط خاطئ. يمكن إلغاؤه من لوحة التحكم.
              </p>
            </div>
            <Switch
              checked={linkValidationAlertEnabled}
              onCheckedChange={setLinkValidationAlertEnabled}
            />
          </div>
          <div className="flex items-center justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem('dashboard_link_validation_dismissed');
                // Force a small reload to ensure dashboard reads the change
                window.location.reload();
              }}
            >
              إعادة إظهار تحذيرات لوحة التحكم
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}