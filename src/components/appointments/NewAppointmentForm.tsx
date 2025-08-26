import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CalendarPlus, Clock, User, Stethoscope, UserPlus } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLanguage } from "@/contexts/LanguageContext";
interface Patient {
  id: string;
  full_name: string;
  phone: string;
}
const NewAppointmentForm = () => {
  const { t } = useLanguage();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientType, setPatientType] = useState<'existing' | 'new'>('existing');
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
    emergency_phone: '',
    last_dental_visit: '',
    preferred_language: 'arabic'
  });
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    fetchPatients();
  }, []);
  const fetchPatients = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('patients').select('id, full_name, phone').order('full_name');
      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };
  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleNewPatientChange = (field: string, value: string) => {
    setNewPatientData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.appointment_date || !formData.appointment_time) {
      toast({
        title: 'خطأ',
        description: 'يجب ملء تاريخ ووقت الموعد',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.chief_complaint.trim()) {
      toast({
        title: 'خطأ',
        description: 'يجب إدخال سبب الزيارة',
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
      // Get current user profile
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');
      const {
        data: profile
      } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
      if (!profile) throw new Error('لم يتم العثور على ملف المستخدم');
      let finalPatientId = formData.patient_id;

      // If new patient, create patient first
      if (patientType === 'new') {
        const {
          data: newPatient,
          error: patientError
        } = await supabase.from('patients').insert({
          clinic_id: profile.id,
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
          notes: `الحساسيات: ${newPatientData.allergies || 'لا توجد'}\nالأدوية الحالية: ${newPatientData.current_medications || 'لا توجد'}\nآخر زيارة طبيب أسنان: ${newPatientData.last_dental_visit || 'غير محدد'}`
        }).select('id').single();
        if (patientError) throw patientError;
        finalPatientId = newPatient.id;
      }

      // Combine date and time
      const appointmentDateTime = `${formData.appointment_date}T${formData.appointment_time}:00`;
      const {
        error
      } = await supabase.from('appointments').insert({
        patient_id: finalPatientId,
        clinic_id: profile.id,
        appointment_date: appointmentDateTime,
        duration: parseInt(formData.duration),
        treatment_type: formData.treatment_type || null,
        notes: `${formData.notes ? 'ملاحظات: ' + formData.notes + '\n' : ''}سبب الزيارة: ${formData.chief_complaint}\nمستوى الأولوية: ${formData.emergency_level === 'emergency' ? 'طارئ' : formData.emergency_level === 'urgent' ? 'عاجل' : 'روتيني'}${formData.estimated_cost ? '\nالتكلفة المقدرة: ' + formData.estimated_cost + ' ج.م' : ''}${formData.requires_anesthesia === 'true' ? '\nيتطلب تخدير' : ''}${formData.follow_up_required === 'true' ? '\nيتطلب متابعة' : ''}`,
        status: formData.emergency_level === 'emergency' ? 'urgent' : 'scheduled'
      });
      if (error) throw error;
      toast({
        title: 'تم بنجاح',
        description: patientType === 'new' ? 'تم إضافة المريض وحجز الموعد بنجاح' : 'تم حجز الموعد بنجاح'
      });

      // Reset form
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
        emergency_phone: '',
        last_dental_visit: '',
        preferred_language: 'arabic'
      });

      // Refresh patients list if new patient was added
      if (patientType === 'new') {
        await fetchPatients();
      }
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
  const treatmentTypes = [
    'فحص عام ودوري',
    'تنظيف الأسنان',
    'حشو الأسنان (أملغم)',
    'حشو الأسنان (كومبوزيت)',
    'خلع الأسنان البسيط',
    'خلع الأسنان الجراحي',
    'علاج عصب الأسنان',
    'تركيب تاج (كراون)',
    'تركيب جسر الأسنان',
    'طقم أسنان كامل',
    'طقم أسنان جزئي',
    'تقويم الأسنان',
    'زراعة الأسنان',
    'تبييض الأسنان',
    'علاج اللثة',
    'جراحة الفم والوجه والفكين',
    'علاج أسنان الأطفال',
    'علاج طارئ',
    'استشارة متخصصة',
    'أخرى'
  ];
  return <PageContainer maxWidth="2xl">
      <PageHeader title={t("appointmentForm.title")} description={t("appointmentForm.description")} />

      <Card>
        <CardHeader>
          
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Type Selection */}
            <div className="space-y-4">
              <Label>نوع المريض *</Label>
              <RadioGroup value={patientType} onValueChange={(value: 'existing' | 'new') => setPatientType(value)}>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="existing" id="existing" />
                  <Label htmlFor="existing" className="flex items-center">
                    <User className="w-4 h-4 ml-2" />
                    مريض موجود
                  </Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="new" id="new" />
                  <Label htmlFor="new" className="flex items-center">
                    <UserPlus className="w-4 h-4 ml-2" />
                    مريض جديد
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Patient Selection for Existing Patients */}
            {patientType === 'existing' && <div className="space-y-2">
                <Label htmlFor="patient_id">اختر المريض *</Label>
                <Select onValueChange={value => handleChange('patient_id', value)} value={formData.patient_id}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المريض" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(patient => <SelectItem key={patient.id} value={patient.id}>
                        <div className="flex items-center">
                          <User className="w-4 h-4 ml-2" />
                          <span>{patient.full_name}</span>
                          {patient.phone && <span className="text-muted-foreground mr-2">
                              ({patient.phone})
                            </span>}
                        </div>
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>}

            {/* New Patient Form */}
            {patientType === 'new' && <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <UserPlus className="w-5 h-5 ml-2" />
                    بيانات المريض الجديد
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new_full_name">اسم المريض *</Label>
                      <Input id="new_full_name" value={newPatientData.full_name} onChange={e => handleNewPatientChange('full_name', e.target.value)} placeholder="الاسم الكامل" required />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new_phone">رقم الهاتف</Label>
                      <Input id="new_phone" value={newPatientData.phone} onChange={e => handleNewPatientChange('phone', e.target.value)} placeholder="+201234567890" type="tel" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new_email">البريد الإلكتروني</Label>
                      <Input id="new_email" value={newPatientData.email} onChange={e => handleNewPatientChange('email', e.target.value)} placeholder="patient@example.com" type="email" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new_date_of_birth">تاريخ الميلاد</Label>
                      <Input id="new_date_of_birth" value={newPatientData.date_of_birth} onChange={e => handleNewPatientChange('date_of_birth', e.target.value)} type="date" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new_gender">الجنس</Label>
                      <Select onValueChange={value => handleNewPatientChange('gender', value)} value={newPatientData.gender}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الجنس" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">ذكر</SelectItem>
                          <SelectItem value="female">أنثى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new_blood_type">فصيلة الدم</Label>
                      <Select onValueChange={value => handleNewPatientChange('blood_type', value)} value={newPatientData.blood_type}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر فصيلة الدم" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new_address">العنوان</Label>
                      <Input id="new_address" value={newPatientData.address} onChange={e => handleNewPatientChange('address', e.target.value)} placeholder="عنوان المريض" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new_insurance_info">التأمين الصحي</Label>
                      <Input id="new_insurance_info" value={newPatientData.insurance_info} onChange={e => handleNewPatientChange('insurance_info', e.target.value)} placeholder="رقم التأمين الصحي" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new_emergency_contact">جهة الاتصال في الطوارئ</Label>
                      <Input id="new_emergency_contact" value={newPatientData.emergency_contact} onChange={e => handleNewPatientChange('emergency_contact', e.target.value)} placeholder="اسم الشخص" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new_emergency_phone">رقم الطوارئ</Label>
                      <Input id="new_emergency_phone" value={newPatientData.emergency_phone} onChange={e => handleNewPatientChange('emergency_phone', e.target.value)} placeholder="+201234567890" type="tel" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new_allergies">الحساسيات</Label>
                    <Textarea id="new_allergies" value={newPatientData.allergies} onChange={e => handleNewPatientChange('allergies', e.target.value)} placeholder="حساسية البنسلين، اللاتكس، إلخ..." rows={2} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new_current_medications">الأدوية الحالية</Label>
                    <Textarea id="new_current_medications" value={newPatientData.current_medications} onChange={e => handleNewPatientChange('current_medications', e.target.value)} placeholder="الأدوية التي يتناولها المريض حالياً..." rows={2} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new_last_dental_visit">آخر زيارة لطبيب أسنان</Label>
                      <Input id="new_last_dental_visit" value={newPatientData.last_dental_visit} onChange={e => handleNewPatientChange('last_dental_visit', e.target.value)} type="date" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new_medical_history">التاريخ المرضي</Label>
                    <Textarea id="new_medical_history" value={newPatientData.medical_history} onChange={e => handleNewPatientChange('medical_history', e.target.value)} placeholder="الأمراض السابقة والعمليات الجراحية..." rows={3} />
                  </div>
                </CardContent>
              </Card>}

            {/* Chief Complaint and Emergency Level */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Stethoscope className="w-5 h-5 ml-2" />
                  تفاصيل الموعد
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="chief_complaint">سبب الزيارة *</Label>
                  <Textarea 
                    id="chief_complaint" 
                    value={formData.chief_complaint} 
                    onChange={e => handleChange('chief_complaint', e.target.value)} 
                    placeholder="ألم في الأسنان، فحص دوري، تنظيف، إلخ..." 
                    rows={2} 
                    required 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergency_level">مستوى الأولوية</Label>
                    <Select onValueChange={value => handleChange('emergency_level', value)} value={formData.emergency_level}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر مستوى الأولوية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">روتيني</SelectItem>
                        <SelectItem value="urgent">عاجل</SelectItem>
                        <SelectItem value="emergency">طارئ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estimated_cost">التكلفة المقدرة (ج.م)</Label>
                    <Input 
                      id="estimated_cost" 
                      value={formData.estimated_cost} 
                      onChange={e => handleChange('estimated_cost', e.target.value)} 
                      placeholder="0.00" 
                      type="number" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <input 
                      type="checkbox" 
                      id="requires_anesthesia" 
                      checked={formData.requires_anesthesia === 'true'}
                      onChange={e => handleChange('requires_anesthesia', e.target.checked.toString())}
                      className="rounded"
                    />
                    <Label htmlFor="requires_anesthesia">يتطلب تخدير</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <input 
                      type="checkbox" 
                      id="follow_up_required" 
                      checked={formData.follow_up_required === 'true'}
                      onChange={e => handleChange('follow_up_required', e.target.checked.toString())}
                      className="rounded"
                    />
                    <Label htmlFor="follow_up_required">يتطلب متابعة</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appointment_date">تاريخ الموعد *</Label>
                <Input id="appointment_date" type="date" value={formData.appointment_date} onChange={e => handleChange('appointment_date', e.target.value)} required min={new Date().toISOString().split('T')[0]} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appointment_time">وقت الموعد *</Label>
                <Input id="appointment_time" type="time" value={formData.appointment_time} onChange={e => handleChange('appointment_time', e.target.value)} required />
              </div>
            </div>

            {/* Duration and Treatment Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">مدة الموعد (بالدقائق)</Label>
                <Select onValueChange={value => handleChange('duration', value)} value={formData.duration}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المدة" />
                  </SelectTrigger>
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
              
              <div className="space-y-2">
                <Label htmlFor="treatment_type">نوع العلاج</Label>
                <Select onValueChange={value => handleChange('treatment_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع العلاج" />
                  </SelectTrigger>
                  <SelectContent>
                    {treatmentTypes.map(type => <SelectItem key={type} value={type}>
                        <div className="flex items-center">
                          <Stethoscope className="w-4 h-4 ml-2" />
                          {type}
                        </div>
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات إضافية</Label>
              <Textarea id="notes" value={formData.notes} onChange={e => handleChange('notes', e.target.value)} placeholder="أي ملاحظات حول الموعد..." rows={3} />
            </div>

            <div className="flex justify-end space-x-4 space-x-reverse">
              <Button type="submit" disabled={loading} className="px-8">
                <Clock className="w-4 h-4 ml-2" />
                {loading ? 'جاري الحفظ...' : 'حفظ الموعد'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>;
};
export default NewAppointmentForm;