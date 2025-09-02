import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-green-50/30 dark:from-background dark:via-background dark:to-background">
      {/* Premium Header */}
      <div className="bg-white/80 dark:bg-background/80 backdrop-blur-sm border-b border-primary/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="hover:bg-primary/10">
                ← المرضى
              </Button>
              <div className="h-8 w-px bg-border"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold">
                  {patient.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{patient.full_name}</h1>
                  <p className="text-sm text-muted-foreground">معرف المريض: #{patient.id.slice(0, 8)}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Patient Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/80 dark:bg-background/80 rounded-lg p-3 border shadow-sm text-center min-w-[100px]">
                  <div className="text-xl font-bold text-blue-600">{patientStats.totalAppointments}</div>
                  <div className="text-xs text-muted-foreground">إجمالي المواعيد</div>
                </div>
                
                <div className="bg-white/80 dark:bg-background/80 rounded-lg p-3 border shadow-sm text-center min-w-[100px]">
                  <div className="text-xl font-bold text-green-600">{patientStats.completedTreatments}</div>
                  <div className="text-xs text-muted-foreground">العلاجات المكتملة</div>
                </div>
                
                <div className="bg-white/80 dark:bg-background/80 rounded-lg p-3 border shadow-sm text-center min-w-[100px]">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Heart className="h-4 w-4 text-green-600" />
                    <span className="text-xl font-bold text-green-600">{patientStats.healthPercentage}%</span>
                  </div>
                  <div className="text-xs text-green-700 font-medium">جيد</div>
                  <div className="text-xs text-muted-foreground">صحة الفم</div>
                </div>
              </div>

              <div className="h-8 w-px bg-border mx-4"></div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-200">
                  <Printer className="w-4 h-4 ml-2" />
                  طباعة التقرير
                </Button>
                <Button variant="outline" size="sm" onClick={handleEditPatient} className="hover:bg-orange-50 hover:border-orange-200">
                  <Edit className="w-4 h-4 ml-2" />
                  تعديل البيانات
                </Button>
                <Button size="sm" onClick={() => setTreatmentDialogOpen(true)} className="bg-gradient-to-r from-primary to-secondary shadow-lg hover:shadow-xl transition-all duration-300">
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة علاج جديد
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Premium Patient Header Card */}
        <PatientHeader patient={patient} />

        {/* Main Content Layout */}
        <Tabs defaultValue="dental-chart" className="w-full">
          <div className="grid grid-cols-12 gap-8">
            {/* Left Column - Navigation Sidebar */}
            <div className="col-span-3">
              <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm shadow-xl border-0 sticky top-24">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" />
                    أقسام الملف الطبي
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <TabsList className="grid w-full grid-cols-1 h-auto bg-transparent space-y-2">
                    <TabsTrigger value="dental-chart" className="w-full justify-start gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white hover:bg-primary/10 transition-all duration-200">
                      <Heart className="w-4 h-4" />
                      مخطط الأسنان التفاعلي
                    </TabsTrigger>
                    <TabsTrigger value="overview" className="w-full justify-start gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white hover:bg-green-500/10 transition-all duration-200">
                      <Activity className="w-4 h-4" />
                      نظرة عامة على الصحة
                    </TabsTrigger>
                    <TabsTrigger value="prescriptions" className="w-full justify-start gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white hover:bg-purple-500/10 transition-all duration-200">
                      <Stethoscope className="w-4 h-4" />
                      الوصفات الطبية
                    </TabsTrigger>
                    <TabsTrigger value="images" className="w-full justify-start gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white hover:bg-indigo-500/10 transition-all duration-200">
                      <Image className="w-4 h-4" />
                      الأشعة والصور
                    </TabsTrigger>
                    <TabsTrigger value="appointments" className="w-full justify-start gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white hover:bg-orange-500/10 transition-all duration-200">
                      <Calendar className="w-4 h-4" />
                      تقويم المواعيد
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="w-full justify-start gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white hover:bg-emerald-500/10 transition-all duration-200">
                      <CreditCard className="w-4 h-4" />
                      الحالة المالية
                    </TabsTrigger>
                  </TabsList>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Main Content Area */}
            <div className="col-span-9">
              <TabsContent value="dental-chart" className="mt-0">
                <Card className="bg-white/95 dark:bg-card/95 backdrop-blur-sm shadow-2xl border-0 animate-fade-in">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg">
                    <CardTitle className="text-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Heart className="w-4 h-4 text-primary" />
                      </div>
                      مخطط الأسنان التفاعلي ثلاثي الأبعاد
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <Enhanced3DToothChart 
                      patientId={patient.id} 
                      onToothSelect={handleToothSelect}
                      selectedTooth={selectedTooth}
                      numberingSystem={selectedToothSystem}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="overview" className="mt-0">
                <Card className="bg-white/95 dark:bg-card/95 backdrop-blur-sm shadow-2xl border-0 animate-fade-in">
                  <CardHeader className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-t-lg">
                    <CardTitle className="text-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-green-600" />
                      </div>
                      لوحة معلومات الصحة الفموية الشاملة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <OralHealthDashboard patientId={patient.id} onStatUpdate={fetchPatientStats} />
                    <div className="mt-8 pt-8 border-t border-border/50">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        الخط الزمني للعلاجات
                      </h3>
                      <PatientTimeline patientId={patient.id} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="prescriptions" className="mt-0">
                <Card className="bg-white/95 dark:bg-card/95 backdrop-blur-sm shadow-2xl border-0 animate-fade-in">
                  <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-t-lg">
                    <CardTitle className="text-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Stethoscope className="w-4 h-4 text-purple-600" />
                      </div>
                      الوصفات الطبية والأدوية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <PatientPrescriptionSection 
                      patientId={patient.id} 
                      patientData={{
                        full_name: patient.full_name,
                        date_of_birth: patient.date_of_birth,
                        phone: patient.phone
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="images" className="mt-0">
                <Card className="bg-white/95 dark:bg-card/95 backdrop-blur-sm shadow-2xl border-0 animate-fade-in">
                  <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 rounded-t-lg">
                    <CardTitle className="text-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                        <Image className="w-4 h-4 text-indigo-600" />
                      </div>
                      معرض الصور الطبية والأشعة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <PatientImageGallery patientId={patient.id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="appointments" className="mt-0">
                <Card className="bg-white/95 dark:bg-card/95 backdrop-blur-sm shadow-2xl border-0 animate-fade-in">
                  <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-t-lg">
                    <CardTitle className="text-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-orange-600" />
                      </div>
                      تقويم المواعيد والجلسات
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <PatientAppointmentCalendar 
                      patientId={patient.id} 
                      patientName={patient.full_name}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financial" className="mt-0">
                <Card className="bg-white/95 dark:bg-card/95 backdrop-blur-sm shadow-2xl border-0 animate-fade-in">
                  <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-t-lg">
                    <CardTitle className="text-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                      </div>
                      الحالة المالية والفواتير
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <PatientFinancialStatus 
                      patientId={patient.id} 
                      patientName={patient.full_name}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>

      <AddTreatmentDialog
        open={treatmentDialogOpen}
        onOpenChange={setTreatmentDialogOpen}
        patientId={patient.id}
        patientName={patient.full_name}
        onTreatmentAdded={() => setTreatmentDialogOpen(false)}
      />

      {/* Edit Patient Dialog */}
      <Dialog open={editMode} onOpenChange={setEditMode}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المريض</DialogTitle>
          </DialogHeader>
          
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientProfile;