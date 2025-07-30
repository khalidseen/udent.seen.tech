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
  appointment_date: string;
  duration_minutes: number;
  status: string;
  notes: string;
  cost: number;
  patients: {
    full_name: string;
    phone: string;
  };
  profiles: {
    full_name: string;
  };
}

const AppointmentList = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
    const matchesSearch = 
      appointment.patients.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patients.phone?.includes(searchTerm) ||
      appointment.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "" || statusFilter === "all" || appointment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">إدارة المواعيد</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة المواعيد</h1>
          <p className="text-muted-foreground mt-2">عرض وإدارة جميع المواعيد</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 ml-2" />
          موعد جديد
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="البحث باسم المريض أو الطبيب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        
        <Select onValueChange={setStatusFilter} value={statusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="تصفية حسب الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="scheduled">مجدول</SelectItem>
            <SelectItem value="completed">مكتمل</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
            <SelectItem value="no_show">لم يحضر</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{appointments.length}</div>
            <p className="text-sm text-muted-foreground">إجمالي المواعيد</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {appointments.filter(a => a.status === 'scheduled').length}
            </div>
            <p className="text-sm text-muted-foreground">مجدولة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {appointments.filter(a => a.status === 'completed').length}
            </div>
            <p className="text-sm text-muted-foreground">مكتملة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {appointments.filter(a => a.status === 'cancelled').length}
            </div>
            <p className="text-sm text-muted-foreground">ملغية</p>
          </CardContent>
        </Card>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">لا توجد مواعيد حالياً</p>
            </CardContent>
          </Card>
        ) : (
          filteredAppointments.map((appointment) => (
            <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        <User className="w-4 h-4 ml-2" />
                        {appointment.patients.full_name}
                      </CardTitle>
                      <div className="flex items-center space-x-2 space-x-reverse mt-1">
                        {getStatusBadge(appointment.status)}
                        <span className="text-sm text-muted-foreground">
                          مع {appointment.profiles.full_name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 space-x-reverse">
                    <Button variant="outline" size="sm">
                      تعديل
                    </Button>
                    <Button variant="outline" size="sm">
                      عرض
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(new Date(appointment.appointment_date), 'EEEE dd/MM/yyyy', { locale: ar })}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(new Date(appointment.appointment_date), 'HH:mm')} 
                      ({appointment.duration_minutes} دقيقة)
                    </span>
                  </div>
                  
                  {appointment.patients.phone && (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{appointment.patients.phone}</span>
                    </div>
                  )}
                  
                  {appointment.cost && (
                    <div className="text-sm font-medium">
                      التكلفة: {appointment.cost} جنيه
                    </div>
                  )}
                </div>
                
                {appointment.notes && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground">ملاحظات: {appointment.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AppointmentList;