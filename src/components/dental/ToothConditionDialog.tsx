import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ToothConditionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  toothNumber: string;
  numberingSystem: string;
  onConditionUpdate?: () => void;
}

interface ToothCondition {
  condition_type: string;
  condition_color: string;
  notes: string;
  treatment_date: string;
}

const conditionTypes = [
  { value: 'healthy', label: 'سليم', color: '#FFFFFF' },
  { value: 'caries', label: 'تسوس', color: '#8B4513' },
  { value: 'filled', label: 'محشو', color: '#C0C0C0' },
  { value: 'crown', label: 'تاج', color: '#FFD700' },
  { value: 'missing', label: 'مفقود', color: '#FF0000' },
  { value: 'needs_treatment', label: 'يحتاج علاج', color: '#FFA500' },
  { value: 'root_canal', label: 'علاج عصب', color: '#800080' },
  { value: 'extraction_needed', label: 'يحتاج قلع', color: '#DC143C' },
  { value: 'observation', label: 'تحت المراقبة', color: '#FFFF00' },
  { value: 'treated', label: 'تم العلاج', color: '#00FF00' }
];

export default function ToothConditionDialog({
  isOpen,
  onOpenChange,
  patientId,
  toothNumber,
  numberingSystem,
  onConditionUpdate
}: ToothConditionDialogProps) {
  const { user } = useAuth();
  const [condition, setCondition] = useState<ToothCondition>({
    condition_type: 'healthy',
    condition_color: '#FFFFFF',
    notes: '',
    treatment_date: new Date().toISOString().split('T')[0]
  });
  const [existingCondition, setExistingCondition] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && patientId && toothNumber) {
      fetchExistingCondition();
    }
  }, [isOpen, patientId, toothNumber]);

  const fetchExistingCondition = async () => {
    try {
      const { data } = await supabase
        .from('tooth_conditions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('tooth_number', toothNumber)
        .eq('numbering_system', numberingSystem)
        .single();

      if (data) {
        setExistingCondition(data);
        setCondition({
          condition_type: data.condition_type,
          condition_color: data.condition_color,
          notes: data.notes || '',
          treatment_date: data.treatment_date || new Date().toISOString().split('T')[0]
        });
      } else {
        setExistingCondition(null);
        setCondition({
          condition_type: 'healthy',
          condition_color: '#FFFFFF',
          notes: '',
          treatment_date: new Date().toISOString().split('T')[0]
        });
      }
    } catch (error) {
      console.error('Error fetching tooth condition:', error);
    }
  };

  const handleConditionTypeChange = (value: string) => {
    const conditionType = conditionTypes.find(t => t.value === value);
    setCondition(prev => ({
      ...prev,
      condition_type: value,
      condition_color: conditionType?.color || '#FFFFFF'
    }));
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    setLoading(true);
    try {
      // Get clinic_id from user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast.error('خطأ في الحصول على معلومات العيادة');
        return;
      }

      const conditionData = {
        patient_id: patientId,
        clinic_id: profile.id,
        tooth_number: toothNumber,
        numbering_system: numberingSystem,
        condition_type: condition.condition_type,
        condition_color: condition.condition_color,
        notes: condition.notes.trim() || null,
        treatment_date: condition.treatment_date || null
      };

      if (existingCondition) {
        // Update existing condition
        const { error } = await supabase
          .from('tooth_conditions')
          .update(conditionData)
          .eq('id', existingCondition.id);

        if (error) throw error;
        toast.success('تم تحديث حالة السن بنجاح');
      } else {
        // Create new condition
        const { error } = await supabase
          .from('tooth_conditions')
          .insert(conditionData);

        if (error) throw error;
        toast.success('تم حفظ حالة السن بنجاح');
      }

      onConditionUpdate?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving tooth condition:', error);
      toast.error('حدث خطأ في حفظ حالة السن');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingCondition) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tooth_conditions')
        .delete()
        .eq('id', existingCondition.id);

      if (error) throw error;

      toast.success('تم حذف حالة السن بنجاح');
      onConditionUpdate?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error deleting tooth condition:', error);
      toast.error('حدث خطأ في حذف حالة السن');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>حالة السن رقم {toothNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tooth Preview */}
          <div className="flex justify-center">
            <div 
              className="w-16 h-16 rounded-lg border-2 border-gray-300 flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: condition.condition_color }}
            >
              {toothNumber}
            </div>
          </div>

          {/* Condition Type */}
          <div className="space-y-2">
            <Label htmlFor="condition-type">حالة السن</Label>
            <Select value={condition.condition_type} onValueChange={handleConditionTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="اختر حالة السن" />
              </SelectTrigger>
              <SelectContent>
                {conditionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: type.color }}
                      />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Color */}
          <div className="space-y-2">
            <Label htmlFor="color">لون مخصص</Label>
            <Input
              type="color"
              value={condition.condition_color}
              onChange={(e) => setCondition(prev => ({ ...prev, condition_color: e.target.value }))}
              className="h-10"
            />
          </div>

          {/* Treatment Date */}
          <div className="space-y-2">
            <Label htmlFor="treatment-date">تاريخ العلاج</Label>
            <Input
              type="date"
              value={condition.treatment_date}
              onChange={(e) => setCondition(prev => ({ ...prev, treatment_date: e.target.value }))}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              value={condition.notes}
              onChange={(e) => setCondition(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="أضف ملاحظات حول حالة السن..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          {existingCondition && (
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              حذف
            </Button>
          )}
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}