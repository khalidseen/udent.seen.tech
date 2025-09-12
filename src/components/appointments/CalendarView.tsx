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

  // ألوان مختلفة لكل يوم من الأسبوع
  const getDayColors = useCallback((date: Date) => {
    const dayOfWeek = date.getDay();
    const colors = [
      'bg-purple-50 border-purple-200 hover:bg-purple-100', // الأحد
      'bg-blue-50 border-blue-200 hover:bg-blue-100', // الاثنين  
      'bg-green-50 border-green-200 hover:bg-green-100', // الثلاثاء
      'bg-yellow-50 border-yellow-200 hover:bg-yellow-100', // الأربعاء
      'bg-orange-50 border-orange-200 hover:bg-orange-100', // الخميس
      'bg-red-50 border-red-200 hover:bg-red-100', // الجمعة
      'bg-indigo-50 border-indigo-200 hover:bg-indigo-100', // السبت
    ];
    return colors[dayOfWeek] || 'bg-gray-50 border-gray-200 hover:bg-gray-100';
  }, []);

  const renderCalendarDay = useCallback((date: Date) => {
    const stats = getDayAppointmentStats(date);
    const dayAppointments = getAppointmentsForDate(date);
    const isToday = isSameDay(date, new Date());
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
    const dayColors = getDayColors(date);
    
    return (
      <div
        className={cn(
          "p-3 h-32 border-2 rounded-lg transition-all duration-200 cursor-pointer relative",
          !isPast && dayColors,
          "hover:border-primary/40 hover:shadow-md",
          isToday && "border-amber-400 bg-amber-100 shadow-lg",
          isPast && "opacity-50 cursor-not-allowed bg-gray-100 border-gray-300"
        )}
        onClick={() => !isPast && handleDateClick(date)}
      >
        {/* رقم اليوم بحجم كبير */}
        <div className={cn(
          "text-3xl font-bold mb-2",
          isToday ? "text-amber-800" : isPast ? "text-gray-400" : "text-gray-700"
        )}>
          {format(date, 'd')}
        </div>
        
        {/* عداد المواعيد في الزاوية العلوية اليسرى */}
        {stats.total > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
            {stats.total}
          </div>
        )}
        
        {/* مؤشرات حالة المواعيد */}
        {stats.total > 0 && (
          <div className="absolute top-2 right-2 flex gap-1">
            {stats.scheduled > 0 && (
              <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm" title={`${stats.scheduled} مجدول`} />
            )}
            {stats.completed > 0 && (
              <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm" title={`${stats.completed} مكتمل`} />
            )}
            {stats.cancelled > 0 && (
              <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm" title={`${stats.cancelled} ملغي`} />
            )}
          </div>
        )}
        
        {/* تفاصيل المواعيد */}
        {!isPast && dayAppointments.length > 0 && (
          <div className="absolute bottom-2 left-2 right-2 space-y-1">
            {dayAppointments.slice(0, 2).map((appointment, index) => (
              <div
                key={appointment.id}
                className="text-xs bg-white/90 border border-gray-300 text-gray-800 px-2 py-1 rounded shadow-sm"
              >
                <div className="font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(appointment.appointment_date), 'HH:mm')}
                </div>
                <div className="text-gray-600 truncate">
                  {appointment.patients?.full_name || 'مريض غير محدد'}
                </div>
                {appointment.treatment_type && (
                  <div className="text-gray-500 text-xs truncate">
                    {appointment.treatment_type}
                  </div>
                )}
              </div>
            ))}
            {dayAppointments.length > 2 && (
              <div className="text-xs text-gray-600 bg-white/80 px-2 py-1 rounded text-center font-medium">
                +{dayAppointments.length - 2} موعد إضافي
              </div>
            )}
          </div>
        )}
        
        {/* اسم اليوم في الزاوية السفلية */}
        <div className="absolute bottom-1 right-1 text-xs text-gray-500 font-medium">
          {format(date, 'EEEE', { locale: ar }).slice(0, 3)}
        </div>
      </div>
    );
  }, [getDayAppointmentStats, handleDateClick, getAppointmentsForDate, getDayColors]);

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
            {[
              { name: 'السبت', color: 'text-indigo-600 bg-indigo-50' },
              { name: 'الأحد', color: 'text-purple-600 bg-purple-50' },
              { name: 'الاثنين', color: 'text-blue-600 bg-blue-50' },
              { name: 'الثلاثاء', color: 'text-green-600 bg-green-50' },
              { name: 'الأربعاء', color: 'text-yellow-600 bg-yellow-50' },
              { name: 'الخميس', color: 'text-orange-600 bg-orange-50' },
              { name: 'الجمعة', color: 'text-red-600 bg-red-50' }
            ].map((day) => (
              <div key={day.name} className={`p-3 text-center text-sm font-bold rounded-lg border ${day.color}`}>
                {day.name}
              </div>
            ))}
          </div>
          
          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Add empty cells for days before month start */}
            {Array.from({ length: (startOfMonth(currentDate).getDay() + 1) % 7 }).map((_, index) => (
              <div key={`empty-${index}`} className="h-32" />
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