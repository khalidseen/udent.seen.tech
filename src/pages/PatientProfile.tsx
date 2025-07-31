import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Activity, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import PatientMedicalHistory from "@/components/patients/PatientMedicalHistory";
import PatientTimeline from "@/components/patients/PatientTimeline";

interface Patient {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  date_of_birth: string;
  gender: string;
  address: string;
  medical_history: string;
  created_at: string;
}

const PatientProfile = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      fetchPatient();
    }
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;
      setPatient(data);
    } catch (error) {
      console.error('Error fetching patient:', error);
    } finally {
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
          <Button variant="outline">
            <FileText className="w-4 h-4 ml-2" />
            طباعة التقرير
          </Button>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="treatments" className="flex items-center">
            <Activity className="w-4 h-4 ml-1" />
            العلاجات
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
    </PageContainer>
  );
};

export default PatientProfile;