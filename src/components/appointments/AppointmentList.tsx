<<<<<<< HEAD
import { useEffect, useState, useCallback } from "react";
=======
import { useEffect, useState } from "react";
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, User, Search, Plus, Phone, Filter, X, Edit, CheckCircle, CalendarDays, List } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import AddAppointmentDialog from "./AddAppointmentDialog";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { PageHeader } from "@/components/layout/PageHeader";
import EditAppointmentDialog from "./EditAppointmentDialog";
import PostAppointmentActions from "./PostAppointmentActions";
import CalendarView from "./CalendarView";
<<<<<<< HEAD
import AddAppointmentPopup from "./AddAppointmentPopup";
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
interface Appointment {
  id: string;
  patient_id: string;
  clinic_id: string;
  appointment_date: string;
  duration: number;
  status: string;
  notes?: string;
  treatment_type?: string;
  created_at: string;
  updated_at: string;
  patients?: {
    id: string;
    full_name: string;
    phone?: string;
    email?: string;
  };
  profiles?: {
    full_name: string;
  };
}
const AppointmentList = () => {
  const {
    t
  } = useLanguage();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [patientNameFilter, setPatientNameFilter] = useState("");
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
<<<<<<< HEAD
  const [isAddAppointmentDialogOpen, setIsAddAppointmentDialogOpen] = useState(false);

  const fetchAppointments = useCallback(async () => {
=======
  useEffect(() => {
    fetchAppointments();
  }, []);
  const fetchAppointments = async () => {
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
    try {
      // Get current user's clinic_id
      const {
        data: userProfile
      } = await supabase.from('profiles').select('id').eq('user_id', (await supabase.auth.getUser()).data.user?.id).single();
      if (!userProfile) {
        console.error('No clinic profile found for user');
        setAppointments([]);
        return;
      }
      const {
        data,
        error
      } = await supabase.from('appointments').select(`
          *,
          patients (id, full_name, phone, email),
          profiles (full_name)
        `).eq('clinic_id', userProfile.id).order('appointment_date', {
        ascending: true
      });
      if (error) throw error;
<<<<<<< HEAD
      setAppointments(data || []);
=======
      setAppointments(data as any || []);
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: t('common.error'),
        description: t('messages.dataLoadError'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
<<<<<<< HEAD
  }, [t]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

=======
  };
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: {
        label: t('status.scheduled'),
        variant: 'default' as const
      },
      completed: {
        label: t('status.completed'),
        variant: 'secondary' as const
      },
      cancelled: {
        label: t('status.cancelled'),
        variant: 'destructive' as const
      },
      no_show: {
        label: t('status.noShow'),
        variant: 'outline' as const
      }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };
<<<<<<< HEAD

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.patients?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || appointment.treatment_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || appointment.status === filterStatus;
    
    // Hide past appointments - only show today and future appointments
    const appointmentDate = new Date(appointment.appointment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const isFutureOrToday = appointmentDate >= today;
    
    let matchesDate = true;
    if (dateFilter) {
      const appointmentDateStr = new Date(appointment.created_at).toISOString().split('T')[0];
      matchesDate = appointmentDateStr === dateFilter;
    }
    const matchesPatientName = !patientNameFilter || appointment.patients?.full_name.toLowerCase().includes(patientNameFilter.toLowerCase());
    return matchesSearch && matchesStatus && matchesDate && matchesPatientName && isFutureOrToday;
  });

=======
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.patients?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || appointment.treatment_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || appointment.status === filterStatus;
    let matchesDate = true;
    if (dateFilter) {
      const appointmentDate = new Date(appointment.created_at).toISOString().split('T')[0];
      matchesDate = appointmentDate === dateFilter;
    }
    const matchesPatientName = !patientNameFilter || appointment.patients?.full_name.toLowerCase().includes(patientNameFilter.toLowerCase());
    return matchesSearch && matchesStatus && matchesDate && matchesPatientName;
  });
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      const {
        error
      } = await supabase.from('appointments').update({
        status: 'completed'
      }).eq('id', appointmentId);
      if (error) throw error;
      toast({
        title: t('common.success'),
        description: t('messages.appointmentCompleted')
      });
      fetchAppointments();
<<<<<<< HEAD
    } catch (error) {
=======
    } catch (error: any) {
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive'
      });
    }
  };
<<<<<<< HEAD

