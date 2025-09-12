import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  CheckCircle,
  ArrowRight,
  Stethoscope,
  Star,
  Users,
  Award,
  Heart
} from "lucide-react";

interface ClinicInfo {
  id: string;
  clinic_name: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  logo_url?: string;
  working_hours?: string;
}

interface FormData {
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  patient_address: string;
  condition_description: string;
}

const PublicBookingLanding = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedClinic, setSelectedClinic] = useState<ClinicInfo | null>(null);
  const [availableClinics, setAvailableClinics] = useState<ClinicInfo[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [formData, setFormData] = useState<FormData>({
    patient_name: "",
    patient_phone: "",
    patient_email: "",
    patient_address: "",
    condition_description: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
  ];

  useEffect(() => {
    const clinicId = searchParams.get('clinic');
    if (clinicId) {
      fetchClinicInfo(clinicId);
    } else {
      fetchAvailableClinics();
    }
  }, [searchParams]);

  const fetchClinicInfo = async (clinicId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('id, clinic_name, address, phone, email, description, logo_url, working_hours')
        .eq('id', clinicId)
        .eq('user_type', 'clinic')
        .single();

      if (error) {
        toast.error("لم يتم العثور على العيادة");
        fetchAvailableClinics();
        return;
      }

      setSelectedClinic(data);
    } catch (error) {
      console.error('Error fetching clinic info:', error);
      fetchAvailableClinics();
    }
  };

  const fetchAvailableClinics = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('id, clinic_name, address, phone, email, description, logo_url, working_hours')
        .eq('user_type', 'clinic')
        .eq('status', 'active')
        .order('clinic_name');

      if (error) throw error;
      setAvailableClinics(data || []);
    } catch (error) {
      console.error('Error fetching clinics:', error);
      toast.error("حدث خطأ في تحميل العيادات المتاحة");
    }
  };

  const handleClinicSelect = (clinic: ClinicInfo) => {
    setSelectedClinic(clinic);
    navigate(`?clinic=${clinic.id}`, { replace: true });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClinic || !selectedDate || !selectedTime) {
      toast.error("يرجى ملء جميع البيانات المطلوبة");
      return;
    }

    // Validate form data
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
      const { error } = await supabase
        .from('appointment_requests')
        .insert({
          clinic_id: selectedClinic.id,
          patient_name: formData.patient_name.trim(),
          patient_phone: formData.patient_phone?.trim() || null,
          patient_email: formData.patient_email?.trim() || null,
          patient_address: formData.patient_address?.trim() || null,
          condition_description: formData.condition_description.trim(),
          preferred_date: format(selectedDate, 'yyyy-MM-dd'),
          preferred_time: selectedTime,
          status: 'pending'
        });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("تم إرسال طلب الموعد بنجاح!");
    } catch (error: any) {
      console.error('Error submitting appointment request:', error);
      toast.error("حدث خطأ في إرسال الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              تم إرسال طلبك بنجاح!
            </CardTitle>
            <CardDescription>
              سيتم مراجعة طلبك والتواصل معك قريباً لتأكيد الموعد
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">العيادة:</span>
                <span>{selectedClinic?.clinic_name}</span>
              </div>
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
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full mt-6"
              variant="outline"
            >
              حجز موعد آخر
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main landing page
  if (!selectedClinic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              احجز موعدك الآن
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              احجز موعدك في أفضل العيادات الطبية بسهولة وسرعة
            </p>
            
            {/* Features */}
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">حجز سريع</h3>
                <p className="text-gray-600 text-sm">احجز موعدك في دقائق</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">أطباء مختصون</h3>
                <p className="text-gray-600 text-sm">فريق طبي متخصص</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">جودة عالية</h3>
                <p className="text-gray-600 text-sm">خدمة طبية متميزة</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="font-semibold mb-2">عناية شخصية</h3>
                <p className="text-gray-600 text-sm">اهتمام شخصي بكل مريض</p>
              </div>
            </div>
          </div>

          {/* Available Clinics */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">اختر العيادة المناسبة</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableClinics.map((clinic) => (
                <Card key={clinic.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleClinicSelect(clinic)}>
                  <CardHeader>
                    <div className="flex items-center space-x-4 space-x-reverse">
                      {clinic.logo_url ? (
                        <img src={clinic.logo_url} alt={clinic.clinic_name} className="w-12 h-12 rounded-full" />
                      ) : (
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Stethoscope className="w-6 h-6 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{clinic.clinic_name}</CardTitle>
                        <div className="flex items-center text-yellow-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      {clinic.address && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 ml-2" />
                          <span>{clinic.address}</span>
                        </div>
                      )}
                      {clinic.phone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 ml-2" />
                          <span>{clinic.phone}</span>
                        </div>
                      )}
                      {clinic.working_hours && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 ml-2" />
                          <span>{clinic.working_hours}</span>
                        </div>
                      )}
                    </div>
                    {clinic.description && (
                      <p className="text-sm text-gray-600 mt-3 line-clamp-2">{clinic.description}</p>
                    )}
                    <Button className="w-full mt-4" variant="outline">
                      <ArrowRight className="w-4 h-4 ml-2" />
                      احجز الآن
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Booking form for selected clinic
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Clinic Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center space-x-4 space-x-reverse">
              {selectedClinic.logo_url ? (
                <img src={selectedClinic.logo_url} alt={selectedClinic.clinic_name} className="w-16 h-16 rounded-full" />
              ) : (
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Stethoscope className="w-8 h-8 text-blue-600" />
                </div>
              )}
              <div>
                <CardTitle className="text-2xl">{selectedClinic.clinic_name}</CardTitle>
                <CardDescription className="flex items-center space-x-2 space-x-reverse">
                  {selectedClinic.address && (
                    <>
                      <MapPin className="w-4 h-4" />
                      <span>{selectedClinic.address}</span>
                    </>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Booking Form */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">حجز موعد جديد</CardTitle>
            <CardDescription>
              املأ النموذج أدناه لحجز موعدك في {selectedClinic.clinic_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Patient Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <User className="w-5 h-5 ml-2" />
                    معلومات المريض
                  </h3>
                  
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
                  <h3 className="text-lg font-semibold flex items-center">
                    <CalendarIcon className="w-5 h-5 ml-2" />
                    اختيار التاريخ والوقت
                  </h3>
                  
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

export default PublicBookingLanding;
