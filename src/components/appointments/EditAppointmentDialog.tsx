import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Save, AlertTriangle } from "lucide-react";

interface EditAppointment {
  id: string;
  patient_id: string;
  clinic_id?: string;
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

interface EditAppointmentDialogProps {
  appointment: EditAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAppointmentUpdated: () => void;
}

const TREATMENT_TYPES = [
  { value: 'فحص عام', label: 'فحص عام' },
  { value: 'تنظيف الأسنان', label: 'تنظيف الأسنان' },
  { value: 'حشو الأسنان', label: 'حشو الأسنان' },
  { value: 'خلع الأسنان', label: 'خلع الأسنان' },
  { value: 'علاج عصب', label: 'علاج عصب' },
  { value: 'تركيب تاج', label: 'تركيب تاج' },
  { value: 'تركيب جسر', label: 'تركيب جسر' },
  { value: 'زراعة أسنان', label: 'زراعة أسنان' },
  { value: 'تقويم الأسنان', label: 'تقويم الأسنان' },
  { value: 'تبييض الأسنان', label: 'تبييض الأسنان' },
  { value: 'جراحة فموية', label: 'جراحة فموية' },
  { value: 'علاج اللثة', label: 'علاج اللثة' },
  { value: 'طوارئ', label: 'طوارئ' },
  { value: 'متابعة', label: 'متابعة' },
  { value: 'استشارة', label: 'استشارة' },
  { value: 'أخرى', label: 'أخرى' },
];

const EditAppointmentDialog = ({ 
  appointment, 
  open, 
  onOpenChange, 
  onAppointmentUpdated 
}: EditAppointmentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    appointment_date: '',
    appointment_time: '',
    duration: 30,
    status: 'scheduled',
    treatment_type: '',
    notes: '',
    patient_phone: '',
    patient_email: ''
  });

  useEffect(() => {
    if (appointment) {
      const appointmentDate = new Date(appointment.appointment_date);
      setFormData({
        appointment_date: appointmentDate.toISOString().split('T')[0],
        appointment_time: appointmentDate.toTimeString().slice(0, 5),
        duration: appointment.duration,
        status: appointment.status,
        treatment_type: appointment.treatment_type || '',
        notes: appointment.notes || '',
        patient_phone: appointment.patients?.phone || '',
        patient_email: appointment.patients?.email || ''
      });
      setConflictWarning(null);
    }
  }, [appointment]);

  const checkConflicts = useCallback(async (date: string, time: string, duration: number) => {
    if (!appointment) return;
    
    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    
    const { data: existing } = await supabase
      .from('appointments')
      .select('id, appointment_date, duration, patients(full_name)')
      .eq('clinic_id', appointment.clinic_id || '')
      .gte('appointment_date', `${date}T00:00:00`)
      .lte('appointment_date', `${date}T23:59:59`)
      .in('status', ['scheduled', 'confirmed'])
      .neq('id', appointment.id);

    if (existing && existing.length > 0) {
      const conflicts = existing.filter(apt => {
        const aptStart = new Date(apt.appointment_date);
        const aptEnd = new Date(aptStart.getTime() + (apt.duration || 30) * 60000);
        return (startTime < aptEnd && endTime > aptStart);
      });

      if (conflicts.length > 0) {
        const names = conflicts.map(c => (c.patients as any)?.full_name || 'مريض').join('، ');
        setConflictWarning(`⚠️ تعارض مع موعد: ${names}`);
      } else {
        setConflictWarning(null);
      }
    } else {
      setConflictWarning(null);
    }
  }, [appointment]);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'appointment_date' || field === 'appointment_time' || field === 'duration') {
      const updated = { ...formData, [field]: value };
      if (updated.appointment_date && updated.appointment_time) {
        checkConflicts(updated.appointment_date, updated.appointment_time, typeof updated.duration === 'number' ? updated.duration : parseInt(String(updated.duration)));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;

    setLoading(true);
    
    try {
      const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`);
      
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({
          appointment_date: appointmentDateTime.toISOString(),
          duration: formData.duration,
          status: formData.status,
          treatment_type: formData.treatment_type || null,
          notes: formData.notes || null
        })
        .eq('id', appointment.id);

      if (appointmentError) throw appointmentError;

      // Update patient contact info if changed
      const updateData: Record<string, string> = {};
      if (formData.patient_phone && formData.patient_phone !== appointment.patients?.phone) {
        updateData.phone = formData.patient_phone;
      }
      if (formData.patient_email && formData.patient_email !== appointment.patients?.email) {
        updateData.email = formData.patient_email;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: patientError } = await supabase
          .from('patients')
          .update(updateData)
          .eq('id', appointment.patient_id);
        if (patientError) throw patientError;
      }

      toast({ title: 'تم التحديث', description: 'تم تحديث الموعد بنجاح' });
      onAppointmentUpdated();
      onOpenChange(false);

    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>تعديل الموعد - {appointment.patients?.full_name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Conflict Warning */}
          {conflictWarning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{conflictWarning}</AlertDescription>
            </Alert>
          )}

          {/* Patient Info */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium">تحديث بيانات المريض</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                <Input value={formData.patient_phone} onChange={(e) => handleChange('patient_phone', e.target.value)} placeholder="رقم الهاتف" />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input type="email" value={formData.patient_email} onChange={(e) => handleChange('patient_email', e.target.value)} placeholder="البريد الإلكتروني" />
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input type="date" value={formData.appointment_date} onChange={(e) => handleChange('appointment_date', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>الوقت</Label>
              <Input type="time" value={formData.appointment_time} onChange={(e) => handleChange('appointment_time', e.target.value)} required min="08:00" max="22:00" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>المدة (بالدقائق)</Label>
              <Input type="number" min="15" max="240" step="15" value={formData.duration} onChange={(e) => handleChange('duration', parseInt(e.target.value))} required />
            </div>
            <div className="space-y-2">
              <Label>حالة الموعد</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">مجدول</SelectItem>
                  <SelectItem value="confirmed">مؤكد</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                  <SelectItem value="no_show">لم يحضر</SelectItem>
                  <SelectItem value="rescheduled">معاد جدولته</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>نوع العلاج</Label>
            <Select value={formData.treatment_type} onValueChange={(value) => handleChange('treatment_type', value)}>
              <SelectTrigger><SelectValue placeholder="اختر نوع العلاج" /></SelectTrigger>
              <SelectContent>
                {TREATMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} placeholder="ملاحظات إضافية..." rows={3} />
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 ml-2" />
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAppointmentDialog;
