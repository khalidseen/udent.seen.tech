import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CalendarPlus, Clock, User, Stethoscope } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

interface Patient {
  id: string;
  full_name: string;
  phone: string;
}

const NewAppointmentForm = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_date: '',
    appointment_time: '',
    duration: '30',
    treatment_type: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, phone')
        .order('full_name');

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_id || !formData.appointment_date || !formData.appointment_time) {
      toast({
        title: 'خطأ',
        description: 'يجب ملء جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      // Get current user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('لم يتم العثور على ملف المستخدم');

      // Combine date and time
      const appointmentDateTime = `${formData.appointment_date}T${formData.appointment_time}:00`;

      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: formData.patient_id,
          clinic_id: profile.id,
          appointment_date: appointmentDateTime,
          duration: parseInt(formData.duration),
          treatment_type: formData.treatment_type || null,
          notes: formData.notes || null,
          status: 'scheduled'
        });

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم حجز الموعد بنجاح'
      });

      // Reset form
      setFormData({
        patient_id: '',
        appointment_date: '',
        appointment_time: '',
        duration: '30',
        treatment_type: '',
        notes: ''
      });

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
    'فحص عام',
    'تنظيف الأسنان',
    'حشو الأسنان',
    'خلع الأسنان',
    'علاج العصب',
    'تركيب التاج',
    'تقويم الأسنان',
    'زراعة الأسنان',
    'تبييض الأسنان',
    'أخرى'
  ];

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader 
        title="حجز موعد جديد" 
        description="احجز موعد جديد للمريض" 
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarPlus className="w-5 h-5 ml-2" />
            بيانات الموعد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Selection */}
            <div className="space-y-2">
              <Label htmlFor="patient_id">اختر المريض *</Label>
              <Select onValueChange={(value) => handleChange('patient_id', value)}>
                <SelectTrigger>
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
                />
              </div>
            </div>

            {/* Duration and Treatment Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">مدة الموعد (بالدقائق)</Label>
                <Select onValueChange={(value) => handleChange('duration', value)} value={formData.duration}>
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
                <Select onValueChange={(value) => handleChange('treatment_type', value)}>
                  <SelectTrigger>
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
              />
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
    </PageContainer>
  );
};

export default NewAppointmentForm;