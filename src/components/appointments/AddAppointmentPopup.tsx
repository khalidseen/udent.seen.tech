import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CalendarPlus, Save, X, AlertTriangle } from "lucide-react";

interface AddAppointmentPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAppointmentAdded?: () => void;
  preselectedDate?: string;
}

interface Patient {
  id: string;
  full_name: string;
  phone: string;
}

import { TREATMENT_TYPES } from "@/constants/treatmentTypes";

const AddAppointmentPopup = ({ open, onOpenChange, onAppointmentAdded, preselectedDate }: AddAppointmentPopupProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientType, setPatientType] = useState<'existing' | 'new'>('existing');
  const [loading, setLoading] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [conflictOverride, setConflictOverride] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);
  
  const [activeDoctors, setActiveDoctors] = useState<{id: string; full_name: string; specialization: string | null}[]>([]);
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: preselectedDate || '',
    appointment_time: '',
    duration: '30',
    treatment_type: '',
    notes: '',
    emergency_level: 'routine',
    chief_complaint: '',
  });

  const [newPatientData, setNewPatientData] = useState({
    full_name: '',
    phone: '',
    email: '',
  });

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Check for conflicts when date/time changes
    if (field === 'appointment_date' || field === 'appointment_time' || field === 'duration') {
      const updated = { ...formData, [field]: value };
      if (updated.appointment_date && updated.appointment_time) {
        checkConflicts(updated.appointment_date, updated.appointment_time, parseInt(updated.duration));
        setConflictOverride(false);
      }
    }
  };

  const handlePatientChange = (field: string, value: string) => {
    setNewPatientData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      patient_id: '',
      doctor_id: '',
      appointment_date: preselectedDate || '',
      appointment_time: '',
      duration: '30',
      treatment_type: '',
      notes: '',
      emergency_level: 'routine',
      chief_complaint: '',
    });
    setNewPatientData({ full_name: '', phone: '', email: '' });
    setPatientType('existing');
    setConflictWarning(null);
    setConflictOverride(false);
  };

  // Fetch clinic_id once
  useEffect(() => {
    const fetchClinicId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (profile) setClinicId(profile.id);
    };
    fetchClinicId();
  }, []);

  // Fetch patients filtered by clinic
  useEffect(() => {
    const fetchPatients = async () => {
      if (!clinicId) return;
      const { data } = await supabase
        .from('patients')
        .select('id, full_name, phone')
        .eq('clinic_id', clinicId)
        .eq('patient_status', 'active')
        .order('full_name');
      if (data) setPatients(data);
    };
    if (open && clinicId) fetchPatients();
  }, [open, clinicId]);

  // Fetch active doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!clinicId) return;
      const { data } = await supabase
        .from('doctors')
        .select('id, full_name, specialization')
        .eq('clinic_id', clinicId)
        .eq('status', 'active')
        .order('full_name');
      if (data) setActiveDoctors(data);
    };
    if (open && clinicId) fetchDoctors();
  }, [open, clinicId]);

  // Conflict detection
  const checkConflicts = useCallback(async (date: string, time: string, duration: number) => {
    if (!clinicId) return;
    
    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    
    let query = supabase
      .from('appointments')
      .select('id, appointment_date, duration, patients(full_name)')
      .eq('clinic_id', clinicId)
      .gte('appointment_date', `${date}T00:00:00`)
      .lte('appointment_date', `${date}T23:59:59`)
      .in('status', ['scheduled', 'confirmed']);

    // Filter by selected doctor
    if (formData.doctor_id && formData.doctor_id !== 'none') {
      query = query.eq('doctor_id', formData.doctor_id);
    }

    const { data: existing } = await query;

    if (existing && existing.length > 0) {
      const conflicts = existing.filter(apt => {
        const aptStart = new Date(apt.appointment_date);
        const aptEnd = new Date(aptStart.getTime() + (apt.duration || 30) * 60000);
        return (startTime < aptEnd && endTime > aptStart);
      });

      if (conflicts.length > 0) {
        const names = conflicts.map(c => (c.patients as any)?.full_name || 'مريض').join('، ');
        setConflictWarning(`⚠️ تعارض مع موعد: ${names}`);
      } else {
        setConflictWarning(null);
      }
    } else {
      setConflictWarning(null);
    }
  }, [clinicId, formData.doctor_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.appointment_date || !formData.appointment_time) {
      toast({ title: 'خطأ', description: 'يجب إدخال تاريخ ووقت الموعد', variant: 'destructive' });
      return;
    }

    if (!formData.doctor_id || formData.doctor_id === 'none') {
      toast({ title: 'خطأ', description: 'يجب اختيار الطبيب المعالج', variant: 'destructive' });
      return;
    }

    if (patientType === 'existing' && !formData.patient_id) {
      toast({ title: 'خطأ', description: 'يجب اختيار المريض', variant: 'destructive' });
      return;
    }

    if (patientType === 'new' && !newPatientData.full_name.trim()) {
      toast({ title: 'خطأ', description: 'يجب إدخال اسم المريض الجديد', variant: 'destructive' });
      return;
    }

    // Validate appointment is not in the past
    const appointmentDT = new Date(`${formData.appointment_date}T${formData.appointment_time}:00`);
    if (appointmentDT < new Date()) {
      toast({ title: 'خطأ', description: 'لا يمكن حجز موعد في الماضي', variant: 'destructive' });
      return;
    }

    if (conflictWarning && !conflictOverride) {
      toast({ title: 'تعارض مواعيد', description: 'يوجد تعارض مع موعد آخر. اضغط مرة أخرى للتأكيد.', variant: 'destructive' });
      setConflictOverride(true);
      return;
    }

    setLoading(true);
    
    try {
      if (!clinicId) throw new Error('لم يتم العثور على ملف المستخدم');

      let patient_id = formData.patient_id;

      // Create new patient if needed
      if (patientType === 'new') {
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert([{
            full_name: newPatientData.full_name,
            phone: newPatientData.phone || null,
            email: newPatientData.email || null,
            clinic_id: clinicId
          }])
          .select('id')
          .single();

        if (patientError) throw patientError;
        patient_id = newPatient.id;
      }

      const appointmentDateTime = `${formData.appointment_date}T${formData.appointment_time}:00`;

      const noteParts = [];
      if (formData.chief_complaint) noteParts.push(`سبب الزيارة: ${formData.chief_complaint}`);
      if (formData.notes) noteParts.push(formData.notes);

      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert([{
          patient_id,
          clinic_id: clinicId,
          doctor_id: formData.doctor_id,
          appointment_date: appointmentDateTime,
          duration: parseInt(formData.duration),
          treatment_type: formData.treatment_type || null,
          notes: noteParts.join('\n') || null,
          status: formData.emergency_level === 'emergency' ? 'confirmed' : 'scheduled'
        } as any]);

      if (appointmentError) throw appointmentError;

      toast({
        title: 'تم بنجاح',
        description: patientType === 'new' ? 'تم إضافة المريض وحجز الموعد بنجاح' : 'تم إضافة الموعد بنجاح'
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
        <div className="sticky top-0 z-50 bg-background border-b border-border p-6 flex items-center justify-between">
          <DialogHeader className="flex-1">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <CalendarPlus className="w-6 h-6 text-primary" />
              إضافة موعد جديد
            </DialogTitle>
          </DialogHeader>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-10 w-10 hover:bg-muted">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
            
            {/* Conflict Warning */}
            {conflictWarning && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{conflictWarning}</AlertDescription>
              </Alert>
            )}

            {/* Patient Selection */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">اختيار المريض</h3>
              
              <RadioGroup value={patientType} onValueChange={(value: 'existing' | 'new') => setPatientType(value)} className="flex gap-6">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="existing" id="popup-existing" />
                  <Label htmlFor="popup-existing">مريض موجود</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="new" id="popup-new" />
                  <Label htmlFor="popup-new">مريض جديد</Label>
                </div>
              </RadioGroup>
              
              {patientType === 'existing' ? (
                <div className="space-y-2">
                  <Label>اختر المريض *</Label>
                  <Select value={formData.patient_id} onValueChange={(value) => handleFormChange('patient_id', value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="اختر المريض" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.full_name} {patient.phone ? `- ${patient.phone}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>اسم المريض *</Label>
                    <Input value={newPatientData.full_name} onChange={(e) => handlePatientChange('full_name', e.target.value)} placeholder="الاسم الكامل" className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الهاتف</Label>
                    <Input value={newPatientData.phone} onChange={(e) => handlePatientChange('phone', e.target.value)} placeholder="05xxxxxxxx" type="tel" className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input value={newPatientData.email} onChange={(e) => handlePatientChange('email', e.target.value)} type="email" className="h-11" />
                  </div>
                </div>
              )}
            </div>

            {/* Appointment Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">تفاصيل الموعد</h3>
              
              {/* Doctor Selection */}
              <div className="space-y-2">
                <Label>الطبيب المعالج *</Label>
                <Select value={formData.doctor_id} onValueChange={(value) => handleFormChange('doctor_id', value)}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="اختر الطبيب" /></SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    {activeDoctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        د. {doctor.full_name} {doctor.specialization ? `- ${doctor.specialization}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!formData.doctor_id && (
                  <p className="text-xs text-destructive">مطلوب</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>تاريخ الموعد *</Label>
                  <Input type="date" value={formData.appointment_date} onChange={(e) => handleFormChange('appointment_date', e.target.value)} className="h-11" min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-2">
                  <Label>وقت الموعد *</Label>
                  <Input type="time" value={formData.appointment_time} onChange={(e) => handleFormChange('appointment_time', e.target.value)} className="h-11" min="08:00" max="22:00" />
                </div>
                <div className="space-y-2">
                  <Label>مدة الموعد (دقيقة)</Label>
                  <Select value={formData.duration} onValueChange={(value) => handleFormChange('duration', value)}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نوع العلاج</Label>
                  <Select value={formData.treatment_type} onValueChange={(value) => handleFormChange('treatment_type', value)}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="اختر نوع العلاج" /></SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      {TREATMENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>مستوى الأولوية</Label>
                  <Select value={formData.emergency_level} onValueChange={(value) => handleFormChange('emergency_level', value)}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      <SelectItem value="routine">عادي</SelectItem>
                      <SelectItem value="urgent">عاجل</SelectItem>
                      <SelectItem value="emergency">طوارئ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>سبب الزيارة / الشكوى الرئيسية</Label>
                <Textarea value={formData.chief_complaint} onChange={(e) => handleFormChange('chief_complaint', e.target.value)} placeholder="وصف الحالة والأعراض..." rows={3} className="resize-none" />
              </div>

              <div className="space-y-2">
                <Label>ملاحظات إضافية</Label>
                <Textarea value={formData.notes} onChange={(e) => handleFormChange('notes', e.target.value)} placeholder="أي ملاحظات أو تعليمات خاصة..." rows={3} className="resize-none" />
              </div>
            </div>
          </form>
        </div>

        <div className="sticky bottom-0 bg-background border-t border-border p-6">
          <div className="max-w-4xl mx-auto flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false); }} disabled={loading} className="px-8 h-12">
              إلغاء
            </Button>
            <Button type="button" disabled={loading} onClick={handleSubmit} className="px-8 h-12">
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
