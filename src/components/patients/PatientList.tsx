import React, { useState, useMemo, useCallback, Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageToolbar } from "@/components/layout/PageToolbar";
import AddTreatmentDialog from "./AddTreatmentDialog";
import AddPatientDrawer from "./AddPatientDrawer";
import UpdatePatientsCreatorButton from "./UpdatePatientsCreatorButton";
import AddSamplePatientsButton from "./AddSamplePatientsButton";
import PatientFilters, { PatientFilter } from "./PatientFilters";
import PatientTableView from "./PatientTableView";
import VirtualizedPatientList from "./VirtualizedPatientList";
import { usePatients, useClinicId } from "@/hooks/usePatients";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useDebounce } from "@/hooks/useDebounce";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { withErrorBoundary } from "@/components/ui/error-boundary";
import { Alert, AlertDescription } from "@/components/ui/alert";
const PatientList = () => {
  const { t } = useLanguage();
  const { metrics } = usePerformanceMonitor('PatientList');
  const queryClient = useQueryClient();
  
  // State management
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // 12 patients per page as requested
  const [isRefreshing, setIsRefreshing] = useState(false); // حالة التحديث
  const [filters, setFilters] = useState<PatientFilter>({
    gender: 'all',
    ageRange: 'all',
    hasEmail: 'all',
    hasPhone: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Get clinic ID with React Query
  const { data: clinicId, isLoading: clinicLoading } = useClinicId();

  // Optimized search with debouncing
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  // Calculate pagination parameters

  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage]);
  const { 
    data: patientsResult, 
    isLoading: patientsLoading, 
    error: patientsError,
    isError,
    refetch: refetchPatients
  } = usePatients({
    clinicId: clinicId || undefined,
    search: debouncedSearchQuery,
    limit: itemsPerPage,
    offset,
    orderBy: 'created_at',
    ascending: false
  });

  const patients = useMemo(() => patientsResult?.data || [], [patientsResult?.data]);
  const totalPatients = patientsResult?.total || 0;
  const totalPages = Math.ceil(totalPatients / itemsPerPage);

  const loading = clinicLoading || patientsLoading || isRefreshing;
  
  // Apply client-side filters to the already paginated data
  const filteredPatients = useMemo(() => {
    if (!patients || patients.length === 0) return [];
    
    return patients.filter(patient => {
      // Gender filter
      const matchesGender = !filters.gender || filters.gender === 'all' || patient.gender === filters.gender;

      // Age range filter
      let matchesAge = true;
      if (filters.ageRange && filters.ageRange !== 'all' && patient.date_of_birth) {
        const age = new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear();
        switch (filters.ageRange) {
          case '0-18':
            matchesAge = age < 18;
            break;
          case '18-30':
            matchesAge = age >= 18 && age <= 30;
            break;
          case '30-50':
            matchesAge = age >= 30 && age <= 50;
            break;
          case '50-70':
            matchesAge = age >= 50 && age <= 70;
            break;
          case '70+':
            matchesAge = age > 70;
            break;
        }
      }

      // Email filter
      const matchesEmail = !filters.hasEmail || filters.hasEmail === 'all' || 
        (filters.hasEmail === 'yes' ? !!patient.email : !patient.email);

      // Phone filter
      const matchesPhone = !filters.hasPhone || filters.hasPhone === 'all' || 
        (filters.hasPhone === 'yes' ? !!patient.phone : !patient.phone);

      // Date range filter
      let matchesDateRange = true;
      if (filters.dateFrom || filters.dateTo) {
        const createdDate = new Date(patient.created_at);
        if (filters.dateFrom) {
          matchesDateRange = matchesDateRange && createdDate >= new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          matchesDateRange = matchesDateRange && createdDate <= toDate;
        }
      }

      return matchesGender && matchesAge && matchesEmail && matchesPhone && matchesDateRange;
    });
  }, [patients, filters]);
  // Event handlers with useCallback for optimization
  const handleAddTreatment = useCallback((patientId: string, patientName: string) => {
    setSelectedPatient({ id: patientId, name: patientName });
    setTreatmentDialogOpen(true);
  }, []);

  const handleEditPatient = useCallback((patientId: string) => {
    window.location.href = `/patients/${patientId}`;
  }, []);

  const handleTreatmentAdded = useCallback(() => {
    // Optionally refresh data or show success message
  }, []);

  const handlePatientAdded = useCallback(async () => {
    try {
      setIsRefreshing(true); // إظهار مؤشر التحديث
      setCurrentPage(1); // Reset to first page when new patient is added
      
      // إبطال كاش المرضى لإجبار إعادة التحميل
      await queryClient.invalidateQueries({ queryKey: ['patients'] });
      
      // إبطال أي كاش متعلق بالعيادة أيضاً
      if (clinicId) {
        await queryClient.invalidateQueries({ 
          predicate: (query) => 
            query.queryKey[0] === 'patients' && 
            JSON.stringify(query.queryKey[1]).includes(clinicId)
        });
      }
      
      // إعادة تحميل البيانات بشكل صريح أيضاً
      await refetchPatients();
      
    } catch (error) {
      console.error('Error refreshing patients list:', error);
    } finally {
      setIsRefreshing(false); // إخفاء مؤشر التحديث
    }
  }, [refetchPatients, queryClient, clinicId]);

  const handlePatientUpdated = useCallback(async () => {
    try {
      setIsRefreshing(true);
      
      // إبطال كاش المرضى لإجبار إعادة التحميل
      await queryClient.invalidateQueries({ queryKey: ['patients'] });
      
      // إبطال أي كاش متعلق بالعيادة أيضاً
      if (clinicId) {
        await queryClient.invalidateQueries({ 
          predicate: (query) => 
            query.queryKey[0] === 'patients' && 
            JSON.stringify(query.queryKey[1]).includes(clinicId)
        });
      }
      
      // إعادة تحميل البيانات بشكل صريح أيضاً
      await refetchPatients();
      
    } catch (error) {
      console.error('Error refreshing patients list:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchPatients, queryClient, clinicId]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const getActiveFiltersCount = useCallback((filters: PatientFilter) => {
    return Object.values(filters).filter(v => v !== '' && v !== 'all').length;
  }, []);
  // Loading state with improved skeleton
  if (loading) {
    return (
      <PageContainer>
        <PageToolbar
          title={t('navigation.patients')}
          showViewToggle={false}
          showAdvancedFilter={false}
        />
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>{t('common.loading')}</span>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  // Error state  
  if (isError) {
    return (
      <PageContainer>
        <PageToolbar
          title={t('navigation.patients')}
          showViewToggle={false}
          showAdvancedFilter={false}
        />
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            حدث خطأ في تحميل بيانات المرضى. يرجى المحاولة مرة أخرى.
          </AlertDescription>
        </Alert>
      </PageContainer>
    );
  }
  return (
    <PageContainer>
      <PageToolbar
        title={t('navigation.patients')}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('patients.searchPlaceholder')}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filterContent={
          <PatientFilters 
            filters={filters} 
            onFiltersChange={setFilters} 
          />
        }
        activeFiltersCount={getActiveFiltersCount(filters)}
        actions={
          <div className="flex gap-2">
            <AddSamplePatientsButton />
            <UpdatePatientsCreatorButton />
            <AddPatientDrawer onPatientAdded={handlePatientAdded} />
          </div>
        }
      />

      {/* Patients Display with Virtualization */}
      {viewMode === 'cards' ? (
        <Suspense fallback={<div>Loading patients...</div>}>
          <VirtualizedPatientList
            patients={filteredPatients}
            onAddTreatment={handleAddTreatment}
            onEditPatient={handleEditPatient}
            onPatientUpdated={handlePatientUpdated}
            loading={loading}
            viewMode={viewMode}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            totalItems={totalPatients}
          />
        </Suspense>
      ) : (
        <>
          <PatientTableView 
            patients={filteredPatients} 
            onAddTreatment={handleAddTreatment} 
          />
          {/* Add pagination for table view too */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Treatment Dialog */}
      {selectedPatient && (
        <AddTreatmentDialog 
          open={treatmentDialogOpen} 
          onOpenChange={setTreatmentDialogOpen} 
          patientId={selectedPatient.id} 
          patientName={selectedPatient.name} 
          onTreatmentAdded={handleTreatmentAdded} 
        />
      )}
    </PageContainer>
  );
};

const PatientListWithErrorBoundary = withErrorBoundary(
  PatientList,
  <PageContainer>
    <Alert className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        حدث خطأ في تحميل قائمة المرضى
      </AlertDescription>
    </Alert>
  </PageContainer>
);

export default PatientListWithErrorBoundary;