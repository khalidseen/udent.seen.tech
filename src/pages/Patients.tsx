import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Search, Grid, List } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import PatientTableView from "@/components/patients/PatientTableView";
import PatientCardsView from "@/components/patients/PatientCardsView";
import PatientStatsCards from "@/components/patients/PatientStatsCards";
import AddPatientDrawer from "@/components/patients/AddPatientDrawer";
import AddTreatmentDialog from "@/components/patients/AddTreatmentDialog";
import { useLanguage } from "@/contexts/LanguageContext";

interface PatientData {
  id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  date_of_birth?: string | null;
  gender: string;
  address?: string | null;
  medical_history?: string | null;
  allergies?: string | null;
  current_medications?: string | null;
  insurance_provider?: string | null;
  insurance_policy_number?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  patient_status: string;
  insurance_info?: string | null;
  blood_type?: string | null;
  occupation?: string | null;
  marital_status?: string | null;
  created_at: string;
}

export default function Patients() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [addTreatmentDialogOpen, setAddTreatmentDialogOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedPatientName, setSelectedPatientName] = useState<string>("");

  // Fetch patients
  const { data: patientsData = [], isLoading, refetch } = useQuery({
    queryKey: ['patients', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PatientData[];
    },
  });

  // Convert PatientData to Patient type for PatientTableView
  const patients: any[] = patientsData.map(p => ({
    ...p,
    email: p.email || '',
    date_of_birth: p.date_of_birth || undefined,
    address: p.address || undefined,
    medical_history: p.medical_history || undefined,
    allergies: p.allergies || undefined,
    current_medications: p.current_medications || undefined,
    insurance_provider: p.insurance_provider || undefined,
    insurance_policy_number: p.insurance_policy_number || undefined,
    emergency_contact: p.emergency_contact || undefined,
    emergency_phone: p.emergency_phone || undefined,
    insurance_info: p.insurance_info || undefined,
    blood_type: p.blood_type || undefined,
    occupation: p.occupation || undefined,
    marital_status: p.marital_status || undefined,
  }));

  const handleAddTreatment = (patientId: string, patientName: string) => {
    setSelectedPatientId(patientId);
    setSelectedPatientName(patientName);
    setAddTreatmentDialogOpen(true);
  };

  return (
    <PageContainer>
      <PageHeader
        title={t('navigation.patients')}
        description="إدارة معلومات المرضى والسجلات الطبية"
      />

      {/* إحصائيات المرضى */}
      <PatientStatsCards
        totalPatients={patients.length}
        activePatients={patients.filter(p => p.patient_status === 'active').length}
        inactivePatients={patients.filter(p => p.patient_status === 'inactive').length}
        archivedPatients={patients.filter(p => p.patient_status === 'archived').length}
      />

      <Card className="border-border/60">
        <CardHeader className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              قائمة المرضى
            </CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* أزرار التبديل بين العرضين */}
              <div className="flex gap-1 border border-border rounded-lg p-1 bg-background">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="gap-2"
                >
                  <Grid className="h-4 w-4" />
                  مربعات
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="gap-2"
                >
                  <List className="h-4 w-4" />
                  جدول
                </Button>
              </div>

              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث عن مريض..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 w-full sm:w-[300px]"
                />
              </div>
              
              <Button
                onClick={() => {
                  document.getElementById('add-patient-trigger')?.click();
                }}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {t('actions.addPatient')}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="all">
                الكل ({patients.length})
              </TabsTrigger>
              <TabsTrigger value="active">
                نشط ({patients.filter(p => p.patient_status === 'active').length})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                غير نشط ({patients.filter(p => p.patient_status === 'inactive').length})
              </TabsTrigger>
              <TabsTrigger value="archived">
                مؤرشف ({patients.filter(p => p.patient_status === 'archived').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : patients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">لا يوجد مرضى</h3>
                  <p className="text-muted-foreground">ابدأ بإضافة مريض جديد</p>
                  <Button
                    onClick={() => {
                      document.getElementById('add-patient-trigger')?.click();
                    }}
                    className="mt-4 gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    إضافة مريض
                  </Button>
                </div>
              ) : viewMode === 'cards' ? (
                <PatientCardsView 
                  patients={patients} 
                  onAddTreatment={handleAddTreatment}
                />
              ) : (
                <PatientTableView 
                  patients={patients} 
                  onAddTreatment={handleAddTreatment}
                />
              )}
            </TabsContent>

            <TabsContent value="active">
              {viewMode === 'cards' ? (
                <PatientCardsView 
                  patients={patients.filter(p => p.patient_status === 'active')} 
                  onAddTreatment={handleAddTreatment}
                />
              ) : (
                <PatientTableView 
                  patients={patients.filter(p => p.patient_status === 'active')} 
                  onAddTreatment={handleAddTreatment}
                />
              )}
            </TabsContent>

            <TabsContent value="inactive">
              {viewMode === 'cards' ? (
                <PatientCardsView 
                  patients={patients.filter(p => p.patient_status === 'inactive')} 
                  onAddTreatment={handleAddTreatment}
                />
              ) : (
                <PatientTableView 
                  patients={patients.filter(p => p.patient_status === 'inactive')} 
                  onAddTreatment={handleAddTreatment}
                />
              )}
            </TabsContent>

            <TabsContent value="archived">
              {viewMode === 'cards' ? (
                <PatientCardsView 
                  patients={patients.filter(p => p.patient_status === 'archived')} 
                  onAddTreatment={handleAddTreatment}
                />
              ) : (
                <PatientTableView 
                  patients={patients.filter(p => p.patient_status === 'archived')} 
                  onAddTreatment={handleAddTreatment}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AddPatientDrawer 
        onPatientAdded={() => {
          refetch();
        }}
      />

      <AddTreatmentDialog
        open={addTreatmentDialogOpen}
        onOpenChange={setAddTreatmentDialogOpen}
        patientId={selectedPatientId}
        patientName={selectedPatientName}
        onTreatmentAdded={() => {
          setAddTreatmentDialogOpen(false);
          refetch();
        }}
      />
    </PageContainer>
  );
}
