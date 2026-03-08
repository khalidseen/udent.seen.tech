import React, { useState, useEffect, useCallback } from 'react';
import { formatDateUtil } from '@/utils/formatters';
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
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Patient } from '@/hooks/usePatients';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TREATMENT_TYPES } from '@/constants/treatmentTypes';

interface AppointmentBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
}

interface DBAppointment {
  id: string;
  appointment_date: string;
  duration: number;
  treatment_type: string | null;
  doctor_id: string | null;
  status: string;
  notes: string | null;
  doctors?: { full_name: string } | null;
}

const statusLabels: Record<string, string> = {
  scheduled: 'مجدول',
  confirmed: 'مؤكد',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

const statusColors: Record<string, string> = {
  scheduled: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusIcons: Record<string, React.ElementType> = {
  scheduled: AlertCircle,
  confirmed: CheckCircle,
  completed: CheckCircle,
  cancelled: XCircle,
};

const AppointmentBookingDialog: React.FC<AppointmentBookingDialogProps> = ({
  open,
  onOpenChange,
  patient
}) => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<DBAppointment[]>([]);
  const [doctors, setDoctors] = useState<{id: string; full_name: string; specialization: string | null}[]>([]);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    date: '',
    time: '',
    duration: 30,
    treatment_type: '',
    doctor_id: '',
    notes: '',
  });

  // Fetch clinic ID
  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
      if (profile) setClinicId(profile.id);
    };
    if (open) fetch();
  }, [open]);

  // Fetch doctors
  useEffect(() => {
    if (!clinicId || !open) return;
    const fetchDoctors = async () => {
      const { data } = await supabase
        .from('doctors')
        .select('id, full_name, specialization')
        .eq('clinic_id', clinicId)
        .eq('status', 'active')
        .order('full_name');
      if (data) setDoctors(data);
    };
    fetchDoctors();
  }, [clinicId, open]);

  // Fetch patient appointments
  const fetchAppointments = useCallback(async () => {
    if (!clinicId || !open) return;
    const { data } = await supabase
      .from('appointments')
      .select('id, appointment_date, duration, treatment_type, doctor_id, status, notes, doctors(full_name)')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patient.id)
      .order('appointment_date', { ascending: false })
      .limit(20);
    if (data) setAppointments(data as DBAppointment[]);
  }, [clinicId, open, patient.id]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const handleCreateAppointment = async () => {
    if (!newAppointment.date || !newAppointment.time || !newAppointment.doctor_id) {
      toast({ title: "خطأ", description: "يرجى ملء التاريخ والوقت واختيار الطبيب", variant: "destructive" });
      return;
    }
    if (!clinicId) return;

    setLoading(true);
    try {
      const appointmentDateTime = `${newAppointment.date}T${newAppointment.time}:00`;
      const { error } = await supabase.from('appointments').insert({
        patient_id: patient.id,
        clinic_id: clinicId,
        doctor_id: newAppointment.doctor_id,
        appointment_date: appointmentDateTime,
        duration: newAppointment.duration,
        treatment_type: newAppointment.treatment_type || null,
        notes: newAppointment.notes || null,
        status: 'scheduled',
      } as any);

      if (error) throw error;

      setNewAppointment({ date: '', time: '', duration: 30, treatment_type: '', doctor_id: '', notes: '' });
      setShowNewAppointment(false);
      toast({ title: "تم إنشاء الموعد", description: "تم حجز الموعد بنجاح" });
      fetchAppointments();
    } catch (error: unknown) {
      toast({ title: "خطأ", description: error instanceof Error ? error.message : 'حدث خطأ', variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: newStatus === 'cancelled' ? "تم إلغاء الموعد" : "تم تأكيد الموعد" });
      fetchAppointments();
    }
  };

  const scheduled = appointments.filter(a => a.status === 'scheduled').length;
  const confirmed = appointments.filter(a => a.status === 'confirmed').length;
  const completed = appointments.filter(a => a.status === 'completed').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            حجز المواعيد - {patient.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-foreground">{scheduled}</div>
              <div className="text-sm text-muted-foreground">مجدولة</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-foreground">{confirmed}</div>
              <div className="text-sm text-muted-foreground">مؤكدة</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-foreground">{completed}</div>
              <div className="text-sm text-muted-foreground">مكتملة</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-foreground">{appointments.length}</div>
              <div className="text-sm text-muted-foreground">إجمالي</div>
            </div>
          </div>

          {/* New appointment button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-foreground">المواعيد</h3>
            <Button onClick={() => setShowNewAppointment(true)}>
              <Plus className="h-4 w-4 mr-2" />
              حجز موعد جديد
            </Button>
          </div>

          {/* Appointments list */}
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <div className="text-center py-8 bg-muted/30 rounded-lg">
                <CalendarDays className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">لا توجد مواعيد محجوزة</p>
                <Button onClick={() => setShowNewAppointment(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  حجز أول موعد
                </Button>
              </div>
            ) : (
              appointments.map((appointment) => {
                const StatusIcon = statusIcons[appointment.status] || AlertCircle;
                const aptDate = new Date(appointment.appointment_date);
                return (
                  <Card key={appointment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={statusColors[appointment.status] || ''}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusLabels[appointment.status] || appointment.status}
                            </Badge>
                            {appointment.treatment_type && (
                              <Badge variant="outline">{appointment.treatment_type}</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{formatDateUtil(aptDate)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{aptDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })} ({appointment.duration} دقيقة)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{appointment.doctors ? `د. ${(appointment.doctors as any).full_name}` : 'غير محدد'}</span>
                            </div>
                          </div>
                          {appointment.notes && (
                            <div className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                              {appointment.notes}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          {appointment.status === 'scheduled' && (
                            <Button size="sm" onClick={() => handleStatusChange(appointment.id, 'confirmed')}>
                              تأكيد
                            </Button>
                          )}
                          {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                            <Button size="sm" variant="outline" onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                              className="text-destructive hover:bg-destructive/10">
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

        {/* New appointment form dialog */}
        {showNewAppointment && (
          <Dialog open={showNewAppointment} onOpenChange={setShowNewAppointment}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>حجز موعد جديد</DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>تاريخ الموعد *</Label>
                  <Input
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>وقت الموعد *</Label>
                  <Input
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, time: e.target.value }))}
                    min="08:00" max="22:00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>نوع العلاج</Label>
                  <Select value={newAppointment.treatment_type} onValueChange={v => setNewAppointment(prev => ({ ...prev, treatment_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر نوع العلاج" /></SelectTrigger>
                    <SelectContent>
                      {TREATMENT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المدة (دقيقة)</Label>
                  <Select value={newAppointment.duration.toString()} onValueChange={v => setNewAppointment(prev => ({ ...prev, duration: parseInt(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 دقيقة</SelectItem>
                      <SelectItem value="30">30 دقيقة</SelectItem>
                      <SelectItem value="45">45 دقيقة</SelectItem>
                      <SelectItem value="60">60 دقيقة</SelectItem>
                      <SelectItem value="90">90 دقيقة</SelectItem>
                      <SelectItem value="120">120 دقيقة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>الطبيب المعالج *</Label>
                  <Select value={newAppointment.doctor_id} onValueChange={v => setNewAppointment(prev => ({ ...prev, doctor_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر الطبيب" /></SelectTrigger>
                    <SelectContent>
                      {doctors.map(doc => (
                        <SelectItem key={doc.id} value={doc.id}>
                          د. {doc.full_name} {doc.specialization ? `- ${doc.specialization}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="أضف أي ملاحظات إضافية..."
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewAppointment(false)}>إلغاء</Button>
                <Button onClick={handleCreateAppointment} disabled={loading}>
                  {loading ? 'جاري الحفظ...' : 'حجز الموعد'}
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
