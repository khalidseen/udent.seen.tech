import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, AlertTriangle } from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ar } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import DayDetailModal from "./DayDetailModal";

interface Appointment {
  id: string;
  patient_id: string;
  appointment_date: string;
  duration: number;
  status: string;
  treatment_type?: string;
  notes?: string;
  patients?: {
    id: string;
    full_name: string;
    phone?: string;
    email?: string;
  };
}

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayModalOpen, setDayModalOpen] = useState(false);

  const fetchMonthAppointments = useCallback(async () => {
    try {
      setLoading(true);

      // Get current user's clinic_id for data isolation
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (id, full_name, phone, email)
        `)
        .eq('clinic_id', profile.id)
        .gte('appointment_date', monthStart.toISOString())
        .lte('appointment_date', monthEnd.toISOString())
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchMonthAppointments();
  }, [fetchMonthAppointments]);

  // Realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('calendar-appointments')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments'
      }, () => {
        fetchMonthAppointments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMonthAppointments]);

  const getAppointmentsForDate = useCallback((date: Date) => {
    return appointments.filter(appointment =>
      isSameDay(new Date(appointment.appointment_date), date)
    );
  }, [appointments]);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setDayModalOpen(true);
  }, []);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  }, [currentDate]);

  const getDayAppointmentStats = useCallback((date: Date) => {
    const dayAppointments = getAppointmentsForDate(date);
    const completed = dayAppointments.filter(a => a.status === 'completed').length;
    const scheduled = dayAppointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length;
    const cancelled = dayAppointments.filter(a => a.status === 'cancelled').length;
    const noShow = dayAppointments.filter(a => a.status === 'no_show').length;
    
    return { total: dayAppointments.length, completed, scheduled, cancelled, noShow };
  }, [getAppointmentsForDate]);

  const renderCalendarDay = useCallback((date: Date) => {
    const stats = getDayAppointmentStats(date);
    const dayAppointments = getAppointmentsForDate(date);
    const isToday = isSameDay(date, new Date());
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
    
    return (
      <div
        className={cn(
          "p-3 h-32 border-2 rounded-lg transition-all duration-200 relative",
          "bg-card border-border",
          !isPast && "cursor-pointer hover:border-primary/40 hover:shadow-md",
          isToday && "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20",
          isPast && "opacity-50 cursor-not-allowed bg-muted border-muted"
        )}
        onClick={() => !isPast && handleDateClick(date)}
      >
        {/* رقم اليوم */}
        <div className={cn(
          "text-3xl font-bold mb-2",
          isToday ? "text-primary" : isPast ? "text-muted-foreground" : "text-foreground"
        )}>
          {format(date, 'd')}
        </div>
        
        {/* عداد المواعيد */}
        {stats.total > 0 && (
          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
            {stats.total}
          </div>
        )}
        
        {/* مؤشرات حالة المواعيد */}
        {stats.total > 0 && (
          <div className="absolute top-2 right-2 flex gap-1">
            {stats.scheduled > 0 && (
              <div className="w-3 h-3 bg-primary rounded-full shadow-sm" title={`${stats.scheduled} مجدول`} />
            )}
            {stats.completed > 0 && (
              <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm" title={`${stats.completed} مكتمل`} />
            )}
            {stats.cancelled > 0 && (
              <div className="w-3 h-3 bg-destructive rounded-full shadow-sm" title={`${stats.cancelled} ملغي`} />
            )}
            {stats.noShow > 0 && (
              <div className="w-3 h-3 bg-orange-500 rounded-full shadow-sm" title={`${stats.noShow} لم يحضر`} />
            )}
          </div>
        )}
        
        {/* تفاصيل المواعيد */}
        {dayAppointments.length > 0 && (
          <div className="absolute bottom-2 left-2 right-2 space-y-1">
            {dayAppointments.slice(0, 2).map((appointment) => (
              <div
                key={appointment.id}
                className="text-xs bg-background/90 border border-border text-foreground px-2 py-1 rounded shadow-sm"
              >
                <div className="font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(appointment.appointment_date), 'HH:mm')}
                </div>
                <div className="text-muted-foreground truncate">
                  {appointment.patients?.full_name || 'مريض غير محدد'}
                </div>
              </div>
            ))}
            {dayAppointments.length > 2 && (
              <div className="text-xs text-muted-foreground bg-muted/80 px-2 py-1 rounded text-center font-medium">
                +{dayAppointments.length - 2} موعد إضافي
              </div>
            )}
          </div>
        )}
        
        {/* اسم اليوم */}
        <div className="absolute bottom-1 right-1 text-xs text-muted-foreground font-medium">
          {format(date, 'EEEE', { locale: ar }).slice(0, 3)}
        </div>
      </div>
    );
  }, [getDayAppointmentStats, handleDateClick, getAppointmentsForDate]);

  const monthDays = useMemo(() => 
    eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
    }), [currentDate]);

  const monthStats = useMemo(() => ({
    total: appointments.length,
    completed: appointments.filter(a => a.status === 'completed').length,
    scheduled: appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
    noShow: appointments.filter(a => a.status === 'no_show').length,
  }), [appointments]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">جاري تحميل التقويم...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CalendarIcon className="w-6 h-6 text-primary" />
              <div>
                <CardTitle className="text-xl">
                  {format(currentDate, 'MMMM yyyy', { locale: ar })}
                </CardTitle>
                <p className="text-sm text-muted-foreground">تقويم المواعيد</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                اليوم
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Month Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{monthStats.total}</p>
                <p className="text-xs text-muted-foreground">إجمالي المواعيد</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <div>
                <p className="text-2xl font-bold text-primary">{monthStats.scheduled}</p>
                <p className="text-xs text-muted-foreground">مجدول</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full" />
              <div>
                <p className="text-2xl font-bold text-green-600">{monthStats.completed}</p>
                <p className="text-xs text-muted-foreground">مكتمل</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-destructive rounded-full" />
              <div>
                <p className="text-2xl font-bold text-destructive">{monthStats.cancelled}</p>
                <p className="text-xs text-muted-foreground">ملغي</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-orange-500">{monthStats.noShow}</p>
                <p className="text-xs text-muted-foreground">لم يحضر</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
          {/* Week Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((day) => (
              <div key={day} className="p-3 text-center text-sm font-bold rounded-lg border bg-muted text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: (startOfMonth(currentDate).getDay() + 1) % 7 }).map((_, index) => (
              <div key={`empty-${index}`} className="h-32" />
            ))}
            {monthDays.map((date) => (
              <div key={date.toString()}>
                {renderCalendarDay(date)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Day Detail Modal */}
      <DayDetailModal
        date={selectedDate}
        appointments={selectedDate ? getAppointmentsForDate(selectedDate) : []}
        open={dayModalOpen}
        onOpenChange={setDayModalOpen}
        onAppointmentUpdate={fetchMonthAppointments}
      />
    </div>
  );
};

export default CalendarView;
