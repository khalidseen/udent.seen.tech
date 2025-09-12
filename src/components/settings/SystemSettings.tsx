import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Database, 
  Clock, 
  HardDrive, 
  Network, 
  Key,
  Bell,
  Mail,
  RefreshCw,
  Download,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

export function SystemSettings() {
  const [systemSettings, setSystemSettings] = useState({
    sessionTimeout: 30,
    autoSaveInterval: 5,
    maxFileSize: 10,
    enableAuditLog: true,
    enableAutoBackup: true,
    backupFrequency: "daily",
    enableNotifications: true,
    enableEmailAlerts: true,
    enableSMSAlerts: false,
    maxLoginAttempts: 3,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
      maxAge: 90
    },
    maintenanceMode: false,
    debugMode: false
  });

  const [backupStatus, setBackupStatus] = useState({
    lastBackup: "2024-08-30 15:30:00",
    backupSize: "150 MB",
    status: "success"
  });



  const handleSave = () => {
    toast.success("تم حفظ إعدادات النظام بنجاح");
  };

  const handleBackupNow = () => {
    toast.info("جاري إنشاء نسخة احتياطية...");
    // محاكاة عملية النسخ الاحتياطي
    setTimeout(() => {
      setBackupStatus({
        lastBackup: new Date().toLocaleString('ar-SA'),
        backupSize: "152 MB",
        status: "success"
      });
      toast.success("تم إنشاء النسخة الاحتياطية بنجاح");
    }, 3000);
  };

  const handleClearCache = () => {
    toast.success("تم مسح ذاكرة التخزين المؤقت");
  };

  return (
    <div className="space-y-6">
      {/* إعدادات الأمان */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            إعدادات الأمان
          </CardTitle>
          <CardDescription>
            إعدادات الحماية والأمان للنظام
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>انتهاء جلسة العمل (دقيقة)</Label>
              <div className="space-y-2">
                <Slider
                  value={[systemSettings.sessionTimeout]}
                  onValueChange={([value]) => setSystemSettings(prev => ({ ...prev, sessionTimeout: value }))}
                  max={120}
                  min={5}
                  step={5}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">{systemSettings.sessionTimeout} دقيقة</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>عدد محاولات تسجيل الدخول المسموحة</Label>
              <Input
                type="number"
                value={systemSettings.maxLoginAttempts}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                min={1}
                max={10}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>تسجيل العمليات</Label>
                <p className="text-sm text-muted-foreground">تسجيل جميع عمليات النظام</p>
              </div>
              <Switch
                checked={systemSettings.enableAuditLog}
                onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, enableAuditLog: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>وضع الصيانة</Label>
                <p className="text-sm text-muted-foreground">إيقاف النظام مؤقتاً للصيانة</p>
              </div>
              <Switch
                checked={systemSettings.maintenanceMode}
                onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, maintenanceMode: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* سياسة كلمات المرور */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            سياسة كلمات المرور
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>الحد الأدنى لطول كلمة المرور</Label>
              <Input
                type="number"
                value={systemSettings.passwordPolicy.minLength}
                onChange={(e) => setSystemSettings(prev => ({
                  ...prev,
                  passwordPolicy: { ...prev.passwordPolicy, minLength: parseInt(e.target.value) }
                }))}
                min={6}
                max={32}
              />
            </div>

            <div className="space-y-2">
              <Label>صالحية كلمة المرور (يوم)</Label>
              <Input
                type="number"
                value={systemSettings.passwordPolicy.maxAge}
                onChange={(e) => setSystemSettings(prev => ({
                  ...prev,
                  passwordPolicy: { ...prev.passwordPolicy, maxAge: parseInt(e.target.value) }
                }))}
                min={30}
                max={365}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">أحرف كبيرة</Label>
              <Switch
                checked={systemSettings.passwordPolicy.requireUppercase}
                onCheckedChange={(checked) => setSystemSettings(prev => ({
                  ...prev,
                  passwordPolicy: { ...prev.passwordPolicy, requireUppercase: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">أحرف صغيرة</Label>
              <Switch
                checked={systemSettings.passwordPolicy.requireLowercase}
                onCheckedChange={(checked) => setSystemSettings(prev => ({
                  ...prev,
                  passwordPolicy: { ...prev.passwordPolicy, requireLowercase: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">أرقام</Label>
              <Switch
                checked={systemSettings.passwordPolicy.requireNumbers}
                onCheckedChange={(checked) => setSystemSettings(prev => ({
                  ...prev,
                  passwordPolicy: { ...prev.passwordPolicy, requireNumbers: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">رموز خاصة</Label>
              <Switch
                checked={systemSettings.passwordPolicy.requireSymbols}
                onCheckedChange={(checked) => setSystemSettings(prev => ({
                  ...prev,
                  passwordPolicy: { ...prev.passwordPolicy, requireSymbols: checked }
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* النسخ الاحتياطي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            النسخ الاحتياطي
          </CardTitle>
          <CardDescription>
            إدارة النسخ الاحتياطية للبيانات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>تفعيل النسخ الاحتياطي التلقائي</Label>
              <p className="text-sm text-muted-foreground">إنشاء نسخ احتياطية بشكل تلقائي</p>
            </div>
            <Switch
              checked={systemSettings.enableAutoBackup}
              onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, enableAutoBackup: checked }))}
            />
          </div>

          {systemSettings.enableAutoBackup && (
            <div className="space-y-2">
              <Label>تكرار النسخ الاحتياطي</Label>
              <Select 
                value={systemSettings.backupFrequency} 
                onValueChange={(value) => setSystemSettings(prev => ({ ...prev, backupFrequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">كل ساعة</SelectItem>
                  <SelectItem value="daily">يومياً</SelectItem>
                  <SelectItem value="weekly">أسبوعياً</SelectItem>
                  <SelectItem value="monthly">شهرياً</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">حالة آخر نسخة احتياطية</h4>
              <Badge variant={backupStatus.status === "success" ? "default" : "destructive"}>
                {backupStatus.status === "success" ? "نجحت" : "فشلت"}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>التاريخ: {backupStatus.lastBackup}</p>
              <p>الحجم: {backupStatus.backupSize}</p>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleBackupNow}>
                <Download className="h-4 w-4 ml-2" />
                إنشاء نسخة احتياطية الآن
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إعدادات الإشعارات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            إعدادات الإشعارات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>الإشعارات العامة</Label>
                <p className="text-sm text-muted-foreground">إشعارات النظام</p>
              </div>
              <Switch
                checked={systemSettings.enableNotifications}
                onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, enableNotifications: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>تنبيهات البريد الإلكتروني</Label>
                <p className="text-sm text-muted-foreground">إرسال عبر الإيميل</p>
              </div>
              <Switch
                checked={systemSettings.enableEmailAlerts}
                onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, enableEmailAlerts: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>تنبيهات الرسائل النصية</Label>
                <p className="text-sm text-muted-foreground">إرسال عبر SMS</p>
              </div>
              <Switch
                checked={systemSettings.enableSMSAlerts}
                onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, enableSMSAlerts: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>



      {/* إعدادات الأداء */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            إعدادات الأداء
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>فترة الحفظ التلقائي (دقيقة)</Label>
              <div className="space-y-2">
                <Slider
                  value={[systemSettings.autoSaveInterval]}
                  onValueChange={([value]) => setSystemSettings(prev => ({ ...prev, autoSaveInterval: value }))}
                  max={30}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">{systemSettings.autoSaveInterval} دقيقة</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>الحد الأقصى لحجم الملف (MB)</Label>
              <Input
                type="number"
                value={systemSettings.maxFileSize}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) }))}
                min={1}
                max={100}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClearCache}>
              <Trash2 className="h-4 w-4 ml-2" />
              مسح ذاكرة التخزين المؤقت
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* منطقة الخطر */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            منطقة الخطر
          </CardTitle>
          <CardDescription>
            إجراءات خطيرة قد تؤثر على النظام
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>وضع التطوير والاختبار</Label>
              <p className="text-sm text-muted-foreground">تفعيل رسائل التطوير (للمطورين فقط)</p>
            </div>
            <Switch
              checked={systemSettings.debugMode}
              onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, debugMode: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* زر الحفظ */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          حفظ الإعدادات
        </Button>
      </div>
    </div>
  );
}