import { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users } from "lucide-react";
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
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (id, full_name, phone, email)
        `)
        .gte('appointment_date', monthStart.toISOString())
        .lte('appointment_date', monthEnd.toISOString())
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments((data as any) || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchMonthAppointments();
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
    const scheduled = dayAppointments.filter(a => a.status === 'scheduled').length;
    const cancelled = dayAppointments.filter(a => a.status === 'cancelled').length;
    
    return { total: dayAppointments.length, completed, scheduled, cancelled };
  }, [getAppointmentsForDate]);

  const renderCalendarDay = useCallback((date: Date) => {
    const stats = getDayAppointmentStats(date);
    const isToday = isSameDay(date, new Date());
    
    return (
      <div
        onClick={() => handleDateClick(date)}
        className={cn(
          "relative p-2 h-20 border border-border/30 cursor-pointer transition-all duration-200 hover:bg-accent/50",
          isToday && "bg-primary/10 border-primary/30"
        )}
      >
        <div className="flex justify-between items-start h-full">
          <span className={cn(
            "text-sm font-medium",
            isToday && "text-primary font-semibold"
          )}>
            {format(date, 'd', { locale: ar })}
          </span>
          
          {stats.total > 0 && (
            <div className="flex flex-col gap-1">
              <Badge variant="secondary" className="text-xs px-1 py-0">
                {stats.total}
              </Badge>
              
              <div className="flex gap-1">
                {stats.scheduled > 0 && (
                  <div className="w-2 h-2 bg-primary rounded-full" title={`${stats.scheduled} مجدول`} />
                )}
                {stats.completed > 0 && (
                  <div className="w-2 h-2 bg-green-500 rounded-full" title={`${stats.completed} مكتمل`} />
                )}
                {stats.cancelled > 0 && (
                  <div className="w-2 h-2 bg-red-500 rounded-full" title={`${stats.cancelled} ملغي`} />
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="absolute bottom-1 right-1 text-xs text-muted-foreground">
          {format(date, 'EEEE', { locale: ar }).slice(0, 3)}
        </div>
      </div>
    );
  }, [getDayAppointmentStats, handleDateClick]);

  const monthDays = useMemo(() => 
    eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
    }), [currentDate]);

  // Get month statistics
  const monthStats = useMemo(() => ({
    total: appointments.length,
    completed: appointments.filter(a => a.status === 'completed').length,
    scheduled: appointments.filter(a => a.status === 'scheduled').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  }), [appointments]);


  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">جاري تحميل التقويم...</div>
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
                <p className="text-sm text-muted-foreground">
                  تقويم المواعيد
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                اليوم
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Month Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div className="w-4 h-4 bg-red-500 rounded-full" />
              <div>
                <p className="text-2xl font-bold text-red-600">{monthStats.cancelled}</p>
                <p className="text-xs text-muted-foreground">ملغي</p>
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
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Add empty cells for days before month start */}
            {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, index) => (
              <div key={`empty-${index}`} className="h-20" />
            ))}
            
            {/* Render month days */}
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