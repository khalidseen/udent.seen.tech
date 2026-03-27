import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bell, 
  Calendar, 
  Users, 
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Stethoscope,
  Volume2,
  Save,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

const DEFAULT_NOTIFICATIONS: Record<string, Record<string, { system: boolean; email: boolean; sms: boolean }>> = {
  appointments: {
    newAppointment: { system: true, email: true, sms: false },
    appointmentReminder: { system: true, email: true, sms: true },
    appointmentCancelled: { system: true, email: true, sms: false },
    appointmentCompleted: { system: true, email: false, sms: false },
  },
  patients: {
    newPatient: { system: true, email: false, sms: false },
    patientUpdated: { system: true, email: false, sms: false },
    birthdayReminder: { system: true, email: true, sms: false },
  },
  medical: {
    newRecord: { system: true, email: false, sms: false },
    treatmentCompleted: { system: true, email: true, sms: false },
    followUpReminder: { system: true, email: true, sms: true },
  },
  financial: {
    paymentReceived: { system: true, email: true, sms: false },
    paymentOverdue: { system: true, email: true, sms: true },
    invoiceGenerated: { system: true, email: true, sms: false },
  },
  system: {
    systemUpdate: { system: true, email: true, sms: false },
    maintenanceScheduled: { system: true, email: true, sms: false },
    backupCompleted: { system: true, email: false, sms: false },
    securityAlert: { system: true, email: true, sms: true },
  },
};

const DEFAULT_GENERAL = {
  soundEnabled: true,
  desktopNotifications: true,
  reminderTime: "30",
  workingHoursOnly: true,
  maxNotificationsPerDay: 50,
};

export function NotificationSettings() {
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile-notification-settings'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_current_user_profile');
      return data;
    }
  });
  const clinicId = profile?.id;

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['notification-settings-data', clinicId],
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

  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [generalSettings, setGeneralSettings] = useState(DEFAULT_GENERAL);

  useEffect(() => {
    if (!settingsData) return;
    if (settingsData.notifications) {
      // Deep merge: defaults first, then saved values on top
      const merged = { ...DEFAULT_NOTIFICATIONS };
      for (const cat of Object.keys(merged)) {
        if (settingsData.notifications[cat]) {
          merged[cat] = { ...merged[cat] };
          for (const item of Object.keys(merged[cat])) {
            if (settingsData.notifications[cat][item]) {
              merged[cat][item] = { ...merged[cat][item], ...settingsData.notifications[cat][item] };
            }
          }
        }
      }
      setNotifications(merged);
    }
    if (settingsData.notification_general) {
      setGeneralSettings({ ...DEFAULT_GENERAL, ...settingsData.notification_general });
    }
  }, [settingsData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const existingPrefs = settingsData || {};
      const newPrefs = {
        ...existingPrefs,
        notifications,
        notification_general: generalSettings,
      };
      const { error } = await supabase
        .from('clinic_settings')
        .upsert({ clinic_id: clinicId!, custom_preferences: newPrefs }, { onConflict: 'clinic_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings-data', clinicId] });
      toast.success("تم حفظ إعدادات الإشعارات بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حفظ الإعدادات");
    },
  });

  const notificationCategories = [
    {
      key: "appointments",
      title: "المواعيد",
      icon: Calendar,
      description: "إشعارات متعلقة بالمواعيد والحجوزات",
      items: [
        { key: "newAppointment", title: "موعد جديد", description: "عند إنشاء موعد جديد" },
        { key: "appointmentReminder", title: "تذكير بالموعد", description: "تذكير المرضى بمواعيدهم" },
        { key: "appointmentCancelled", title: "إلغاء موعد", description: "عند إلغاء أحد المواعيد" },
        { key: "appointmentCompleted", title: "اكتمال الموعد", description: "عند انتهاء الموعد" }
      ]
    },
    {
      key: "patients",
      title: "المرضى",
      icon: Users,
      description: "إشعارات متعلقة ببيانات المرضى",
      items: [
        { key: "newPatient", title: "مريض جديد", description: "عند تسجيل مريض جديد" },
        { key: "patientUpdated", title: "تحديث بيانات المريض", description: "عند تعديل معلومات المريض" },
        { key: "birthdayReminder", title: "تذكير عيد الميلاد", description: "تهنئة المرضى بأعياد ميلادهم" }
      ]
    },
    {
      key: "medical",
      title: "السجلات الطبية",
      icon: Stethoscope,
      description: "إشعارات متعلقة بالسجلات والعلاجات",
      items: [
        { key: "newRecord", title: "سجل طبي جديد", description: "عند إضافة سجل طبي جديد" },
        { key: "treatmentCompleted", title: "اكتمال العلاج", description: "عند انتهاء خطة العلاج" },
        { key: "followUpReminder", title: "تذكير المتابعة", description: "تذكير بمواعيد المتابعة" }
      ]
    },
    {
      key: "financial",
      title: "المالية",
      icon: DollarSign,
      description: "إشعارات متعلقة بالمدفوعات والفواتير",
      items: [
        { key: "paymentReceived", title: "استلام دفعة", description: "عند استلام دفعة من مريض" },
        { key: "paymentOverdue", title: "تأخير في السداد", description: "عند تأخر المريض في السداد" },
        { key: "invoiceGenerated", title: "إنشاء فاتورة", description: "عند إنشاء فاتورة جديدة" }
      ]
    },
    {
      key: "system",
      title: "النظام",
      icon: AlertCircle,
      description: "إشعارات النظام والأمان",
      items: [
        { key: "systemUpdate", title: "تحديث النظام", description: "عند توفر تحديث جديد" },
        { key: "maintenanceScheduled", title: "صيانة مجدولة", description: "تذكير بصيانة النظام" },
        { key: "backupCompleted", title: "اكتمال النسخ الاحتياطي", description: "عند انتهاء النسخ الاحتياطي" },
        { key: "securityAlert", title: "تنبيه أمني", description: "عند اكتشاف نشاط مشبوه" }
      ]
    }
  ];

  const updateNotification = (category: string, item: string, type: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [item]: {
          ...prev[category][item],
          [type]: value
        }
      }
    }));
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
      {/* الإعدادات العامة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            الإعدادات العامة للإشعارات
          </CardTitle>
          <CardDescription>
            إعدادات عامة تؤثر على جميع أنواع الإشعارات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  الأصوات
                </Label>
                <p className="text-sm text-muted-foreground">تشغيل أصوات الإشعارات</p>
              </div>
              <Switch
                checked={generalSettings.soundEnabled}
                onCheckedChange={(checked) => setGeneralSettings(prev => ({ ...prev, soundEnabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>إشعارات سطح المكتب</Label>
                <p className="text-sm text-muted-foreground">عرض الإشعارات على الشاشة</p>
              </div>
              <Switch
                checked={generalSettings.desktopNotifications}
                onCheckedChange={(checked) => setGeneralSettings(prev => ({ ...prev, desktopNotifications: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>أوقات العمل فقط</Label>
                <p className="text-sm text-muted-foreground">إرسال الإشعارات في أوقات العمل</p>
              </div>
              <Switch
                checked={generalSettings.workingHoursOnly}
                onCheckedChange={(checked) => setGeneralSettings(prev => ({ ...prev, workingHoursOnly: checked }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                وقت التذكير (دقيقة قبل الموعد)
              </Label>
              <Select 
                value={generalSettings.reminderTime} 
                onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, reminderTime: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 دقيقة</SelectItem>
                  <SelectItem value="30">30 دقيقة</SelectItem>
                  <SelectItem value="60">ساعة واحدة</SelectItem>
                  <SelectItem value="120">ساعتان</SelectItem>
                  <SelectItem value="1440">يوم واحد</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الحد الأقصى للإشعارات اليومية</Label>
              <Select 
                value={generalSettings.maxNotificationsPerDay.toString()} 
                onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, maxNotificationsPerDay: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 إشعار</SelectItem>
                  <SelectItem value="50">50 إشعار</SelectItem>
                  <SelectItem value="100">100 إشعار</SelectItem>
                  <SelectItem value="999">بلا حدود</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إعدادات الإشعارات بالتفصيل */}
      {notificationCategories.map(category => (
        <Card key={category.key}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <category.icon className="h-5 w-5" />
              {category.title}
            </CardTitle>
            <CardDescription>{category.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* رأس الجدول */}
              <div className="grid grid-cols-12 gap-4 font-medium text-sm text-muted-foreground border-b pb-2">
                <div className="col-span-6">نوع الإشعار</div>
                <div className="col-span-2 text-center">النظام</div>
                <div className="col-span-2 text-center">البريد الإلكتروني</div>
                <div className="col-span-2 text-center">رسائل نصية</div>
              </div>

              {/* صفوف الإشعارات */}
              {category.items.map(item => (
                <div key={item.key} className="grid grid-cols-12 gap-4 items-center py-2">
                  <div className="col-span-6">
                    <div className="space-y-1">
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <Switch
                      checked={notifications[category.key][item.key].system}
                      onCheckedChange={(checked) => updateNotification(category.key, item.key, 'system', checked)}
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <Switch
                      checked={notifications[category.key][item.key].email}
                      onCheckedChange={(checked) => updateNotification(category.key, item.key, 'email', checked)}
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <Switch
                      checked={notifications[category.key][item.key].sms}
                      onCheckedChange={(checked) => updateNotification(category.key, item.key, 'sms', checked)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* ملخص الإشعارات المفعلة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            ملخص الإشعارات المفعلة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notificationCategories.map(category => {
              const activeCount = category.items.reduce((count, item) => {
                const itemNotifications = notifications[category.key][item.key];
                return count + (itemNotifications.system ? 1 : 0) + 
                       (itemNotifications.email ? 1 : 0) + 
                       (itemNotifications.sms ? 1 : 0);
              }, 0);

              return (
                <div key={category.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <category.icon className="h-4 w-4" />
                    <span className="font-medium">{category.title}</span>
                  </div>
                  <Badge variant={activeCount > 0 ? "default" : "secondary"}>
                    {activeCount} إشعار مفعل
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* زر الحفظ */}
      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex items-center gap-2">
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ الإعدادات
        </Button>
      </div>
    </div>
  );
}