=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy - HH:mm", {
        locale: ar
      });
    } catch {
      return dateString;
    }
  };
<<<<<<< HEAD

  // إحصائيات المواعيد
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.appointment_date?.startsWith(todayStr));
  const totalAppointments = appointments.length;
  const scheduled = appointments.filter(a => a.status === 'scheduled').length;
  const completed = appointments.filter(a => a.status === 'completed').length;
  const cancelled = appointments.filter(a => a.status === 'cancelled').length;

  if (loading) {
    return (
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-primary" /> تقويم المواعيد
          </h1>
          <div className="text-lg text-muted-foreground">سبتمبر 2025</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-4 text-center">
              <div className="text-xs text-muted-foreground mb-1">اليوم</div>
              <div className="text-2xl font-bold text-blue-700">0</div>
            </CardContent>
          </Card>
          <Card className="bg-primary/10 border-primary">
            <CardContent className="py-4 text-center">
              <div className="text-xs text-muted-foreground mb-1">إجمالي المواعيد</div>
              <div className="text-2xl font-bold text-primary">0</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="py-4 text-center">
              <div className="text-xs text-muted-foreground mb-1">مجدول</div>
              <div className="text-2xl font-bold text-yellow-700">0</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="py-4 text-center">
              <div className="text-xs text-muted-foreground mb-1">مكتمل</div>
              <div className="text-2xl font-bold text-green-700">0</div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="py-4 text-center">
              <div className="text-xs text-muted-foreground mb-1">ملغي</div>
              <div className="text-2xl font-bold text-red-700">0</div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            جاري تحميل المواعيد...
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2">
          <CalendarDays className="w-7 h-7 text-primary" /> تقويم المواعيد
        </h1>
        <div className="text-lg text-muted-foreground">سبتمبر 2025</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">اليوم</div>
            <div className="text-2xl font-bold text-blue-700">{todayAppointments.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary">
          <CardContent className="py-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">إجمالي المواعيد</div>
            <div className="text-2xl font-bold text-primary">{totalAppointments}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="py-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">مجدول</div>
            <div className="text-2xl font-bold text-yellow-700">{scheduled}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="py-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">مكتمل</div>
            <div className="text-2xl font-bold text-green-700">{completed}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="py-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">ملغي</div>
            <div className="text-2xl font-bold text-red-700">{cancelled}</div>
          </CardContent>
        </Card>
      </div>
      <PageToolbar
        title="المواعيد"
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="بحث سريع عن المواعيد..."
        showViewToggle={false}
        showAdvancedFilter={false}
        actions={
          <Button onClick={() => setIsAddAppointmentDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            إضافة موعد جديد
          </Button>
        }
      />
      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            التقويم
          </TabsTrigger>
          <TabsTrigger value="cards" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            بطاقات المواعيد
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            قائمة المواعيد
          </TabsTrigger>
        </TabsList>
        <TabsContent value="calendar">
          <div className="bg-white rounded-lg shadow p-6">
            <CalendarView />
          </div>
        </TabsContent>
        {/* ...existing code... */}
        <TabsContent value="cards" className="space-y-6">
          {/* ...existing code... */}
        </TabsContent>
        <TabsContent value="list" className="space-y-6">
          {/* ...existing code... */}
        </TabsContent>
      </Tabs>
      <EditAppointmentDialog appointment={editingAppointment} open={editDialogOpen} onOpenChange={setEditDialogOpen} onAppointmentUpdated={fetchAppointments} />
      <AddAppointmentPopup 
        open={isAddAppointmentDialogOpen}
        onOpenChange={setIsAddAppointmentDialogOpen}
        onAppointmentAdded={fetchAppointments}
      />
    </PageContainer>
  );
};

=======
  if (loading) {
    return <PageContainer>
        <PageHeader title={t('navigation.appointments')} description={t('messages.loadingData')} />
        <Card>
          <CardContent className="p-6">
            <div className="text-center">{t('common.loading')}</div>
          </CardContent>
        </Card>
      </PageContainer>;
  }
  return <PageContainer>
      <PageToolbar
        title={t('navigation.appointments')}
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('filters.searchByName')}
        showViewToggle={false}
        showAdvancedFilter={false}
        actions={<AddAppointmentDialog onAppointmentAdded={fetchAppointments} />}
      />

      {/* Tabs for Calendar and List View */}
      <Tabs defaultValue="calendar" className="space-y-6">
        

        {/* Calendar View */}
        <TabsContent value="calendar">
          <CalendarView />
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Basic Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder={t('filters.searchByName')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-10" />
                    </div>
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('filters.allAppointments')}</SelectItem>
                      <SelectItem value="scheduled">{t('status.scheduled')}</SelectItem>
                      <SelectItem value="completed">{t('status.completed')}</SelectItem>
                      <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
                      <SelectItem value="no_show">{t('status.noShow')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    {t('actions.advancedFilter')}
                  </Button>
                </div>

                {/* Advanced Filters */}
                {showAdvancedFilters && <div className="border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>{t('filters.dateAdded')}</Label>
                        <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} placeholder={t('filters.dateFrom')} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>{t('filters.searchByPatientName')}</Label>
                        <Input value={patientNameFilter} onChange={e => setPatientNameFilter(e.target.value)} placeholder={t('filters.patientName')} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>{t('common.clear')}</Label>
                        <Button variant="outline" onClick={() => {
                      setSearchTerm("");
                      setFilterStatus("all");
                      setDateFilter("");
                      setPatientNameFilter("");
                    }} className="w-full flex items-center gap-2">
                          <X className="w-4 h-4" />
                          {t('actions.clearAll')}
                        </Button>
                      </div>
                    </div>

                    {/* Active Filters Display */}
                    {(searchTerm || filterStatus !== "all" || dateFilter || patientNameFilter) && <div className="mt-4 p-3 bg-muted rounded-lg">
                        <div className="text-sm font-medium mb-2">{t('filters.activeFilters')}:</div>
                        <div className="flex flex-wrap gap-2">
                          {searchTerm && <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                              {t('common.search')}: {searchTerm}
                            </span>}
                          {filterStatus !== "all" && <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                              {t('forms.status')}: {filterStatus === "scheduled" ? t('status.scheduled') : filterStatus === "completed" ? t('status.completed') : filterStatus === "cancelled" ? t('status.cancelled') : t('status.noShow')}
                            </span>}
                          {dateFilter && <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                              {t('filters.dateAdded')}: {dateFilter}
                            </span>}
                          {patientNameFilter && <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                              {t('filters.patientName')}: {patientNameFilter}
                            </span>}
                        </div>
                      </div>}
                  </div>}
              </div>
            </CardContent>
          </Card>

          {/* Appointments List */}
          <div className="grid gap-4">
            {filteredAppointments.length === 0 ? <Card>
                <CardContent className="p-6">
                  <div className="text-center text-muted-foreground">
                    {t('messages.noAppointments')}
                  </div>
                </CardContent>
              </Card> : filteredAppointments.map(appointment => <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            <span className="font-medium text-lg">
                              {appointment.patients?.full_name}
                            </span>
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {formatDate(appointment.appointment_date)}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {appointment.duration} دقيقة
                          </div>
                          
                          {appointment.patients?.phone && <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {appointment.patients.phone}
                            </div>}
                        </div>
                        
                        {appointment.treatment_type && <div className="mt-2">
                            <span className="text-sm font-medium">{t('forms.treatmentType')}: </span>
                            <span className="text-sm text-muted-foreground">
                              {appointment.treatment_type}
                            </span>
                          </div>}
                        
                        {appointment.notes && <div className="mt-2">
                            <span className="text-sm font-medium">{t('forms.notes')}: </span>
                            <span className="text-sm text-muted-foreground">
                              {appointment.notes}
                            </span>
                          </div>}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                    setEditingAppointment(appointment);
                    setEditDialogOpen(true);
                  }} className="border-border/60 hover:bg-accent/60 transition-all duration-200">
                          <Edit className="w-4 h-4 ml-1" />
                          {t('common.edit')}
                        </Button>
                        
                        {appointment.status !== 'completed' && <PostAppointmentActions appointment={appointment} onActionsCompleted={fetchAppointments} />}
                        
                        <Button size="sm" onClick={() => handleCompleteAppointment(appointment.id)} className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
                          <CheckCircle className="w-4 h-4 ml-1" />
                          {t('common.complete')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>)}
            </div>
        </TabsContent>
      </Tabs>

      <EditAppointmentDialog appointment={editingAppointment} open={editDialogOpen} onOpenChange={setEditDialogOpen} onAppointmentUpdated={fetchAppointments} />
    </PageContainer>;
};
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
export default AppointmentList;