import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Activity, FileText, Save } from "lucide-react";

interface Appointment {
  id: string;
  patient_id: string;
  patients?: {
    full_name: string;
  };
}

interface PostAppointmentActionsProps {
  appointment: Appointment;
  onActionsCompleted: () => void;
}

const PostAppointmentActions = ({ appointment, onActionsCompleted }: PostAppointmentActionsProps) => {
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [treatmentData, setTreatmentData] = useState({
    tooth_number: '',
    tooth_surface: '',
    diagnosis: '',
    treatment_plan: '',
    treatment_date: new Date().toISOString().split('T')[0],
    status: 'completed',
    notes: ''
  });

  const [appointmentNotes, setAppointmentNotes] = useState('');

  const handleTreatmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('لم يتم العثور على ملف المستخدم');

      const { error } = await supabase
        .from('dental_treatments')
        .insert({
          clinic_id: profile.id,
          patient_id: appointment.patient_id,
          tooth_number: treatmentData.tooth_number,
          tooth_surface: treatmentData.tooth_surface,
          diagnosis: treatmentData.diagnosis,
          treatment_plan: treatmentData.treatment_plan,
          treatment_date: treatmentData.treatment_date,
          status: treatmentData.status,
          notes: treatmentData.notes,
          numbering_system: 'universal'
        });

      if (error) throw error;

      toast({
        title: 'تم الإضافة',
        description: 'تم إضافة العلاج بنجاح'
      });

      setTreatmentDialogOpen(false);
      setTreatmentData({
        tooth_number: '',
        tooth_surface: '',
        diagnosis: '',
        treatment_plan: '',
        treatment_date: new Date().toISOString().split('T')[0],
        status: 'completed',
        notes: ''
      });
      onActionsCompleted();

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

  const handleNotesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          notes: appointmentNotes,
          status: 'completed'
        })
        .eq('id', appointment.id);

      if (error) throw error;

      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ الملاحظات بنجاح'
      });

      setNotesDialogOpen(false);
      setAppointmentNotes('');
      onActionsCompleted();

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

  const commonDiagnoses = [
    'تسوس',
    'التهاب اللثة',
    'التهاب دواعم السن',
    'كسر في السن',
    'حساسية الأسنان',
    'خراج',
    'تآكل المينا'
  ];

  const treatmentOptions = [
    'حشو',
    'تنظيف',
    'خلع',
    'علاج عصب',
    'تاج',
    'جسر',
    'علاج اللثة'
  ];

  const toothSurfaces = [
    'Mesial (أمامي)',
    'Distal (خلفي)',
    'Buccal/Facial (خدي)',
    'Lingual/Palatal (لساني)',
    'Occlusal (إطباقي)'
  ];

  return (
    <div className="flex space-x-2 space-x-reverse">
      {/* Add Treatment Dialog */}
      <Dialog open={treatmentDialogOpen} onOpenChange={setTreatmentDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="default">
            <Activity className="w-4 h-4 ml-1" />
            إضافة علاج
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إضافة علاج للمريض: {appointment.patients?.full_name}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleTreatmentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رقم السن *</Label>
                <Input
                  value={treatmentData.tooth_number}
                  onChange={(e) => setTreatmentData(prev => ({ ...prev, tooth_number: e.target.value }))}
                  placeholder="مثل: 11, 21, 31..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>سطح السن</Label>
                <Select onValueChange={(value) => setTreatmentData(prev => ({ ...prev, tooth_surface: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر سطح السن" />
                  </SelectTrigger>
                  <SelectContent>
                    {toothSurfaces.map((surface) => (
                      <SelectItem key={surface} value={surface}>
                        {surface}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>التشخيص *</Label>
                <Select onValueChange={(value) => setTreatmentData(prev => ({ ...prev, diagnosis: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التشخيص" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonDiagnoses.map((diagnosis) => (
                      <SelectItem key={diagnosis} value={diagnosis}>
                        {diagnosis}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>العلاج *</Label>
                <Select onValueChange={(value) => setTreatmentData(prev => ({ ...prev, treatment_plan: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العلاج" />
                  </SelectTrigger>
                  <SelectContent>
                    {treatmentOptions.map((treatment) => (
                      <SelectItem key={treatment} value={treatment}>
                        {treatment}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>تاريخ العلاج</Label>
              <Input
                type="date"
                value={treatmentData.treatment_date}
                onChange={(e) => setTreatmentData(prev => ({ ...prev, treatment_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>ملاحظات العلاج</Label>
              <Textarea
                value={treatmentData.notes}
                onChange={(e) => setTreatmentData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="ملاحظات حول العلاج..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
              <Button type="button" variant="outline" onClick={() => setTreatmentDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="w-4 h-4 ml-2" />
                {loading ? 'جاري الحفظ...' : 'حفظ العلاج'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <FileText className="w-4 h-4 ml-1" />
            إضافة ملاحظات
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة ملاحظات للموعد</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleNotesSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>ملاحظات الموعد</Label>
              <Textarea
                value={appointmentNotes}
                onChange={(e) => setAppointmentNotes(e.target.value)}
                placeholder="أضف ملاحظات حول الموعد، التوصيات، أو المتابعة المطلوبة..."
                rows={6}
                required
              />
            </div>

            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button type="button" variant="outline" onClick={() => setNotesDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="w-4 h-4 ml-2" />
                {loading ? 'جاري الحفظ...' : 'حفظ الملاحظات'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostAppointmentActions;