import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, User, Search, Plus, Phone } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

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
    full_name: string;
    phone?: string;
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

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (full_name, phone),
          profiles (full_name)
        `)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
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
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy - HH:mm", { locale: ar });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">المواعيد</h1>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">جاري التحميل...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">المواعيد</h1>
          <p className="text-muted-foreground mt-2">إدارة مواعيد العيادة</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 ml-2" />
          موعد جديد
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في المواعيد..."
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
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      تعديل
                    </Button>
                    {appointment.status === 'scheduled' && (
                      <Button size="sm">
                        إكمال
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AppointmentList;