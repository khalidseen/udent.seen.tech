import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { offlineSupabase } from "@/lib/offline-supabase";
import { useOfflineData } from "@/hooks/useOfflineData";
import { Phone, Mail, Calendar, Edit, Eye, Activity, Grid3X3, List, BarChart3, Wifi, WifiOff, Filter } from "lucide-react";
import PatientCard from "./PatientCard";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import AddTreatmentDialog from "./AddTreatmentDialog";
import { PageHeader } from "@/components/layout/PageHeader";
import AddPatientDrawer from "./AddPatientDrawer";
import PatientFilters, { PatientFilter } from "./PatientFilters";
import PatientTableView from "./PatientTableView";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/contexts/LanguageContext";

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
  national_id?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  patient_status: string;
  insurance_info?: string;
  blood_type?: string;
  occupation?: string;
  marital_status?: string;
  assigned_doctor_id?: string;
  medical_condition?: string;
  financial_status: 'paid' | 'pending' | 'overdue' | 'partial';
  assigned_doctor?: {
    full_name: string;
  };
}

const PatientList = () => {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [filters, setFilters] = useState<PatientFilter>({
    gender: 'all',
    ageRange: 'all',
    hasEmail: 'all',
    hasPhone: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string } | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);

  // Get clinic ID first
  useEffect(() => {
    const getClinicId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id);

        if (profiles && profiles.length > 0) {
          setClinicId(profiles[0].id);
        }
      } catch (error) {
        console.error('Error getting clinic ID:', error);
      }
    };

    getClinicId();
  }, []);

  // Fetch enhanced patient data with doctor information
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const fetchPatientsWithDoctors = async () => {
    if (!clinicId) return;
    
    try {
      // Get patients with doctor information using supabase
      const { data: patientsData, error } = await supabase
        .from('patients')
        .select(`
          *,
          assigned_doctor:doctors(full_name)
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enhancedPatients: Patient[] = patientsData?.map(patient => ({
        ...patient,
        financial_status: (patient.financial_status as 'paid' | 'pending' | 'overdue' | 'partial') || 'pending',
        assigned_doctor: patient.assigned_doctor ? { full_name: patient.assigned_doctor.full_name } : undefined
      })) || [];

      setPatients(enhancedPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setIsOffline(true);
      
      // Fallback to offline data without doctors
      try {
        const patientsResult = await offlineSupabase.select('patients', { 
          filter: { clinic_id: clinicId },
          order: { column: 'created_at', ascending: false }
        });
        
        const fallbackPatients: Patient[] = patientsResult.data?.map(patient => ({
          ...patient,
          financial_status: (patient.financial_status as 'paid' | 'pending' | 'overdue' | 'partial') || 'pending',
          assigned_doctor: undefined
        })) || [];
        
        setPatients(fallbackPatients);
      } catch (offlineError) {
        console.error('Offline fallback failed:', offlineError);
        setPatients([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clinicId) {
      fetchPatientsWithDoctors();
    }
  }, [clinicId]);

  const refresh = () => {
    if (clinicId) {
      setLoading(true);
      fetchPatientsWithDoctors();
    }
  };

  const filteredPatients = patients.filter(patient => {
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
        toDate.setHours(23, 59, 59, 999); // End of day
        matchesDateRange = matchesDateRange && createdDate <= toDate;
      }
    }

    return matchesGender && matchesAge && matchesEmail && matchesPhone && matchesDateRange;
  });

  const getGenderBadge = (gender: string) => {
    return gender === 'male' ? (
      <Badge variant="outline">{t('status.male')}</Badge>
    ) : gender === 'female' ? (
      <Badge variant="outline">{t('status.female')}</Badge>
    ) : null;
  };

  const handleAddTreatment = (patientId: string, patientName: string) => {
    setSelectedPatient({ id: patientId, name: patientName });
    setTreatmentDialogOpen(true);
  };

  const handleEditPatient = (patientId: string) => {
    // Navigate to edit patient page or open edit dialog
    window.location.href = `/patients/${patientId}`;
  };

  const handleTreatmentAdded = () => {
    // Optionally refresh data or show success message
  };

  const handlePatientAdded = () => {
    refresh();
  };

  const getActiveFiltersCount = (filters: PatientFilter) => {
    return Object.values(filters).filter(v => v !== '' && v !== 'all').length;
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title={t('navigation.patients')} description={t('messages.loadingData')} />
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-2">
              {isOffline ? <WifiOff className="w-5 h-5 text-orange-500" /> : <Wifi className="w-5 h-5 text-blue-500" />}
              <span>{t('common.loading')}</span>
              {isOffline && <span className="text-sm text-orange-600">({t('messages.offlineMode')})</span>}
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title={t('patients.title')} 
        description={t('patients.description')}
        action={<AddPatientDrawer onPatientAdded={handlePatientAdded} />}
      />

      {/* Patient Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border border-border/60 bg-white/90 dark:bg-card/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">{filteredPatients.length}</div>
              <div className="text-sm text-muted-foreground font-medium">{t('charts.displayedPatients')}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/60 bg-white/90 dark:bg-card/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {filteredPatients.filter(p => p.gender === 'female').length}
              </div>
              <div className="text-sm text-muted-foreground font-medium">{t('charts.femalePatients')}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/60 bg-white/90 dark:bg-card/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {filteredPatients.filter(p => p.gender === 'male').length}
              </div>
              <div className="text-sm text-muted-foreground font-medium">{t('charts.malePatients')}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Filters Button */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="fixed top-20 right-4 z-50 bg-white/90 dark:bg-card/90 backdrop-blur-sm border-border/60 shadow-lg hover:shadow-xl transition-all duration-200"
            size="sm"
          >
            <Filter className="w-4 h-4 ml-1" />
            {t('actions.advancedFilter')}
            {Object.values(filters).some(v => v !== '' && v !== 'all') && (
              <Badge variant="destructive" className="mr-2 h-5 w-5 p-0 text-xs">
                {getActiveFiltersCount(filters)}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <PatientFilters filters={filters} onFiltersChange={setFilters} />
        </PopoverContent>
      </Popover>

      {/* Floating View Mode Button */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="fixed top-32 right-4 z-50 bg-white/90 dark:bg-card/90 backdrop-blur-sm border-border/60 shadow-lg hover:shadow-xl transition-all duration-200"
            size="sm"
          >
            {viewMode === 'cards' ? <Grid3X3 className="w-4 h-4 ml-1" /> : <List className="w-4 h-4 ml-1" />}
            {viewMode === 'cards' ? t('actions.cardsView') : t('actions.tableView')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="start">
          <div className="space-y-1">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="w-full justify-start gap-2"
            >
              <Grid3X3 className="w-4 h-4" />
              {t('actions.cardsView')}
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="w-full justify-start gap-2"
            >
              <List className="w-4 h-4" />
              {t('actions.tableView')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Patients Display */}
      {filteredPatients.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">{t('messages.noResults')}</h3>
              <p>{Object.values(filters).some(v => v !== '' && v !== 'all') 
                ? t('messages.noPatientsMatchFilter')
                : t('messages.noPatients')}</p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onAddTreatment={handleAddTreatment}
              onEditPatient={handleEditPatient}
            />
          ))}
        </div>
      ) : (
        <PatientTableView patients={filteredPatients} onAddTreatment={handleAddTreatment} />
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

export default PatientList;