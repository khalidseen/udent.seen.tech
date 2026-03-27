import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Plus } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface PatientAppointmentsProps {
  patientId: string;
}

export function PatientAppointments({ patientId }: PatientAppointmentsProps) {
  const navigate = useNavigate();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['patient-appointments', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-primary';
      case 'confirmed': return 'bg-blue-600';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-destructive';
      case 'no_show': return 'bg-orange-500';
      case 'rescheduled': return 'bg-yellow-500';
      default: return 'bg-muted';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'مجدول';
      case 'confirmed': return 'مؤكد';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      case 'no_show': return 'لم يحضر';
      case 'rescheduled': return 'معاد جدولته';
      default: return status;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">المواعيد</h3>
        <Button size="sm" onClick={() => navigate(`/appointments/new?patient=${patientId}`)}>
          <Plus className="w-4 h-4 ml-2" />
          حجز موعد جديد
        </Button>
      </div>

      {!appointments || appointments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">لا توجد مواعيد مسجلة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(new Date(appointment.appointment_date), 'PPP', { locale: ar })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(appointment.appointment_date), 'HH:mm')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        • {appointment.duration} دقيقة
                      </span>
                    </div>
                    {appointment.treatment_type && (
                      <div className="text-sm text-muted-foreground">
                        نوع العلاج: {appointment.treatment_type}
                      </div>
                    )}
                    {appointment.notes && (
                      <div className="text-sm text-muted-foreground">
                        ملاحظات: {appointment.notes}
                      </div>
                    )}
                  </div>
                  <Badge className={getStatusColor(appointment.status)}>
                    {getStatusText(appointment.status)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
