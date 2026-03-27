import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileText, Eye, User, ExternalLink, Calendar, Activity, Package, Pill, ArrowLeftRight } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import CreatePrescriptionDialog from "@/components/prescriptions/CreatePrescriptionDialog";
import ViewPrescriptionDialog from "@/components/prescriptions/ViewPrescriptionDialog";
import { useNavigate, useSearchParams } from "react-router-dom";

interface Prescription {
  id: string;
  patient_id: string;
  doctor_name: string;
  diagnosis: string;
  prescription_date: string;
  status: 'active' | 'completed' | 'cancelled';
  patients?: {
    id: string;
    full_name: string;
    phone?: string;
    age?: number;
  };
}

const Prescriptions = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patient') || undefined;
  const workflowSource = searchParams.get('from');
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  useEffect(() => {
    if (preselectedPatientId) {
      setShowCreateDialog(true);
    }
  }, [preselectedPatientId]);

  const { data: profile } = useQuery({
    queryKey: ['current-profile'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_current_user_profile');
      return data;
    }
  });

  const clinicId = profile?.id;

  const { data: prescriptions, isLoading, refetch } = useQuery({
    queryKey: ['prescriptions', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patients (
            id,
            full_name,
            phone, 
            date_of_birth
          )
        `)
        .eq('clinic_id', clinicId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data?.map((prescription: any) => ({
        ...prescription,
        patients: prescription.patients ? {
          ...prescription.patients,
          age: prescription.patients.date_of_birth ? 
            new Date().getFullYear() - new Date(prescription.patients.date_of_birth).getFullYear() : 
            undefined
        } : null
      })) as Prescription[];
    },
    enabled: !!clinicId
  });

  const filteredPrescriptions = prescriptions?.filter(prescription =>
    prescription.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.doctor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'نشطة';
      case 'completed': return 'مكتملة';
      case 'cancelled': return 'ملغاة';
      default: return status;
    }
  };

  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShowViewDialog(true);
  };

  return (
    <PageContainer>
      <PageHeader
        title="الوصفات الطبية"
        description="إدارة الوصفات الطبية للمرضى"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/medications?from=prescriptions')}>
              <Pill className="w-4 h-4 ml-1" /> الأدوية
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/inventory?category=medications&from=prescriptions')}>
              <Package className="w-4 h-4 ml-1" /> المخزون
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/stock-movements?reference=usage&from=prescriptions')}>
              <ArrowLeftRight className="w-4 h-4 ml-1" /> حركات الاستخدام
            </Button>
          </div>
        }
      />

      {(preselectedPatientId || workflowSource) && (
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          {preselectedPatientId && <span>تم فتح الصفحة ضمن سياق مريض محدد وسيتم فتح إنشاء وصفة مباشرة. </span>}
          {workflowSource === 'medications' && <span>تم الوصول من شاشة الأدوية لمراجعة الوصفات المرتبطة. </span>}
          {workflowSource === 'inventory' && <span>تم الوصول من المخزون لمتابعة الاستهلاك الدوائي.</span>}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="البحث في الوصفات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          وصفة طبية جديدة
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPrescriptions?.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              لا توجد وصفات طبية
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              ابدأ بإضافة وصفة طبية جديدة للمرضى
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              إضافة وصفة طبية
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrescriptions?.map((prescription) => (
            <Card key={prescription.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-right flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <button
                        className="text-primary hover:underline"
                        onClick={() => prescription.patients?.id && navigate(`/patients/${prescription.patients.id}`)}
                      >
                        {prescription.patients?.full_name || 'غير محدد'}
                      </button>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {prescription.patients?.age ? `${prescription.patients.age} سنة` : 'العمر غير محدد'}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(prescription.status) as any}>
                    {getStatusLabel(prescription.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">التشخيص:</p>
                    <p className="text-sm">{prescription.diagnosis}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">الطبيب:</p>
                    <p className="text-sm">{prescription.doctor_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">تاريخ الوصفة:</p>
                    <p className="text-sm">
                      {new Date(prescription.prescription_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPrescription(prescription)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      عرض
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => prescription.patients?.id && navigate(`/patients/${prescription.patients.id}?tab=prescriptions`)}
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      ملف المريض
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/appointments/new?patient=${prescription.patient_id}`)}
                      className="flex items-center gap-1"
                    >
                      <Calendar className="w-3 h-3" />
                      موعد
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/dental-treatments-management?patient=${prescription.patient_id}`)}
                      className="flex items-center gap-1"
                    >
                      <Activity className="w-3 h-3" />
                      علاجات
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/stock-movements?reference=usage&from=prescriptions`)}
                      className="flex items-center gap-1"
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                      المخزون
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreatePrescriptionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => refetch()}
        preselectedPatientId={preselectedPatientId}
      />

      <ViewPrescriptionDialog
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
        prescription={selectedPrescription}
      />
    </PageContainer>
  );
};

export default Prescriptions;
