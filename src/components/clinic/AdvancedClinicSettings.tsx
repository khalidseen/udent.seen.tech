import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Shield, Bell, Database, Globe, Save, RefreshCw } from 'lucide-react';

interface ClinicSettings {
  id: string;
  name: string;
  license_number?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country: string;
  logo_url?: string;
  subscription_plan: string;
  subscription_status: string;
  max_users: number;
  max_patients: number;
  custom_plan_config: any;
  usage_metrics: any;
}

interface SystemSettings {
  auto_backup: boolean;
  backup_frequency: string;
  notification_preferences: any;
  security_settings: any;
  api_settings: any;
}

export const AdvancedClinicSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    auto_backup: true,
    backup_frequency: 'daily',
    notification_preferences: {},
    security_settings: {},
    api_settings: {}
  });

  // الحصول على إعدادات العيادة
  const { data: clinicData, isLoading } = useQuery({
    queryKey: ['clinic-settings'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.clinic_id) throw new Error('العيادة غير موجودة');

      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', profile.clinic_id)
        .single();

      if (error) throw error;
      return data as ClinicSettings;
    }
  });

  // تحديث الحالة عند تحميل البيانات
  React.useEffect(() => {
    if (clinicData) {
      setSettings(clinicData);
    }
  }, [clinicData]);

  // تحديث إعدادات العيادة
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<ClinicSettings>) => {
      if (!settings) return;
      
      const { error } = await supabase
        .from('clinics')
        .update(updates)
        .eq('id', settings.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث إعدادات العيادة بنجاح'
      });
      queryClient.invalidateQueries({ queryKey: ['clinic-settings'] });
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث الإعدادات',
        variant: 'destructive'
      });
    }
  });

  const handleSaveSettings = () => {
    if (!settings) return;
    updateSettingsMutation.mutate(settings);
  };

  const handleInputChange = (field: keyof ClinicSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8">
        <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">لا توجد بيانات</h3>
        <p className="text-muted-foreground">لم يتم العثور على إعدادات العيادة</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">الإعدادات المتقدمة</h2>
          <p className="text-muted-foreground">إدارة جميع إعدادات العيادة والنظام</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={updateSettingsMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateSettingsMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            عام
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            الأمان
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            التنبيهات
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            النظام
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>معلومات العيادة الأساسية</CardTitle>
              <CardDescription>إدارة المعلومات الأساسية للعيادة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinic_name">اسم العيادة</Label>
                  <Input
                    id="clinic_name"
                    value={settings.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_number">رقم الترخيص</Label>
                  <Input
                    id="license_number"
                    value={settings.license_number || ''}
                    onChange={(e) => handleInputChange('license_number', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={settings.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">العنوان</Label>
                <Textarea
                  id="address"
                  value={settings.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">المدينة</Label>
                  <Input
                    id="city"
                    value={settings.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">الدولة</Label>
                  <Select
                    value={settings.country}
                    onValueChange={(value) => handleInputChange('country', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Saudi Arabia">السعودية</SelectItem>
                      <SelectItem value="UAE">الإمارات</SelectItem>
                      <SelectItem value="Kuwait">الكويت</SelectItem>
                      <SelectItem value="Qatar">قطر</SelectItem>
                      <SelectItem value="Bahrain">البحرين</SelectItem>
                      <SelectItem value="Oman">عمان</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>معلومات الاشتراك</CardTitle>
              <CardDescription>تفاصيل خطة الاشتراك والحدود</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>خطة الاشتراك الحالية</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{settings.subscription_plan}</Badge>
                    <Badge 
                      variant={settings.subscription_status === 'active' ? 'default' : 'destructive'}
                    >
                      {settings.subscription_status === 'active' ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>الحد الأقصى للمستخدمين</Label>
                  <Input value={settings.max_users} disabled />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الحد الأقصى للمرضى</Label>
                  <Input value={settings.max_patients} disabled />
                </div>
                <div className="space-y-2">
                  <Label>حالة النظام</Label>
                  <Badge variant="default">
                    <Globe className="h-3 w-3 mr-1" />
                    متصل
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الأمان</CardTitle>
              <CardDescription>إدارة أمان العيادة وحماية البيانات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>تفعيل المصادقة الثنائية</Label>
                  <p className="text-sm text-muted-foreground">زيادة أمان الحسابات</p>
                </div>
                <Switch />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>تسجيل العمليات الحساسة</Label>
                  <p className="text-sm text-muted-foreground">تسجيل جميع العمليات المهمة</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>قفل الجلسة تلقائياً</Label>
                  <p className="text-sm text-muted-foreground">قفل النظام بعد فترة عدم نشاط</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label>مدة قفل الجلسة (دقائق)</Label>
                <Select defaultValue="30">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 دقيقة</SelectItem>
                    <SelectItem value="30">30 دقيقة</SelectItem>
                    <SelectItem value="60">60 دقيقة</SelectItem>
                    <SelectItem value="120">120 دقيقة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات التنبيهات</CardTitle>
              <CardDescription>إدارة تنبيهات النظام والإشعارات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>تنبيهات المواعيد</Label>
                  <p className="text-sm text-muted-foreground">إشعارات قبل المواعيد</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>تنبيهات انتهاء المخزون</Label>
                  <p className="text-sm text-muted-foreground">إنذار عند نقص المواد</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>تنبيهات النظام</Label>
                  <p className="text-sm text-muted-foreground">إشعارات تحديثات النظام</p>
                </div>
                <Switch />
              </div>

              <div className="space-y-2">
                <Label>طريقة الإشعار</Label>
                <Select defaultValue="email">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">البريد الإلكتروني</SelectItem>
                    <SelectItem value="sms">رسائل نصية</SelectItem>
                    <SelectItem value="both">كلاهما</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات النظام</CardTitle>
              <CardDescription>إدارة إعدادات النظام المتقدمة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>النسخ الاحتياطي التلقائي</Label>
                  <p className="text-sm text-muted-foreground">نسخ احتياطي منتظم للبيانات</p>
                </div>
                <Switch 
                  checked={systemSettings.auto_backup}
                  onCheckedChange={(checked) => 
                    setSystemSettings(prev => ({ ...prev, auto_backup: checked }))
                  }
                />
              </div>

              {systemSettings.auto_backup && (
                <div className="space-y-2">
                  <Label>تكرار النسخ الاحتياطي</Label>
                  <Select 
                    value={systemSettings.backup_frequency}
                    onValueChange={(value) => 
                      setSystemSettings(prev => ({ ...prev, backup_frequency: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">يومي</SelectItem>
                      <SelectItem value="weekly">أسبوعي</SelectItem>
                      <SelectItem value="monthly">شهري</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>تحديثات تلقائية</Label>
                  <p className="text-sm text-muted-foreground">تحديث النظام تلقائياً</p>
                </div>
                <Switch />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>المنطقة الزمنية</Label>
                <Select defaultValue="Asia/Riyadh">
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
                <Label>اللغة الافتراضية</Label>
                <Select defaultValue="ar">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Button variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  إعادة تعيين إعدادات النظام
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};