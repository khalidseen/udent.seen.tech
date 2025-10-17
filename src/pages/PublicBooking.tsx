import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Calendar as CalendarIcon, Clock, User, Phone, Mail, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function PublicBooking() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    appointmentType: "",
    notes: ""
  });

  const appointmentTypes = [
    "فحص عام",
    "تنظيف الأسنان",
    "حشو أسنان",
    "علاج جذور",
    "تقويم أسنان",
    "زراعة أسنان",
    "استشارة"
  ];

  const timeSlots = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.phone || !selectedDate || !formData.appointmentType) {
      toast({
        title: "خطأ في الحجز",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "تم إرسال طلب الحجز",
      description: "سيتم التواصل معك قريباً لتأكيد الموعد",
    });

    // Reset form
    setFormData({
      fullName: "",
      phone: "",
      email: "",
      appointmentType: "",
      notes: ""
    });
    setSelectedDate(new Date());
  };

  return (
    <PageContainer>
      <PageHeader
        title="حجز موعد جديد"
        description="احجز موعدك الآن عبر الإنترنت وسنتواصل معك للتأكيد"
      />

      <div className="max-w-4xl mx-auto">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              نموذج الحجز
            </CardTitle>
            <CardDescription>
              يرجى ملء المعلومات التالية لحجز موعدك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    <User className="w-4 h-4 inline ml-2" />
                    الاسم الكامل *
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="أدخل اسمك الكامل"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="w-4 h-4 inline ml-2" />
                    رقم الهاتف *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="05XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="w-4 h-4 inline ml-2" />
                    البريد الإلكتروني (اختياري)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointmentType">
                    <FileText className="w-4 h-4 inline ml-2" />
                    نوع الموعد *
                  </Label>
                  <Select 
                    value={formData.appointmentType} 
                    onValueChange={(value) => setFormData({...formData, appointmentType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الموعد" />
                    </SelectTrigger>
                    <SelectContent>
                      {appointmentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <Label>
                  <CalendarIcon className="w-4 h-4 inline ml-2" />
                  اختر التاريخ المفضل *
                </Label>
                <div className="border rounded-lg p-4 flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={ar}
                    className="rounded-md"
                    disabled={(date) => date < new Date()}
                  />
                </div>
                {selectedDate && (
                  <p className="text-sm text-muted-foreground text-center">
                    التاريخ المحدد: {format(selectedDate, "PPP", { locale: ar })}
                  </p>
                )}
              </div>

              {/* Time Slots */}
              <div className="space-y-2">
                <Label>
                  <Clock className="w-4 h-4 inline ml-2" />
                  الأوقات المتاحة (اختياري)
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      variant="outline"
                      className="w-full"
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  * سيتم تحديد الوقت النهائي بعد التأكيد من العيادة
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">
                  <FileText className="w-4 h-4 inline ml-2" />
                  ملاحظات إضافية (اختياري)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="أي ملاحظات أو استفسارات تود إضافتها..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" size="lg">
                إرسال طلب الحجز
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                بالضغط على "إرسال طلب الحجز"، فإنك توافق على سياسة الخصوصية الخاصة بالعيادة
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>معلومات مهمة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              ⏰ أوقات العمل: من الأحد إلى الخميس، من 9 صباحاً إلى 5 مساءً
            </p>
            <p className="text-sm">
              📞 للاستفسارات: 0500000000
            </p>
            <p className="text-sm">
              ✅ سيتم التواصل معك خلال 24 ساعة لتأكيد الموعد
            </p>
            <p className="text-sm">
              ❌ في حالة الإلغاء، يرجى الاتصال قبل 24 ساعة على الأقل
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
