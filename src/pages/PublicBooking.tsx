<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
=======
import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
<<<<<<< HEAD
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Stethoscope,
  Building,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppointmentService, type Doctor, type TimeSlot, type ClinicInfo } from "@/services/AppointmentService";
import { useAuth } from "@/hooks/useAuth";

// Step definitions for the booking wizard
enum BookingStep {
  CLINIC_SELECTION = 1,
  DOCTOR_SELECTION = 2,
  DATE_TIME_SELECTION = 3,
  PATIENT_INFO = 4,
  CONFIRMATION = 5
}

// Form data interface
interface BookingFormData {
  clinicId: string;
  doctorId: string;
  selectedDate: Date | null;
  selectedTime: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  notes: string;
}

const PublicBooking: React.FC = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<BookingStep>(BookingStep.CLINIC_SELECTION);
  const [formData, setFormData] = useState<BookingFormData>({
    clinicId: '',
    doctorId: '',
    selectedDate: null,
    selectedTime: '',
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    notes: ''
  });

  // State for loading and data
  const [loading, setLoading] = useState(false);
  const [clinics, setClinics] = useState<ClinicInfo[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<ClinicInfo | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  // Load clinics on component mount
  useEffect(() => {
    const loadClinicsData = async () => {
      setLoading(true);
      try {
        // For now, use the current user's clinic if logged in
        if (user?.id) {
          const clinicInfo = await AppointmentService.getClinicInfo(user.id);
          setClinics([{ ...clinicInfo, id: user.id }]);
          setFormData(prev => ({ ...prev, clinicId: user.id }));
          setSelectedClinic({ ...clinicInfo, id: user.id });
          setCurrentStep(BookingStep.DOCTOR_SELECTION);
        }
      } catch (error) {
        console.error('Error loading clinics:', error);
        setError('حدث خطأ في تحميل بيانات العيادات');
      } finally {
        setLoading(false);
      }
    };

    loadClinicsData();
  }, [user?.id]);

  // Mock function to load clinics (replace with actual implementation)
  const loadClinics = async () => {
    setLoading(true);
    try {
      // For now, use the current user's clinic if logged in
      if (user?.id) {
        const clinicInfo = await AppointmentService.getClinicInfo(user.id);
        setClinics([{ ...clinicInfo, id: user.id }]);
        setFormData(prev => ({ ...prev, clinicId: user.id }));
        setSelectedClinic({ ...clinicInfo, id: user.id });
        setCurrentStep(BookingStep.DOCTOR_SELECTION);
      }
    } catch (error) {
      console.error('Error loading clinics:', error);
      setError('حدث خطأ في تحميل بيانات العيادات');
    } finally {
      setLoading(false);
    }
  };

  // Load doctors when clinic is selected
  const loadDoctors = async (clinicId: string) => {
    setLoading(true);
    try {
      const doctorsData = await AppointmentService.getDoctors(clinicId);
      setDoctors(doctorsData);
    } catch (error) {
      console.error('Error loading doctors:', error);
      setError('حدث خطأ في تحميل بيانات الأطباء');
    } finally {
      setLoading(false);
    }
  };

  // Load time slots when doctor and date are selected
  const loadTimeSlots = async (doctorId: string, date: Date) => {
    setLoading(true);
    try {
      const dateString = date.toISOString().split('T')[0];
      const slots = await AppointmentService.getAvailableTimeSlots(
        doctorId, 
        dateString, 
        formData.clinicId
      );
      setTimeSlots(slots);
    } catch (error) {
      console.error('Error loading time slots:', error);
      setError('حدث خطأ في تحميل المواعيد المتاحة');
    } finally {
      setLoading(false);
    }
  };

  // Handle clinic selection
  const handleClinicSelect = (clinicId: string) => {
    const clinic = clinics.find(c => c.id === clinicId);
    setSelectedClinic(clinic || null);
    setFormData(prev => ({ ...prev, clinicId }));
    loadDoctors(clinicId);
    setCurrentStep(BookingStep.DOCTOR_SELECTION);
  };

  // Handle doctor selection
  const handleDoctorSelect = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    setSelectedDoctor(doctor || null);
    setFormData(prev => ({ ...prev, doctorId }));
    setCurrentStep(BookingStep.DATE_TIME_SELECTION);
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, selectedDate: date, selectedTime: '' }));
      loadTimeSlots(formData.doctorId, date);
    }
  };

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    setFormData(prev => ({ ...prev, selectedTime: time }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (!formData.selectedDate) {
        throw new Error('يرجى اختيار التاريخ');
      }

      const requestData = {
        clinic_id: formData.clinicId,
        doctor_id: formData.doctorId,
        patient_name: formData.patientName,
        patient_phone: formData.patientPhone,
        patient_email: formData.patientEmail,
        requested_date: formData.selectedDate.toISOString().split('T')[0],
        requested_time: formData.selectedTime,
        notes: formData.notes
      };

      // @ts-expect-error - Type will be fixed in service
      await AppointmentService.createAppointmentRequest(requestData);
      setSuccess(true);
      setCurrentStep(BookingStep.CONFIRMATION);
    } catch (error) {
      console.error('Error submitting booking:', error);
      setError('حدث خطأ في إرسال طلب الحجز. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // Navigation functions
  const goToNextStep = () => {
    if (currentStep < BookingStep.CONFIRMATION) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > BookingStep.CLINIC_SELECTION) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case BookingStep.CLINIC_SELECTION:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Building className="mx-auto h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">اختر العيادة</h3>
              <p className="text-muted-foreground">اختر العيادة التي تريد حجز موعد بها</p>
            </div>
            
            {loading ? (
              <div className="text-center py-8">جاري تحميل العيادات...</div>
            ) : (
              <div className="grid gap-3">
                {clinics.map((clinic) => (
                  <Card 
                    key={clinic.id} 
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      formData.clinicId === clinic.id && "border-primary"
                    )}
                    onClick={() => handleClinicSelect(clinic.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">{clinic.clinic_name}</h4>
                          {clinic.clinic_address && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {clinic.clinic_address}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case BookingStep.DOCTOR_SELECTION:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Stethoscope className="mx-auto h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">اختر الطبيب</h3>
              <p className="text-muted-foreground">اختر الطبيب المناسب لك</p>
            </div>
            
            {loading ? (
              <div className="text-center py-8">جاري تحميل الأطباء...</div>
            ) : (
              <div className="grid gap-3">
                {doctors.map((doctor) => (
                  <Card 
                    key={doctor.id} 
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      formData.doctorId === doctor.id && "border-primary"
                    )}
                    onClick={() => handleDoctorSelect(doctor.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Stethoscope className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">{doctor.name}</h4>
                          <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case BookingStep.DATE_TIME_SELECTION:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CalendarIcon className="mx-auto h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">اختر التاريخ والوقت</h3>
              <p className="text-muted-foreground">اختر التاريخ والوقت المناسب لموعدك</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="text-base font-medium mb-3 block">اختر التاريخ</Label>
                <Calendar
                  mode="single"
                  selected={formData.selectedDate || undefined}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date() || date.getDay() === 5} // Disable past dates and Fridays
                  className="rounded-md border"
                  dir="rtl"
                />
              </div>
              
              <div>
                <Label className="text-base font-medium mb-3 block">اختر الوقت</Label>
                {formData.selectedDate ? (
                  loading ? (
                    <div className="text-center py-8">جاري تحميل المواعيد...</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                      {timeSlots.filter(slot => slot.is_available).map((slot) => (
                        <Button
                          key={slot.id}
                          variant={formData.selectedTime === slot.start_time ? "default" : "outline"}
                          size="sm"
                          className="text-sm"
                          onClick={() => handleTimeSelect(slot.start_time)}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {slot.start_time}
                        </Button>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    اختر التاريخ أولاً لعرض المواعيد المتاحة
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case BookingStep.PATIENT_INFO:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <User className="mx-auto h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">بيانات المريض</h3>
              <p className="text-muted-foreground">أدخل بياناتك الشخصية</p>
            </div>
            
            <div className="grid gap-4">
              <div>
                <Label htmlFor="patientName">الاسم الكامل *</Label>
                <Input
                  id="patientName"
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                  placeholder="أدخل اسمك الكامل"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="patientPhone">رقم الهاتف *</Label>
                <Input
                  id="patientPhone"
                  type="tel"
                  value={formData.patientPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, patientPhone: e.target.value }))}
                  placeholder="أدخل رقم هاتفك"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="patientEmail">البريد الإلكتروني</Label>
                <Input
                  id="patientEmail"
                  type="email"
                  value={formData.patientEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, patientEmail: e.target.value }))}
                  placeholder="أدخل بريدك الإلكتروني (اختياري)"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">ملاحظات إضافية</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="أي ملاحظات أو تفاصيل إضافية"
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case BookingStep.CONFIRMATION:
        return (
          <div className="space-y-6">
            {success ? (
              <div className="text-center">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-green-700 mb-2">تم إرسال طلب الحجز بنجاح!</h3>
                <p className="text-muted-foreground mb-4">
                  سيتم مراجعة طلبك والتواصل معك قريباً لتأكيد الموعد
                </p>
                <Badge variant="outline" className="text-sm">
                  سيتم التواصل معك خلال 24 ساعة
                </Badge>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">مراجعة بيانات الحجز</h3>
                  <p className="text-muted-foreground">تأكد من صحة البيانات قبل الإرسال</p>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">العيادة:</span>
                    <span>{selectedClinic?.clinic_name}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-medium">الطبيب:</span>
                    <span>{selectedDoctor?.name}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-medium">التاريخ:</span>
                    <span>{formData.selectedDate?.toLocaleDateString('ar-SA')}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-medium">الوقت:</span>
                    <span>{formData.selectedTime}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-medium">المريض:</span>
                    <span>{formData.patientName}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-medium">الهاتف:</span>
                    <span>{formData.patientPhone}</span>
                  </div>
                  {formData.patientEmail && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="font-medium">البريد الإلكتروني:</span>
                        <span>{formData.patientEmail}</span>
                      </div>
                    </>
                  )}
                  {formData.notes && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="font-medium">الملاحظات:</span>
                        <span className="text-right">{formData.notes}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Check if current step is valid
  const isStepValid = () => {
    switch (currentStep) {
      case BookingStep.CLINIC_SELECTION:
        return !!formData.clinicId;
      case BookingStep.DOCTOR_SELECTION:
        return !!formData.doctorId;
      case BookingStep.DATE_TIME_SELECTION:
        return !!formData.selectedDate && !!formData.selectedTime;
      case BookingStep.PATIENT_INFO:
        return !!formData.patientName && !!formData.patientPhone;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">حجز موعد</CardTitle>
          <CardDescription>احجز موعدك مع أفضل الأطباء</CardDescription>
          
          {/* Progress indicator */}
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    step < currentStep ? "bg-primary text-primary-foreground" :
                    step === currentStep ? "bg-primary text-primary-foreground" :
                    "bg-muted text-muted-foreground"
                  )}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {renderStepContent()}
          
          {/* Navigation buttons */}
          {!success && (
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={goToPreviousStep}
                disabled={currentStep === BookingStep.CLINIC_SELECTION}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                السابق
              </Button>
              
              {currentStep === BookingStep.PATIENT_INFO ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!isStepValid() || loading}
                >
                  {loading ? 'جاري الإرسال...' : 'إرسال طلب الحجز'}
                  <CheckCircle className="w-4 h-4 ml-2" />
                </Button>
              ) : currentStep < BookingStep.CONFIRMATION ? (
                <Button
                  onClick={goToNextStep}
                  disabled={!isStepValid()}
                >
                  التالي
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
=======
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
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
    </div>
  );
};

export default PublicBooking;