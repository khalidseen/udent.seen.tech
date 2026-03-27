import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Shield, 
  Database, 
  HardDrive, 
  Key,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Loader2,
  Info
} from "lucide-react";
import { toast } from "sonner";

const DEFAULT_SYSTEM_SETTINGS = {
  sessionTimeout: 30,
  autoSaveInterval: 5,
  maxFileSize: 10,
  enableAuditLog: true,
  enableAutoBackup: true,
  backupFrequency: "daily",
  maxLoginAttempts: 3,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
    maxAge: 90,
  },
  maintenanceMode: false,
  debugMode: false,
};

export function SystemSettings() {
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile-system-settings'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_current_user_profile');
      return data;
    }
  });
  const clinicId = profile?.id;

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['system-settings-data', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('custom_preferences')
        .eq('clinic_id', clinicId!)
        .maybeSingle();
      if (error) throw error;
      return (data?.custom_preferences ?? {}) as Record<string, any>;
    },
    enabled: !!clinicId,
  });

  const [systemSettings, setSystemSettings] = useState(DEFAULT_SYSTEM_SETTINGS);

  useEffect(() => {
    if (!settingsData?.system) return;
    setSystemSettings(prev => ({
      ...prev,
      ...settingsData.system,
      passwordPolicy: {
        ...prev.passwordPolicy,
        ...(settingsData.system.passwordPolicy || {}),
      },
    }));
  }, [settingsData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const existingPrefs = settingsData || {};
      const newPrefs = {
        ...existingPrefs,
        system: systemSettings,
      };
      const { error } = await supabase
        .from('clinic_settings')
        .upsert({ clinic_id: clinicId!, custom_preferences: newPrefs }, { onConflict: 'clinic_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings-data', clinicId] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-mode'] });
      toast.success("تم حفظ إعدادات النظام بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حفظ الإعدادات");
    },
  });

  const handleClearCache = () => {
    queryClient.clear();
    const keysToKeep = ['supabase.auth.token'];
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
      if (!keysToKeep.some(k => key.includes(k))) {
        localStorage.removeItem(key);
      }
    }
    toast.success("تم مسح ذاكرة التخزين المؤقت بنجاح");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

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
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 rounded-lg flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <h4 className="font-medium text-blue-800 dark:text-blue-300">النسخ الاحتياطي التلقائي</h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                يتم إدارة النسخ الاحتياطي تلقائياً بواسطة Supabase. يتم إنشاء نسخ احتياطية يومية مع إمكانية الاسترجاع إلى أي نقطة زمنية خلال آخر 7 أيام.
              </p>
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
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex items-center gap-2">
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          حفظ الإعدادات
        </Button>
      </div>
    </div>
  );
}