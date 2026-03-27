import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useSettings } from "@/hooks/useSettingsHook";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Monitor, Moon, Sun, Languages, Type, Layout, Grid, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InterfaceSettings() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const {
    fontWeight,
    setFontWeight,
    navFontSize,
    setNavFontSize,
    sidebarIconSize,
    setSidebarIconSize,
    collapsedIconSize,
    setCollapsedIconSize,
    showDashboardBoxes,
    setShowDashboardBoxes,
    boxesPerRow,
    setBoxesPerRow,
    boxSize,
    setBoxSize,
    linkValidationAlertEnabled,
    setLinkValidationAlertEnabled,
    timeFormat,
    setTimeFormat,
  } = useSettings();

  const isAr = language === 'ar';

  return (
    <div className="space-y-6">
      {/* إعدادات اللغة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            {isAr ? 'اللغة' : 'Language'}
          </CardTitle>
          <CardDescription>
            {isAr ? 'اختر لغة واجهة النظام' : 'Choose the system interface language'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{isAr ? 'لغة الواجهة' : 'Interface Language'}</Label>
            <Select value={language} onValueChange={(val) => setLanguage(val as 'ar' | 'en')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">
                  <div className="flex items-center gap-2">
                    <span>🇸🇦</span>
                    العربية
                  </div>
                </SelectItem>
                <SelectItem value="en">
                  <div className="flex items-center gap-2">
                    <span>🇺🇸</span>
                    English
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{isAr ? 'حجم خط القائمة والمربعات' : 'Sidebar and Tiles Font Size'}</Label>
            <Select value={navFontSize} onValueChange={(val) => setNavFontSize(val as 'small' | 'medium' | 'large')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">{isAr ? 'صغير' : 'Small'}</SelectItem>
                <SelectItem value="medium">{isAr ? 'متوسط' : 'Medium'}</SelectItem>
                <SelectItem value="large">{isAr ? 'كبير' : 'Large'}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {isAr
                ? 'يتم تطبيق نفس حجم الخط على عناصر القائمة الجانبية ومربعات لوحة التحكم.'
                : 'Applies the same font size to sidebar items and dashboard tiles.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* إعدادات الوقت */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {isAr ? 'تنسيق الوقت' : 'Time Format'}
          </CardTitle>
          <CardDescription>
            {isAr ? 'اختر طريقة عرض الوقت في النظام' : 'Choose how time is displayed in the system'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{isAr ? 'نظام الوقت' : 'Time System'}</Label>
            <Select value={timeFormat} onValueChange={(val) => setTimeFormat(val as '12' | '24')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">
                  {isAr ? '12 ساعة (صباحاً/مساءً)' : '12-hour (AM/PM)'}
                </SelectItem>
                <SelectItem value="24">
                  {isAr ? '24 ساعة' : '24-hour'}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {isAr
                ? `مثال: ${new Date().toLocaleTimeString(language === 'ar' ? 'ar-IQ' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: timeFormat === '12' })}`
                : `Example: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: timeFormat === '12' })}`
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* إعدادات المظهر */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            {isAr ? 'إعدادات المظهر' : 'Appearance Settings'}
          </CardTitle>
          <CardDescription>
            {isAr ? 'تخصيص مظهر واجهة النظام' : 'Customize the system interface appearance'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{isAr ? 'السمة' : 'Theme'}</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    {isAr ? 'فاتح' : 'Light'}
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    {isAr ? 'داكن' : 'Dark'}
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    {isAr ? 'تلقائي' : 'System'}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              {isAr ? 'سماكة الخط' : 'Font Weight'}
            </Label>
            <Select value={fontWeight} onValueChange={setFontWeight}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">{isAr ? 'عادي' : 'Normal'}</SelectItem>
                <SelectItem value="bold">{isAr ? 'عريض' : 'Bold'}</SelectItem>
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
            {isAr ? 'إعدادات الشريط الجانبي' : 'Sidebar Settings'}
          </CardTitle>
          <CardDescription>
            {isAr ? 'تخصيص مظهر وسلوك الشريط الجانبي' : 'Customize sidebar appearance and behavior'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{isAr ? 'حجم أيقونات الشريط الجانبي' : 'Sidebar Icon Size'}</Label>
            <Select value={sidebarIconSize} onValueChange={setSidebarIconSize}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">{isAr ? 'صغير' : 'Small'}</SelectItem>
                <SelectItem value="medium">{isAr ? 'متوسط' : 'Medium'}</SelectItem>
                <SelectItem value="large">{isAr ? 'كبير' : 'Large'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{isAr ? 'حجم الأيقونات عند الطي' : 'Collapsed Icon Size'}</Label>
            <Select value={collapsedIconSize} onValueChange={setCollapsedIconSize}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">{isAr ? 'صغير' : 'Small'}</SelectItem>
                <SelectItem value="medium">{isAr ? 'متوسط' : 'Medium'}</SelectItem>
                <SelectItem value="large">{isAr ? 'كبير' : 'Large'}</SelectItem>
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
            {isAr ? 'إعدادات لوحة القيادة' : 'Dashboard Settings'}
          </CardTitle>
          <CardDescription>
            {isAr ? 'تخصيص عرض البيانات في لوحة القيادة' : 'Customize data display in the dashboard'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>{isAr ? 'إظهار صناديق لوحة القيادة' : 'Show Dashboard Boxes'}</Label>
              <p className="text-sm text-muted-foreground">
                {isAr ? 'عرض الإحصائيات في شكل صناديق' : 'Display statistics as boxes'}
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
                <Label>{isAr ? `عدد الصناديق في الصف: ${boxesPerRow}` : `Boxes per row: ${boxesPerRow}`}</Label>
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
                <Label>{isAr ? `حجم الصناديق: ${boxSize}px` : `Box size: ${boxSize}px`}</Label>
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
              <Label>{isAr ? 'تنبيه فحص صحة الربط في لوحة القيادة' : 'Dashboard Link Health Alert'}</Label>
              <p className="text-sm text-muted-foreground">
                {isAr
                  ? 'إظهار تنبيه في الإعدادات فقط عندما يوجد رابط خاطئ. يمكن إلغاؤه من لوحة التحكم.'
                  : 'Show alert in settings only when broken links exist. Can be dismissed from dashboard.'}
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
                window.location.reload();
              }}
            >
              {isAr ? 'إعادة إظهار تحذيرات لوحة التحكم' : 'Reset Dashboard Warnings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
