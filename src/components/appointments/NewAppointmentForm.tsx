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
<<<<<<< HEAD
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
=======
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
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
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
<<<<<<< HEAD

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
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
  const fetchPatients = async () => {
    try {
      const {
        data,
        error
<<<<<<< HEAD
      } = await supabase.from('patients').select('id, full_name, phone, email, created_at').order('full_name');
=======
      } = await supabase.from('patients').select('id, full_name, phone').order('full_name');
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
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
<<<<<<< HEAD
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

=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
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
<<<<<<< HEAD
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      toast({
        title: 'خطأ',
        description: errorMessage,
=======
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
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
<<<<<<< HEAD
  return <PageContainer maxWidth="4xl">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-3">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center text-xl">
                <CalendarPlus className="w-6 h-6 ml-3 text-blue-600" />
                حجز موعد جديد
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-8">
            {/* Patient Type Selection */}
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <User className="w-5 h-5 ml-2 text-blue-600" />
                نوع المريض
              </h3>
              <RadioGroup value={patientType} onValueChange={handlePatientTypeChange}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 space-x-reverse p-4 border rounded-lg hover:bg-white transition-colors cursor-pointer">
                    <RadioGroupItem value="existing" id="existing" />
                    <Label htmlFor="existing" className="flex items-center cursor-pointer">
                      <User className="w-5 h-5 ml-2 text-green-600" />
                      <div>
                        <div className="font-medium">مريض موجود</div>
                        <div className="text-sm text-gray-500">اختر من قائمة المرضى</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 space-x-reverse p-4 border rounded-lg hover:bg-white transition-colors cursor-pointer">
                    <RadioGroupItem value="new" id="new" />
                    <Label htmlFor="new" className="flex items-center cursor-pointer">
                      <UserPlus className="w-5 h-5 ml-2 text-blue-600" />
                      <div>
                        <div className="font-medium">مريض جديد</div>
                        <div className="text-sm text-gray-500">إضافة مريض جديد</div>
                      </div>
                    </Label>
                  </div>
=======
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
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
                </div>
              </RadioGroup>
            </div>

            {/* Patient Selection for Existing Patients */}
<<<<<<< HEAD
            {patientType === 'existing' && (
              <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Search className="w-5 h-5 ml-2 text-cyan-600" />
                    البحث عن المريض
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search and Select Patient */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">
                      ابحث واختر المريض *
                    </Label>
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        value={patientSearchTerm}
                        onChange={(e) => setPatientSearchTerm(e.target.value)}
                        placeholder="اكتب اسم المريض أو رقم الهاتف أو الإيميل..."
                        className="pr-12 pl-12 text-lg p-3 border-2 border-cyan-200 focus:border-cyan-500"
                      />
                      {patientSearchTerm && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={() => {
                            setPatientSearchTerm("");
                            handleChange('patient_id', '');
                          }}
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Live Search Results */}
                    {patientSearchTerm && filteredPatients.length > 0 && (
                      <div className="border-2 border-cyan-200 rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2 bg-cyan-50 border-b text-sm font-medium text-cyan-700">
                          {filteredPatients.length} نتيجة للبحث
                        </div>
                        {filteredPatients.map(patient => (
                          <div
                            key={patient.id}
                            className={`p-3 hover:bg-cyan-50 cursor-pointer border-b last:border-b-0 transition-colors ${
                              formData.patient_id === patient.id ? 'bg-cyan-100 border-cyan-300' : ''
                            }`}
                            onClick={() => handlePatientSelect(patient)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-800">{patient.full_name}</div>
                                  <div className="flex items-center gap-3 text-sm text-gray-500">
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
                                  className="h-8 px-2 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                                  onClick={(e) => handleOpenMedicalRecord(patient, e)}
                                  title="ملف المريض"
                                >
                                  <FileUser className="w-4 h-4 ml-1" />
                                  <span className="text-xs">ملف المريض</span>
                                </Button>
                                {formData.patient_id === patient.id && (
                                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
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
                      <div className="border-2 border-gray-200 rounded-lg bg-gray-50 p-4 text-center">
                        <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">لا توجد نتائج للبحث عن "{patientSearchTerm}"</p>
                        <p className="text-sm text-gray-400 mt-1">جرب البحث باسم آخر أو رقم هاتف</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Display selected patient info */}
                  {formData.patient_id && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                      {(() => {
                        const selectedPatient = patients.find(p => p.id === formData.patient_id);
                        return selectedPatient ? (
                          <div>
                            <h4 className="font-semibold text-green-700 mb-3 flex items-center">
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ml-2">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                              تم اختيار المريض
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="flex items-center">
                                <User className="w-4 h-4 ml-2 text-green-600" />
                                <span className="font-medium">{selectedPatient.full_name}</span>
                              </div>
                              {selectedPatient.phone && (
                                <div className="flex items-center">
                                  <Phone className="w-4 h-4 ml-2 text-green-600" />
                                  <span>{selectedPatient.phone}</span>
                                </div>
                              )}
                              {selectedPatient.email && (
                                <div className="flex items-center col-span-2">
                                  <Mail className="w-4 h-4 ml-2 text-green-600" />
                                  <span>{selectedPatient.email}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button
                                type="button"
                                variant="default"
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
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
=======
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
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a

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
<<<<<<< HEAD
                      aria-label="يتطلب تخدير"
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
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
<<<<<<< HEAD
                      aria-label="يتطلب متابعة"
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
                    />
                    <Label htmlFor="follow_up_required">يتطلب متابعة</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date and Time */}
<<<<<<< HEAD
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <CalendarPlus className="w-5 h-5 ml-2 text-purple-600" />
                  توقيت الموعد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="appointment_date" className="text-base font-semibold">تاريخ الموعد *</Label>
                    <Input 
                      id="appointment_date" 
                      type="date" 
                      value={formData.appointment_date} 
                      onChange={e => handleChange('appointment_date', e.target.value)} 
                      required 
                      min={new Date().toISOString().split('T')[0]}
                      className="text-lg p-3 border-2 border-purple-200 focus:border-purple-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="appointment_time" className="text-base font-semibold">وقت الموعد *</Label>
                    <Input 
                      id="appointment_time" 
                      type="time" 
                      value={formData.appointment_time} 
                      onChange={e => handleChange('appointment_time', e.target.value)} 
                      required
                      className="text-lg p-3 border-2 border-purple-200 focus:border-purple-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Duration and Treatment Type */}
            <Card className="bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Stethoscope className="w-5 h-5 ml-2 text-green-600" />
                  تفاصيل العلاج
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-base font-semibold">مدة الموعد</Label>
                    <Select onValueChange={value => handleChange('duration', value)} value={formData.duration}>
                      <SelectTrigger className="text-lg p-3 border-2 border-green-200 focus:border-green-500">
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
                    <Label htmlFor="treatment_type" className="text-base font-semibold">نوع العلاج</Label>
                    <Select onValueChange={value => handleChange('treatment_type', value)}>
                      <SelectTrigger className="text-lg p-3 border-2 border-green-200 focus:border-green-500">
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
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FileText className="w-5 h-5 ml-2 text-amber-600" />
                  ملاحظات إضافية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-base font-semibold">ملاحظات خاصة بالموعد</Label>
                  <Textarea 
                    id="notes" 
                    value={formData.notes} 
                    onChange={e => handleChange('notes', e.target.value)} 
                    placeholder="أي ملاحظات حول الموعد، تحضيرات خاصة، أو تعليمات للمريض..." 
                    rows={4}
                    className="text-lg p-4 border-2 border-amber-200 focus:border-amber-500 resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4 space-x-reverse pt-6">
              <Button type="submit" disabled={loading} className="px-8 py-3 text-lg shadow-lg">
                <Clock className="w-5 h-5 ml-2" />
=======
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
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
                {loading ? 'جاري الحفظ...' : 'حفظ الموعد'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
<<<<<<< HEAD
    </div>

    {/* Sidebar */}
    <div className="lg:col-span-1">
      <div className="space-y-6">
        {/* Quick Info */}
        <Card className="shadow-md">
          <CardHeader className="bg-blue-50 border-b">
            <CardTitle className="text-lg flex items-center">
              <Clock className="w-5 h-5 ml-2 text-blue-600" />
              معلومات سريعة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="text-sm">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">التاريخ الحالي:</span>
                <span className="font-medium">{new Date().toLocaleDateString('ar-EG')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">إجمالي المرضى:</span>
                <span className="font-medium">{patients.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">نتائج البحث:</span>
                <span className="font-medium">{filteredPatients.length}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">المدة الافتراضية:</span>
                <span className="font-medium">30 دقيقة</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Tips */}
        <Card className="shadow-md">
          <CardHeader className="bg-cyan-50 border-b">
            <CardTitle className="text-lg flex items-center">
              <Search className="w-5 h-5 ml-2 text-cyan-600" />
              نصائح البحث
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-center p-2 bg-gray-50 rounded">
                <User className="w-4 h-4 ml-2 text-cyan-600" />
                <span>ابحث بالاسم الكامل أو جزء منه</span>
              </div>
              <div className="flex items-center p-2 bg-gray-50 rounded">
                <Phone className="w-4 h-4 ml-2 text-cyan-600" />
                <span>ابحث برقم الهاتف</span>
              </div>
              <div className="flex items-center p-2 bg-gray-50 rounded">
                <Mail className="w-4 h-4 ml-2 text-cyan-600" />
                <span>ابحث بعنوان الإيميل</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Treatment Types Guide */}
        <Card className="shadow-md">
          <CardHeader className="bg-green-50 border-b">
            <CardTitle className="text-lg flex items-center">
              <Stethoscope className="w-5 h-5 ml-2 text-green-600" />
              أنواع العلاج الشائعة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">فحص عام ودوري</div>
              <div className="p-2 bg-gray-50 rounded">تنظيف الأسنان</div>
              <div className="p-2 bg-gray-50 rounded">حشو الأسنان</div>
              <div className="p-2 bg-gray-50 rounded">علاج العصب</div>
              <div className="p-2 bg-gray-50 rounded">خلع الأسنان</div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Levels */}
        <Card className="shadow-md">
          <CardHeader className="bg-red-50 border-b">
            <CardTitle className="text-lg flex items-center">
              <CalendarPlus className="w-5 h-5 ml-2 text-red-600" />
              مستويات الأولوية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-center p-2 bg-green-50 rounded">
                <div className="w-3 h-3 bg-green-500 rounded-full ml-2"></div>
                <span>روتيني - غير عاجل</span>
              </div>
              <div className="flex items-center p-2 bg-yellow-50 rounded">
                <div className="w-3 h-3 bg-yellow-500 rounded-full ml-2"></div>
                <span>عاجل - في نفس الأسبوع</span>
              </div>
              <div className="flex items-center p-2 bg-red-50 rounded">
                <div className="w-3 h-3 bg-red-500 rounded-full ml-2"></div>
                <span>طارئ - في نفس اليوم</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</PageContainer>;
=======
    </PageContainer>;
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
};
export default NewAppointmentForm;