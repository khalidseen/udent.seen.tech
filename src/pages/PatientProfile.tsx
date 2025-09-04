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
import Enhanced2DToothChart from "@/components/dental/Enhanced2DToothChart";
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
      {/* Enhanced Patient Header */}
      <div className="bg-white/90 dark:bg-background/90 backdrop-blur-xl border-b border-primary/20 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* Patient Avatar & Basic Info */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="hover:bg-primary/10 mb-4 lg:mb-0">
                المرضى ←
              </Button>
              <div className="hidden lg:block h-8 w-px bg-border"></div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center text-white font-bold text-xl shadow-xl">
                    {patient.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 text-2xl">
                    {patient.gender === 'male' ? '👨‍⚕️' : patient.gender === 'female' ? '👩‍⚕️' : '👤'}
                  </div>
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {patient.full_name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm text-muted-foreground">#{patient.id.slice(0, 8)}</p>
                    {patient.gender && (
                      <Badge variant="outline" className="text-xs">
                        {patient.gender === 'male' ? 'ذكر' : 'أنثى'}
                      </Badge>
                    )}
                    {patient.date_of_birth && (
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                        {getAge(patient.date_of_birth)} سنة
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      مريض منذ {format(new Date(patient.created_at), 'MMMM yyyy', { locale: ar })}
                    </Badge>
                  </div>
                  {/* Contact Info Row */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                    {patient.phone && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {patient.phone}
                      </div>
                    )}
                    {patient.email && (
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {patient.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Stats & Actions */}
            <div className="flex-1 flex flex-col lg:flex-row items-start lg:items-center justify-end gap-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 gap-2 w-full lg:w-auto">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 rounded-lg p-3 border border-blue-200/50 dark:border-blue-800/50 text-center min-w-[80px] hover:shadow-md transition-all duration-200">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{patientStats.totalAppointments}</div>
                  <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">إجمالي المواعيد</div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 rounded-lg p-3 border border-green-200/50 dark:border-green-800/50 text-center min-w-[80px] hover:shadow-md transition-all duration-200">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">{patientStats.completedTreatments}</div>
                  <div className="text-xs text-green-700 dark:text-green-300 font-medium">العلاجات المكتملة</div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-1 w-full lg:w-auto">
                <Button variant="outline" size="sm" className="w-8 h-8 p-0 hover:bg-blue-50 hover:border-blue-300">
                  <Printer className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleEditPatient} className="w-8 h-8 p-0 hover:bg-orange-50 hover:border-orange-300">
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" onClick={() => setTreatmentDialogOpen(true)} className="bg-gradient-to-r from-primary to-secondary shadow-md hover:shadow-lg transition-all duration-200 flex-1 lg:flex-none">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span className="text-xs">إضافة علاج جديد</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-0">
        {/* Medical File Sections Tabs */}
        <Tabs defaultValue="dental-chart" className="w-full">
          {/* Responsive Tabs Navigation */}
          <div className="mb-0">
            <div className="bg-background/90 backdrop-blur-sm shadow-lg border rounded-t-2xl" dir="rtl">
              <TabsList className="grid w-full h-auto bg-transparent p-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1" dir="rtl">
                <TabsTrigger value="financial" className="flex flex-col sm:flex-row items-center justify-center gap-1 p-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-primary-foreground hover:bg-emerald-500/10 transition-all duration-200 rounded-lg text-center" dir="rtl">
                  <CreditCard className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs font-medium">الحالة المالية</span>
                </TabsTrigger>
                <TabsTrigger value="appointments" className="flex flex-col sm:flex-row items-center justify-center gap-1 p-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-primary-foreground hover:bg-orange-500/10 transition-all duration-200 rounded-lg text-center" dir="rtl">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs font-medium">المواعيد</span>
                </TabsTrigger>
                <TabsTrigger value="images" className="flex flex-col sm:flex-row items-center justify-center gap-1 p-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-cyan-500 data-[state=active]:text-primary-foreground hover:bg-indigo-500/10 transition-all duration-200 rounded-lg text-center" dir="rtl">
                  <Image className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs font-medium">الأشعة</span>
                </TabsTrigger>
                <TabsTrigger value="prescriptions" className="flex flex-col sm:flex-row items-center justify-center gap-1 p-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-primary-foreground hover:bg-purple-500/10 transition-all duration-200 rounded-lg text-center" dir="rtl">
                  <Stethoscope className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs font-medium">الوصفات</span>
                </TabsTrigger>
                <TabsTrigger value="overview" className="flex flex-col sm:flex-row items-center justify-center gap-1 p-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-primary-foreground hover:bg-green-500/10 transition-all duration-200 rounded-lg text-center" dir="rtl">
                  <Activity className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs font-medium">نظرة عامة</span>
                </TabsTrigger>
                <TabsTrigger value="dental-chart" className="flex flex-col sm:flex-row items-center justify-center gap-1 p-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-primary-foreground hover:bg-primary/10 transition-all duration-200 rounded-lg text-center" dir="rtl">
                  <Heart className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs font-medium">مخطط الأسنان</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Main Content Area - Merged directly with tabs */}
          <div className="w-full">
              <TabsContent value="dental-chart" className="mt-0">
                <Card className="bg-white/95 dark:bg-card/95 backdrop-blur-sm shadow-2xl border-0 rounded-t-none rounded-b-2xl animate-fade-in">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg">
                    <CardTitle className="text-xl flex items-center justify-center gap-3 text-center">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Heart className="w-4 h-4 text-primary" />
                      </div>
                      مخطط الأسنان ثنائي الأبعاد المحسن
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <Enhanced2DToothChart 
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
                    <CardTitle className="text-xl flex items-center justify-center gap-3 text-center">
                      <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-green-600" />
                      </div>
                      لوحة معلومات الصحة الفموية الشاملة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <OralHealthDashboard patientId={patient.id} onStatUpdate={fetchPatientStats} />
                    <div className="mt-8 pt-8 border-t border-border/50">
                      <h3 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2 text-center">
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
                    <CardTitle className="text-xl flex items-center justify-center gap-3 text-center">
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
                    <CardTitle className="text-xl flex items-center justify-center gap-3 text-center">
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
                    <CardTitle className="text-xl flex items-center justify-center gap-3 text-center">
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
                    <CardTitle className="text-xl flex items-center justify-center gap-3 text-center">
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