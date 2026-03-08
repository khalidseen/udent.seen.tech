import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CurrencyAmount } from "@/components/ui/currency-display";

interface OrderItem {
  id: string;
  supply_id?: string;
  supply_name: string;
  quantity: number;
  unit_cost: number;
  line_total: number;
}

interface CreatePurchaseOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

export function CreatePurchaseOrderDialog({ isOpen, onClose, onOrderCreated }: CreatePurchaseOrderDialogProps) {
  const [supplier, setSupplier] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: profile } = useQuery({
    queryKey: ['current-profile-po'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_current_user_profile');
      return data;
    }
  });

  const { data: supplies } = useQuery({
    queryKey: ['medical-supplies-list', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_supplies')
        .select('id, name, unit_cost, unit')
        .eq('clinic_id', profile!.id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  const addItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      supply_name: "",
      quantity: 1,
      unit_cost: 0,
      line_total: 0
    }]);
  };

  const removeItem = (id: string) => setItems(items.filter(item => item.id !== id));

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      const updatedItem = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unit_cost') {
        updatedItem.line_total = updatedItem.quantity * updatedItem.unit_cost;
      }
      return updatedItem;
    }));
  };

  const selectSupply = (itemId: string, supplyId: string) => {
    const supply = supplies?.find(s => s.id === supplyId);
    if (supply) {
      setItems(items.map(item => {
        if (item.id !== itemId) return item;
        const unitCost = Number(supply.unit_cost);
        return { ...item, supply_id: supplyId, supply_name: supply.name, unit_cost: unitCost, line_total: item.quantity * unitCost };
      }));
    }
  };

  const calculateTotal = () => items.reduce((sum, item) => sum + item.line_total, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier || items.length === 0) {
      toast({ title: "خطأ", description: "يرجى ملء الحقول المطلوبة وإضافة عنصر واحد على الأقل", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      if (!profile) throw new Error('لم يتم العثور على ملف المستخدم');

      const { data: orderNumber, error: numberError } = await supabase
        .rpc('generate_purchase_order_number', { clinic_id_param: profile.id });
      if (numberError) throw numberError;

      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .insert({
          clinic_id: profile.id,
          order_number: orderNumber,
          supplier,
          supplier_contact: supplierContact || null,
          expected_delivery: expectedDelivery || null,
          total_amount: calculateTotal(),
          notes: notes || null
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        purchase_order_id: order.id,
        supply_id: item.supply_id || null,
        supply_name: item.supply_name,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        line_total: item.line_total
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(orderItems);
      if (itemsError) throw itemsError;

      onOrderCreated();
      onClose();
      resetForm();
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "حدث خطأ أثناء إنشاء أمر الشراء", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSupplier(""); setSupplierContact(""); setExpectedDelivery(""); setNotes(""); setItems([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء أمر شراء جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>المورد *</Label>
              <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="اسم المورد" required />
            </div>
            <div>
              <Label>تواصل المورد</Label>
              <Input value={supplierContact} onChange={(e) => setSupplierContact(e.target.value)} placeholder="هاتف أو إيميل" />
            </div>
            <div>
              <Label>تاريخ التسليم المتوقع</Label>
              <Input type="date" value={expectedDelivery} onChange={(e) => setExpectedDelivery(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>ملاحظات</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات إضافية..." />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>عناصر أمر الشراء</CardTitle>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="w-4 h-4 ml-2" /> إضافة عنصر
              </Button>
            </CardHeader>
            <CardContent>
              {items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستلزم</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>المجموع</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="space-y-2">
                            <Select onValueChange={(v) => selectSupply(item.id, v)}>
                              <SelectTrigger><SelectValue placeholder="اختر المستلزم" /></SelectTrigger>
                              <SelectContent>
                                {supplies?.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.name} - <CurrencyAmount amount={Number(s.unit_cost)} />
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input value={item.supply_name} onChange={(e) => updateItem(item.id, 'supply_name', e.target.value)} placeholder="أو أدخل اسم المستلزم" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" min="0" step="0.01" value={item.unit_cost} onChange={(e) => updateItem(item.id, 'unit_cost', Number(e.target.value))} />
                        </TableCell>
                        <TableCell><CurrencyAmount amount={item.line_total} /></TableCell>
                        <TableCell>
                          <Button type="button" variant="outline" size="sm" onClick={() => removeItem(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد عناصر. انقر "إضافة عنصر" لبدء إنشاء أمر الشراء.
                </div>
              )}

              {items.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <div className="text-xl font-bold">
                    المجموع الكلي: <CurrencyAmount amount={calculateTotal()} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : "إنشاء أمر الشراء"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
