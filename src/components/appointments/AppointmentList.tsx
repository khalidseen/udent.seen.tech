import { useEffect, useState, useCallback } from "react";
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
import AddAppointmentPopup from "./AddAppointmentPopup";
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
  const [isAddAppointmentDialogOpen, setIsAddAppointmentDialogOpen] = useState(false);

  const fetchAppointments = useCallback(async () => {
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
      setAppointments(data || []);
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
  }, [t]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

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
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy - HH:mm", {
        locale: ar
      });
    } catch {
      return dateString;
    }
  };

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

export default AppointmentList;