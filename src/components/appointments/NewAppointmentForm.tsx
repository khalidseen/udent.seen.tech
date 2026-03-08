import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  CalendarPlus, Clock, User, Stethoscope, UserPlus, FileText,
  Search, Phone, Mail, X, FileUser, AlertTriangle, CheckCircle2,
  ArrowLeft, ArrowRight, Calendar, Shield, DollarSign, Activity
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  medical_condition?: string;
  blood_type?: string;
  created_at?: string;
}

interface ExistingAppointment {
  id: string;
  appointment_date: string;
  duration: number;
  status: string;
  treatment_type?: string;
  patients?: { full_name: string };
}

const TREATMENT_TYPES = [
  { value: 'فحص عام ودوري', label: 'فحص عام ودوري', icon: '🔍', duration: 30 },
  { value: 'تنظيف الأسنان', label: 'تنظيف الأسنان', icon: '🪥', duration: 45 },
  { value: 'حشو الأسنان', label: 'حشو الأسنان', icon: '🦷', duration: 45 },
  { value: 'خلع الأسنان', label: 'خلع الأسنان', icon: '🔧', duration: 30 },
  { value: 'علاج عصب', label: 'علاج عصب', icon: '💉', duration: 60 },
  { value: 'تركيب تاج', label: 'تركيب تاج', icon: '👑', duration: 60 },
  { value: 'تركيب جسر', label: 'تركيب جسر', icon: '🌉', duration: 90 },
  { value: 'زراعة أسنان', label: 'زراعة أسنان', icon: '🔩', duration: 120 },
  { value: 'تقويم الأسنان', label: 'تقويم الأسنان', icon: '📐', duration: 45 },
  { value: 'تبييض الأسنان', label: 'تبييض الأسنان', icon: '✨', duration: 60 },
  { value: 'جراحة فموية', label: 'جراحة فموية', icon: '🏥', duration: 90 },
  { value: 'علاج اللثة', label: 'علاج اللثة', icon: '🩺', duration: 45 },
  { value: 'علاج أطفال', label: 'علاج أطفال', icon: '👶', duration: 30 },
  { value: 'طوارئ', label: 'طوارئ', icon: '🚨', duration: 30 },
  { value: 'متابعة', label: 'متابعة', icon: '🔄', duration: 15 },
  { value: 'استشارة', label: 'استشارة', icon: '💬', duration: 30 },
  { value: 'أخرى', label: 'أخرى', icon: '📋', duration: 30 },
];

const STEPS = [
  { id: 1, title: 'المريض', icon: User },
  { id: 2, title: 'الموعد', icon: Calendar },
  { id: 3, title: 'التفاصيل', icon: Stethoscope },
  { id: 4, title: 'مراجعة', icon: CheckCircle2 },
];

const NewAppointmentForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patient');

  const [currentStep, setCurrentStep] = useState(1);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientType, setPatientType] = useState<'existing' | 'new'>('existing');
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<ExistingAppointment[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [formData, setFormData] = useState({
    patient_id: preselectedPatientId || '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    duration: '30',
    treatment_type: '',
    notes: '',
    emergency_level: 'routine',
    chief_complaint: '',
    estimated_cost: '',
    requires_anesthesia: false,
    follow_up_required: false,
  });

  const [newPatientData, setNewPatientData] = useState({
    full_name: '', phone: '', email: '', date_of_birth: '', gender: '',
    address: '', medical_history: '', blood_type: '', emergency_contact: '',
    emergency_phone: '', insurance_info: '',
  });

  // Fetch clinic_id
  useEffect(() => {
    const fetchClinic = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
      if (profile) setClinicId(profile.id);
    };
    fetchClinic();
  }, []);

  // Fetch active doctors
  const [activeDoctors, setActiveDoctors] = useState<{id: string; full_name: string; specialization: string | null}[]>([]);
  useEffect(() => {
    if (!clinicId) return;
    const fetchDoctors = async () => {
      const { data } = await supabase
        .from('doctors')
        .select('id, full_name, specialization')
        .eq('clinic_id', clinicId)
        .eq('status', 'active')
        .order('full_name');
      if (data) setActiveDoctors(data);
    };
    fetchDoctors();
  }, [clinicId]);

  // Fetch patients filtered by clinic
  useEffect(() => {
    if (!clinicId) return;
    const fetchPatients = async () => {
      const { data } = await supabase
        .from('patients')
        .select('id, full_name, phone, email, date_of_birth, gender, medical_condition, blood_type, created_at')
        .eq('clinic_id', clinicId)
        .eq('patient_status', 'active')
        .order('full_name');
      if (data) {
        setPatients(data);
        // Auto-select preselected patient
        if (preselectedPatientId) {
          const found = data.find(p => p.id === preselectedPatientId);
          if (found) {
            setSelectedPatient(found);
            setPatientSearchTerm(found.full_name);
          }
        }
      }
    };
    fetchPatients();
  }, [clinicId, preselectedPatientId]);

  // Filtered patients
  const filteredPatients = patientSearchTerm
    ? patients.filter(p =>
        p.full_name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
        p.phone?.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(patientSearchTerm.toLowerCase())
      )
    : patients;

  // Fetch today's appointments for sidebar
  useEffect(() => {
    if (!clinicId) return;
    const fetchToday = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('appointments')
        .select('id, appointment_date, duration, status, treatment_type, patients(full_name)')
        .eq('clinic_id', clinicId)
        .gte('appointment_date', `${today}T00:00:00`)
        .lte('appointment_date', `${today}T23:59:59`)
        .in('status', ['scheduled', 'confirmed'])
        .order('appointment_date', { ascending: true });
      if (data) setTodayAppointments(data as ExistingAppointment[]);
    };
    fetchToday();
  }, [clinicId]);

  // Conflict detection
  const checkConflicts = useCallback(async (date: string, time: string, duration: number) => {
    if (!clinicId || !date || !time) return;
    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    const { data: existing } = await supabase
      .from('appointments')
      .select('id, appointment_date, duration, patients(full_name)')
      .eq('clinic_id', clinicId)
      .gte('appointment_date', `${date}T00:00:00`)
      .lte('appointment_date', `${date}T23:59:59`)
      .in('status', ['scheduled', 'confirmed']);

    if (existing && existing.length > 0) {
      const conflicts = existing.filter(apt => {
        const aptStart = new Date(apt.appointment_date);
        const aptEnd = new Date(aptStart.getTime() + (apt.duration || 30) * 60000);
        return startTime < aptEnd && endTime > aptStart;
      });
      if (conflicts.length > 0) {
        const names = conflicts.map(c => (c.patients as any)?.full_name || 'مريض').join('، ');
        setConflictWarning(`تعارض مع موعد: ${names}`);
      } else {
        setConflictWarning(null);
      }
    } else {
      setConflictWarning(null);
    }
  }, [clinicId]);

  const handleChange = (field: string, value: string | boolean) => {
    if (field === 'treatment_type' && typeof value === 'string') {
      const treatment = TREATMENT_TYPES.find(t => t.value === value);
      if (treatment) {
        setFormData(prev => ({ ...prev, treatment_type: value, duration: String(treatment.duration) }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'appointment_date' || field === 'appointment_time' || field === 'duration') {
      const updated = { ...formData, [field]: value };
      checkConflicts(
        String(updated.appointment_date),
        String(updated.appointment_time),
        parseInt(String(updated.duration))
      );
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({ ...prev, patient_id: patient.id }));
    setPatientSearchTerm(patient.full_name);
  };

  const clearPatientSelection = () => {
    setSelectedPatient(null);
    setFormData(prev => ({ ...prev, patient_id: '' }));
    setPatientSearchTerm('');
  };

  const canProceedStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (patientType === 'existing') return !!formData.patient_id;
        return !!newPatientData.full_name.trim();
      case 2:
        return !!formData.appointment_date && !!formData.appointment_time;
      case 3:
        return !!formData.chief_complaint.trim();
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!clinicId) return;
    setLoading(true);

    try {
      let finalPatientId = formData.patient_id;

      if (patientType === 'new') {
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            clinic_id: clinicId,
            full_name: newPatientData.full_name,
            phone: newPatientData.phone || null,
            email: newPatientData.email || null,
            date_of_birth: newPatientData.date_of_birth || null,
            gender: newPatientData.gender || null,
            address: newPatientData.address || null,
            medical_history: newPatientData.medical_history || null,
            blood_type: newPatientData.blood_type || null,
            emergency_contact: newPatientData.emergency_contact || null,
            emergency_phone: newPatientData.emergency_phone || null,
            insurance_info: newPatientData.insurance_info || null,
          })
          .select('id')
          .single();
        if (patientError) throw patientError;
        finalPatientId = newPatient.id;
      }

      const appointmentDateTime = `${formData.appointment_date}T${formData.appointment_time}:00`;

      const noteParts: string[] = [];
      if (formData.chief_complaint) noteParts.push(`سبب الزيارة: ${formData.chief_complaint}`);
      if (formData.notes) noteParts.push(formData.notes);
      if (formData.estimated_cost) noteParts.push(`التكلفة المقدرة: ${formData.estimated_cost}`);
      if (formData.requires_anesthesia) noteParts.push('يتطلب تخدير');
      if (formData.follow_up_required) noteParts.push('يتطلب متابعة');

      const { error } = await supabase.from('appointments').insert({
        patient_id: finalPatientId,
        clinic_id: clinicId,
        doctor_id: formData.doctor_id && formData.doctor_id !== 'none' ? formData.doctor_id : null,
        appointment_date: appointmentDateTime,
        duration: parseInt(formData.duration),
        treatment_type: formData.treatment_type || null,
        notes: noteParts.join('\n') || null,
        status: formData.emergency_level === 'emergency' ? 'confirmed' : 'scheduled',
      } as any);

      if (error) throw error;

      toast({
        title: '✅ تم بنجاح',
        description: patientType === 'new' ? 'تم إضافة المريض وحجز الموعد بنجاح' : 'تم حجز الموعد بنجاح',
      });

      navigate('/appointments');
    } catch (error: unknown) {
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Step renderer
  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Patient Type */}
      <RadioGroup value={patientType} onValueChange={(v: 'existing' | 'new') => {
        setPatientType(v);
        clearPatientSelection();
      }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Label htmlFor="step-existing" className={cn(
            "flex items-center gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all",
            patientType === 'existing' ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40"
          )}>
            <RadioGroupItem value="existing" id="step-existing" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-foreground">مريض مسجل</div>
                <div className="text-sm text-muted-foreground">ابحث في قائمة المرضى</div>
              </div>
            </div>
          </Label>
          <Label htmlFor="step-new" className={cn(
            "flex items-center gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all",
            patientType === 'new' ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40"
          )}>
            <RadioGroupItem value="new" id="step-new" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-foreground">مريض جديد</div>
                <div className="text-sm text-muted-foreground">تسجيل مريض جديد</div>
              </div>
            </div>
          </Label>
        </div>
      </RadioGroup>

      {/* Existing Patient Search */}
      {patientType === 'existing' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={patientSearchTerm}
              onChange={(e) => {
                setPatientSearchTerm(e.target.value);
                if (selectedPatient && e.target.value !== selectedPatient.full_name) {
                  clearPatientSelection();
                }
              }}
              placeholder="ابحث بالاسم أو رقم الهاتف أو الإيميل..."
              className="pr-12 pl-10 h-12 text-base border-2"
            />
            {patientSearchTerm && (
              <Button type="button" variant="ghost" size="sm" className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0" onClick={clearPatientSelection}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Selected Patient Card */}
          {selectedPatient && (
            <Card className="border-2 border-primary bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-lg">{selectedPatient.full_name}</div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {selectedPatient.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{selectedPatient.phone}</span>}
                        {selectedPatient.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{selectedPatient.email}</span>}
                        {selectedPatient.blood_type && <Badge variant="outline" className="text-xs">{selectedPatient.blood_type}</Badge>}
                      </div>
                      {selectedPatient.medical_condition && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
                          <AlertTriangle className="w-3 h-3" />
                          {selectedPatient.medical_condition}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/patients?id=${selectedPatient.id}`)}>
                      <FileUser className="w-4 h-4 ml-1" /> الملف
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={clearPatientSelection}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Results */}
          {patientSearchTerm && !selectedPatient && (
            <ScrollArea className="max-h-64 border-2 border-border rounded-xl">
              {filteredPatients.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>لا توجد نتائج لـ "{patientSearchTerm}"</p>
                </div>
              ) : (
                <div className="p-1">
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50 rounded-t-lg">
                    {filteredPatients.length} نتيجة
                  </div>
                  {filteredPatients.slice(0, 20).map(patient => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between p-3 hover:bg-accent rounded-lg cursor-pointer transition-colors"
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{patient.full_name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            {patient.phone && <span>{patient.phone}</span>}
                            {patient.gender && <span>• {patient.gender === 'male' ? 'ذكر' : 'أنثى'}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      )}

      {/* New Patient Form */}
      {patientType === 'new' && (
        <div className="space-y-6 p-6 border-2 border-dashed border-border rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم المريض الكامل *</Label>
              <Input value={newPatientData.full_name} onChange={e => setNewPatientData(p => ({ ...p, full_name: e.target.value }))} placeholder="الاسم الرباعي" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input value={newPatientData.phone} onChange={e => setNewPatientData(p => ({ ...p, phone: e.target.value }))} placeholder="05xxxxxxxx" type="tel" className="h-11" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input value={newPatientData.email} onChange={e => setNewPatientData(p => ({ ...p, email: e.target.value }))} type="email" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>تاريخ الميلاد</Label>
              <Input value={newPatientData.date_of_birth} onChange={e => setNewPatientData(p => ({ ...p, date_of_birth: e.target.value }))} type="date" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>الجنس</Label>
              <Select value={newPatientData.gender} onValueChange={v => setNewPatientData(p => ({ ...p, gender: v }))}>
                <SelectTrigger className="h-11"><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">ذكر</SelectItem>
                  <SelectItem value="female">أنثى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>فصيلة الدم</Label>
              <Select value={newPatientData.blood_type} onValueChange={v => setNewPatientData(p => ({ ...p, blood_type: v }))}>
                <SelectTrigger className="h-11"><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => (
                    <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>التأمين الصحي</Label>
              <Input value={newPatientData.insurance_info} onChange={e => setNewPatientData(p => ({ ...p, insurance_info: e.target.value }))} className="h-11" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>جهة اتصال الطوارئ</Label>
              <Input value={newPatientData.emergency_contact} onChange={e => setNewPatientData(p => ({ ...p, emergency_contact: e.target.value }))} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>رقم الطوارئ</Label>
              <Input value={newPatientData.emergency_phone} onChange={e => setNewPatientData(p => ({ ...p, emergency_phone: e.target.value }))} type="tel" className="h-11" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>التاريخ المرضي</Label>
            <Textarea value={newPatientData.medical_history} onChange={e => setNewPatientData(p => ({ ...p, medical_history: e.target.value }))} placeholder="الأمراض السابقة، الحساسيات، الأدوية..." rows={3} />
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Conflict Warning */}
      {conflictWarning && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">{conflictWarning}</AlertDescription>
        </Alert>
      )}

      {/* Doctor Selection */}
      <div className="space-y-2">
        <Label className="text-base font-semibold flex items-center gap-1">
          <Stethoscope className="w-4 h-4" /> الطبيب المعالج
        </Label>
        <Select value={formData.doctor_id} onValueChange={v => handleChange('doctor_id', v)}>
          <SelectTrigger className="h-12 text-base border-2"><SelectValue placeholder="اختر الطبيب" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">بدون طبيب محدد</SelectItem>
            {activeDoctors.map(doc => (
              <SelectItem key={doc.id} value={doc.id}>
                د. {doc.full_name} {doc.specialization ? `- ${doc.specialization}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label className="text-base font-semibold">تاريخ الموعد *</Label>
          <Input
            type="date"
            value={formData.appointment_date}
            onChange={e => handleChange('appointment_date', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="h-12 text-base border-2"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-base font-semibold">وقت الموعد *</Label>
          <Input
            type="time"
            value={formData.appointment_time}
            onChange={e => handleChange('appointment_time', e.target.value)}
            min="08:00" max="22:00"
            className="h-12 text-base border-2"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-base font-semibold">المدة</Label>
          <Select value={formData.duration} onValueChange={v => handleChange('duration', v)}>
            <SelectTrigger className="h-12 text-base border-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 دقيقة</SelectItem>
              <SelectItem value="30">30 دقيقة</SelectItem>
              <SelectItem value="45">45 دقيقة</SelectItem>
              <SelectItem value="60">ساعة واحدة</SelectItem>
              <SelectItem value="90">ساعة ونصف</SelectItem>
              <SelectItem value="120">ساعتان</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Treatment Type Grid */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">نوع العلاج</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {TREATMENT_TYPES.map(t => (
            <div
              key={t.value}
              className={cn(
                "p-3 border-2 rounded-xl cursor-pointer transition-all text-center hover:shadow-sm",
                formData.treatment_type === t.value
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/40"
              )}
              onClick={() => handleChange('treatment_type', t.value)}
            >
              <div className="text-2xl mb-1">{t.icon}</div>
              <div className="text-xs font-medium text-foreground">{t.label}</div>
              <div className="text-[10px] text-muted-foreground">{t.duration} د</div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Level */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">مستوى الأولوية</Label>
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: 'routine', label: 'عادي', color: 'border-green-300 bg-green-50 text-green-700', icon: '🟢' },
            { value: 'urgent', label: 'عاجل', color: 'border-orange-300 bg-orange-50 text-orange-700', icon: '🟠' },
            { value: 'emergency', label: 'طوارئ', color: 'border-red-300 bg-red-50 text-red-700', icon: '🔴' },
          ].map(level => (
            <div
              key={level.value}
              className={cn(
                "p-4 border-2 rounded-xl cursor-pointer transition-all text-center",
                formData.emergency_level === level.value ? level.color + " shadow-sm" : "border-border hover:border-primary/40"
              )}
              onClick={() => handleChange('emergency_level', level.value)}
            >
              <div className="text-xl mb-1">{level.icon}</div>
              <div className="font-medium text-sm">{level.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-base font-semibold">سبب الزيارة / الشكوى الرئيسية *</Label>
        <Textarea
          value={formData.chief_complaint}
          onChange={e => handleChange('chief_complaint', e.target.value)}
          placeholder="وصف مفصل للحالة والأعراض التي يعاني منها المريض..."
          rows={4}
          className="text-base border-2 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-base font-semibold">التكلفة المقدرة</Label>
          <div className="relative">
            <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={formData.estimated_cost}
              onChange={e => handleChange('estimated_cost', e.target.value)}
              type="number"
              placeholder="0.00"
              className="pr-10 h-11 border-2"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Checkbox
            id="requires_anesthesia"
            checked={formData.requires_anesthesia}
            onCheckedChange={(v) => handleChange('requires_anesthesia', !!v)}
          />
          <Label htmlFor="requires_anesthesia" className="cursor-pointer">يتطلب تخدير</Label>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <Checkbox
            id="follow_up_required"
            checked={formData.follow_up_required}
            onCheckedChange={(v) => handleChange('follow_up_required', !!v)}
          />
          <Label htmlFor="follow_up_required" className="cursor-pointer">يتطلب موعد متابعة</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-base font-semibold">ملاحظات إضافية</Label>
        <Textarea
          value={formData.notes}
          onChange={e => handleChange('notes', e.target.value)}
          placeholder="أي تعليمات خاصة أو ملاحظات للطبيب..."
          rows={3}
          className="border-2 resize-none"
        />
      </div>
    </div>
  );

  const renderStep4 = () => {
    const patientName = patientType === 'existing' ? selectedPatient?.full_name : newPatientData.full_name;
    const treatment = TREATMENT_TYPES.find(t => t.value === formData.treatment_type);

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-3" />
          <h3 className="text-xl font-bold text-foreground">مراجعة بيانات الموعد</h3>
          <p className="text-muted-foreground">تأكد من صحة البيانات قبل الحفظ</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Info */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> المريض
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-lg text-foreground">{patientName}</div>
              {patientType === 'new' && <Badge variant="secondary" className="mt-1">مريض جديد</Badge>}
              {selectedPatient?.phone && <div className="text-sm text-muted-foreground mt-1">{selectedPatient.phone}</div>}
            </CardContent>
          </Card>

          {/* Appointment Info */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> الموعد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-foreground">
                {formData.appointment_date && format(new Date(formData.appointment_date), 'dd MMMM yyyy', { locale: ar })}
              </div>
              <div className="text-sm text-muted-foreground">
                الساعة {formData.appointment_time} • {formData.duration} دقيقة
              </div>
            </CardContent>
          </Card>

          {/* Treatment Info */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-primary" /> العلاج
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-foreground">
                {treatment ? `${treatment.icon} ${treatment.label}` : 'غير محدد'}
              </div>
              <Badge variant={formData.emergency_level === 'emergency' ? 'destructive' : formData.emergency_level === 'urgent' ? 'secondary' : 'outline'} className="mt-1">
                {formData.emergency_level === 'emergency' ? 'طوارئ' : formData.emergency_level === 'urgent' ? 'عاجل' : 'عادي'}
              </Badge>
            </CardContent>
          </Card>

          {/* Complaint */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> الشكوى
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-foreground">{formData.chief_complaint || 'لم يُحدد'}</div>
              {formData.estimated_cost && (
                <div className="text-sm text-muted-foreground mt-2">التكلفة المقدرة: {formData.estimated_cost}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {conflictWarning && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{conflictWarning}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <CalendarPlus className="w-7 h-7 text-primary" />
              حجز موعد جديد
            </h1>
            <p className="text-muted-foreground mt-1">أكمل الخطوات لحجز موعد للمريض</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/appointments')}>
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للمواعيد
          </Button>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-between mb-8 bg-card border-2 border-border rounded-2xl p-4">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isDone = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer",
                    isActive && "bg-primary text-primary-foreground shadow-sm",
                    isDone && "bg-primary/10 text-primary",
                    !isActive && !isDone && "text-muted-foreground"
                  )}
                  onClick={() => {
                    if (isDone || step.id === currentStep) setCurrentStep(step.id);
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                  <span className="font-medium text-sm hidden md:block">{step.title}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-2",
                    isDone ? "bg-primary" : "bg-border"
                  )} />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="border-2">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {(() => { const Icon = STEPS[currentStep - 1].icon; return <Icon className="w-5 h-5 text-primary" />; })()}
                  {STEPS[currentStep - 1].title}
                  <Badge variant="outline" className="mr-auto text-xs">{currentStep} / {STEPS.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(s => s - 1)}
                disabled={currentStep === 1}
                className="px-6"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                السابق
              </Button>

              {currentStep < 4 ? (
                <Button
                  onClick={() => setCurrentStep(s => s + 1)}
                  disabled={!canProceedStep(currentStep)}
                  className="px-6"
                >
                  التالي
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8"
                  size="lg"
                >
                  <CheckCircle2 className="w-5 h-5 ml-2" />
                  {loading ? 'جاري الحفظ...' : 'تأكيد وحجز الموعد'}
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Today's Schedule */}
            <Card className="border-2">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  مواعيد اليوم
                  <Badge variant="secondary" className="mr-auto">{todayAppointments.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                {todayAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">لا توجد مواعيد اليوم</p>
                ) : (
                  <ScrollArea className="max-h-48">
                    <div className="space-y-2">
                      {todayAppointments.map(apt => (
                        <div key={apt.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-xs">
                          <div>
                            <div className="font-medium text-foreground">{(apt.patients as any)?.full_name}</div>
                            <div className="text-muted-foreground">
                              {format(new Date(apt.appointment_date), 'HH:mm')} • {apt.duration}د
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {apt.treatment_type || 'عام'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-2">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">المرضى المسجلين</span>
                  <span className="font-semibold text-foreground">{patients.length}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">المدة المحددة</span>
                  <span className="font-semibold text-foreground">{formData.duration} دقيقة</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">ساعات العمل</span>
                  <span className="font-semibold text-foreground">8ص - 10م</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default NewAppointmentForm;
