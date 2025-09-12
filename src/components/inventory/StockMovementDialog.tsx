import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Supply {
  id: string;
  name: string;
  current_stock: number;
  unit: string;
}

interface StockMovementDialogProps {
  supply: Supply;
  isOpen: boolean;
  onClose: () => void;
  onMovementRecorded: () => void;
}

export function StockMovementDialog({ supply, isOpen, onClose, onMovementRecorded }: StockMovementDialogProps) {
  const [movementType, setMovementType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [quantity, setQuantity] = useState(1);
  const [referenceType, setReferenceType] = useState('');
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const getMovementTypeText = (type: string) => {
    switch (type) {
      case 'in': return 'إدخال';
      case 'out': return 'إخراج';
      case 'adjustment': return 'تعديل';
      default: return type;
    }
  };

  const getReferenceTypeText = (type: string) => {
    switch (type) {
      case 'purchase': return 'شراء';
      case 'usage': return 'استخدام';
      case 'waste': return 'تالف';
      case 'adjustment': return 'تعديل';
      default: return type;
    }
  };

  const calculateNewStock = () => {
    switch (movementType) {
      case 'in':
        return supply.current_stock + quantity;
      case 'out':
        return supply.current_stock - quantity;
      case 'adjustment':
        return quantity; // In adjustment, quantity is the new total stock
      default:
        return supply.current_stock;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (movementType === 'out' && quantity > supply.current_stock) {
      toast({
        title: "خطأ",
        description: "لا يمكن إخراج كمية أكبر من المخزون المتاح",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user profile for clinic_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .single();

      if (!profile) throw new Error('لم يتم العثور على ملف المستخدم');

      // Calculate the actual quantity change for the movement
      let actualQuantity = quantity;
      if (movementType === 'adjustment') {
        actualQuantity = quantity - supply.current_stock;
      } else if (movementType === 'out') {
        actualQuantity = -quantity;
      }

      // Record the stock movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          clinic_id: profile.id,
          supply_id: supply.id,
          movement_type: movementType,
          quantity: actualQuantity,
          reference_type: referenceType || null,
          notes: notes || null,
          created_by: profile.id
        });

      if (movementError) throw movementError;

      // Update the supply's current stock
      const newStock = calculateNewStock();
      const { error: updateError } = await supabase
        .from('medical_supplies')
        .update({ current_stock: newStock })
        .eq('id', supply.id);

      if (updateError) throw updateError;

      onMovementRecorded();
      onClose();
      resetForm();
      
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تسجيل الحركة",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setMovementType('in');
    setQuantity(1);
    setReferenceType('');
    setNotes("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>حركة مخزون - {supply.name}</DialogTitle>
        </DialogHeader>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">معلومات المستلزم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">المخزون الحالي:</span>
                <span className="font-medium">{supply.current_stock} {supply.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المخزون بعد الحركة:</span>
                <span className="font-medium">{calculateNewStock()} {supply.unit}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="movementType">نوع الحركة</Label>
            <Select value={movementType} onValueChange={(value: any) => setMovementType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع الحركة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">إدخال</SelectItem>
                <SelectItem value="out">إخراج</SelectItem>
                <SelectItem value="adjustment">تعديل</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity">
              {movementType === 'adjustment' ? 'المخزون الجديد' : 'الكمية'}
            </Label>
            <Input
              id="quantity"
              type="number"
              min={movementType === 'adjustment' ? "0" : "1"}
              max={movementType === 'out' ? supply.current_stock : undefined}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <Label htmlFor="referenceType">نوع المرجع</Label>
            <Select value={referenceType} onValueChange={setReferenceType}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع المرجع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="purchase">شراء</SelectItem>
                <SelectItem value="usage">استخدام</SelectItem>
                <SelectItem value="waste">تالف</SelectItem>
                <SelectItem value="adjustment">تعديل</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات إضافية..."
            />
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : "تسجيل الحركة"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}