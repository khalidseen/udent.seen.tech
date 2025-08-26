import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, User, Bell, Shield, Palette, Clock, Globe, Save, Database, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CacheManager } from "@/components/cache/CacheManager";
import { PermissionsManagement } from "@/components/settings/PermissionsManagement";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/contexts/SettingsContext";

export default function Settings() {
  const { t } = useLanguage();
  const { fontWeight, setFontWeight } = useSettings();
  const [clinicSettings, setClinicSettings] = useState({
    name: "عيادة الأسنان المتطورة",
    address: "شارع الملك فهد، الرياض",
    phone: "0112345678",
    email: "info@clinic.com",
    workingHours: "8:00 ص - 6:00 م",
    timezone: "Asia/Riyadh",
    currency: "SAR"
  });

  const [userSettings, setUserSettings] = useState({
    fullName: "د. أحمد محمد",
    email: "doctor@clinic.com",
    phone: "0501234567",
    specialization: "طب الأسنان العام"
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    appointmentReminders: true,
    stockAlerts: true,
    paymentAlerts: true,
    lowStockThreshold: 10
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: "30",
    passwordExpiry: "90"
  });

  const [appearance, setAppearance] = useState({
    theme: "system",
    language: "ar",
    compactMode: false,
    fontWeight: fontWeight
  });

  const handleSave = (section: string) => {
    toast.success(`تم حفظ إعدادات ${section} بنجاح`);
  };

  return (
    <PageContainer>
      <PageHeader
        title={t('common.settings')}
        description={t('settings.description')}
      />

      <Tabs defaultValue="clinic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="clinic" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            {t('settings.clinic')}
          </TabsTrigger>
          <TabsTrigger value="user" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            {t('settings.user')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            {t('settings.notifications')}
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {t('settings.security')}
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            {t('settings.appearance')}
          </TabsTrigger>
          <TabsTrigger value="cache" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            {t('settings.data')}
          </TabsTrigger>
          <PermissionGate permissions={["settings.permissions"]}>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('settings.permissions')}
            </TabsTrigger>
          </PermissionGate>
        </TabsList>

        {/* إعدادات العيادة */}
        <TabsContent value="clinic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                إعدادات العيادة
              </CardTitle>
              <CardDescription>
                إدارة المعلومات الأساسية للعيادة وساعات العمل
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinic-name">اسم العيادة</Label>
                  <Input 
                    id="clinic-name"
                    value={clinicSettings.name}
                    onChange={(e) => setClinicSettings({...clinicSettings, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic-phone">رقم الهاتف</Label>
                  <Input 
                    id="clinic-phone"
                    value={clinicSettings.phone}
                    onChange={(e) => setClinicSettings({...clinicSettings, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinic-address">العنوان</Label>
                <Textarea 
                  id="clinic-address"
                  value={clinicSettings.address}
                  onChange={(e) => setClinicSettings({...clinicSettings, address: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinic-email">البريد الإلكتروني</Label>
                  <Input 
                    id="clinic-email"
                    type="email"
                    value={clinicSettings.email}
                    onChange={(e) => setClinicSettings({...clinicSettings, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="working-hours">ساعات العمل</Label>
                  <Input 
                    id="working-hours"
                    value={clinicSettings.workingHours}
                    onChange={(e) => setClinicSettings({...clinicSettings, workingHours: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المنطقة الزمنية</Label>
                  <Select value={clinicSettings.timezone} onValueChange={(value) => setClinicSettings({...clinicSettings, timezone: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Riyadh">الرياض (GMT+3)</SelectItem>
                      <SelectItem value="Asia/Dubai">دبي (GMT+4)</SelectItem>
                      <SelectItem value="Asia/Kuwait">الكويت (GMT+3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>العملة</Label>
                  <Select value={clinicSettings.currency} onValueChange={(value) => setClinicSettings({...clinicSettings, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                      <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                      <SelectItem value="KWD">دينار كويتي (KWD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />
              <div className="flex justify-end">
                <Button onClick={() => handleSave('العيادة')}>
                  <Save className="w-4 h-4 mr-2" />
                  حفظ التغييرات
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* إعدادات المستخدم */}
        <TabsContent value="user">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                إعدادات المستخدم
              </CardTitle>
              <CardDescription>
                إدارة المعلومات الشخصية وبيانات الحساب
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">الاسم الكامل</Label>
                  <Input 
                    id="full-name"
                    value={userSettings.fullName}
                    onChange={(e) => setUserSettings({...userSettings, fullName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-email">البريد الإلكتروني</Label>
                  <Input 
                    id="user-email"
                    type="email"
                    value={userSettings.email}
                    onChange={(e) => setUserSettings({...userSettings, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-phone">رقم الهاتف</Label>
                  <Input 
                    id="user-phone"
                    value={userSettings.phone}
                    onChange={(e) => setUserSettings({...userSettings, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">التخصص</Label>
                  <Input 
                    id="specialization"
                    value={userSettings.specialization}
                    onChange={(e) => setUserSettings({...userSettings, specialization: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">تغيير كلمة المرور</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">كلمة المرور الحالية</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                </div>
              </div>

              <Separator />
              <div className="flex justify-end">
                <Button onClick={() => handleSave('المستخدم')}>
                  <Save className="w-4 h-4 mr-2" />
                  حفظ التغييرات
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* إعدادات الإشعارات */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                إعدادات الإشعارات
              </CardTitle>
              <CardDescription>
                إدارة التنبيهات والإشعارات المختلفة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تنبيهات البريد الإلكتروني</Label>
                    <p className="text-sm text-muted-foreground">
                      استقبال التنبيهات عبر البريد الإلكتروني
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.emailAlerts}
                    onCheckedChange={(checked) => setNotifications({...notifications, emailAlerts: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تنبيهات الرسائل النصية</Label>
                    <p className="text-sm text-muted-foreground">
                      استقبال التنبيهات عبر الرسائل النصية
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.smsAlerts}
                    onCheckedChange={(checked) => setNotifications({...notifications, smsAlerts: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تذكيرات المواعيد</Label>
                    <p className="text-sm text-muted-foreground">
                      إرسال تذكيرات للمرضى قبل مواعيدهم
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.appointmentReminders}
                    onCheckedChange={(checked) => setNotifications({...notifications, appointmentReminders: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تنبيهات المخزون</Label>
                    <p className="text-sm text-muted-foreground">
                      التنبيه عند انخفاض المخزون أو انتهاء الصلاحية
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.stockAlerts}
                    onCheckedChange={(checked) => setNotifications({...notifications, stockAlerts: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تنبيهات المدفوعات</Label>
                    <p className="text-sm text-muted-foreground">
                      التنبيه عند استلام مدفوعات أو فواتير متأخرة
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.paymentAlerts}
                    onCheckedChange={(checked) => setNotifications({...notifications, paymentAlerts: checked})}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">إعدادات التنبيهات</h3>
                <div className="space-y-2">
                  <Label htmlFor="low-stock">حد المخزون المنخفض</Label>
                  <Input 
                    id="low-stock"
                    type="number"
                    value={notifications.lowStockThreshold}
                    onChange={(e) => setNotifications({...notifications, lowStockThreshold: parseInt(e.target.value)})}
                    className="w-32"
                  />
                  <p className="text-sm text-muted-foreground">
                    سيتم إرسال تنبيه عندما يصل المخزون لهذا الحد
                  </p>
                </div>
              </div>

              <Separator />
              <div className="flex justify-end">
                <Button onClick={() => handleSave('الإشعارات')}>
                  <Save className="w-4 h-4 mr-2" />
                  حفظ التغييرات
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* إعدادات الأمان */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                إعدادات الأمان
              </CardTitle>
              <CardDescription>
                إدارة إعدادات الأمان والحماية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>المصادقة الثنائية</Label>
                    <p className="text-sm text-muted-foreground">
                      تفعيل طبقة حماية إضافية للحساب
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={security.twoFactorAuth ? "default" : "secondary"}>
                      {security.twoFactorAuth ? "مفعل" : "غير مفعل"}
                    </Badge>
                    <Switch 
                      checked={security.twoFactorAuth}
                      onCheckedChange={(checked) => setSecurity({...security, twoFactorAuth: checked})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>مهلة انتهاء الجلسة (بالدقائق)</Label>
                  <Select value={security.sessionTimeout} onValueChange={(value) => setSecurity({...security, sessionTimeout: value})}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 دقيقة</SelectItem>
                      <SelectItem value="30">30 دقيقة</SelectItem>
                      <SelectItem value="60">ساعة واحدة</SelectItem>
                      <SelectItem value="120">ساعتان</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>انتهاء صلاحية كلمة المرور (بالأيام)</Label>
                  <Select value={security.passwordExpiry} onValueChange={(value) => setSecurity({...security, passwordExpiry: value})}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 يوم</SelectItem>
                      <SelectItem value="60">60 يوم</SelectItem>
                      <SelectItem value="90">90 يوم</SelectItem>
                      <SelectItem value="never">بدون انتهاء</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">سجل النشاط</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-fit">
                    <Clock className="w-4 h-4 mr-2" />
                    عرض سجل تسجيل الدخول
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    عرض آخر محاولات تسجيل الدخول والأنشطة
                  </p>
                </div>
              </div>

              <Separator />
              <div className="flex justify-end">
                <Button onClick={() => handleSave('الأمان')}>
                  <Save className="w-4 h-4 mr-2" />
                  حفظ التغييرات
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* إعدادات المظهر */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                {t('settings.appearance')}
              </CardTitle>
              <CardDescription>
                {t('settings.appearanceDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('settings.theme')}</Label>
                  <Select value={appearance.theme} onValueChange={(value) => setAppearance({...appearance, theme: value})}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t('settings.light')}</SelectItem>
                      <SelectItem value="dark">{t('settings.dark')}</SelectItem>
                      <SelectItem value="system">{t('settings.system')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('settings.language')}</Label>
                  <Select value={appearance.language} onValueChange={(value) => setAppearance({...appearance, language: value})}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('settings.fontWeight')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.fontWeightDescription')}
                  </p>
                  <Select 
                    value={fontWeight} 
                    onValueChange={(value: 'normal' | 'bold') => {
                      setFontWeight(value);
                      setAppearance({...appearance, fontWeight: value});
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">{t('settings.normal')}</SelectItem>
                      <SelectItem value="bold">{t('settings.bold')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.compactMode')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.compactModeDescription')}
                    </p>
                  </div>
                  <Switch 
                    checked={appearance.compactMode}
                    onCheckedChange={(checked) => setAppearance({...appearance, compactMode: checked})}
                  />
                </div>
              </div>

              <Separator />
              <div className="flex justify-end">
                <Button onClick={() => handleSave(t('settings.appearance'))}>
                  <Save className="w-4 h-4 mr-2" />
                  {t('common.save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* إعدادات إدارة البيانات والكاش */}
        <TabsContent value="cache">
          <CacheManager />
        </TabsContent>

        {/* إدارة الصلاحيات والأدوار */}
        <PermissionGate permissions={["settings.permissions"]}>
          <TabsContent value="permissions">
            <PermissionsManagement />
          </TabsContent>
        </PermissionGate>
      </Tabs>
    </PageContainer>
  );
}