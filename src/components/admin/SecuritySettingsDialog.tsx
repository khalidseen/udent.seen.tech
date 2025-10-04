import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Eye, Clock, AlertTriangle, Lock, Users, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SecuritySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SecuritySettings {
  enable_audit_logging: boolean;
  enable_session_timeout: boolean;
  session_timeout_minutes: number;
  enable_ip_whitelist: boolean;
  enable_2fa_requirement: boolean;
  enable_password_complexity: boolean;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  enable_sensitive_data_alerts: boolean;
  enable_bulk_operation_alerts: boolean;
}

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  created_at: string;
  status: string;
}

export const SecuritySettingsDialog = ({ open, onOpenChange }: SecuritySettingsDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState<SecuritySettings>({
    enable_audit_logging: true,
    enable_session_timeout: false,
    session_timeout_minutes: 30,
    enable_ip_whitelist: false,
    enable_2fa_requirement: false,
    enable_password_complexity: true,
    max_login_attempts: 5,
    lockout_duration_minutes: 15,
    enable_sensitive_data_alerts: true,
    enable_bulk_operation_alerts: true
  });

  // إحصائيات الأمان
  const { data: securityStats } = useQuery({
    queryKey: ['security-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_audit_statistics', { days_back: 7 });
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // التنبيهات الأمنية الحديثة
  const { data: recentAlerts = [] } = useQuery({
    queryKey: ['security-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as SecurityAlert[];
    },
    enabled: open
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: SecuritySettings) => {
      // يمكن حفظ الإعدادات في جدول منفصل أو في metadata للعيادة
      const { error } = await supabase
        .from('clinics')
        .update({ 
          custom_plan_config: { 
            security_settings: newSettings as any
          } as any
        })
        .eq('id', (await supabase.from('profiles').select('clinic_id').eq('user_id', (await supabase.auth.getUser()).data.user?.id).single()).data?.clinic_id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'تم تحديث إعدادات الأمان',
        description: 'تم حفظ إعدادات الأمان بنجاح'
      });
    }
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(settings);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'suspicious_login': return <Shield className="h-4 w-4" />;
      case 'bulk_data_access': return <Eye className="h-4 w-4" />;
      case 'high_risk_operation': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            إعدادات الأمان المتقدمة
          </DialogTitle>
          <DialogDescription>
            إدارة شاملة لإعدادات أمان النظام والتنبيهات
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
            <TabsTrigger value="alerts">التنبيهات</TabsTrigger>
            <TabsTrigger value="stats">الإحصائيات</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4">
            <div className="grid gap-4">
              {/* إعدادات التسجيل والمراقبة */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    التسجيل والمراقبة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="audit_logging">تسجيل العمليات الحساسة</Label>
                      <p className="text-sm text-muted-foreground">تسجيل جميع العمليات الحساسة في النظام</p>
                    </div>
                    <Switch
                      id="audit_logging"
                      checked={settings.enable_audit_logging}
                      onCheckedChange={(value) => setSettings({ ...settings, enable_audit_logging: value })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sensitive_alerts">تنبيهات البيانات الحساسة</Label>
                      <p className="text-sm text-muted-foreground">تنبيهات عند الوصول للبيانات الطبية الحساسة</p>
                    </div>
                    <Switch
                      id="sensitive_alerts"
                      checked={settings.enable_sensitive_data_alerts}
                      onCheckedChange={(value) => setSettings({ ...settings, enable_sensitive_data_alerts: value })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="bulk_alerts">تنبيهات العمليات المجمعة</Label>
                      <p className="text-sm text-muted-foreground">تنبيهات عند تنفيذ عمليات مجمعة كبيرة</p>
                    </div>
                    <Switch
                      id="bulk_alerts"
                      checked={settings.enable_bulk_operation_alerts}
                      onCheckedChange={(value) => setSettings({ ...settings, enable_bulk_operation_alerts: value })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* إعدادات الجلسات */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    إدارة الجلسات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="session_timeout">انتهاء صلاحية الجلسة تلقائياً</Label>
                      <p className="text-sm text-muted-foreground">إنهاء الجلسة تلقائياً بعد فترة عدم نشاط</p>
                    </div>
                    <Switch
                      id="session_timeout"
                      checked={settings.enable_session_timeout}
                      onCheckedChange={(value) => setSettings({ ...settings, enable_session_timeout: value })}
                    />
                  </div>

                  {settings.enable_session_timeout && (
                    <div>
                      <Label htmlFor="timeout_minutes">مدة انتهاء الصلاحية (بالدقائق)</Label>
                      <Input
                        id="timeout_minutes"
                        type="number"
                        value={settings.session_timeout_minutes}
                        onChange={(e) => setSettings({ ...settings, session_timeout_minutes: parseInt(e.target.value) })}
                        min="5"
                        max="480"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* إعدادات الأمان المتقدمة */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    أمان الوصول
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="password_complexity">متطلبات كلمة المرور المعقدة</Label>
                      <p className="text-sm text-muted-foreground">فرض استخدام كلمات مرور قوية</p>
                    </div>
                    <Switch
                      id="password_complexity"
                      checked={settings.enable_password_complexity}
                      onCheckedChange={(value) => setSettings({ ...settings, enable_password_complexity: value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="max_attempts">الحد الأقصى لمحاولات تسجيل الدخول</Label>
                      <Input
                        id="max_attempts"
                        type="number"
                        value={settings.max_login_attempts}
                        onChange={(e) => setSettings({ ...settings, max_login_attempts: parseInt(e.target.value) })}
                        min="3"
                        max="10"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lockout_duration">مدة الحظر (بالدقائق)</Label>
                      <Input
                        id="lockout_duration"
                        type="number"
                        value={settings.lockout_duration_minutes}
                        onChange={(e) => setSettings({ ...settings, lockout_duration_minutes: parseInt(e.target.value) })}
                        min="5"
                        max="1440"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>التنبيهات الأمنية الحديثة</CardTitle>
                <CardDescription>
                  آخر 10 تنبيهات أمنية في النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentAlerts.length > 0 ? (
                    recentAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
                          {getAlertTypeIcon(alert.alert_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{alert.title}</h4>
                            <span className={`px-2 py-1 rounded-md text-xs ${getSeverityColor(alert.severity)}`}>
                              {alert.severity}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(alert.created_at).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">لا توجد تنبيهات أمنية حديثة</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الأحداث</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(securityStats as any)?.total_events || 0}</div>
                  <p className="text-xs text-muted-foreground">آخر 7 أيام</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">الأحداث عالية المخاطر</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{(securityStats as any)?.high_risk_events || 0}</div>
                  <p className="text-xs text-muted-foreground">تتطلب مراجعة</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">التنبيهات النشطة</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{(securityStats as any)?.active_alerts || 0}</div>
                  <p className="text-xs text-muted-foreground">تحتاج معالجة</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">معدل الأمان</CardTitle>
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {securityStats ? Math.max(0, 100 - (((securityStats as any).high_risk_events || 0) * 10)) : 100}%
            </div>
                  <p className="text-xs text-muted-foreground">نسبة الأمان العامة</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
          <Button onClick={handleSaveSettings} disabled={updateSettingsMutation.isPending}>
            <Shield className="h-4 w-4 mr-2" />
            {updateSettingsMutation.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};