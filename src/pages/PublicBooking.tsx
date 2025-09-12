import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

      await (AppointmentService as any).createAppointmentRequest(requestData as any);
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
    </div>
  );
};

export default PublicBooking;