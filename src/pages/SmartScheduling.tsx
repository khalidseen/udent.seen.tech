import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, addDays, startOfWeek, isSameDay, parseISO, isWithinInterval } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarDays, ChevronRight, ChevronLeft, Clock, User, Plus, AlertTriangle, Palmtree } from "lucide-react";

const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

export default function SmartScheduling() {
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [weekOffset, setWeekOffset] = useState(0);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const queryClient = useQueryClient();

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: profile } = useQuery({
    queryKey: ['profile-scheduling'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_user_profile');
      if (error) throw error;
      return data;
    }
  });
  const clinicId = profile?.id;

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors-schedule', clinicId],
    queryFn: async () => {
      const { data } = await supabase.from('doctors').select('id, full_name, specialization').eq('clinic_id', clinicId!).eq('status', 'active');
      return data || [];
    },
    enabled: !!clinicId
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments-calendar', clinicId, weekOffset],
    queryFn: async () => {
      const start = format(weekDays[0], 'yyyy-MM-dd');
      const end = format(weekDays[6], 'yyyy-MM-dd');
      const { data } = await supabase
        .from('appointments')
        .select('*, patients(full_name), doctors(full_name)')
        .eq('clinic_id', clinicId!)
        .gte('appointment_date', start)
        .lte('appointment_date', end + 'T23:59:59')
        .neq('status', 'cancelled');
      return data || [];
    },
    enabled: !!clinicId
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['doctor-schedules', clinicId],
    queryFn: async () => {
      const { data } = await supabase.from('doctor_schedules').select('*').eq('clinic_id', clinicId!).eq('is_active', true);
      return data || [];
    },
    enabled: !!clinicId
  });

  const { data: leaves = [] } = useQuery({
    queryKey: ['doctor-leaves', clinicId],
    queryFn: async () => {
      const { data } = await supabase.from('doctor_leaves').select('*, doctors(full_name)').eq('clinic_id', clinicId!).gte('end_date', format(new Date(), 'yyyy-MM-dd'));
      return data || [];
    },
    enabled: !!clinicId
  });

  const filteredAppointments = useMemo(() => {
    if (selectedDoctor === 'all') return appointments;
    return appointments.filter((a: any) => a.doctor_id === selectedDoctor);
  }, [appointments, selectedDoctor]);

  const getAppointmentsForSlot = (day: Date, hour: number) => {
    return filteredAppointments.filter((a: any) => {
      const d = new Date(a.appointment_date);
      return isSameDay(d, day) && d.getHours() === hour;
    });
  };

  const isDoctorOnLeave = (doctorId: string, day: Date) => {
    return leaves.some((l: any) => 
      l.doctor_id === doctorId &&
      isWithinInterval(day, { start: parseISO(l.start_date), end: parseISO(l.end_date) })
    );
  };

  const hasConflict = (day: Date, hour: number) => {
    const slotApps = getAppointmentsForSlot(day, hour);
    if (selectedDoctor !== 'all') return slotApps.length > 1;
    const doctorGroups = new Map<string, number>();
    slotApps.forEach((a: any) => {
      if (a.doctor_id) doctorGroups.set(a.doctor_id, (doctorGroups.get(a.doctor_id) || 0) + 1);
    });
    return Array.from(doctorGroups.values()).some(c => c > 1);
  };

  // Leave dialog state
  const [leaveForm, setLeaveForm] = useState({ doctor_id: '', start_date: '', end_date: '', reason: '', leave_type: 'vacation' });

  const createLeaveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('doctor_leaves').insert({
        clinic_id: clinicId!, doctor_id: leaveForm.doctor_id,
        start_date: leaveForm.start_date, end_date: leaveForm.end_date,
        reason: leaveForm.reason || null, leave_type: leaveForm.leave_type
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-leaves'] });
      toast.success('تمت إضافة الإجازة');
      setShowLeaveDialog(false);
    }
  });

  // Schedule dialog state
  const [scheduleForm, setScheduleForm] = useState({ doctor_id: '', day_of_week: '0', start_time: '08:00', end_time: '16:00', slot_duration: '30' });

  const createScheduleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('doctor_schedules').upsert({
        clinic_id: clinicId!, doctor_id: scheduleForm.doctor_id,
        day_of_week: parseInt(scheduleForm.day_of_week),
        start_time: scheduleForm.start_time, end_time: scheduleForm.end_time,
        slot_duration: parseInt(scheduleForm.slot_duration)
      }, { onConflict: 'doctor_id,day_of_week' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-schedules'] });
      toast.success('تم حفظ الجدول');
      setShowScheduleDialog(false);
    }
  });

  const todayStats = {
    total: appointments.filter((a: any) => isSameDay(new Date(a.appointment_date), new Date())).length,
    conflicts: weekDays.reduce((sum, day) => sum + HOURS.reduce((s, h) => s + (hasConflict(day, h) ? 1 : 0), 0), 0),
    activeLeaves: leaves.filter((l: any) => isWithinInterval(new Date(), { start: parseISO(l.start_date), end: parseISO(l.end_date) })).length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarDays className="w-8 h-8 text-primary" />
            الجدولة الذكية والتقويم
          </h1>
          <p className="text-muted-foreground">تقويم بصري مع كشف التعارضات وإدارة الإجازات</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowScheduleDialog(true)}>
            <Clock className="w-4 h-4 ml-2" />ساعات العمل
          </Button>
          <Button variant="outline" onClick={() => setShowLeaveDialog(true)}>
            <Palmtree className="w-4 h-4 ml-2" />إضافة إجازة
          </Button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{todayStats.total}</p>
          <p className="text-xs text-muted-foreground">مواعيد هذا الأسبوع</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{todayStats.conflicts}</p>
          <p className="text-xs text-muted-foreground">تعارضات</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{todayStats.activeLeaves}</p>
          <p className="text-xs text-muted-foreground">إجازات نشطة</p>
        </CardContent></Card>
      </div>

      {/* فلاتر + تنقل */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset(w => w - 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>اليوم</Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset(w => w + 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-medium mr-2">
            {format(weekDays[0], 'dd MMM', { locale: ar })} — {format(weekDays[6], 'dd MMM yyyy', { locale: ar })}
          </span>
        </div>
        <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
          <SelectTrigger className="w-48"><SelectValue placeholder="كل الأطباء" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأطباء</SelectItem>
            {doctors.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* التقويم الأسبوعي */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-xs text-muted-foreground w-16">الوقت</th>
                {weekDays.map((day, i) => (
                  <th key={i} className={`p-2 text-center border-r ${isSameDay(day, new Date()) ? 'bg-primary/5' : ''}`}>
                    <div className="text-xs text-muted-foreground">{DAYS_AR[day.getDay()]}</div>
                    <div className={`text-lg font-bold ${isSameDay(day, new Date()) ? 'text-primary' : ''}`}>{format(day, 'd')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour} className="border-b hover:bg-muted/30">
                  <td className="p-1 text-xs text-muted-foreground text-center font-mono border-r">
                    {hour.toString().padStart(2, '0')}:00
                  </td>
                  {weekDays.map((day, i) => {
                    const slotApps = getAppointmentsForSlot(day, hour);
                    const conflict = hasConflict(day, hour);
                    const onLeave = selectedDoctor !== 'all' && isDoctorOnLeave(selectedDoctor, day);
                    return (
                      <td key={i} className={`p-1 border-r min-h-[48px] align-top ${
                        onLeave ? 'bg-amber-50 dark:bg-amber-950/20' :
                        conflict ? 'bg-red-50 dark:bg-red-950/20' :
                        isSameDay(day, new Date()) ? 'bg-primary/5' : ''
                      }`}>
                        {onLeave && slotApps.length === 0 && (
                          <div className="text-[10px] text-amber-600 text-center">🌴 إجازة</div>
                        )}
                        {slotApps.map((a: any) => (
                          <div key={a.id} className={`text-[10px] p-1 mb-0.5 rounded truncate ${
                            a.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            a.status === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            'bg-primary/10 text-primary'
                          }`} title={`${a.patients?.full_name} - ${a.treatment_type || ''}`}>
                            <span className="font-medium">{a.patients?.full_name?.split(' ')[0]}</span>
                            {conflict && <AlertTriangle className="w-2.5 h-2.5 inline mr-1 text-red-500" />}
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* الإجازات النشطة */}
      {leaves.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Palmtree className="w-5 h-5" />الإجازات القادمة</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {leaves.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                  <div>
                    <span className="font-medium">{l.doctors?.full_name}</span>
                    <span className="text-sm text-muted-foreground mr-2">
                      {format(parseISO(l.start_date), 'dd/MM')} → {format(parseISO(l.end_date), 'dd/MM/yyyy')}
                    </span>
                    {l.reason && <span className="text-xs text-muted-foreground mr-2">({l.reason})</span>}
                  </div>
                  <Badge variant="outline">{l.leave_type === 'vacation' ? 'إجازة' : l.leave_type === 'sick' ? 'مرضية' : l.leave_type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* حوار الإجازة */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>إضافة إجازة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الطبيب</Label>
              <Select value={leaveForm.doctor_id} onValueChange={v => setLeaveForm(p => ({ ...p, doctor_id: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر الطبيب" /></SelectTrigger>
                <SelectContent>{doctors.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>نوع الإجازة</Label>
              <Select value={leaveForm.leave_type} onValueChange={v => setLeaveForm(p => ({ ...p, leave_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">إجازة سنوية</SelectItem>
                  <SelectItem value="sick">مرضية</SelectItem>
                  <SelectItem value="personal">شخصية</SelectItem>
                  <SelectItem value="conference">مؤتمر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>من</Label><Input type="date" value={leaveForm.start_date} onChange={e => setLeaveForm(p => ({ ...p, start_date: e.target.value }))} /></div>
              <div><Label>إلى</Label><Input type="date" value={leaveForm.end_date} onChange={e => setLeaveForm(p => ({ ...p, end_date: e.target.value }))} /></div>
            </div>
            <div><Label>السبب</Label><Textarea value={leaveForm.reason} onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))} /></div>
            <Button className="w-full" onClick={() => createLeaveMutation.mutate()} disabled={!leaveForm.doctor_id || !leaveForm.start_date || !leaveForm.end_date}>
              إضافة الإجازة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* حوار ساعات العمل */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تعيين ساعات العمل</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الطبيب</Label>
              <Select value={scheduleForm.doctor_id} onValueChange={v => setScheduleForm(p => ({ ...p, doctor_id: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر الطبيب" /></SelectTrigger>
                <SelectContent>{doctors.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>اليوم</Label>
              <Select value={scheduleForm.day_of_week} onValueChange={v => setScheduleForm(p => ({ ...p, day_of_week: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS_AR.map((d, i) => <SelectItem key={i} value={i.toString()}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>من</Label><Input type="time" value={scheduleForm.start_time} onChange={e => setScheduleForm(p => ({ ...p, start_time: e.target.value }))} /></div>
              <div><Label>إلى</Label><Input type="time" value={scheduleForm.end_time} onChange={e => setScheduleForm(p => ({ ...p, end_time: e.target.value }))} /></div>
            </div>
            <div>
              <Label>مدة الموعد (دقيقة)</Label>
              <Select value={scheduleForm.slot_duration} onValueChange={v => setScheduleForm(p => ({ ...p, slot_duration: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 دقيقة</SelectItem>
                  <SelectItem value="30">30 دقيقة</SelectItem>
                  <SelectItem value="45">45 دقيقة</SelectItem>
                  <SelectItem value="60">ساعة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => createScheduleMutation.mutate()} disabled={!scheduleForm.doctor_id}>
              حفظ الجدول
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
