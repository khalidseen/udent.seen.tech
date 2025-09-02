import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Plus, FileText, Printer, Stethoscope, Heart, Calendar, Image, CreditCard, Activity } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { PatientHeader } from "@/components/patients/PatientHeader";
import { OralHealthDashboard } from "@/components/dental/OralHealthDashboard";
import Enhanced3DToothChart from "@/components/dental/Enhanced3DToothChart";
import PatientTimeline from "@/components/patients/PatientTimeline";
import AddTreatmentDialog from "@/components/patients/AddTreatmentDialog";
import { PatientImageGallery } from "@/components/medical-records/PatientImageGallery";
import { PatientAppointmentCalendar } from "@/components/patients/PatientAppointmentCalendar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import PatientPrescriptionSection from "@/components/patients/PatientPrescriptionSection";
import PatientFinancialStatus from "@/components/patients/PatientFinancialStatus";

interface Patient {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  date_of_birth: string;
  gender: string;
  address: string;
  medical_history: string;
  notes: string;
  created_at: string;
}

const PatientProfile = () => {
  const { id: patientId } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Patient | null>(null);
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<string>("");
  const [selectedToothSystem, setSelectedToothSystem] = useState<'universal' | 'palmer' | 'fdi'>('universal');
  const [patientStats, setPatientStats] = useState({
    totalAppointments: 0,
    completedTreatments: 0,
    healthPercentage: 85
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (patientId && user) {
      fetchPatient();
      fetchPatientStats();
    }
  }, [patientId, user]);

  const fetchPatient = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get the clinic_id from user profile first
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        console.error('No profile found for user');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .eq('clinic_id', profile.id)
        .maybeSingle();

      if (error) throw error;
      setPatient(data);
    } catch (error) {
      console.error('Error fetching patient:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل بيانات المريض",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientStats = async () => {
    if (!patientId) return;

    try {
      // Fetch appointments count
      const { data: appointments } = await supabase
        .from('appointments')
        .select('id, status')
        .eq('patient_id', patientId);

      // Fetch treatments count
      const { data: treatments } = await supabase
        .from('dental_treatments')
        .select('id, status')
        .eq('patient_id', patientId);

      // Fetch tooth conditions for health percentage
      const { data: conditions } = await supabase
        .from('tooth_conditions')
        .select('condition_type')
        .eq('patient_id', patientId);

      const totalAppointments = appointments?.length || 0;
      const completedTreatments = treatments?.filter(t => t.status === 'completed').length || 0;
      
      // Calculate health percentage based on healthy teeth
      let healthyTeeth = 0;
      let treatedTeeth = 0;
      conditions?.forEach(condition => {
        if (condition.condition_type === 'healthy') healthyTeeth++;
        if (['filled', 'crown', 'root_canal'].includes(condition.condition_type)) treatedTeeth++;
      });
      
      const totalHealthyTeeth = healthyTeeth + treatedTeeth;
      const healthPercentage = Math.round((totalHealthyTeeth / 32) * 100);

      setPatientStats({
        totalAppointments,
        completedTreatments,
        healthPercentage: healthPercentage || 85
      });
    } catch (error) {
      console.error('Error fetching patient stats:', error);
    }
  };

  const handleToothSelect = (toothNumber: string, system: 'universal' | 'palmer' | 'fdi') => {
    setSelectedTooth(toothNumber);
    setSelectedToothSystem(system);
  };

  const getGenderBadge = (gender: string) => {
    return gender === 'male' ? (
      <Badge variant="outline">ذكر</Badge>
    ) : gender === 'female' ? (
      <Badge variant="outline">أنثى</Badge>
    ) : null;
  };

  const getAge = (dateOfBirth: string) => {
    return new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
  };

  const handleEditPatient = () => {
    setEditData({ ...patient! });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!editData || !user) return;

    try {
      const { error } = await supabase
        .from('patients')
        .update({
          full_name: editData.full_name,
          phone: editData.phone || null,
          email: editData.email || null,
          date_of_birth: editData.date_of_birth || null,
          gender: editData.gender || null,
          address: editData.address || null,
          medical_history: editData.medical_history || null,
          notes: editData.notes || null
        })
        .eq('id', patientId);

      if (error) throw error;

      setPatient(editData);
      setEditMode(false);
      toast({
        title: "تم بنجاح",
        description: "تم تحديث بيانات المريض بنجاح",
      });
    } catch (error) {
      console.error('Error updating patient:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث البيانات",
        variant: "destructive",
      });
    }
  };

  const handleEditChange = (field: string, value: string) => {
    if (editData) {
      setEditData({ ...editData, [field]: value });
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="text-center">جاري التحميل...</div>
      </PageContainer>
    );
  }

  if (!patient) {
    return (
      <PageContainer>
        <div className="text-center">لم يتم العثور على المريض</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-8">
      {/* Modern Patient Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            ← العودة
          </Button>
          <h1 className="text-2xl font-bold text-primary">ملف المريض الشامل</h1>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 ml-1" />
            طباعة
          </Button>
          <Button variant="outline" size="sm" onClick={handleEditPatient}>
            <Edit className="w-4 h-4 ml-1" />
            تعديل
          </Button>
          <Sheet open={treatmentDialogOpen} onOpenChange={setTreatmentDialogOpen}>
            <SheetTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 ml-1" />
                إضافة علاج
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-xl font-semibold text-center mb-6">
                  إضافة علاج للمريض ({patient.full_name})
                </SheetTitle>
              </SheetHeader>
              <AddTreatmentDialog
                open={true}
                onOpenChange={() => {}}
                patientId={patient.id}
                patientName={patient.full_name}
                onTreatmentAdded={() => setTreatmentDialogOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Enhanced Patient Header */}
      <PatientHeader patient={patient} stats={patientStats} />

      {/* Health Overview Dashboard */}
      <OralHealthDashboard patientId={patient.id} onStatUpdate={fetchPatientStats} />

      {/* Enhanced Patient Details Tabs */}
      <Tabs defaultValue="prescriptions" className="w-full">
        <TabsList className="grid w-full grid-cols-6 h-12">
          <TabsTrigger value="prescriptions" className="flex items-center gap-2 text-sm">
            <Stethoscope className="w-4 h-4" />
            الوصفات الطبية
          </TabsTrigger>
          <TabsTrigger value="financial-status" className="flex items-center gap-2 text-sm">
            <CreditCard className="w-4 h-4" />
            الحالة المالية
          </TabsTrigger>
          <TabsTrigger value="dental-status" className="flex items-center gap-2 text-sm">
            <Heart className="w-4 h-4" />
            حالة الأسنان
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2 text-sm">
            <Image className="w-4 h-4" />
            الصور الطبية
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            المواعيد
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4" />
            الخط الزمني
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="prescriptions" className="mt-8">
          <PatientPrescriptionSection 
            patientId={patient.id} 
            patientData={{
              full_name: patient.full_name,
              date_of_birth: patient.date_of_birth,
              phone: patient.phone
            }}
          />
        </TabsContent>
        
        <TabsContent value="financial-status" className="mt-8">
          <PatientFinancialStatus 
            patientId={patient.id} 
            patientName={patient.full_name}
          />
        </TabsContent>
        
        <TabsContent value="dental-status" className="mt-8">
          <Enhanced3DToothChart 
            patientId={patient.id} 
            onToothSelect={handleToothSelect}
            selectedTooth={selectedTooth}
            numberingSystem={selectedToothSystem}
          />
        </TabsContent>
        
        <TabsContent value="images" className="mt-8">
          <PatientImageGallery patientId={patient.id} />
        </TabsContent>
        
        <TabsContent value="appointments" className="mt-8">
          <PatientAppointmentCalendar 
            patientId={patient.id} 
            patientName={patient.full_name}
          />
        </TabsContent>
        
        <TabsContent value="timeline" className="mt-8">
          <PatientTimeline patientId={patient.id} />
        </TabsContent>
      </Tabs>

      {/* Edit Patient Dialog */}
      <Sheet open={editMode} onOpenChange={setEditMode}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>تعديل بيانات المريض</SheetTitle>
          </SheetHeader>
          
          {editData && (
            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم المريض *</Label>
                  <Input
                    value={editData.full_name}
                    onChange={(e) => handleEditChange('full_name', e.target.value)}
                    placeholder="الاسم الكامل"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input
                    value={editData.phone || ''}
                    onChange={(e) => handleEditChange('phone', e.target.value)}
                    placeholder="+201234567890"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    value={editData.email || ''}
                    onChange={(e) => handleEditChange('email', e.target.value)}
                    placeholder="patient@example.com"
                    type="email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>تاريخ الميلاد</Label>
                  <Input
                    value={editData.date_of_birth || ''}
                    onChange={(e) => handleEditChange('date_of_birth', e.target.value)}
                    type="date"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الجنس</Label>
                  <Select value={editData.gender || ''} onValueChange={(value) => handleEditChange('gender', value)}>
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
                  <Label>العنوان</Label>
                  <Input
                    value={editData.address || ''}
                    onChange={(e) => handleEditChange('address', e.target.value)}
                    placeholder="عنوان المريض"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>التاريخ المرضي</Label>
                  <Textarea
                    value={editData.medical_history || ''}
                    onChange={(e) => handleEditChange('medical_history', e.target.value)}
                    placeholder="التاريخ المرضي والحساسيات..."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>ملاحظات إضافية</Label>
                  <Textarea
                    value={editData.notes || ''}
                    onChange={(e) => handleEditChange('notes', e.target.value)}
                    placeholder="أي ملاحظات أو معلومات إضافية..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleSaveEdit}>
                  حفظ التغييرات
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      </div>
    </PageContainer>
  );
};

export default PatientProfile;