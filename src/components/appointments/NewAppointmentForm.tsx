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
import { CalendarPlus, Clock, User, Stethoscope, UserPlus, FileText, Search, Phone, Mail, X, FileUser } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
interface Patient {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  created_at?: string;
}
const NewAppointmentForm = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientType, setPatientType] = useState<'existing' | 'new'>('existing');
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
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

  useEffect(() => {
    // Filter patients based on search term
    if (patientSearchTerm) {
      const filtered = patients.filter(patient => 
        patient.full_name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
        patient.phone?.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(patientSearchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [patients, patientSearchTerm]);
  const fetchPatients = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('patients').select('id, full_name, phone, email, created_at').order('full_name');
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
  const handlePatientTypeChange = (value: 'existing' | 'new') => {
    setPatientType(value);
    setPatientSearchTerm(""); // Clear search when switching patient types
    handleChange('patient_id', ''); // Clear selected patient
  };

  const handlePatientSelect = (patient: Patient) => {
    handleChange('patient_id', patient.id);
    setPatientSearchTerm(patient.full_name); // Set the search term to patient name
  };

  const generatePatientSlug = (patient: Patient) => {
    // استخراج الاسم الأول
    const firstName = patient.full_name.split(' ')[0];
    
    // تنسيق تاريخ التسجيل (YYYY-MM-DD)
    const registrationDate = patient.created_at 
      ? new Date(patient.created_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    
    // إنشاء الرابط الفريد: الاسم-الأول-YYYY-MM-DD
    const slug = `${firstName}-${registrationDate}`.toLowerCase()
      .replace(/[\s\u0600-\u06FF]+/g, '-') // استبدال المسافات والأحرف العربية بشرطات
      .replace(/[^\w-]/g, '') // إزالة الأحرف الخاصة
      .replace(/-+/g, '-'); // تنظيف الشرطات المتعددة
    
    console.log(`Generated slug for ${patient.full_name}: ${slug}`);
    return slug;
  };

  const handleOpenMedicalRecord = (patient: Patient, event: React.MouseEvent) => {
    event.stopPropagation(); // منع تفعيل اختيار المريض
    const patientSlug = generatePatientSlug(patient);
    navigate(`/patients/${patientSlug}?id=${patient.id}`);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      toast({
        title: 'خطأ',
        description: errorMessage,
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-3">
          <Card className="shadow-elegant border-2">
            <CardHeader className="bg-gradient-subtle border-b border-border">
              <CardTitle className="flex items-center text-xl font-bold">
                <CalendarPlus className="w-6 h-6 ml-3 text-primary" />
                حجز موعد جديد
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-8">
            {/* Patient Type Selection */}
            <div className="bg-muted/50 p-6 rounded-lg border-2 border-dashed border-border">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
                <User className="w-5 h-5 ml-2 text-primary" />
                نوع المريض
              </h3>
              <RadioGroup value={patientType} onValueChange={handlePatientTypeChange}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 space-x-reverse p-4 border-2 border-border rounded-lg hover:bg-accent/50 transition-all cursor-pointer">
                    <RadioGroupItem value="existing" id="existing" />
                    <Label htmlFor="existing" className="flex items-center cursor-pointer">
                      <User className="w-5 h-5 ml-2 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">مريض موجود</div>
                        <div className="text-sm text-muted-foreground">اختر من قائمة المرضى</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 space-x-reverse p-4 border-2 border-border rounded-lg hover:bg-accent/50 transition-all cursor-pointer">
                    <RadioGroupItem value="new" id="new" />
                    <Label htmlFor="new" className="flex items-center cursor-pointer">
                      <UserPlus className="w-5 h-5 ml-2 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">مريض جديد</div>
                        <div className="text-sm text-muted-foreground">إضافة مريض جديد</div>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Patient Selection for Existing Patients */}
            {patientType === 'existing' && (
              <Card className="bg-accent/30 border-2 border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-foreground">
                    <Search className="w-5 h-5 ml-2 text-primary" />
                    البحث عن المريض
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search and Select Patient */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold text-foreground">
                      ابحث واختر المريض *
                    </Label>
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        value={patientSearchTerm}
                        onChange={(e) => setPatientSearchTerm(e.target.value)}
                        placeholder="اكتب اسم المريض أو رقم الهاتف أو الإيميل..."
                        className="pr-12 pl-12 text-lg p-3 border-2 border-primary/30 focus:border-primary bg-background"
                      />
                      {patientSearchTerm && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                          onClick={() => {
                            setPatientSearchTerm("");
                            handleChange('patient_id', '');
                          }}
                        >
                          <X className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Live Search Results */}
                    {patientSearchTerm && filteredPatients.length > 0 && (
                      <div className="border-2 border-primary/30 rounded-lg bg-card shadow-elegant max-h-60 overflow-y-auto">
                        <div className="p-2 bg-accent border-b border-border text-sm font-medium text-foreground">
                          {filteredPatients.length} نتيجة للبحث
                        </div>
                        {filteredPatients.map(patient => (
                          <div
                            key={patient.id}
                            className={`p-3 hover:bg-accent cursor-pointer border-b border-border last:border-b-0 transition-all ${
                              formData.patient_id === patient.id ? 'bg-primary/10 border-primary' : ''
                            }`}
                            onClick={() => handlePatientSelect(patient)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-primary-foreground" />
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">{patient.full_name}</div>
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    {patient.phone && (
                                      <div className="flex items-center gap-1">
                                        <Phone className="w-3 h-3" />
                                        <span>{patient.phone}</span>
                                      </div>
                                    )}
                                    {patient.email && (
                                      <div className="flex items-center gap-1">
                                        <Mail className="w-3 h-3" />
                                        <span>{patient.email}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* Medical Record Button */}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 hover:bg-accent text-primary"
                                  onClick={(e) => handleOpenMedicalRecord(patient, e)}
                                  title="ملف المريض"
                                >
                                  <FileUser className="w-4 h-4 ml-1" />
                                  <span className="text-xs">ملف المريض</span>
                                </Button>
                                {formData.patient_id === patient.id && (
                                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* No Results Message */}
                    {patientSearchTerm && filteredPatients.length === 0 && (
                      <div className="border-2 border-border rounded-lg bg-muted/50 p-4 text-center">
                        <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">لا توجد نتائج للبحث عن "{patientSearchTerm}"</p>
                        <p className="text-sm text-muted-foreground mt-1">جرب البحث باسم آخر أو رقم هاتف</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Display selected patient info */}
                  {formData.patient_id && (
                    <div className="mt-4 p-4 bg-primary/10 rounded-lg border-2 border-primary/30">
                      {(() => {
                        const selectedPatient = patients.find(p => p.id === formData.patient_id);
                        return selectedPatient ? (
                          <div>
                            <h4 className="font-semibold text-primary mb-3 flex items-center">
                              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center ml-2">
                                <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                              </div>
                              تم اختيار المريض
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="flex items-center">
                                <User className="w-4 h-4 ml-2 text-primary" />
                                <span className="font-medium text-foreground">{selectedPatient.full_name}</span>
                              </div>
                              {selectedPatient.phone && (
                                <div className="flex items-center">
                                  <Phone className="w-4 h-4 ml-2 text-primary" />
                                  <span className="text-foreground">{selectedPatient.phone}</span>
                                </div>
                              )}
                              {selectedPatient.email && (
                                <div className="flex items-center col-span-2">
                                  <Mail className="w-4 h-4 ml-2 text-primary" />
                                  <span className="text-foreground">{selectedPatient.email}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button
                                type="button"
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  const patientSlug = generatePatientSlug(selectedPatient);
                                  navigate(`/patients/${patientSlug}?id=${selectedPatient.id}`);
                                }}
                              >
                                <FileUser className="w-3 h-3 ml-1" />
                                ملف المريض
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  handleChange('patient_id', '');
                                  setPatientSearchTerm('');
                                }}
                              >
                                <X className="w-3 h-3 ml-1" />
                                إلغاء الاختيار
                              </Button>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* New Patient Form */}
            {patientType === 'new' && <Card className="border-2 border-dashed border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-foreground">
                    <UserPlus className="w-5 h-5 ml-2 text-primary" />
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
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-foreground">
                  <Stethoscope className="w-5 h-5 ml-2 text-primary" />
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
                      aria-label="يتطلب تخدير"
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
                      aria-label="يتطلب متابعة"
                    />
                    <Label htmlFor="follow_up_required">يتطلب متابعة</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date and Time */}
            <Card className="bg-accent/30 border-2 border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-foreground">
                  <CalendarPlus className="w-5 h-5 ml-2 text-primary" />
                  توقيت الموعد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="appointment_date" className="text-base font-semibold text-foreground">تاريخ الموعد *</Label>
                    <Input 
                      id="appointment_date" 
                      type="date" 
                      value={formData.appointment_date} 
                      onChange={e => handleChange('appointment_date', e.target.value)} 
                      required 
                      min={new Date().toISOString().split('T')[0]}
                      className="text-lg p-3 border-2 border-primary/30 focus:border-primary bg-background"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="appointment_time" className="text-base font-semibold text-foreground">وقت الموعد *</Label>
                    <Input 
                      id="appointment_time" 
                      type="time" 
                      value={formData.appointment_time} 
                      onChange={e => handleChange('appointment_time', e.target.value)} 
                      required
                      className="text-lg p-3 border-2 border-primary/30 focus:border-primary bg-background"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Duration and Treatment Type */}
            <Card className="bg-accent/30 border-2 border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-foreground">
                  <Stethoscope className="w-5 h-5 ml-2 text-primary" />
                  تفاصيل العلاج
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-base font-semibold text-foreground">مدة الموعد</Label>
                    <Select onValueChange={value => handleChange('duration', value)} value={formData.duration}>
                      <SelectTrigger className="text-lg p-3 border-2 border-primary/30 focus:border-primary bg-background">
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
                    <Label htmlFor="treatment_type" className="text-base font-semibold text-foreground">نوع العلاج</Label>
                    <Select onValueChange={value => handleChange('treatment_type', value)}>
                      <SelectTrigger className="text-lg p-3 border-2 border-primary/30 focus:border-primary bg-background">
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
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="bg-accent/30 border-2 border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-foreground">
                  <FileText className="w-5 h-5 ml-2 text-primary" />
                  ملاحظات إضافية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-base font-semibold text-foreground">ملاحظات خاصة بالموعد</Label>
                  <Textarea 
                    id="notes" 
                    value={formData.notes} 
                    onChange={e => handleChange('notes', e.target.value)} 
                    placeholder="أي ملاحظات حول الموعد، تحضيرات خاصة، أو تعليمات للمريض..." 
                    rows={4}
                    className="text-lg p-4 border-2 border-primary/30 focus:border-primary resize-none bg-background"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4 space-x-reverse pt-6">
              <Button type="submit" disabled={loading} className="px-8 py-3 text-lg shadow-elegant">
                <Clock className="w-5 h-5 ml-2" />
                {loading ? 'جاري الحفظ...' : 'حفظ الموعد'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>

    {/* Sidebar */}
    <div className="lg:col-span-1">
      <div className="space-y-6">
        {/* Quick Info */}
        <Card className="shadow-elegant border-2">
          <CardHeader className="bg-accent border-b border-border">
            <CardTitle className="text-lg flex items-center text-foreground">
              <Clock className="w-5 h-5 ml-2 text-primary" />
              معلومات سريعة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="text-sm">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">التاريخ الحالي:</span>
                <span className="font-medium text-foreground">{new Date().toLocaleDateString('ar-EG')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">إجمالي المرضى:</span>
                <span className="font-medium text-foreground">{patients.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">نتائج البحث:</span>
                <span className="font-medium text-foreground">{filteredPatients.length}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">المدة الافتراضية:</span>
                <span className="font-medium text-foreground">30 دقيقة</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Tips */}
        <Card className="shadow-elegant border-2">
          <CardHeader className="bg-accent border-b border-border">
            <CardTitle className="text-lg flex items-center text-foreground">
              <Search className="w-5 h-5 ml-2 text-primary" />
              نصائح البحث
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-center p-2 bg-muted/50 rounded">
                <User className="w-4 h-4 ml-2 text-primary" />
                <span className="text-foreground">ابحث بالاسم الكامل أو جزء منه</span>
              </div>
              <div className="flex items-center p-2 bg-muted/50 rounded">
                <Phone className="w-4 h-4 ml-2 text-primary" />
                <span className="text-foreground">ابحث برقم الهاتف</span>
              </div>
              <div className="flex items-center p-2 bg-muted/50 rounded">
                <Mail className="w-4 h-4 ml-2 text-primary" />
                <span className="text-foreground">ابحث بعنوان الإيميل</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Treatment Types Guide */}
        <Card className="shadow-elegant border-2">
          <CardHeader className="bg-accent border-b border-border">
            <CardTitle className="text-lg flex items-center text-foreground">
              <Stethoscope className="w-5 h-5 ml-2 text-primary" />
              أنواع العلاج الشائعة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-muted/50 rounded text-foreground">فحص عام ودوري</div>
              <div className="p-2 bg-muted/50 rounded text-foreground">تنظيف الأسنان</div>
              <div className="p-2 bg-muted/50 rounded text-foreground">حشو الأسنان</div>
              <div className="p-2 bg-muted/50 rounded text-foreground">علاج العصب</div>
              <div className="p-2 bg-muted/50 rounded text-foreground">خلع الأسنان</div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Levels */}
        <Card className="shadow-elegant border-2">
          <CardHeader className="bg-accent border-b border-border">
            <CardTitle className="text-lg flex items-center text-foreground">
              <CalendarPlus className="w-5 h-5 ml-2 text-primary" />
              مستويات الأولوية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-center p-2 bg-muted/50 rounded">
                <div className="w-3 h-3 bg-primary rounded-full ml-2"></div>
                <span className="text-foreground">روتيني - غير عاجل</span>
              </div>
              <div className="flex items-center p-2 bg-muted/50 rounded">
                <div className="w-3 h-3 bg-secondary rounded-full ml-2"></div>
                <span className="text-foreground">عاجل - في نفس الأسبوع</span>
              </div>
              <div className="flex items-center p-2 bg-muted/50 rounded">
                <div className="w-3 h-3 bg-destructive rounded-full ml-2"></div>
                <span className="text-foreground">طارئ - في نفس اليوم</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</PageContainer>;
};
export default NewAppointmentForm;