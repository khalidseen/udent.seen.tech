import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface TimelineEvent {
  id: string;
  type: 'treatment' | 'appointment';
  date: string;
  title: string;
  description: string;
  status: string;
  details: any;
}

interface PatientTimelineProps {
  patientId: string;
}

const PatientTimeline = ({ patientId }: PatientTimelineProps) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchTimelineData();
  }, [patientId]);

  const fetchTimelineData = async () => {
    try {
      // Fetch treatments
      const { data: treatments, error: treatmentsError } = await supabase
        .from('dental_treatments')
        .select('*')
        .eq('patient_id', patientId);

      if (treatmentsError) throw treatmentsError;

      // Fetch appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId);

      if (appointmentsError) throw appointmentsError;

      // Combine and format events
      const timelineEvents: TimelineEvent[] = [
        ...(treatments || []).map(treatment => ({
          id: treatment.id,
          type: 'treatment' as const,
          date: treatment.treatment_date,
          title: `علاج: ${treatment.treatment_plan}`,
          description: `السن رقم ${treatment.tooth_number} - ${treatment.diagnosis}`,
          status: treatment.status,
          details: treatment
        })),
        ...(appointments || []).map(appointment => ({
          id: appointment.id,
          type: 'appointment' as const,
          date: appointment.appointment_date,
          title: `موعد: ${appointment.treatment_type || 'فحص عام'}`,
          description: `${appointment.duration} دقيقة`,
          status: appointment.status,
          details: appointment
        }))
      ];

      // Sort by date (newest first)
      timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setEvents(timelineEvents);
    } catch (error) {
      console.error('Error fetching timeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    return type === 'treatment' ? (
      <Activity className="w-4 h-4" />
    ) : (
      <Calendar className="w-4 h-4" />
    );
  };

  const getStatusBadge = (status: string, type: string) => {
    const treatmentStatuses = {
      planned: { label: 'مخطط', variant: 'secondary' as const },
      in_progress: { label: 'قيد التنفيذ', variant: 'default' as const },
      completed: { label: 'مكتمل', variant: 'default' as const },
    };

    const appointmentStatuses = {
      scheduled: { label: 'مجدول', variant: 'secondary' as const },
      confirmed: { label: 'مؤكد', variant: 'default' as const },
      completed: { label: 'مكتمل', variant: 'default' as const },
      cancelled: { label: 'ملغي', variant: 'destructive' as const },
    };

    const statusConfig = type === 'treatment' ? treatmentStatuses : appointmentStatuses;
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { label: status, variant: 'outline' as const };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredEvents = events.filter(event => {
    if (filter === "all") return true;
    return event.type === filter;
  });

  if (loading) {
    return <div className="text-center">جاري تحميل البيانات...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">عرض:</span>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأحداث</SelectItem>
                <SelectItem value="treatment">العلاجات فقط</SelectItem>
                <SelectItem value="appointment">المواعيد فقط</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد أحداث في الخط الزمني</p>
            </CardContent>
          </Card>
        ) : (
          filteredEvents.map((event, index) => (
            <div key={event.id} className="relative">
              {/* Timeline Line */}
              {index < filteredEvents.length - 1 && (
                <div className="absolute right-6 top-12 w-0.5 h-16 bg-border"></div>
              )}
              
              <Card className="relative hover:shadow-md transition-shadow">
                {/* Timeline Dot */}
                <div className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-background"></div>
                </div>
                
                <CardHeader className="pr-8 pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center">
                      {getEventIcon(event.type)}
                      <span className="mr-2">{event.title}</span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {event.type === 'treatment' ? 'علاج' : 'موعد'}
                      </Badge>
                      {getStatusBadge(event.status, event.type)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pr-8">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.date), 'EEEE، dd MMMM yyyy', { locale: ar })}
                    </p>
                    <p className="font-medium">{event.description}</p>
                    
                    {event.details.notes && (
                      <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                        <strong>ملاحظات:</strong> {event.details.notes}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientTimeline;