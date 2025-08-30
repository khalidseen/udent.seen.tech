import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building, Clock, Phone, MapPin, Mail, Globe, Save } from "lucide-react";
import { toast } from "sonner";

export function ClinicSettings() {
  const [clinicInfo, setClinicInfo] = useState({
    name: "عيادة الأسنان المتقدمة",
    nameEn: "Advanced Dental Clinic",
    description: "عيادة طب أسنان متخصصة في جميع أنواع العلاجات السنية",
    address: "شارع الملك فهد، الرياض، المملكة العربية السعودية",
    phone: "+966 11 123 4567",
    email: "info@dentalclinic.com",
    website: "www.dentalclinic.com",
    workingHours: {
      sunday: { open: "08:00", close: "18:00", enabled: true },
      monday: { open: "08:00", close: "18:00", enabled: true },
      tuesday: { open: "08:00", close: "18:00", enabled: true },
      wednesday: { open: "08:00", close: "18:00", enabled: true },
      thursday: { open: "08:00", close: "18:00", enabled: true },
      friday: { open: "08:00", close: "12:00", enabled: true },
      saturday: { open: "09:00", close: "15:00", enabled: false }
    },
    currency: "SAR",
    taxNumber: "123456789012345",
    specialties: ["تقويم الأسنان", "جراحة الفم", "طب أسنان الأطفال", "تجميل الأسنان"]
  });

  const currencies = [
    { code: "SAR", name: "ريال سعودي", symbol: "ر.س" },
    { code: "USD", name: "دولار أمريكي", symbol: "$" },
    { code: "EUR", name: "يورو", symbol: "€" },
    { code: "AED", name: "درهم إماراتي", symbol: "د.إ" },
  ];

  const days = [
    { key: "sunday", name: "الأحد" },
    { key: "monday", name: "الإثنين" },
    { key: "tuesday", name: "الثلاثاء" },
    { key: "wednesday", name: "الأربعاء" },
    { key: "thursday", name: "الخميس" },
    { key: "friday", name: "الجمعة" },
    { key: "saturday", name: "السبت" }
  ];

  const handleSave = () => {
    // حفظ الإعدادات في قاعدة البيانات
    toast.success("تم حفظ إعدادات العيادة بنجاح");
  };

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
            <Label htmlFor="currency">العملة</Label>
            <Select value={clinicInfo.currency} onValueChange={(value) => setClinicInfo(prev => ({ ...prev, currency: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(currency => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.name} ({currency.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            تحديد أوقات عمل العيادة لكل يوم من أيام الأسبوع
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {days.map(day => (
              <div key={day.key} className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium">{day.name}</div>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={clinicInfo.workingHours[day.key].open}
                    onChange={(e) => setClinicInfo(prev => ({
                      ...prev,
                      workingHours: {
                        ...prev.workingHours,
                        [day.key]: { ...prev.workingHours[day.key], open: e.target.value }
                      }
                    }))}
                    className="w-28"
                  />
                  <span className="text-muted-foreground">إلى</span>
                  <Input
                    type="time"
                    value={clinicInfo.workingHours[day.key].close}
                    onChange={(e) => setClinicInfo(prev => ({
                      ...prev,
                      workingHours: {
                        ...prev.workingHours,
                        [day.key]: { ...prev.workingHours[day.key], close: e.target.value }
                      }
                    }))}
                    className="w-28"
                  />
                  <Button
                    variant={clinicInfo.workingHours[day.key].enabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setClinicInfo(prev => ({
                      ...prev,
                      workingHours: {
                        ...prev.workingHours,
                        [day.key]: { ...prev.workingHours[day.key], enabled: !prev.workingHours[day.key].enabled }
                      }
                    }))}
                  >
                    {clinicInfo.workingHours[day.key].enabled ? "مفعل" : "معطل"}
                  </Button>
                </div>
              </div>
            ))}
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
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {clinicInfo.specialties.map((specialty, index) => (
              <Badge key={index} variant="secondary">
                {specialty}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* زر الحفظ */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          حفظ الإعدادات
        </Button>
      </div>
    </div>
  );
}