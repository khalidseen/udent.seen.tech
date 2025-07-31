import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface EditAppointment {
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

interface EditAppointmentDialogProps {
  appointment: EditAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAppointmentUpdated: () => void;
}

const EditAppointmentDialog = ({ 
  appointment, 
  open, 
  onOpenChange, 
  onAppointmentUpdated 
}: EditAppointmentDialogProps) => {
  const [loading, setLoading] = useState(false);
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
    }
  }, [appointment]);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;

    setLoading(true);
    
    try {
      // Update appointment
      const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`);
      
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({
          appointment_date: appointmentDateTime.toISOString(),
          duration: formData.duration,
          status: formData.status,
          treatment_type: formData.treatment_type,
          notes: formData.notes
        })
        .eq('id', appointment.id);

      if (appointmentError) throw appointmentError;

      // Update patient info if provided
      if (formData.patient_phone || formData.patient_email) {
        const updateData: any = {};
        if (formData.patient_phone) updateData.phone = formData.patient_phone;
        if (formData.patient_email) updateData.email = formData.patient_email;

        const { error: patientError } = await supabase
          .from('patients')
          .update(updateData)
          .eq('id', appointment.patient_id);

        if (patientError) throw patientError;
      }

      toast({
        title: 'تم التحديث',
        description: 'تم تحديث الموعد بنجاح'
      });

      onAppointmentUpdated();
      onOpenChange(false);

    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
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
          {/* Patient Info Section */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium">تحديث بيانات المريض</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                <Input
                  value={formData.patient_phone}
                  onChange={(e) => handleChange('patient_phone', e.target.value)}
                  placeholder="رقم الهاتف"
                />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={formData.patient_email}
                  onChange={(e) => handleChange('patient_email', e.target.value)}
                  placeholder="البريد الإلكتروني"
                />
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={formData.appointment_date}
                onChange={(e) => handleChange('appointment_date', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>الوقت</Label>
              <Input
                type="time"
                value={formData.appointment_time}
                onChange={(e) => handleChange('appointment_time', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>المدة (بالدقائق)</Label>
              <Input
                type="number"
                min="15"
                max="180"
                step="15"
                value={formData.duration}
                onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>حالة الموعد</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">مجدول</SelectItem>
                  <SelectItem value="confirmed">مؤكد</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>نوع العلاج</Label>
            <Select value={formData.treatment_type} onValueChange={(value) => handleChange('treatment_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع العلاج" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultation">استشارة</SelectItem>
                <SelectItem value="cleaning">تنظيف</SelectItem>
                <SelectItem value="filling">حشو</SelectItem>
                <SelectItem value="extraction">خلع</SelectItem>
                <SelectItem value="root_canal">علاج عصب</SelectItem>
                <SelectItem value="crown">تاج</SelectItem>
                <SelectItem value="orthodontics">تقويم</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="ملاحظات إضافية..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
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