import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const PublicBooking = () => {
  const [searchParams] = useSearchParams();
  const clinicId = searchParams.get('clinic');
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [formData, setFormData] = useState({
    patient_name: "",
    patient_phone: "",
    patient_email: "",
    patient_address: "",
    condition_description: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Available time slots
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clinicId) {
      toast.error("رابط غير صالح");
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast.error("يرجى اختيار التاريخ والوقت");
      return;
    }

    // Validate form data before submission
    if (formData.patient_name.length < 2 || formData.patient_name.length > 100) {
      toast.error("يجب أن يكون الاسم بين 2 و 100 حرف");
      return;
    }

    if (formData.condition_description.length < 10 || formData.condition_description.length > 1000) {
      toast.error("يجب أن يكون وصف الحالة بين 10 و 1000 حرف");
      return;
    }

    if (formData.patient_phone && formData.patient_phone.length < 8) {
      toast.error("رقم الهاتف يجب أن يكون على الأقل 8 أرقام");
      return;
    }

    if (formData.patient_email && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(formData.patient_email)) {
      toast.error("صيغة البريد الإلكتروني غير صحيحة");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get client IP and user agent for security tracking
      const { data: clientInfo } = await supabase.functions.invoke('get-client-info');
      
      const { error } = await supabase
        .from('appointment_requests')
        .insert({
          clinic_id: clinicId,
          patient_name: formData.patient_name.trim(),
          patient_phone: formData.patient_phone?.trim() || null,
          patient_email: formData.patient_email?.trim() || null,
          patient_address: formData.patient_address?.trim() || null,
          condition_description: formData.condition_description.trim(),
          preferred_date: format(selectedDate, 'yyyy-MM-dd'),
          preferred_time: selectedTime,
          request_ip: clientInfo?.ip || null,
          request_user_agent: clientInfo?.userAgent || null
        });

      if (error) {
        // Handle specific rate limiting errors
        if (error.message.includes('rate_limit')) {
          toast.error("تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة مرة أخرى لاحقاً");
        } else if (error.message.includes('Patient name')) {
          toast.error("الاسم يجب أن يكون بين 2 و 100 حرف");
        } else if (error.message.includes('Phone number')) {
          toast.error("رقم الهاتف يجب أن يكون على الأقل 8 أرقام");
        } else if (error.message.includes('Invalid email')) {
          toast.error("صيغة البريد الإلكتروني غير صحيحة");
        } else if (error.message.includes('Condition description')) {
          toast.error("وصف الحالة يجب أن يكون بين 10 و 1000 حرف");
        } else if (error.message.includes('past')) {
          toast.error("لا يمكن اختيار تاريخ في الماضي");
        } else if (error.message.includes('90 days')) {
          toast.error("لا يمكن اختيار تاريخ أكثر من 90 يوم من الآن");
        } else {
          toast.error("حدث خطأ في إرسال الطلب");
        }
        throw error;
      }

      setIsSubmitted(true);
      toast.success("تم إرسال طلب الموعد بنجاح!");
    } catch (error: any) {
      console.error('Error submitting appointment request:', error);
      // Error message already handled above
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!clinicId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">رابط غير صالح</CardTitle>
            <CardDescription>
              هذا الرابط غير صحيح أو منتهي الصلاحية
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-primary">
              ✅ تم إرسال طلبك بنجاح
            </CardTitle>
            <CardDescription className="text-center">
              تم إرسال طلب حجز موعدك للعيادة. سيتم مراجعة الطلب والرد عليك قريباً.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">التاريخ:</span>
                <span>{selectedDate && format(selectedDate, 'dd/MM/yyyy', { locale: ar })}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">الوقت:</span>
                <span>{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">الاسم:</span>
                <span>{formData.patient_name}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">حجز موعد جديد</CardTitle>
            <CardDescription>
              املأ النموذج أدناه لحجز موعد في العيادة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">معلومات المريض</h3>
                  
                  <div>
                    <Label htmlFor="patient_name">الاسم الكامل *</Label>
                    <Input
                      id="patient_name"
                      name="patient_name"
                      value={formData.patient_name}
                      onChange={handleInputChange}
                      required
                      placeholder="أدخل اسمك الكامل"
                    />
                  </div>

                  <div>
                    <Label htmlFor="patient_phone">رقم الهاتف</Label>
                    <Input
                      id="patient_phone"
                      name="patient_phone"
                      type="tel"
                      value={formData.patient_phone}
                      onChange={handleInputChange}
                      placeholder="+90 555 123 4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="patient_email">البريد الإلكتروني</Label>
                    <Input
                      id="patient_email"
                      name="patient_email"
                      type="email"
                      value={formData.patient_email}
                      onChange={handleInputChange}
                      placeholder="example@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="patient_address">العنوان</Label>
                    <Input
                      id="patient_address"
                      name="patient_address"
                      value={formData.patient_address}
                      onChange={handleInputChange}
                      placeholder="أدخل عنوانك"
                    />
                  </div>

                  <div>
                    <Label htmlFor="condition_description">وصف الحالة *</Label>
                    <Textarea
                      id="condition_description"
                      name="condition_description"
                      value={formData.condition_description}
                      onChange={handleInputChange}
                      required
                      placeholder="صف حالتك أو الأعراض التي تعاني منها"
                      rows={4}
                    />
                  </div>
                </div>

                {/* Date and Time Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">اختيار التاريخ والوقت</h3>
                  
                  <div>
                    <Label>اختر التاريخ *</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date() || date.getDay() === 5 || date.getDay() === 6}
                      className="rounded-md border w-full"
                      locale={ar}
                    />
                  </div>

                  {selectedDate && (
                    <div>
                      <Label>اختر الوقت *</Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {timeSlots.map((time) => (
                          <Button
                            key={time}
                            type="button"
                            variant={selectedTime === time ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedTime(time)}
                            className="text-sm"
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting || !selectedDate || !selectedTime}
                  className="w-full md:w-auto px-8"
                >
                  {isSubmitting ? "جاري الإرسال..." : "إرسال طلب الموعد"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicBooking;