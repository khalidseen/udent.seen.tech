import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, DollarSign, FileText, Image, Pill, Activity, Edit } from "lucide-react";
import { PatientAppointments } from "@/components/patients/profile/PatientAppointments";
import { PatientTreatments } from "@/components/patients/profile/PatientTreatments";
import { PatientFinancials } from "@/components/patients/profile/PatientFinancials";
import { PatientImages } from "@/components/patients/profile/PatientImages";
import { PatientPrescriptions } from "@/components/patients/profile/PatientPrescriptions";
import { PatientRecords } from "@/components/patients/profile/PatientRecords";
import { PatientNotes } from "@/components/patients/profile/PatientNotes";

export default function PatientProfile() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  const { data: stats } = useQuery({
    queryKey: ['patient-stats', patientId],
    queryFn: async () => {
      const [appointmentsResult, treatmentsResult, financialResult] = await Promise.all([
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', patientId),
        supabase
          .from('dental_treatments')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', patientId),
        supabase
          .from('invoices')
          .select('balance_due')
          .eq('patient_id', patientId)
      ]);

      const totalBalance = financialResult.data?.reduce((sum, inv) => 
        sum + Number(inv.balance_due || 0), 0) || 0;

      return {
        appointmentsCount: appointmentsResult.count || 0,
        treatmentsCount: treatmentsResult.count || 0,
        balance: totalBalance,
      };
    },
    enabled: !!patientId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">لم يتم العثور على المريض</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/patients')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{patient.full_name}</h1>
            <p className="text-muted-foreground">
              {patient.phone} • {patient.email}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(`/patients/edit/${patientId}`)}>
          <Edit className="w-4 h-4 mr-2" />
          تعديل البيانات
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              المواعيد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.appointmentsCount || 0}</div>
            <p className="text-xs text-muted-foreground">إجمالي المواعيد</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              العلاجات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.treatmentsCount || 0}</div>
            <p className="text-xs text-muted-foreground">عدد العلاجات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              الرصيد المستحق
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.balance?.toFixed(2) || '0.00'} ريال
            </div>
            <p className="text-xs text-muted-foreground">
              {Number(stats?.balance || 0) > 0 ? 'مبلغ مستحق' : 'لا توجد مستحقات'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="appointments">
            <Calendar className="h-4 w-4 ml-2" />
            المواعيد
          </TabsTrigger>
          <TabsTrigger value="treatments">
            <Activity className="h-4 w-4 ml-2" />
            العلاجات
          </TabsTrigger>
          <TabsTrigger value="financials">
            <DollarSign className="h-4 w-4 ml-2" />
            الحالة المالية
          </TabsTrigger>
          <TabsTrigger value="images">
            <Image className="h-4 w-4 ml-2" />
            الصور والأشعة
          </TabsTrigger>
          <TabsTrigger value="prescriptions">
            <Pill className="h-4 w-4 ml-2" />
            الوصفات
          </TabsTrigger>
          <TabsTrigger value="records">
            <FileText className="h-4 w-4 ml-2" />
            السجلات
          </TabsTrigger>
          <TabsTrigger value="notes">
            <FileText className="h-4 w-4 ml-2" />
            الملاحظات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appointments">
          <PatientAppointments patientId={patientId!} />
        </TabsContent>

        <TabsContent value="treatments">
          <PatientTreatments patientId={patientId!} />
        </TabsContent>

        <TabsContent value="financials">
          <PatientFinancials patientId={patientId!} />
        </TabsContent>

        <TabsContent value="images">
          <PatientImages patientId={patientId!} />
        </TabsContent>

        <TabsContent value="prescriptions">
          <PatientPrescriptions patientId={patientId!} />
        </TabsContent>

        <TabsContent value="records">
          <PatientRecords patientId={patientId!} />
        </TabsContent>

        <TabsContent value="notes">
          <PatientNotes patientId={patientId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
