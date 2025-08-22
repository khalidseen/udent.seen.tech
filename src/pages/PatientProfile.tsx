import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Activity, Calendar, FileText, Edit, Plus, Smile } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import PatientMedicalHistory from "@/components/patients/PatientMedicalHistory";
import PatientTimeline from "@/components/patients/PatientTimeline";
import AddTreatmentDialog from "@/components/patients/AddTreatmentDialog";
import PalmerDentalChart from "@/components/dental/PalmerDentalChart";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Patient | null>(null);
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    console.log('PatientProfile useEffect triggered:', { 
      patientId, 
      user: user ? { id: user.id, email: user.email } : null,
      loading 
    });
    
    if (patientId && user) {
      console.log('Starting fetchPatient...');
      fetchPatient();
    } else {
      console.log('Not fetching patient:', { 
        hasPatientId: !!patientId, 
        hasUser: !!user 
      });
      // Set a timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        if (!user) {
          console.log('Timeout: No user found, stopping loading');
          setLoading(false);
          toast({
            title: "خطأ في التحقق",
            description: "لم يتم العثور على بيانات المستخدم. يرجى تسجيل الدخول مرة أخرى.",
            variant: "destructive",
          });
        }
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [patientId, user]);

  const fetchPatient = async () => {
    console.log('fetchPatient called with user:', user ? { id: user.id, email: user.email } : null);
    
    if (!user) {
      console.log('fetchPatient: No user, stopping loading');
      setLoading(false);
      return;
    }

    try {
      console.log('fetchPatient: Getting user profile...');
      // Get the clinic_id from user profile first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      console.log('fetchPatient: Profile query result:', { profile, profileError });

      if (profileError) {
        console.error('Profile query error:', profileError);
        toast({
          title: "خطأ في الملف الشخصي",
          description: "حدث خطأ في تحميل بيانات الملف الشخصي: " + profileError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!profile) {
        console.error('No profile found for user');
        toast({
          title: "ملف شخصي مفقود",
          description: "لم يتم العثور على ملف شخصي للمستخدم. يرجى الاتصال بالإدارة.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log('fetchPatient: Getting patient data with clinic_id:', profile.id, 'patient_id:', patientId);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .eq('clinic_id', profile.id)
        .maybeSingle();

      console.log('fetchPatient: Patient query result:', { data, error });

      if (error) {
        console.error('Patient query error:', error);
        throw error;
      }
      
      if (!data) {
        console.log('fetchPatient: No patient found');
        toast({
          title: "مريض غير موجود",
          description: "لم يتم العثور على المريض أو ليس لديك صلاحية للوصول إليه",
          variant: "destructive",
        });
      }
      
      console.log('fetchPatient: Setting patient data:', data);
      setPatient(data);
    } catch (error) {
      console.error('Error fetching patient:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل بيانات المريض: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      console.log('fetchPatient: Setting loading to false');
      setLoading(false);
    }
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
      <PageHeader 
        title={`ملف المريض: ${patient.full_name}`}
        description="عرض تفاصيل المريض وتاريخه الطبي"
        action={
          <div className="flex space-x-2 space-x-reverse">
            <Button variant="outline">
              <FileText className="w-4 h-4 ml-2" />
              طباعة التقرير
            </Button>
            <Button variant="default" onClick={handleEditPatient}>
              <Edit className="w-4 h-4 ml-2" />
              تعديل ملف المريض
            </Button>
            <Sheet open={treatmentDialogOpen} onOpenChange={setTreatmentDialogOpen}>
              <SheetTrigger asChild>
                <Button variant="secondary">
                  <Plus className="w-4 h-4 ml-2" />
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
        }
      />

      {/* Patient Basic Info */}
      <Card className="border border-border/60 bg-white/90 dark:bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 ml-2" />
              المعلومات الأساسية
            </CardTitle>
            <div className="flex items-center space-x-2 space-x-reverse">
              {getGenderBadge(patient.gender)}
              {patient.date_of_birth && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  {getAge(patient.date_of_birth)} سنة
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patient.phone && (
              <div>
                <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                <p className="font-medium">{patient.phone}</p>
              </div>
            )}
            {patient.email && (
              <div>
                <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                <p className="font-medium">{patient.email}</p>
              </div>
            )}
            {patient.date_of_birth && (
              <div>
                <p className="text-sm text-muted-foreground">تاريخ الميلاد</p>
                <p className="font-medium">
                  {format(new Date(patient.date_of_birth), 'yyyy/MM/dd', { locale: ar })}
                </p>
              </div>
            )}
            {patient.address && (
              <div className="md:col-span-2 lg:col-span-3">
                <p className="text-sm text-muted-foreground">العنوان</p>
                <p className="font-medium">{patient.address}</p>
              </div>
            )}
            {patient.medical_history && (
              <div className="md:col-span-2 lg:col-span-3">
                <p className="text-sm text-muted-foreground">التاريخ المرضي</p>
                <p className="font-medium">{patient.medical_history}</p>
              </div>
            )}
            {patient.notes && (
              <div className="md:col-span-2 lg:col-span-3">
                <p className="text-sm text-muted-foreground">ملاحظات إضافية</p>
                <p className="font-medium">{patient.notes}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">تاريخ التسجيل</p>
              <p className="font-medium">
                {format(new Date(patient.created_at), 'yyyy/MM/dd', { locale: ar })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Details Tabs */}
      <Tabs defaultValue="treatments" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="treatments" className="flex items-center">
            <Activity className="w-4 h-4 ml-1" />
            العلاجات
          </TabsTrigger>
          <TabsTrigger value="dental-status" className="flex items-center">
            <Smile className="w-4 h-4 ml-1" />
            حالة الأسنان
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center">
            <Calendar className="w-4 h-4 ml-1" />
            المواعيد
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center">
            <FileText className="w-4 h-4 ml-1" />
            الخط الزمني
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="treatments" className="mt-6">
          <PatientMedicalHistory patientId={patient.id} />
        </TabsContent>
        
        <TabsContent value="dental-status" className="mt-6">
          <PalmerDentalChart 
            patientId={patient.id} 
            patientAge={patient.date_of_birth ? getAge(patient.date_of_birth) : 25}
          />
        </TabsContent>
        
        <TabsContent value="appointments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>مواعيد المريض</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">سيتم إضافة قائمة المواعيد هنا</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="timeline" className="mt-6">
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
    </PageContainer>
  );
};

export default PatientProfile;