import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface AddTreatmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  onTreatmentAdded?: () => void;
}

const AddTreatmentDialog = ({ 
  open, 
  onOpenChange, 
  patientId, 
  patientName,
  onTreatmentAdded 
}: AddTreatmentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    diagnosis: "",
    treatment_plan: "",
    tooth_number: "",
    tooth_surface: "",
    numbering_system: "universal",
    notes: "",
    status: "planned"
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !date) return;

    setLoading(true);
    try {
      // Get user's clinic ID from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على بيانات المستخدم",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('dental_treatments')
        .insert({
          patient_id: patientId,
          clinic_id: profile.id,
          treatment_date: format(date, 'yyyy-MM-dd'),
          diagnosis: formData.diagnosis,
          treatment_plan: formData.treatment_plan,
          tooth_number: formData.tooth_number,
          tooth_surface: formData.tooth_surface || null,
          numbering_system: formData.numbering_system,
          notes: formData.notes || null,
          status: formData.status
        });

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إضافة العلاج بنجاح",
      });

      // Reset form
      setFormData({
        diagnosis: "",
        treatment_plan: "",
        tooth_number: "",
        tooth_surface: "",
        numbering_system: "universal",
        notes: "",
        status: "planned"
      });
      setDate(undefined);
      onOpenChange(false);
      onTreatmentAdded?.();
    } catch (error) {
      console.error('Error adding treatment:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة العلاج",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            إضافة علاج للمريض ({patientName})
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* تاريخ العلاج */}
            <div className="space-y-2">
              <Label>تاريخ العلاج *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-right font-normal"
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: ar }) : "اختر التاريخ"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* حالة العلاج */}
            <div className="space-y-2">
              <Label>حالة العلاج *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر حالة العلاج" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">مخطط</SelectItem>
                  <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* التشخيص */}
          <div className="space-y-2">
            <Label>التشخيص *</Label>
            <Input
              value={formData.diagnosis}
              onChange={(e) => handleInputChange('diagnosis', e.target.value)}
              placeholder="أدخل التشخيص"
              required
            />
          </div>

          {/* خطة العلاج */}
          <div className="space-y-2">
            <Label>خطة العلاج *</Label>
            <Textarea
              value={formData.treatment_plan}
              onChange={(e) => handleInputChange('treatment_plan', e.target.value)}
              placeholder="أدخل خطة العلاج"
              required
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* رقم السن */}
            <div className="space-y-2">
              <Label>رقم السن *</Label>
              <Input
                value={formData.tooth_number}
                onChange={(e) => handleInputChange('tooth_number', e.target.value)}
                placeholder="مثل: 11, 21"
                required
              />
            </div>

            {/* سطح السن */}
            <div className="space-y-2">
              <Label>سطح السن</Label>
              <Input
                value={formData.tooth_surface}
                onChange={(e) => handleInputChange('tooth_surface', e.target.value)}
                placeholder="مثل: O, M, D"
              />
            </div>

            {/* نظام الترقيم */}
            <div className="space-y-2">
              <Label>نظام الترقيم</Label>
              <Select 
                value={formData.numbering_system} 
                onValueChange={(value) => handleInputChange('numbering_system', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="universal">Universal</SelectItem>
                  <SelectItem value="fdi">FDI</SelectItem>
                  <SelectItem value="palmer">Palmer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ملاحظات */}
          <div className="space-y-2">
            <Label>ملاحظات إضافية</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="أدخل أي ملاحظات إضافية"
              rows={3}
            />
          </div>

          {/* أزرار التحكم */}
          <div className="flex justify-end space-x-2 space-x-reverse pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading || !date}>
              <Plus className="w-4 h-4 ml-2" />
              {loading ? "جاري الإضافة..." : "إضافة العلاج"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTreatmentDialog;