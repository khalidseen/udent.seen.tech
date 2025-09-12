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

interface InvoiceItem {
  id: string;
  service_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface CreateInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceCreated: () => void;
}

export function CreateInvoiceDialog({ isOpen, onClose, onInvoiceCreated }: CreateInvoiceDialogProps) {
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name')
        .order('full_name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: servicePrices } = useQuery({
    queryKey: ['service-prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_prices')
        .select('*')
        .eq('is_active', true)
        .order('service_name');
      
      if (error) throw error;
      return data;
    }
  });

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      service_name: "",
      description: "",
      quantity: 1,
      unit_price: 0,
      line_total: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.line_total = updatedItem.quantity * updatedItem.unit_price;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const selectService = (itemId: string, serviceId: string) => {
    const service = servicePrices?.find(s => s.id === serviceId);
    if (service) {
      updateItem(itemId, 'service_name', service.service_name);
      updateItem(itemId, 'unit_price', Number(service.base_price));
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.line_total, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !dueDate || items.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة وإضافة عنصر واحد على الأقل",
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

      // Generate invoice number
      const { data: invoiceNumber, error: numberError } = await supabase
        .rpc('generate_invoice_number', { clinic_id_param: profile.id });

      if (numberError) throw numberError;

      // Create invoice
      const subtotal = calculateSubtotal();
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          clinic_id: profile.id,
          patient_id: selectedPatientId,
          invoice_number: invoiceNumber,
          due_date: dueDate,
          subtotal: subtotal,
          total_amount: subtotal,
          balance_due: subtotal,
          notes: notes || null
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const invoiceItems = items.map(item => ({
        invoice_id: invoice.id,
        service_name: item.service_name,
        description: item.description || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      onInvoiceCreated();
      onClose();
      resetForm();
      
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إنشاء الفاتورة",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedPatientId("");
    setDueDate("");
    setNotes("");
    setItems([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء فاتورة جديدة</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="patient">المريض</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المريض" />
                </SelectTrigger>
                <SelectContent>
                  {patients?.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="due_date">تاريخ الاستحقاق</Label>
              <Input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>عناصر الفاتورة</CardTitle>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="w-4 h-4 ml-2" />
                إضافة عنصر
              </Button>
            </CardHeader>
            <CardContent>
              {items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الخدمة</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>المجموع</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="space-y-2">
                            <Select onValueChange={(value) => selectService(item.id, value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر الخدمة" />
                              </SelectTrigger>
                              <SelectContent>
                                {servicePrices?.map((service) => (
                                  <SelectItem key={service.id} value={service.id}>
                                    {service.service_name} - ${Number(service.base_price).toFixed(2)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              value={item.service_name}
                              onChange={(e) => updateItem(item.id, 'service_name', e.target.value)}
                              placeholder="أو أدخل اسم الخدمة"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            placeholder="وصف الخدمة"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateItem(item.id, 'unit_price', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>${item.line_total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد عناصر. انقر "إضافة عنصر" لبدء إنشاء الفاتورة.
                </div>
              )}

              {items.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      المجموع الفرعي: ${calculateSubtotal().toFixed(2)}
                    </div>
                    <div className="text-xl font-bold">
                      المجموع الكلي: ${calculateSubtotal().toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : "إنشاء الفاتورة"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}