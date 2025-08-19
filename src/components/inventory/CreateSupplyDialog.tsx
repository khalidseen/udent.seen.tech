import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateSupplyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSupplyCreated: () => void;
}

export function CreateSupplyDialog({ isOpen, onClose, onSupplyCreated }: CreateSupplyDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [unit, setUnit] = useState("piece");
  const [currentStock, setCurrentStock] = useState(0);
  const [minimumStock, setMinimumStock] = useState(10);
  const [unitCost, setUnitCost] = useState(0);
  const [supplier, setSupplier] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category) {
      toast({
        title: "خطأ",
        description: "يرجى ملء الحقول المطلوبة",
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

      const { error } = await supabase
        .from('medical_supplies')
        .insert({
          clinic_id: profile.id,
          name,
          category,
          brand: brand || null,
          unit,
          current_stock: currentStock,
          minimum_stock: minimumStock,
          unit_cost: unitCost,
          supplier: supplier || null,
          supplier_contact: supplierContact || null,
          expiry_date: expiryDate || null,
          batch_number: batchNumber || null,
          notes: notes || null
        });

      if (error) throw error;

      onSupplyCreated();
      onClose();
      resetForm();
      
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إضافة المستلزم",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setCategory("");
    setBrand("");
    setUnit("piece");
    setCurrentStock(0);
    setMinimumStock(10);
    setUnitCost(0);
    setSupplier("");
    setSupplierContact("");
    setExpiryDate("");
    setBatchNumber("");
    setNotes("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إضافة مستلزم طبي جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">اسم المستلزم *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسم المستلزم"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">الفئة *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instruments">أدوات</SelectItem>
                  <SelectItem value="materials">مواد</SelectItem>
                  <SelectItem value="medications">أدوية</SelectItem>
                  <SelectItem value="disposables">مستهلكات</SelectItem>
                  <SelectItem value="equipment">معدات</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="brand">الماركة</Label>
              <Input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="الماركة"
              />
            </div>

            <div>
              <Label htmlFor="unit">الوحدة</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوحدة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="piece">قطعة</SelectItem>
                  <SelectItem value="box">علبة</SelectItem>
                  <SelectItem value="pack">عبوة</SelectItem>
                  <SelectItem value="bottle">زجاجة</SelectItem>
                  <SelectItem value="kg">كيلوجرام</SelectItem>
                  <SelectItem value="liter">لتر</SelectItem>
                  <SelectItem value="meter">متر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="currentStock">المخزون الحالي</Label>
              <Input
                id="currentStock"
                type="number"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(Number(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="minimumStock">الحد الأدنى للمخزون</Label>
              <Input
                id="minimumStock"
                type="number"
                min="0"
                value={minimumStock}
                onChange={(e) => setMinimumStock(Number(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="unitCost">تكلفة الوحدة ($)</Label>
              <Input
                id="unitCost"
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(Number(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="expiryDate">تاريخ الانتهاء</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="supplier">المورد</Label>
              <Input
                id="supplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="اسم المورد"
              />
            </div>

            <div>
              <Label htmlFor="supplierContact">تواصل المورد</Label>
              <Input
                id="supplierContact"
                value={supplierContact}
                onChange={(e) => setSupplierContact(e.target.value)}
                placeholder="هاتف أو إيميل المورد"
              />
            </div>

            <div>
              <Label htmlFor="batchNumber">رقم الدفعة</Label>
              <Input
                id="batchNumber"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="رقم الدفعة"
              />
            </div>
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
              {isSubmitting ? "جاري الحفظ..." : "إضافة المستلزم"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}