import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, Calendar, Edit, Eye, Activity, Grid3X3, List, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import AddTreatmentDialog from "./AddTreatmentDialog";
import { PageHeader } from "@/components/layout/PageHeader";
import AddPatientDrawer from "./AddPatientDrawer";
import PatientFilters, { PatientFilter } from "./PatientFilters";
import PatientTableView from "./PatientTableView";

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

const PatientList = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [filters, setFilters] = useState<PatientFilter>({
    searchTerm: '',
    gender: '',
    ageRange: '',
    hasEmail: '',
    hasPhone: '',
    dateFrom: '',
    dateTo: ''
  });
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      // Get current user's clinic ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        setLoading(false);
        return;
      }
      
      if (!profile) {
        console.log('No profile found');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    // Text search
    const matchesSearch = !filters.searchTerm || 
      patient.full_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      patient.phone?.includes(filters.searchTerm) ||
      patient.email?.toLowerCase().includes(filters.searchTerm.toLowerCase());

    // Gender filter
    const matchesGender = !filters.gender || patient.gender === filters.gender;

    // Age range filter
    let matchesAge = true;
    if (filters.ageRange && patient.date_of_birth) {
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
    const matchesEmail = !filters.hasEmail || 
      (filters.hasEmail === 'yes' ? !!patient.email : !patient.email);

    // Phone filter
    const matchesPhone = !filters.hasPhone || 
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

    return matchesSearch && matchesGender && matchesAge && matchesEmail && matchesPhone && matchesDateRange;
  });

  const getGenderBadge = (gender: string) => {
    return gender === 'male' ? (
      <Badge variant="outline">ذكر</Badge>
    ) : gender === 'female' ? (
      <Badge variant="outline">أنثى</Badge>
    ) : null;
  };

  const handleAddTreatment = (patientId: string, patientName: string) => {
    setSelectedPatient({ id: patientId, name: patientName });
    setTreatmentDialogOpen(true);
  };

  const handleTreatmentAdded = () => {
    // Optionally refresh data or show success message
  };

  const handlePatientAdded = () => {
    fetchPatients();
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="المرضى" description="جاري تحميل البيانات..." />
        <Card>
          <CardContent className="p-6">
            <div className="text-center">جاري التحميل...</div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="إدارة المرضى" 
        description="إدارة بيانات المرضى والسجلات الطبية"
        action={<AddPatientDrawer onPatientAdded={handlePatientAdded} />}
      />

      {/* Filters and Search */}
      <PatientFilters filters={filters} onFiltersChange={setFilters} />

      {/* Stats and View Toggle */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Patient Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          <Card className="border border-border/60 bg-white/90 dark:bg-card/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">{filteredPatients.length}</div>
                <div className="text-sm text-muted-foreground font-medium">المرضى المعروضين</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/60 bg-white/90 dark:bg-card/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {filteredPatients.filter(p => p.gender === 'female').length}
                </div>
                <div className="text-sm text-muted-foreground font-medium">المريضات</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/60 bg-white/90 dark:bg-card/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {filteredPatients.filter(p => p.gender === 'male').length}
                </div>
                <div className="text-sm text-muted-foreground font-medium">المرضى الذكور</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Toggle */}
        <Card className="border border-border/60 bg-white/90 dark:bg-card/90 backdrop-blur-sm lg:w-auto">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">طريقة العرض:</span>
              <div className="flex rounded-lg border border-border/60 bg-background p-1">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="gap-1 h-8"
                >
                  <Grid3X3 className="w-4 h-4" />
                  مربعات
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="gap-1 h-8"
                >
                  <List className="w-4 h-4" />
                  جدول
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patients Display */}
      {filteredPatients.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">لا توجد نتائج</h3>
              <p>{filters.searchTerm || Object.values(filters).some(v => v !== '' && v !== filters.searchTerm) 
                ? 'لا توجد مرضى تطابق معايير البحث المحددة' 
                : 'لا توجد مرضى مسجلين بعد'}</p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'cards' ? (
        <div className="grid gap-4">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-xl transition-all duration-300 border border-border/60 bg-white/90 dark:bg-card/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <CardTitle className="text-xl font-semibold">{patient.full_name}</CardTitle>
                    {getGenderBadge(patient.gender)}
                    {patient.date_of_birth && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} سنة
                      </Badge>
                    )}
                  </div>
                  <div className="flex space-x-2 space-x-reverse">
                    <Link to={`/patients/${patient.id}`}>
                      <Button variant="outline" size="sm" className="border-border/60 hover:bg-accent/60 transition-all duration-200">
                        <Eye className="w-4 h-4 ml-1" />
                        عرض
                      </Button>
                    </Link>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="bg-gradient-to-r from-primary to-primary/90 hover:shadow-md transition-all duration-200"
                      onClick={() => handleAddTreatment(patient.id, patient.full_name)}
                    >
                      <Activity className="w-4 h-4 ml-1" />
                      العلاج
                    </Button>
                    <Button variant="outline" size="sm" className="border-border/60 hover:bg-accent/60 transition-all duration-200">
                      <Edit className="w-4 h-4 ml-1" />
                      تعديل
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {patient.phone && (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{patient.phone}</span>
                    </div>
                  )}
                  {patient.email && (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{patient.email}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      مسجل {format(new Date(patient.created_at), 'yyyy/MM/dd', { locale: ar })}
                    </span>
                  </div>
                </div>
                {patient.address && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground">العنوان: {patient.address}</p>
                  </div>
                )}
                {patient.medical_history && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground">التاريخ المرضي: {patient.medical_history}</p>
                  </div>
                )}
              </CardContent>
            </Card>
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