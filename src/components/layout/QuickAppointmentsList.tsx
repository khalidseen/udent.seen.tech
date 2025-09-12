import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, MapPin, Phone } from "lucide-react";
import { offlineSupabase } from "@/lib/offline-supabase";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes?: string;
  patients?: {
    full_name: string;
    phone: string;
  };
}

interface QuickAppointmentsListProps {
  onClose?: () => void;
}

export function QuickAppointmentsList({ onClose }: QuickAppointmentsListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodayAppointments = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const result = await offlineSupabase.select('appointments', {
          filter: { appointment_date: today }
        });
        
        // Filter by confirmed and scheduled appointments
        const todayAppointments = result.data?.filter(
          (apt: any) => apt.status === 'scheduled' || apt.status === 'confirmed'
        ) || [];
        
        setAppointments(todayAppointments);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayAppointments();
  }, []);

  if (loading) {
    return (
      <Card className="w-80 max-w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">مواعيد اليوم</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card className="w-80 max-w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">مواعيد اليوم</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">لا توجد مواعيد اليوم</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80 max-w-full max-h-96 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">مواعيد اليوم</CardTitle>
          <Badge variant="secondary">{appointments.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-64 overflow-y-auto">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="flex items-center justify-between p-3 border border-border/50 rounded-lg bg-background/50 hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">
                  {appointment.patients?.full_name || 'غير محدد'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{appointment.appointment_time}</span>
              </div>
              
              {appointment.patients?.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Phone className="h-3 w-3" />
                  <span>{appointment.patients.phone}</span>
                </div>
              )}
            </div>
            
            <Badge 
              variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {appointment.status === 'confirmed' ? 'مؤكد' : 'مجدول'}
            </Badge>
          </div>
        ))}
      </CardContent>
      
      {onClose && (
        <div className="p-4 pt-0">
          <Button onClick={onClose} variant="outline" className="w-full text-sm">
            إغلاق
          </Button>
        </div>
      )}
    </Card>
  );
}