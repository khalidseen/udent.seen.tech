import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

interface TodayAppointment {
  id: string;
  appointment_date: string;
  duration: number;
  status: string;
  treatment_type: string | null;
  patients: {
    id: string;
    full_name: string;
    phone: string | null;
  } | null;
}

async function fetchTodayAppointments(userId: string): Promise<TodayAppointment[]> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!profile) return [];

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id, appointment_date, duration, status, treatment_type,
      patients (id, full_name, phone)
    `)
    .eq('clinic_id', profile.id)
    .gte('appointment_date', `${today}T00:00:00`)
    .lt('appointment_date', `${today}T23:59:59`)
    .order('appointment_date', { ascending: true })
    .limit(6);

  if (error) throw error;
  return data || [];
}

export function TodayAppointmentsWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: appointments = [], isLoading: loading } = useQuery({
    queryKey: ['today-appointments', user?.id],
    queryFn: () => fetchTodayAppointments(user!.id),
    enabled: !!user,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'confirmed': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'no_show': return 'outline';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
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

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            مواعيد اليوم
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/30">
              <Skeleton className="h-8 w-12 rounded-md" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            مواعيد اليوم
            <Badge variant="secondary" className="text-xs">{appointments.length}</Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/appointments')} className="text-xs">
            عرض الكل <ArrowLeft className="w-3 h-3 mr-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {appointments.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            لا توجد مواعيد لليوم
          </div>
        ) : (
          <div className="space-y-2">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => apt.patients?.id && navigate(`/patients/${apt.patients.id}`)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex flex-col items-center bg-primary/10 rounded-md px-2 py-1 min-w-[50px]">
                    <span className="text-xs font-bold text-primary">
                      {format(new Date(apt.appointment_date), 'HH:mm')}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {apt.patients?.full_name || 'مريض غير محدد'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {apt.treatment_type || 'فحص عام'} • {apt.duration} د
                    </p>
                  </div>
                </div>
                <Badge variant={getStatusColor(apt.status) as any} className="text-xs shrink-0">
                  {getStatusLabel(apt.status)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
