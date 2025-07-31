import { useEffect, useState } from "react";
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
import { Link } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import EditAppointmentDialog from "./EditAppointmentDialog";
import PostAppointmentActions from "./PostAppointmentActions";
import CalendarView from "./CalendarView";
import { toast } from "@/hooks/use-toast";

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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [patientNameFilter, setPatientNameFilter] = useState("");
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (id, full_name, phone, email),
          profiles (full_name)
        `)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments((data as any) || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'مجدول', variant: 'default' as const },
      completed: { label: 'مكتمل', variant: 'secondary' as const },
      cancelled: { label: 'ملغي', variant: 'destructive' as const },
      no_show: { label: 'لم يحضر', variant: 'outline' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.patients?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.treatment_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || appointment.status === filterStatus;
    
    let matchesDate = true;
    if (dateFilter) {
      const appointmentDate = new Date(appointment.created_at).toISOString().split('T')[0];
      matchesDate = appointmentDate === dateFilter;
    }
    
    const matchesPatientName = !patientNameFilter || 
      appointment.patients?.full_name.toLowerCase().includes(patientNameFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesDate && matchesPatientName;
  });

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: 'تم الإكمال',
        description: 'تم إكمال الموعد بنجاح'
      });

      fetchAppointments();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy - HH:mm", { locale: ar });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="المواعيد" description="جاري تحميل البيانات..." />
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
        title="المواعيد" 
        description="إدارة مواعيد العيادة"
        action={
          <Link to="/new-appointment">
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              موعد جديد
            </Button>
          </Link>
        }
      />

      {/* Tabs for Calendar and List View */}
      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            عرض التقويم
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            عرض القائمة
          </TabsTrigger>
        </TabsList>

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
                      <Input
                        placeholder="البحث بالاسم أو نوع العلاج..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المواعيد</SelectItem>
                      <SelectItem value="scheduled">مجدول</SelectItem>
                      <SelectItem value="completed">مكتمل</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                      <SelectItem value="no_show">لم يحضر</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    فلتر متقدم
                  </Button>
                </div>

                {/* Advanced Filters */}
                {showAdvancedFilters && (
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>البحث بتاريخ الإضافة للسجل</Label>
                        <Input
                          type="date"
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value)}
                          placeholder="اختر التاريخ"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>البحث باسم المريض</Label>
                        <Input
                          value={patientNameFilter}
                          onChange={(e) => setPatientNameFilter(e.target.value)}
                          placeholder="أدخل اسم المريض"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>مسح الفلاتر</Label>
                        <Button
                          variant="outline"
                          onClick={() => {
                             setSearchTerm("");
                            setFilterStatus("all");
                            setDateFilter("");
                            setPatientNameFilter("");
                          }}
                          className="w-full flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          مسح الكل
                        </Button>
                      </div>
                    </div>

                    {/* Active Filters Display */}
                    {(searchTerm || filterStatus !== "all" || dateFilter || patientNameFilter) && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <div className="text-sm font-medium mb-2">الفلاتر النشطة:</div>
                        <div className="flex flex-wrap gap-2">
                          {searchTerm && (
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                              البحث: {searchTerm}
                            </span>
                          )}
                          {filterStatus !== "all" && (
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                              الحالة: {filterStatus === "scheduled" ? "مجدول" : 
                                       filterStatus === "completed" ? "مكتمل" : 
                                       filterStatus === "cancelled" ? "ملغي" : "لم يحضر"}
                            </span>
                          )}
                          {dateFilter && (
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                              تاريخ الإضافة: {dateFilter}
                            </span>
                          )}
                          {patientNameFilter && (
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                              اسم المريض: {patientNameFilter}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Appointments List */}
          <div className="grid gap-4">
            {filteredAppointments.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-muted-foreground">
                    لا توجد مواعيد تطابق البحث
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredAppointments.map((appointment) => (
                <Card key={appointment.id} className="hover:shadow-md transition-shadow">
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
                          
                          {appointment.patients?.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {appointment.patients.phone}
                            </div>
                          )}
                        </div>
                        
                        {appointment.treatment_type && (
                          <div className="mt-2">
                            <span className="text-sm font-medium">نوع العلاج: </span>
                            <span className="text-sm text-muted-foreground">
                              {appointment.treatment_type}
                            </span>
                          </div>
                        )}
                        
                        {appointment.notes && (
                          <div className="mt-2">
                            <span className="text-sm font-medium">ملاحظات: </span>
                            <span className="text-sm text-muted-foreground">
                              {appointment.notes}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingAppointment(appointment);
                            setEditDialogOpen(true);
                          }}
                          className="border-border/60 hover:bg-accent/60 transition-all duration-200"
                        >
                          <Edit className="w-4 h-4 ml-1" />
                          تعديل
                        </Button>
                        
                        {appointment.status !== 'completed' && (
                          <PostAppointmentActions 
                            appointment={appointment} 
                            onActionsCompleted={fetchAppointments}
                          />
                        )}
                        
                        <Button 
                          size="sm"
                          onClick={() => handleCompleteAppointment(appointment.id)}
                          className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <CheckCircle className="w-4 h-4 ml-1" />
                          إكمال
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
              )}
            </div>
        </TabsContent>
      </Tabs>

      <EditAppointmentDialog
        appointment={editingAppointment}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onAppointmentUpdated={fetchAppointments}
      />
    </PageContainer>
  );
  };

export default AppointmentList;