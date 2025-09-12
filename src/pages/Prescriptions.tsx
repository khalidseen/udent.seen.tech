import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileText, Eye } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import CreatePrescriptionDialog from "@/components/prescriptions/CreatePrescriptionDialog";
import ViewPrescriptionDialog from "@/components/prescriptions/ViewPrescriptionDialog";

interface Prescription {
  id: string;
  patient_id: string;
  doctor_name: string;
  diagnosis: string;
  prescription_date: string;
  status: 'active' | 'completed' | 'cancelled';
  patients?: {
    full_name: string;
    phone?: string;
    age?: number;
  };
}

const Prescriptions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  const { data: prescriptions, isLoading, refetch } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patients (
            full_name,
            phone, 
            date_of_birth
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Calculate age from date_of_birth
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
  });

  const filteredPrescriptions = prescriptions?.filter(prescription =>
    prescription.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.doctor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
      />

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
                    <CardTitle className="text-lg text-right">
                      {prescription.patients?.full_name || 'غير محدد'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {prescription.patients?.age ? `${prescription.patients.age} سنة` : 'العمر غير محدد'}
                    </p>
                  </div>
                  <Badge className={getStatusColor(prescription.status)}>
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
                      {new Date(prescription.prescription_date).toLocaleDateString('ar-IQ')}
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPrescription(prescription)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      عرض
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