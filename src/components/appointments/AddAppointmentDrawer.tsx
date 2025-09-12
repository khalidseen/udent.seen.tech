import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { offlineSupabase } from "@/lib/offline-supabase";
import { toast } from "@/hooks/use-toast";
import { CalendarPlus, Clock, User, Stethoscope, UserPlus, Save } from "lucide-react";

interface Patient {
  id: string;
  full_name: string;
  phone: string;
}

interface AddAppointmentDrawerProps {
  onAppointmentAdded?: () => void;
}

const AddAppointmentDrawer = ({ onAppointmentAdded }: AddAppointmentDrawerProps) => {
  const [open, setOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientType, setPatientType] = useState<'existing' | 'new'>('existing');
  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_date: '',
    appointment_time: '',
    duration: '30',
    treatment_type: '',
    notes: ''
  });
  const [newPatientData, setNewPatientData] = useState({
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: '',
    address: '',
    medical_history: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPatients();
    }
  }, [open]);

  const fetchPatients = async () => {
    try {
      const result = await offlineSupabase.select('patients', {
        select: ['id', 'full_name', 'phone'],
        orderBy: { field: 'full_name', ascending: true }
      });
      
      if (result.data) {
        setPatients(result.data);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNewPatientChange = (field: string, value: string) => {
    setNewPatientData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      patient_id: '',
      appointment_date: '',
      appointment_time: '',
      duration: '30',
      treatment_type: '',
      notes: ''
    });
    setNewPatientData({
      full_name: '',
      phone: '',
      email: '',
      date_of_birth: '',
      gender: '',
      address: '',
      medical_history: ''
    });
    setPatientType('existing');
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
      // Get current user
      const { data: { user } } = await offlineSupabase.auth.getUser();
      
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      // Get or create user's profile
      const profileResult = await offlineSupabase.select('profiles', { 
        filter: { user_id: user.id } 
      });

      let profile = null;
      if (profileResult.data && profileResult.data.length > 0) {
        profile = profileResult.data[0];
      } else {
        // Create new profile if it doesn't exist
        const newProfile = await offlineSupabase.insert('profiles', {
          user_id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم جديد',
          role: 'doctor'
        });

        if (newProfile.error) {
          console.error('Profile creation error:', newProfile.error);
          throw new Error('فشل في إنشاء ملف المستخدم: ' + newProfile.error.message);
        }
        profile = newProfile.data;
      }

      if (!profile) {
        throw new Error('لم يتم العثور على ملف المستخدم أو فشل في إنشاؤه');
      }

      let finalPatientId = formData.patient_id;

      // If new patient, create patient first
      if (patientType === 'new') {
        const newPatientResult = await offlineSupabase.insert('patients', {
          clinic_id: profile.id,
          full_name: newPatientData.full_name,
          phone: newPatientData.phone || null,
          email: newPatientData.email || null,
          date_of_birth: newPatientData.date_of_birth || null,
          gender: newPatientData.gender || null,
          address: newPatientData.address || null,
          medical_history: newPatientData.medical_history || null
        });

        if (newPatientResult.error) throw newPatientResult.error;
        finalPatientId = newPatientResult.data.id;
      }

      // Combine date and time
      const appointmentDateTime = `${formData.appointment_date}T${formData.appointment_time}:00`;
      
      const result = await offlineSupabase.insert('appointments', {
        patient_id: finalPatientId,
        clinic_id: profile.id,
        appointment_date: appointmentDateTime,
        duration: parseInt(formData.duration),
        treatment_type: formData.treatment_type || null,
        notes: formData.notes || null,
        status: 'scheduled'
      });

      if (result.error) throw result.error;

      toast({
        title: 'تم بنجاح',
        description: patientType === 'new' ? 'تم إضافة المريض وحجز الموعد بنجاح' : 'تم حجز الموعد بنجاح'
      });

      resetForm();
      setOpen(false);
      onAppointmentAdded?.();

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
    'فحص عام', 'تنظيف الأسنان', 'حشو الأسنان', 'خلع الأسنان',
    'علاج العصب', 'تركيب التاج', 'تقويم الأسنان', 'زراعة الأسنان',
    'تبييض الأسنان', 'أخرى'
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <CalendarPlus className="w-4 h-4 ml-2" />
          إضافة موعد جديد
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center text-xl">
            <CalendarPlus className="w-6 h-6 ml-2" />
            حجز موعد جديد
          </SheetTitle>
          <SheetDescription>
            احجز موعد جديد للمريض أو أضف مريض جديد مع الموعد
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Type Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground border-b pb-2">نوع المريض</h3>
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
          {patientType === 'existing' && (
            <div className="space-y-2">
              <Label htmlFor="patient_id">اختر المريض *</Label>
              <Select onValueChange={(value) => handleChange('patient_id', value)} value={formData.patient_id}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="اختر المريض" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      <div className="flex items-center">
                        <User className="w-4 h-4 ml-2" />
                        <span>{patient.full_name}</span>
                        {patient.phone && (
                          <span className="text-muted-foreground mr-2">
                            ({patient.phone})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* New Patient Form */}
          {patientType === 'new' && (
            <Card className="border-dashed">
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
                    <Input
                      id="new_full_name"
                      value={newPatientData.full_name}
                      onChange={(e) => handleNewPatientChange('full_name', e.target.value)}
                      placeholder="الاسم الكامل"
                      className="h-11"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new_phone">رقم الهاتف</Label>
                    <Input
                      id="new_phone"
                      value={newPatientData.phone}
                      onChange={(e) => handleNewPatientChange('phone', e.target.value)}
                      placeholder="+201234567890"
                      type="tel"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new_email">البريد الإلكتروني</Label>
                    <Input
                      id="new_email"
                      value={newPatientData.email}
                      onChange={(e) => handleNewPatientChange('email', e.target.value)}
                      placeholder="patient@example.com"
                      type="email"
                      className="h-11"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new_date_of_birth">تاريخ الميلاد</Label>
                    <Input
                      id="new_date_of_birth"
                      value={newPatientData.date_of_birth}
                      onChange={(e) => handleNewPatientChange('date_of_birth', e.target.value)}
                      type="date"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new_gender">الجنس</Label>
                    <Select onValueChange={(value) => handleNewPatientChange('gender', value)} value={newPatientData.gender}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="اختر الجنس" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">ذكر</SelectItem>
                        <SelectItem value="female">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new_address">العنوان</Label>
                    <Input
                      id="new_address"
                      value={newPatientData.address}
                      onChange={(e) => handleNewPatientChange('address', e.target.value)}
                      placeholder="عنوان المريض"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_medical_history">التاريخ المرضي</Label>
                  <Textarea
                    id="new_medical_history"
                    value={newPatientData.medical_history}
                    onChange={(e) => handleNewPatientChange('medical_history', e.target.value)}
                    placeholder="التاريخ المرضي والحساسيات..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appointment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground border-b pb-2">تفاصيل الموعد</h3>
            
            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appointment_date">تاريخ الموعد *</Label>
                <Input
                  id="appointment_date"
                  type="date"
                  value={formData.appointment_date}
                  onChange={(e) => handleChange('appointment_date', e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appointment_time">وقت الموعد *</Label>
                <Input
                  id="appointment_time"
                  type="time"
                  value={formData.appointment_time}
                  onChange={(e) => handleChange('appointment_time', e.target.value)}
                  required
                  className="h-11"
                />
              </div>
            </div>

            {/* Duration and Treatment Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">مدة الموعد (بالدقائق)</Label>
                <Select onValueChange={(value) => handleChange('duration', value)} value={formData.duration}>
                  <SelectTrigger className="h-11">
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
                <Select onValueChange={(value) => handleChange('treatment_type', value)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="اختر نوع العلاج" />
                  </SelectTrigger>
                  <SelectContent>
                    {treatmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center">
                          <Stethoscope className="w-4 h-4 ml-2" />
                          {type}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات إضافية</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="أي ملاحظات حول الموعد..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading} className="px-8">
              <Save className="w-4 h-4 ml-2" />
              {loading ? 'جاري الحفظ...' : 'حفظ الموعد'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddAppointmentDrawer;