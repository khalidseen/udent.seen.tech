import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PatientAppointmentCalendarProps {
  patientId: string;
  patientName: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  duration: number;
  status: string;
  notes?: string;
  treatment_type?: string;
}

export const PatientAppointmentCalendar: React.FC<PatientAppointmentCalendarProps> = ({ 
  patientId, 
  patientName 
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, [patientId, currentDate]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .gte('appointment_date', startDate.toISOString())
        .lte('appointment_date', endDate.toISOString())
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'confirmed':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'confirmed':
        return <Clock className="h-4 w-4" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'مكتمل';
      case 'confirmed':
        return 'مؤكد';
      case 'scheduled':
        return 'مجدول';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(appointment => 
      isSameDay(parseISO(appointment.appointment_date), date)
    );
  };

  const calendarDays = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  // Calculate empty cells needed at the start of the month
  // In Arabic calendar, Saturday = 0, Sunday = 1, etc.
  // JavaScript getDay(): Sunday = 0, Monday = 1, ..., Saturday = 6
  // We need to adjust: if JS day is 6 (Saturday), our position is 0
  const getArabicDayPosition = (jsDay: number) => {
    return jsDay === 6 ? 0 : jsDay + 1;
  };

  const monthStartDay = startOfMonth(currentDate).getDay();
  const emptyCells = getArabicDayPosition(monthStartDay);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">جاري تحميل المواعيد...</div>
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
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              مواعيد {patientName}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                السابق
              </Button>
              <span className="font-medium px-4">
                {format(currentDate, 'MMMM yyyy', { locale: ar })}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                التالي
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {/* Day headers */}
            {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
            
            {/* Empty cells for days before month start */}
            {Array.from({ length: emptyCells }, (_, i) => (
              <div key={`empty-${i}`} className="p-2" />
            ))}
            
            {/* Calendar days */}
            {calendarDays.map(day => {
              const dayAppointments = getAppointmentsForDate(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              const isPastDay = day < new Date(new Date().setHours(0, 0, 0, 0));
              
              return (
                <div
                  key={day.toISOString()}
                  className={`
                    relative border rounded-lg p-2 min-h-[80px] cursor-pointer transition-all duration-200
                    ${isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}
                    ${isTodayDate ? 'bg-blue-50 dark:bg-blue-950/20' : 'bg-background hover:bg-accent/50'}
                    ${isPastDay ? 'bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed opacity-60' : ''}
                  `}
                  onClick={() => !isPastDay && setSelectedDate(day)}
                >
                  <div className={`text-sm font-medium mb-1 ${isTodayDate ? 'text-blue-600' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  
                  {/* Appointment indicators */}
                  {!isPastDay && (
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 2).map(appointment => (
                        <div
                          key={appointment.id}
                          className={`text-xs px-1 py-0.5 rounded border ${getStatusColor(appointment.status)}`}
                        >
                          {format(parseISO(appointment.appointment_date), 'HH:mm')}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayAppointments.length - 2} أخرى
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                مواعيد يوم {format(selectedDate, 'EEEE، dd MMMM yyyy', { locale: ar })}
              </span>
              <Button size="sm">
                <Plus className="h-4 w-4 ml-1" />
                إضافة موعد
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد مواعيد في هذا اليوم</p>
                <Button variant="outline" className="mt-4" size="sm">
                  إضافة موعد جديد
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateAppointments.map(appointment => (
                  <Card key={appointment.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(appointment.status)}>
                              {getStatusIcon(appointment.status)}
                              <span className="ml-1">{getStatusLabel(appointment.status)}</span>
                            </Badge>
                            <span className="text-sm font-medium">
                              {format(parseISO(appointment.appointment_date), 'HH:mm')} - 
                              {format(
                                new Date(parseISO(appointment.appointment_date).getTime() + appointment.duration * 60000), 
                                'HH:mm'
                              )}
                            </span>
                          </div>
                          
                          {appointment.treatment_type && (
                            <div className="text-sm">
                              <strong>نوع العلاج:</strong> {appointment.treatment_type}
                            </div>
                          )}
                          
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            المدة: {appointment.duration} دقيقة
                          </div>
                          
                          {appointment.notes && (
                            <div className="text-sm">
                              <strong>ملاحظات:</strong> {appointment.notes}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            تعديل
                          </Button>
                          {appointment.status === 'scheduled' && (
                            <Button variant="outline" size="sm">
                              تأكيد
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {appointments.filter(a => a.status === 'completed').length}
            </div>
            <div className="text-sm text-green-700">مواعيد مكتملة</div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {appointments.filter(a => a.status === 'confirmed').length}
            </div>
            <div className="text-sm text-blue-700">مواعيد مؤكدة</div>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {appointments.filter(a => a.status === 'scheduled').length}
            </div>
            <div className="text-sm text-yellow-700">مواعيد مجدولة</div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {appointments.filter(a => a.status === 'cancelled').length}
            </div>
            <div className="text-sm text-red-700">مواعيد ملغية</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};