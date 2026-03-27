import { lazy, Profiler, Suspense, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, DollarSign, FileText, Image, Pill, Activity, Edit, Smile, Shield } from "lucide-react";
import { CurrencyAmount } from "@/components/ui/currency-display";
import { PageSkeleton } from "@/components/ui/skeleton";
import { logger } from "@/lib/logger";

const PatientAppointments = lazy(() =>
  import("@/components/patients/profile/PatientAppointments").then((module) => ({
    default: module.PatientAppointments,
  }))
);

const AppointmentReminderScheduler = lazy(() =>
  import("@/components/appointments/AppointmentReminderScheduler").then((module) => ({
    default: module.AppointmentReminderScheduler,
  }))
);

const PatientTreatments = lazy(() =>
  import("@/components/patients/profile/PatientTreatments").then((module) => ({
    default: module.PatientTreatments,
  }))
);

const PatientFinancials = lazy(() =>
  import("@/components/patients/profile/PatientFinancials").then((module) => ({
    default: module.PatientFinancials,
  }))
);

const PatientPrescriptions = lazy(() =>
  import("@/components/patients/profile/PatientPrescriptions").then((module) => ({
    default: module.PatientPrescriptions,
  }))
);

const PatientRecords = lazy(() =>
  import("@/components/patients/profile/PatientRecords").then((module) => ({
    default: module.PatientRecords,
  }))
);

const PatientNotes = lazy(() =>
  import("@/components/patients/profile/PatientNotes").then((module) => ({
    default: module.PatientNotes,
  }))
);

const PatientWorkflowTracker = lazy(() =>
  import("@/components/workflow/PatientWorkflowTracker").then((module) => ({
    default: module.PatientWorkflowTracker,
  }))
);

const PatientImageGallery = lazy(() =>
  import("@/components/medical-records/PatientImageGallery").then((module) => ({
    default: module.PatientImageGallery,
  }))
);

const AnatomicalDentalChart = lazy(() =>
  import("@/components/dental/AnatomicalDentalChart").then((module) => ({
    default: module.AnatomicalDentalChart,
  }))
);

export default function PatientProfile() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'workflow';

  const onPatientProfileRender = useCallback((
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number
  ) => {
    if (import.meta.env.DEV && actualDuration > 12) {
      logger.debug(`[perf] ${id} ${phase}: ${actualDuration.toFixed(2)}ms`);
    }
  }, []);

  const { data: patient, isLoading, isError } = useQuery({
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
    return <PageSkeleton variant="form" />;
  }

  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-destructive">حدث خطأ في تحميل بيانات المريض</p>
            <Button variant="outline" onClick={() => navigate(-1)}>الرجوع</Button>
          </CardContent>
        </Card>
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
    <Profiler id="PatientProfile" onRender={onPatientProfileRender}>
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
          <Edit className="w-4 h-4 ml-2" />
          تعديل البيانات
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate(`/appointments/new?patient=${patientId}`)}>
          <Calendar className="w-4 h-4 ml-1" />
          حجز موعد
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate(`/dental-treatments-management?patient=${patientId}`)}>
          <Activity className="w-4 h-4 ml-1" />
          إضافة علاج
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate(`/invoice-management?patient=${patientId}&openCreate=true`)}>
          <DollarSign className="w-4 h-4 ml-1" />
          إنشاء فاتورة
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate(`/insurance-management?tab=patients&patient=${patientId}&openCreate=true`)}>
          <Shield className="w-4 h-4 ml-1" />
          التأمين
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate(`/prescriptions?patient=${patientId}`)}>
          <Pill className="w-4 h-4 ml-1" />
          وصفة طبية
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
              <CurrencyAmount amount={stats?.balance || 0} />
            </div>
            <p className="text-xs text-muted-foreground">
              {Number(stats?.balance || 0) > 0 ? 'مبلغ مستحق' : 'لا توجد مستحقات'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={initialTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 w-full">
          <TabsTrigger value="workflow">
            <Activity className="h-4 w-4 ml-2" />
            المسار
          </TabsTrigger>
          <TabsTrigger value="dental-chart">
            <Smile className="h-4 w-4 ml-2" />
            المخطط السني
          </TabsTrigger>
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
            المالية
          </TabsTrigger>
          <TabsTrigger value="images">
            <Image className="h-4 w-4 ml-2" />
            معرض الصور
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

        <TabsContent value="workflow">
          <Suspense fallback={<PageSkeleton variant="cards" />}>
            <PatientWorkflowTracker patientId={patientId!} />
          </Suspense>
        </TabsContent>

        <TabsContent value="dental-chart">
          <Card>
            <CardHeader>
              <CardTitle>المخطط السني ثنائي الأبعاد</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<PageSkeleton variant="cards" />}>
                <AnatomicalDentalChart
                  patientId={patientId!}
                  onToothSelect={() => {}}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Suspense fallback={<PageSkeleton variant="cards" />}>
            <PatientAppointments patientId={patientId!} />
            {patient?.clinic_id && (
              <AppointmentReminderScheduler patientId={patientId!} clinicId={patient.clinic_id} />
            )}
          </Suspense>
        </TabsContent>

        <TabsContent value="treatments">
          <Suspense fallback={<PageSkeleton variant="cards" />}>
            <PatientTreatments patientId={patientId!} />
          </Suspense>
        </TabsContent>

        <TabsContent value="financials">
          <Suspense fallback={<PageSkeleton variant="cards" />}>
            <PatientFinancials patientId={patientId!} />
          </Suspense>
        </TabsContent>

        <TabsContent value="images">
          <Suspense fallback={<PageSkeleton variant="cards" />}>
            <PatientImageGallery patientId={patientId!} />
          </Suspense>
        </TabsContent>

        <TabsContent value="prescriptions">
          <Suspense fallback={<PageSkeleton variant="cards" />}>
            <PatientPrescriptions patientId={patientId!} />
          </Suspense>
        </TabsContent>

        <TabsContent value="records">
          <Suspense fallback={<PageSkeleton variant="cards" />}>
            <PatientRecords patientId={patientId!} />
          </Suspense>
        </TabsContent>

        <TabsContent value="notes">
          <Suspense fallback={<PageSkeleton variant="cards" />}>
            <PatientNotes patientId={patientId!} />
          </Suspense>
        </TabsContent>
      </Tabs>
      </div>
    </Profiler>
  );
}
