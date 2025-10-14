import { useState, useMemo } from "react";
import { usePatients, useClinicId } from '@/hooks/usePatients';
import { useDebounce } from '@/hooks/useDebounce';
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
import { PatientsPagination } from "@/components/patients/PatientsPagination";
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
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [addTreatmentDialogOpen, setAddTreatmentDialogOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedPatientName, setSelectedPatientName] = useState<string>("");

  // استخدام debounce للبحث (تأخير 500ms)
  const debouncedSearch = useDebounce(searchQuery, 500);
  
  const pageSize = 20;

  // استخدام useClinicId و usePatients hooks
  const { data: clinicId, isLoading: isLoadingClinic } = useClinicId();
  
  const { data: patientsResponse, isLoading: isLoadingPatients, refetch } = usePatients({
    clinicId,
    search: debouncedSearch,
    status: activeTab,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  });

  const isLoading = isLoadingClinic || isLoadingPatients;

  // Convert response data to patients array
  const patients: any[] = useMemo(() => 
    (patientsResponse?.data || []).map(p => ({
      ...p,
      email: p.email || '',
      date_of_birth: p.date_of_birth || undefined,
      address: p.address || '',
      medical_history: p.medical_history || '',
      allergies: undefined,
      current_medications: undefined,
      insurance_provider: undefined,
      insurance_policy_number: undefined,
      emergency_contact: p.emergency_contact || undefined,
      emergency_phone: p.emergency_phone || undefined,
      insurance_info: p.insurance_info || undefined,
      blood_type: p.blood_type || undefined,
      occupation: p.occupation || undefined,
      marital_status: p.marital_status || undefined,
    })),
    [patientsResponse?.data]
  );

  const totalCount = patientsResponse?.total || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleAddTreatment = (patientId: string, patientName: string) => {
    setSelectedPatientId(patientId);
    setSelectedPatientName(patientName);
    setAddTreatmentDialogOpen(true);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1); // إعادة تعيين الصفحة عند تغيير التبويب
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // إحصائيات من الخادم
  const statsQuery = usePatients({ clinicId, limit: 0 });
  const allPatientsCount = statsQuery.data?.total || 0;

  return (
    <PageContainer>
      <PageHeader
        title={t('navigation.patients')}
        description="إدارة معلومات المرضى والسجلات الطبية"
      />

      {/* إحصائيات المرضى */}
      <PatientStatsCards
        totalPatients={allPatientsCount}
        activePatients={totalCount}
        inactivePatients={0}
        archivedPatients={0}
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
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="all">
                الكل
              </TabsTrigger>
              <TabsTrigger value="active">
                نشط
              </TabsTrigger>
              <TabsTrigger value="inactive">
                غير نشط
              </TabsTrigger>
              <TabsTrigger value="archived">
                مؤرشف
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground">جاري تحميل البيانات...</p>
                  </div>
                </div>
              ) : patients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">
                    {debouncedSearch ? 'لا توجد نتائج' : 'لا يوجد مرضى'}
                  </h3>
                  <p className="text-muted-foreground">
                    {debouncedSearch 
                      ? 'جرب البحث بكلمات أخرى' 
                      : 'ابدأ بإضافة مريض جديد'}
                  </p>
                  {!debouncedSearch && (
                    <Button
                      onClick={() => {
                        document.getElementById('add-patient-trigger')?.click();
                      }}
                      className="mt-4 gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      إضافة مريض
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {viewMode === 'cards' ? (
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
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <PatientsPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalCount={totalCount}
                      pageSize={pageSize}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AddPatientDrawer 
        onPatientAdded={() => {
          // إعادة تعيين إلى الصفحة الأولى وإعادة تحميل البيانات
          setCurrentPage(1);
          setActiveTab('all');
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
