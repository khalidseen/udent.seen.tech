import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CalendarPlus, Save, Plus, Search, User, X } from "lucide-react";

interface AddAppointmentDialogProps {
  onAppointmentAdded?: () => void;
}

interface Patient {
  id: string;
  full_name: string;
  phone: string;
}

const AddAppointmentDialog = ({ onAppointmentAdded }: AddAppointmentDialogProps) => {
  const [open, setOpen] = useState(false);
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
      setOpen(false);
      onAppointmentAdded?.();

    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 ml-2" />
          إضافة موعد جديد
        </Button>
      </DialogTrigger>
      <DialogContent className="w-screen h-screen max-w-none max-h-none p-0 m-0 rounded-none overflow-hidden">
        {/* Custom Header with Close Button */}
        <div className="sticky top-0 z-50 bg-background border-b border-border p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarPlus className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">إضافة موعد جديد</h2>
              <p className="text-sm text-muted-foreground">أدخل بيانات الموعد الجديد في النموذج أدناه</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setOpen(false)}
            className="h-10 w-10 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 dark:hover:border-red-700 dark:hover:text-red-300"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="h-[calc(100vh-160px)] overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
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
                      placeholder="+201234567890"
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
              
              {/* السطر الأول: التاريخ، الوقت، المدة */}
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

              {/* السطر الثاني: نوع العلاج، مستوى الطوارئ */}
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
                      <SelectItem value="orthodontics">تقويم الأسنان</SelectItem>
                      <SelectItem value="surgery">جراحة الفم</SelectItem>
                      <SelectItem value="checkup">فحص دوري</SelectItem>
                      <SelectItem value="emergency">طوارئ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_level">مستوى الأولوية</Label>
                  <Select value={formData.emergency_level} onValueChange={(value) => handleFormChange('emergency_level', value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="اختر مستوى الأولوية" />
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
        <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border p-4">
          <div className="flex gap-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={loading}
              onClick={handleSubmit}
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

export default AddAppointmentDialog;