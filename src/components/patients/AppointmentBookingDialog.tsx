import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CalendarDays, 
  Clock,
  Plus,
  User,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Patient } from '@/hooks/usePatients';
import { useToast } from '@/hooks/use-toast';

interface AppointmentBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  duration: number;
  type: 'checkup' | 'treatment' | 'consultation' | 'emergency' | 'followup';
  doctor: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  location: string;
}

const AppointmentBookingDialog: React.FC<AppointmentBookingDialogProps> = ({
  open,
  onOpenChange,
  patient
}) => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: '1',
      date: '2024-01-25',
      time: '10:00',
      duration: 60,
      type: 'checkup',
      doctor: 'د. أحمد محمد',
      status: 'scheduled',
      notes: 'فحص دوري',
      location: 'العيادة الرئيسية'
    },
    {
      id: '2',
      date: '2024-02-01',
      time: '14:30',
      duration: 90,
      type: 'treatment',
      doctor: 'د. سارة علي',
      status: 'confirmed',
      notes: 'علاج تسوس الضرس العلوي',
      location: 'قسم العلاج'
    }
  ]);

  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    date: '',
    time: '',
    duration: 60,
    type: 'checkup' as Appointment['type'],
    doctor: '',
    notes: '',
    location: 'العيادة الرئيسية'
  });

  const appointmentTypes = {
    checkup: 'فحص دوري',
    treatment: 'علاج',
    consultation: 'استشارة',
    emergency: 'طوارئ',
    followup: 'متابعة'
  };

  const statusLabels = {
    scheduled: 'مجدول',
    confirmed: 'مؤكد',
    completed: 'مكتمل',
    cancelled: 'ملغي'
  };

  const statusColors = {
    scheduled: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const statusIcons = {
    scheduled: AlertCircle,
    confirmed: CheckCircle,
    completed: CheckCircle,
    cancelled: XCircle
  };

  const doctors = [
    'د. أحمد محمد',
    'د. سارة علي',
    'د. محمد حسن',
    'د. فاطمة خالد',
    'د. عمر يوسف'
  ];

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
  ];

  const handleCreateAppointment = () => {
    if (!newAppointment.date || !newAppointment.time || !newAppointment.doctor) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    const appointment: Appointment = {
      id: Date.now().toString(),
      ...newAppointment,
      status: 'scheduled'
    };

    setAppointments(prev => [...prev, appointment]);
    setNewAppointment({
      date: '',
      time: '',
      duration: 60,
      type: 'checkup',
      doctor: '',
      notes: '',
      location: 'العيادة الرئيسية'
    });
    setShowNewAppointment(false);

    toast({
      title: "تم إنشاء الموعد",
      description: "تم حجز الموعد بنجاح"
    });
  };

  const handleCancelAppointment = (id: string) => {
    setAppointments(prev => 
      prev.map(app => 
        app.id === id ? { ...app, status: 'cancelled' as const } : app
      )
    );
    
    toast({
      title: "تم إلغاء الموعد",
      description: "تم إلغاء الموعد بنجاح"
    });
  };

  const handleConfirmAppointment = (id: string) => {
    setAppointments(prev => 
      prev.map(app => 
        app.id === id ? { ...app, status: 'confirmed' as const } : app
      )
    );
    
    toast({
      title: "تم تأكيد الموعد",
      description: "تم تأكيد الموعد بنجاح"
    });
  };

  const getNextAvailableSlots = () => {
    const today = new Date();
    const slots = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      const dateStr = date.toISOString().split('T')[0];
      const dayAppointments = appointments.filter(app => app.date === dateStr);
      const availableSlots = timeSlots.filter(time => 
        !dayAppointments.some(app => app.time === time)
      );
      
      if (availableSlots.length > 0) {
        slots.push({
          date: dateStr,
          availableSlots: availableSlots.slice(0, 3)
        });
      }
    }
    
    return slots.slice(0, 3);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            حجز المواعيد - {patient.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {appointments.filter(a => a.status === 'scheduled').length}
              </div>
              <div className="text-sm text-blue-700">مواعيد مجدولة</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {appointments.filter(a => a.status === 'confirmed').length}
              </div>
              <div className="text-sm text-green-700">مواعيد مؤكدة</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {appointments.filter(a => a.status === 'completed').length}
              </div>
              <div className="text-sm text-purple-700">مواعيد مكتملة</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">
                {appointments.length}
              </div>
              <div className="text-sm text-orange-700">إجمالي المواعيد</div>
            </div>
          </div>

          {/* أوقات متاحة سريعة */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              أقرب الأوقات المتاحة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getNextAvailableSlots().map((slot, index) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <div className="font-medium text-sm mb-2">
                    {new Date(slot.date).toLocaleDateString('ar-SA', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {slot.availableSlots.map(time => (
                      <Button
                        key={time}
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs"
                        onClick={() => {
                          setNewAppointment(prev => ({
                            ...prev,
                            date: slot.date,
                            time: time
                          }));
                          setShowNewAppointment(true);
                        }}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* زر حجز موعد جديد */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">المواعيد القادمة</h3>
            <Button onClick={() => setShowNewAppointment(true)}>
              <Plus className="h-4 w-4 mr-2" />
              حجز موعد جديد
            </Button>
          </div>

          {/* قائمة المواعيد */}
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <CalendarDays className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">لا توجد مواعيد محجوزة</p>
                <Button onClick={() => setShowNewAppointment(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  حجز أول موعد
                </Button>
              </div>
            ) : (
              appointments
                .sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime())
                .map((appointment) => {
                  const StatusIcon = statusIcons[appointment.status];
                  return (
                    <Card key={appointment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className={statusColors[appointment.status]}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusLabels[appointment.status]}
                              </Badge>
                              <Badge variant="outline">
                                {appointmentTypes[appointment.type]}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span>
                                  {new Date(appointment.date).toLocaleDateString('ar-SA')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span>{appointment.time} ({appointment.duration} دقيقة)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span>{appointment.doctor}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-500" />
                                <span>{appointment.location}</span>
                              </div>
                            </div>
                            
                            {appointment.notes && (
                              <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                {appointment.notes}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            {appointment.status === 'scheduled' && (
                              <Button
                                size="sm"
                                onClick={() => handleConfirmAppointment(appointment.id)}
                              >
                                تأكيد
                              </Button>
                            )}
                            {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelAppointment(appointment.id)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                إلغاء
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
            )}
          </div>
        </div>

        {/* نموذج حجز موعد جديد */}
        {showNewAppointment && (
          <Dialog open={showNewAppointment} onOpenChange={setShowNewAppointment}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>حجز موعد جديد</DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">تاريخ الموعد *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time">وقت الموعد *</Label>
                  <Select
                    value={newAppointment.time}
                    onValueChange={(value) => setNewAppointment(prev => ({ ...prev, time: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الوقت" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(time => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">نوع الموعد</Label>
                  <Select
                    value={newAppointment.type}
                    onValueChange={(value: Appointment['type']) => 
                      setNewAppointment(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(appointmentTypes).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">مدة الموعد (دقيقة)</Label>
                  <Select
                    value={newAppointment.duration.toString()}
                    onValueChange={(value) => 
                      setNewAppointment(prev => ({ ...prev, duration: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 دقيقة</SelectItem>
                      <SelectItem value="60">60 دقيقة</SelectItem>
                      <SelectItem value="90">90 دقيقة</SelectItem>
                      <SelectItem value="120">120 دقيقة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="doctor">الطبيب *</Label>
                  <Select
                    value={newAppointment.doctor}
                    onValueChange={(value) => setNewAppointment(prev => ({ ...prev, doctor: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الطبيب" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map(doctor => (
                        <SelectItem key={doctor} value={doctor}>
                          {doctor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">المكان</Label>
                  <Input
                    id="location"
                    value={newAppointment.location}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="أضف أي ملاحظات إضافية..."
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewAppointment(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleCreateAppointment}>
                  حجز الموعد
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentBookingDialog;