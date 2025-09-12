import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CalendarPlus, Save, X } from "lucide-react";

interface AddAppointmentPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAppointmentAdded?: () => void;
}

interface Patient {
  id: string;
  full_name: string;
  phone: string;
}

const AddAppointmentPopup = ({ open, onOpenChange, onAppointmentAdded }: AddAppointmentPopupProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientType, setPatientType] = useState<'existing' | 'new'>('existing');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_date: '',
    appointment_time: '',
    duration: '30',
    treatment_type: '',
    notes: '',
    emergency_level: 'routine',
    chief_complaint: '',
    estimated_cost: '',
    requires_anesthesia: 'false',
    follow_up_required: 'false'
  });

  const [newPatientData, setNewPatientData] = useState({
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: '',
    address: '',
    medical_history: '',
    blood_type: '',
    allergies: '',
    current_medications: '',
    insurance_info: '',
    emergency_contact: '',
    emergency_phone: ''
  });

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePatientChange = (field: string, value: string) => {
    setNewPatientData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      patient_id: '',
      appointment_date: '',
      appointment_time: '',
      duration: '30',
      treatment_type: '',
      notes: '',
      emergency_level: 'routine',
      chief_complaint: '',
      estimated_cost: '',
      requires_anesthesia: 'false',
      follow_up_required: 'false'
    });
    setNewPatientData({
      full_name: '',
      phone: '',
      email: '',
      date_of_birth: '',
      gender: '',
      address: '',
      medical_history: '',
      blood_type: '',
      allergies: '',
      current_medications: '',
      insurance_info: '',
      emergency_contact: '',
      emergency_phone: ''
    });
    setPatientType('existing');
  };

  // Fetch patients
  useEffect(() => {
    const fetchPatients = async () => {
      const { data } = await supabase
        .from('patients')
        .select('id, full_name, phone')
        .eq('patient_status', 'active')
        .order('full_name');
      
      if (data) setPatients(data);
    };

    if (open) {
      fetchPatients();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.appointment_date || !formData.appointment_time) {
      toast({
        title: 'خطأ',
        description: 'يجب إدخال تاريخ ووقت الموعد',
        variant: 'destructive'
      });
      return;
    }

    if (patientType === 'existing' && !formData.patient_id) {
      toast({
        title: 'خطأ',
        description: 'يجب اختيار المريض',
        variant: 'destructive'
      });
      return;
    }

    if (patientType === 'new' && !newPatientData.full_name.trim()) {
      toast({
        title: 'خطأ',
        description: 'يجب إدخال اسم المريض الجديد',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      let patient_id = formData.patient_id;

      // If new patient, create patient first
      if (patientType === 'new') {
        // Get current user's clinic_id
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        if (!userProfile) throw new Error('لم يتم العثور على ملف المستخدم');

        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert([{
            ...newPatientData,
            clinic_id: userProfile.id
          }])
          .select('id')
          .single();

        if (patientError) throw patientError;
        patient_id = newPatient.id;
      }

      // Get clinic_id for appointment
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!userProfile) throw new Error('لم يتم العثور على ملف المستخدم');

      // Combine date and time for appointment_date
      const appointmentDateTime = `${formData.appointment_date}T${formData.appointment_time}:00`;

      // Create appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert([{
          patient_id,
          clinic_id: userProfile.id,
          appointment_date: appointmentDateTime,
          duration: parseInt(formData.duration),
          treatment_type: formData.treatment_type || null,
          notes: formData.notes || null,
          status: 'scheduled'
        }]);

      if (appointmentError) throw appointmentError;

      toast({
        title: 'تم بنجاح',
        description: 'تم إضافة الموعد بنجاح'
      });

      resetForm();
      onOpenChange(false);
      onAppointmentAdded?.();

    } catch (error: unknown) {
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none p-0 m-0 rounded-none overflow-hidden">
        {/* Custom Header with Close Button */}
        <div className="sticky top-0 z-50 bg-background border-b border-border p-6 flex items-center justify-between">
          <DialogHeader className="flex-1">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <CalendarPlus className="w-6 h-6 text-primary" />
              إضافة موعد جديد
            </DialogTitle>
          </DialogHeader>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-10 w-10 hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
            
            {/* Patient Selection */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">اختيار المريض</h3>
              
              <RadioGroup value={patientType} onValueChange={(value: 'existing' | 'new') => setPatientType(value)} className="flex gap-6">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="existing" id="existing" />
                  <Label htmlFor="existing">مريض موجود</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="new" id="new" />
                  <Label htmlFor="new">مريض جديد</Label>
                </div>
              </RadioGroup>
              
              {patientType === 'existing' ? (
                <div className="space-y-2">
                  <Label htmlFor="patient_id">اختر المريض *</Label>
                  <Select value={formData.patient_id} onValueChange={(value) => handleFormChange('patient_id', value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="اختر المريض" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.full_name} - {patient.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new_patient_name">اسم المريض الجديد *</Label>
                    <Input
                      id="new_patient_name"
                      value={newPatientData.full_name}
                      onChange={(e) => handlePatientChange('full_name', e.target.value)}
                      placeholder="الاسم الكامل"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_patient_phone">رقم الهاتف *</Label>
                    <Input
                      id="new_patient_phone"
                      value={newPatientData.phone}
                      onChange={(e) => handlePatientChange('phone', e.target.value)}
                      placeholder="05xxxxxxxx"
                      type="tel"
                      className="h-11"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Appointment Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">تفاصيل الموعد</h3>
              
              {/* الصف الأول: التاريخ، الوقت، المدة */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appointment_date">تاريخ الموعد *</Label>
                  <Input
                    id="appointment_date"
                    type="date"
                    value={formData.appointment_date}
                    onChange={(e) => handleFormChange('appointment_date', e.target.value)}
                    className="h-11"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointment_time">وقت الموعد *</Label>
                  <Input
                    id="appointment_time"
                    type="time"
                    value={formData.appointment_time}
                    onChange={(e) => handleFormChange('appointment_time', e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">مدة الموعد (دقيقة)</Label>
                  <Select value={formData.duration} onValueChange={(value) => handleFormChange('duration', value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="اختر المدة" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      <SelectItem value="15">15 دقيقة</SelectItem>
                      <SelectItem value="30">30 دقيقة</SelectItem>
                      <SelectItem value="45">45 دقيقة</SelectItem>
                      <SelectItem value="60">60 دقيقة</SelectItem>
                      <SelectItem value="90">90 دقيقة</SelectItem>
                      <SelectItem value="120">120 دقيقة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* الصف الثاني: نوع العلاج، مستوى الطوارئ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="treatment_type">نوع العلاج</Label>
                  <Select value={formData.treatment_type} onValueChange={(value) => handleFormChange('treatment_type', value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="اختر نوع العلاج" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      <SelectItem value="consultation">استشارة</SelectItem>
                      <SelectItem value="cleaning">تنظيف الأسنان</SelectItem>
                      <SelectItem value="filling">حشو الأسنان</SelectItem>
                      <SelectItem value="extraction">خلع الأسنان</SelectItem>
                      <SelectItem value="root_canal">علاج الجذور</SelectItem>
                      <SelectItem value="crown">تركيب تاج</SelectItem>
                      <SelectItem value="bridge">تركيب جسر</SelectItem>
                      <SelectItem value="implant">زراعة أسنان</SelectItem>
                      <SelectItem value="orthodontics">تقويم الأسنان</SelectItem>
                      <SelectItem value="whitening">تبييض الأسنان</SelectItem>
                      <SelectItem value="surgery">جراحة فموية</SelectItem>
                      <SelectItem value="emergency">طوارئ</SelectItem>
                      <SelectItem value="follow_up">متابعة</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_level">مستوى الطوارئ</Label>
                  <Select value={formData.emergency_level} onValueChange={(value) => handleFormChange('emergency_level', value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="اختر المستوى" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      <SelectItem value="routine">عادي</SelectItem>
                      <SelectItem value="urgent">عاجل</SelectItem>
                      <SelectItem value="emergency">طوارئ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chief_complaint">الشكوى الرئيسية</Label>
                <Textarea
                  id="chief_complaint"
                  value={formData.chief_complaint}
                  onChange={(e) => handleFormChange('chief_complaint', e.target.value)}
                  placeholder="وصف الحالة والأعراض..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات إضافية</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  placeholder="أي ملاحظات أو تعليمات خاصة..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Fixed Action Buttons */}
        <div className="sticky bottom-0 bg-background border-t border-border p-6">
          <div className="max-w-4xl mx-auto flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={loading}
              className="px-8 h-12"
            >
              إلغاء
            </Button>
            <Button 
              type="button" 
              disabled={loading}
              onClick={handleSubmit}
              className="px-8 h-12"
            >
              <Save className="w-4 h-4 ml-2" />
              {loading ? 'جاري الحفظ...' : 'حفظ الموعد'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddAppointmentPopup;
