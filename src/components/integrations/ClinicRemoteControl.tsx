import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Globe, Clock, DollarSign, Wifi, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { AccessibleClinic, ClinicSettings, ClinicAnalytics } from '@/hooks/useMultiClinicAnalytics';

interface ClinicRemoteControlProps {
  clinics: AccessibleClinic[];
  analytics: ClinicAnalytics[];
  settings: ClinicSettings[];
  onUpdateSettings: (clinicId: string, updates: Partial<ClinicSettings>) => Promise<boolean>;
  onSwitchClinic: (clinicId: string) => Promise<boolean>;
}

const ClinicRemoteControl: React.FC<ClinicRemoteControlProps> = ({
  clinics,
  analytics,
  settings,
  onUpdateSettings,
  onSwitchClinic,
}) => {
  const [selectedClinicId, setSelectedClinicId] = useState<string>(
    clinics.find(c => c.is_current)?.clinic_id || clinics[0]?.clinic_id || ''
  );

  const selectedClinic = analytics.find(c => c.clinic_id === selectedClinicId);
  const selectedSettings = settings.find(s => s.clinic_id === selectedClinicId);

  const handleSettingChange = async (key: string, value: any) => {
    const success = await onUpdateSettings(selectedClinicId, { [key]: value } as any);
    if (success) {
      toast.success('تم تحديث الإعدادات بنجاح');
    } else {
      toast.error('فشل في تحديث الإعدادات');
    }
  };

  const handleSwitchTo = async () => {
    const success = await onSwitchClinic(selectedClinicId);
    if (success) {
      toast.success('تم التبديل إلى العيادة بنجاح');
      window.location.reload();
    } else {
      toast.error('فشل في التبديل - تحقق من الصلاحيات');
    }
  };

  if (clinics.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">لا توجد عيادات متاحة للتحكم</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clinic Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            التحكم عن بُعد بالعيادات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>اختر العيادة</Label>
              <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر عيادة" />
                </SelectTrigger>
                <SelectContent>
                  {clinics.map(clinic => (
                    <SelectItem key={clinic.clinic_id} value={clinic.clinic_id}>
                      {clinic.clinic_name} {clinic.is_current ? '(الحالية)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSwitchTo} className="mt-6" variant="outline">
              التبديل لهذه العيادة
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedClinic && (
        <>
          {/* Clinic Info */}
          <Card>
            <CardHeader>
              <CardTitle>{selectedClinic.clinic_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{selectedClinic.patient_count}</p>
                  <p className="text-sm text-muted-foreground">مريض</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{selectedClinic.user_count}</p>
                  <p className="text-sm text-muted-foreground">مستخدم</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{selectedClinic.appointment_count}</p>
                  <p className="text-sm text-muted-foreground">موعد</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{selectedClinic.this_month_revenue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">إيراد الشهر</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>إعدادات العيادة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    العملة
                  </Label>
                  <Select
                    value={selectedSettings?.currency || 'IQD'}
                    onValueChange={(val) => handleSettingChange('currency', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IQD">دينار عراقي (IQD)</SelectItem>
                      <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                      <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                      <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                      <SelectItem value="JOD">دينار أردني (JOD)</SelectItem>
                      <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    اللغة
                  </Label>
                  <Select
                    value={selectedSettings?.language || 'ar'}
                    onValueChange={(val) => handleSettingChange('language', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ku">كوردی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    تنسيق الوقت
                  </Label>
                  <Select
                    value={selectedSettings?.time_format || '24'}
                    onValueChange={(val) => handleSettingChange('time_format', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 ساعة</SelectItem>
                      <SelectItem value="24">24 ساعة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    المنطقة الزمنية
                  </Label>
                  <Select
                    value={selectedSettings?.timezone || 'Asia/Baghdad'}
                    onValueChange={(val) => handleSettingChange('timezone', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Baghdad">بغداد (GMT+3)</SelectItem>
                      <SelectItem value="Asia/Riyadh">الرياض (GMT+3)</SelectItem>
                      <SelectItem value="Asia/Dubai">دبي (GMT+4)</SelectItem>
                      <SelectItem value="Africa/Cairo">القاهرة (GMT+2)</SelectItem>
                      <SelectItem value="Asia/Amman">عمّان (GMT+3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Wifi className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">الوصول عن بُعد</p>
                    <p className="text-sm text-muted-foreground">السماح بالتحكم في هذه العيادة عن بُعد</p>
                  </div>
                </div>
                <Switch
                  checked={selectedSettings?.remote_access_enabled ?? true}
                  onCheckedChange={(val) => handleSettingChange('remote_access_enabled', val)}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ClinicRemoteControl;
