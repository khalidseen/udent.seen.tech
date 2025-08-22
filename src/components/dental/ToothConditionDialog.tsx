import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Trash2, Save } from "lucide-react";

interface ToothConditionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  toothNumber: string;
  onConditionUpdate: () => void;
}

interface ToothCondition {
  id?: string;
  condition_type: string;
  condition_color: string;
  notes: string;
  treatment_date: string;
}

const conditionTypes = [
  { value: 'healthy', label: 'صحي', color: '#ffffff' },
  { value: 'cavity', label: 'تسوس', color: '#ef4444' },
  { value: 'filling', label: 'حشوة', color: '#3b82f6' },
  { value: 'crown', label: 'تاج', color: '#eab308' },
  { value: 'missing', label: 'مفقود', color: '#6b7280' },
  { value: 'root_canal', label: 'علاج عصب', color: '#8b5cf6' },
  { value: 'implant', label: 'زراعة', color: '#10b981' },
  { value: 'bridge', label: 'جسر', color: '#f97316' },
  { value: 'extraction_needed', label: 'يحتاج خلع', color: '#dc2626' },
  { value: 'under_treatment', label: 'تحت العلاج', color: '#06b6d4' }
];

const ToothConditionDialog = ({
  open,
  onOpenChange,
  patientId,
  toothNumber,
  onConditionUpdate
}: ToothConditionDialogProps) => {
  const [condition, setCondition] = useState<ToothCondition>({
    condition_type: 'healthy',
    condition_color: '#ffffff',
    notes: '',
    treatment_date: new Date().toISOString().split('T')[0]
  });
  const [existingCondition, setExistingCondition] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open && toothNumber) {
      fetchExistingCondition();
    }
  }, [open, toothNumber, patientId]);

  const fetchExistingCondition = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tooth_conditions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('tooth_number', toothNumber)
        .eq('numbering_system', 'palmer')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setExistingCondition(data);
        setCondition({
          condition_type: data.condition_type || 'healthy',
          condition_color: data.condition_color || '#ffffff',
          notes: data.notes || '',
          treatment_date: data.treatment_date || new Date().toISOString().split('T')[0]
        });
      } else {
        // Reset to defaults for new condition
        setExistingCondition(null);
        setCondition({
          condition_type: 'healthy',
          condition_color: '#ffffff',
          notes: '',
          treatment_date: new Date().toISOString().split('T')[0]
        });
      }
    } catch (error) {
      console.error('Error fetching tooth condition:', error);
    }
  };

  const handleConditionTypeChange = (value: string) => {
    const conditionType = conditionTypes.find(type => type.value === value);
    setCondition(prev => ({
      ...prev,
      condition_type: value,
      condition_color: conditionType?.color || '#ffffff'
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const clinicId = user.id; // Assuming user.id is the clinic_id

      const conditionData = {
        patient_id: patientId,
        clinic_id: clinicId,
        tooth_number: toothNumber,
        numbering_system: 'palmer',
        condition_type: condition.condition_type,
        condition_color: condition.condition_color,
        notes: condition.notes || null,
        treatment_date: condition.treatment_date || null
      };

      let error;
      if (existingCondition) {
        // Update existing condition
        const { error: updateError } = await supabase
          .from('tooth_conditions')
          .update(conditionData)
          .eq('id', existingCondition.id);
        error = updateError;
      } else {
        // Create new condition
        const { error: insertError } = await supabase
          .from('tooth_conditions')
          .insert(conditionData);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم حفظ حالة السن بنجاح",
      });

      onConditionUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving tooth condition:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive",
      });
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

      toast({
        title: "تم بنجاح",
        description: "تم حذف حالة السن بنجاح",
      });

      onConditionUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting tooth condition:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>حالة السن: {toothNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tooth Preview */}
          <div className="flex justify-center">
            <div
              className="w-16 h-16 border-2 border-border rounded-lg flex items-center justify-center text-lg font-bold shadow-md"
              style={{ backgroundColor: condition.condition_color }}
            >
              {toothNumber.slice(2)} {/* Remove quadrant prefix for display */}
            </div>
          </div>

          {/* Condition Type */}
          <div className="space-y-2">
            <Label>حالة السن</Label>
            <Select value={condition.condition_type} onValueChange={handleConditionTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="اختر حالة السن" />
              </SelectTrigger>
              <SelectContent>
                {conditionTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border"
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
            <Label>لون مخصص</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={condition.condition_color}
                onChange={(e) => setCondition(prev => ({ ...prev, condition_color: e.target.value }))}
                className="w-16 h-10"
              />
              <Input
                value={condition.condition_color}
                onChange={(e) => setCondition(prev => ({ ...prev, condition_color: e.target.value }))}
                placeholder="#ffffff"
                className="flex-1"
              />
            </div>
          </div>

          {/* Treatment Date */}
          <div className="space-y-2">
            <Label>تاريخ العلاج</Label>
            <Input
              type="date"
              value={condition.treatment_date}
              onChange={(e) => setCondition(prev => ({ ...prev, treatment_date: e.target.value }))}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea
              value={condition.notes}
              onChange={(e) => setCondition(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="أي ملاحظات حول حالة السن..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <div>
              {existingCondition && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4 ml-1" />
                  حذف
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <Save className="w-4 h-4 ml-1" />
                حفظ
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ToothConditionDialog;