import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, Clock, Phone, MapPin, Mail, Globe, Save, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Shift {
  open: string;
  close: string;
}

interface DaySchedule {
  shifts: Shift[];
  enabled: boolean;
}

type WorkingHours = Record<string, DaySchedule>;

const DEFAULT_WORKING_HOURS: WorkingHours = {
  sunday: { shifts: [{ open: "08:00", close: "18:00" }], enabled: true },
  monday: { shifts: [{ open: "08:00", close: "18:00" }], enabled: true },
  tuesday: { shifts: [{ open: "08:00", close: "18:00" }], enabled: true },
  wednesday: { shifts: [{ open: "08:00", close: "18:00" }], enabled: true },
  thursday: { shifts: [{ open: "08:00", close: "18:00" }], enabled: true },
  friday: { shifts: [{ open: "08:00", close: "12:00" }], enabled: true },
  saturday: { shifts: [{ open: "09:00", close: "15:00" }], enabled: false },
};

export function ClinicSettings() {
  const queryClient = useQueryClient();
  const [newSpecialty, setNewSpecialty] = useState("");

  const { data: profile } = useQuery({
    queryKey: ['profile-clinic-settings'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_current_user_profile');
      return data;
    }
  });
  const clinicId = profile?.id;

  const { data: clinicData, isLoading } = useQuery({
    queryKey: ['clinic-settings-data', clinicId],
    queryFn: async () => {
      const [clinicRes, settingsRes] = await Promise.all([
        supabase.from('clinics').select('*').eq('id', clinicId!).single(),
        supabase.from('clinic_settings').select('*').eq('clinic_id', clinicId!).maybeSingle(),
      ]);
      if (clinicRes.error) throw clinicRes.error;
      return { clinic: clinicRes.data, settings: settingsRes.data };
    },
    enabled: !!clinicId,
  });

  const [clinicInfo, setClinicInfo] = useState({
    name: "",
    nameEn: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    workingHours: DEFAULT_WORKING_HOURS as WorkingHours,
    currency: "IQD",
    taxNumber: "",
    specialties: [] as string[],
  });

  useEffect(() => {
    if (!clinicData) return;
    const { clinic, settings } = clinicData;
    const prefs = (settings?.custom_preferences ?? {}) as Record<string, any>;
    setClinicInfo({
      name: clinic.name || "",
      nameEn: prefs.name_en || "",
      description: prefs.description || "",
      address: clinic.address || "",
      phone: clinic.phone || "",
      email: clinic.email || "",
      website: prefs.website || "",
      workingHours: prefs.working_hours || DEFAULT_WORKING_HOURS,
      currency: settings?.currency || "IQD",
      taxNumber: prefs.tax_number || "",
      specialties: prefs.specialties || [],
    });
  }, [clinicData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { workingHours, currency, nameEn, description, website, taxNumber, specialties, ...clinicFields } = clinicInfo;

      const { error: clinicError } = await supabase
        .from('clinics')
        .update({
          name: clinicFields.name,
          phone: clinicFields.phone,
          email: clinicFields.email,
          address: clinicFields.address,
        })
        .eq('id', clinicId!);
      if (clinicError) throw clinicError;

      const existingPrefs = ((clinicData?.settings?.custom_preferences ?? {}) as Record<string, any>);
      const newPrefs = {
        ...existingPrefs,
        name_en: nameEn,
        description,
        website,
        tax_number: taxNumber,
        working_hours: workingHours,
        specialties,
      };

      const { error: settingsError } = await supabase
        .from('clinic_settings')
        .upsert({
          clinic_id: clinicId!,
          currency,
          custom_preferences: newPrefs,
        }, { onConflict: 'clinic_id' });
      if (settingsError) throw settingsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-settings-data', clinicId] });
      toast.success("تم حفظ إعدادات العيادة بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حفظ الإعدادات");
    },
  });



  const days = [
    { key: "sunday", name: "الأحد" },
    { key: "monday", name: "الإثنين" },
    { key: "tuesday", name: "الثلاثاء" },
    { key: "wednesday", name: "الأربعاء" },
    { key: "thursday", name: "الخميس" },
    { key: "friday", name: "الجمعة" },
    { key: "saturday", name: "السبت" },
  ];

  const addShift = (dayKey: string) => {
    setClinicInfo(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [dayKey]: {
          ...prev.workingHours[dayKey],
          shifts: [...prev.workingHours[dayKey].shifts, { open: "14:00", close: "20:00" }],
        }
      }
    }));
  };

  const removeShift = (dayKey: string, index: number) => {
    setClinicInfo(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [dayKey]: {
          ...prev.workingHours[dayKey],
          shifts: prev.workingHours[dayKey].shifts.filter((_, i) => i !== index),
        }
      }
    }));
  };

  const updateShift = (dayKey: string, index: number, field: 'open' | 'close', value: string) => {
    setClinicInfo(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [dayKey]: {
          ...prev.workingHours[dayKey],
          shifts: prev.workingHours[dayKey].shifts.map((s, i) => i === index ? { ...s, [field]: value } : s),
        }
      }
    }));
  };

  const toggleDay = (dayKey: string) => {
    setClinicInfo(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [dayKey]: {
          ...prev.workingHours[dayKey],
          enabled: !prev.workingHours[dayKey].enabled,
        }
      }
    }));
  };

  const addSpecialty = () => {
    const trimmed = newSpecialty.trim();
    if (!trimmed) return;
    if (clinicInfo.specialties.includes(trimmed)) {
      toast.error("هذا التخصص موجود بالفعل");
      return;
    }
    setClinicInfo(prev => ({ ...prev, specialties: [...prev.specialties, trimmed] }));
    setNewSpecialty("");
  };

  const removeSpecialty = (index: number) => {
    setClinicInfo(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index),
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map(i => (
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
      {/* معلومات العيادة الأساسية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            معلومات العيادة الأساسية
          </CardTitle>
          <CardDescription>
            المعلومات العامة للعيادة والتي تظهر في النظام والتقارير
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="clinicName">اسم العيادة (عربي)</Label>
            <Input
              id="clinicName"
              value={clinicInfo.name}
              onChange={(e) => setClinicInfo(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clinicNameEn">اسم العيادة (إنجليزي)</Label>
            <Input
              id="clinicNameEn"
              value={clinicInfo.nameEn}
              onChange={(e) => setClinicInfo(prev => ({ ...prev, nameEn: e.target.value }))}
            />
          </div>

          <div className="col-span-full space-y-2">
            <Label htmlFor="description">وصف العيادة</Label>
            <Textarea
              id="description"
              value={clinicInfo.description}
              onChange={(e) => setClinicInfo(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>



          <div className="space-y-2">
            <Label htmlFor="taxNumber">الرقم الضريبي</Label>
            <Input
              id="taxNumber"
              value={clinicInfo.taxNumber}
              onChange={(e) => setClinicInfo(prev => ({ ...prev, taxNumber: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* معلومات الاتصال */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            معلومات الاتصال
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-full space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              العنوان
            </Label>
            <Textarea
              id="address"
              value={clinicInfo.address}
              onChange={(e) => setClinicInfo(prev => ({ ...prev, address: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              رقم الهاتف
            </Label>
            <Input
              id="phone"
              value={clinicInfo.phone}
              onChange={(e) => setClinicInfo(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              البريد الإلكتروني
            </Label>
            <Input
              id="email"
              type="email"
              value={clinicInfo.email}
              onChange={(e) => setClinicInfo(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="col-span-full space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              الموقع الإلكتروني
            </Label>
            <Input
              id="website"
              value={clinicInfo.website}
              onChange={(e) => setClinicInfo(prev => ({ ...prev, website: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* أوقات العمل */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            أوقات العمل
          </CardTitle>
          <CardDescription>
            تحديد أوقات عمل العيادة لكل يوم من أيام الأسبوع (يمكن إضافة فترات متعددة لكل يوم)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {days.map(day => {
              const dayData = clinicInfo.workingHours[day.key] || { shifts: [{ open: "08:00", close: "18:00" }], enabled: true };
              return (
                <div key={day.key} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-20 text-sm font-medium">{day.name}</span>
                      <Button
                        variant={dayData.enabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleDay(day.key)}
                      >
                        {dayData.enabled ? "مفعل" : "معطل"}
                      </Button>
                    </div>
                    {dayData.enabled && (
                      <Button variant="ghost" size="sm" onClick={() => addShift(day.key)} className="text-xs gap-1">
                        <Plus className="h-3 w-3" />
                        إضافة فترة
                      </Button>
                    )}
                  </div>
                  {dayData.enabled && dayData.shifts.map((shift, idx) => (
                    <div key={idx} className="flex items-center gap-2 mr-6">
                      <span className="text-xs text-muted-foreground w-12">فترة {idx + 1}</span>
                      <Input
                        type="time"
                        value={shift.open}
                        onChange={(e) => updateShift(day.key, idx, 'open', e.target.value)}
                        className="w-28"
                      />
                      <span className="text-muted-foreground text-sm">إلى</span>
                      <Input
                        type="time"
                        value={shift.close}
                        onChange={(e) => updateShift(day.key, idx, 'close', e.target.value)}
                        className="w-28"
                      />
                      {dayData.shifts.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeShift(day.key, idx)}>
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* التخصصات */}
      <Card>
        <CardHeader>
          <CardTitle>تخصصات العيادة</CardTitle>
          <CardDescription>
            التخصصات الطبية المتوفرة في العيادة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="أضف تخصص جديد..."
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSpecialty()}
              className="flex-1"
            />
            <Button onClick={addSpecialty} size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              إضافة
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {clinicInfo.specialties.map((specialty, index) => (
              <Badge key={index} variant="secondary" className="gap-1 pl-2">
                {specialty}
                <button onClick={() => removeSpecialty(index)} className="mr-1 hover:text-destructive" title="إزالة التخصص">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {clinicInfo.specialties.length === 0 && (
              <p className="text-sm text-muted-foreground">لم يتم إضافة أي تخصص بعد</p>
            )}
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