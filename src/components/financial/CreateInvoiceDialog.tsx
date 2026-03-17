import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedPatientId?: string;
}

interface InvoiceItem {
  service_name: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export function CreateInvoiceDialog({ open, onOpenChange, preselectedPatientId }: CreateInvoiceDialogProps) {
  const queryClient = useQueryClient();
  const [patientId, setPatientId] = useState(preselectedPatientId || "");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [items, setItems] = useState<InvoiceItem[]>([
    { service_name: "", description: "", quantity: 1, unit_price: 0 }
  ]);

  useEffect(() => {
    if (preselectedPatientId) setPatientId(preselectedPatientId);
  }, [preselectedPatientId]);

  const { data: profile } = useQuery({
    queryKey: ['current-profile-for-invoice'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_current_user_profile');
      return data;
    },
    enabled: open,
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-for-invoice', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data } = await supabase
        .from('patients')
        .select('id, full_name')
        .eq('clinic_id', profile.id)
        .eq('patient_status', 'active')
        .order('full_name');
      return data || [];
    },
    enabled: open && !!profile,
  });

  // Fetch service prices for quick-add
  const { data: servicePrices } = useQuery({
    queryKey: ['service-prices-for-invoice', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data } = await supabase
        .from('service_prices')
        .select('id, service_name, base_price, service_category')
        .eq('clinic_id', profile.id)
        .eq('is_active', true)
        .order('service_category')
        .order('service_name');
      return data || [];
    },
    enabled: open && !!profile,
  });

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const discountAmount = subtotal * (discountPercentage / 100);
  const taxAmount = (subtotal - discountAmount) * (taxPercentage / 100);
  const totalAmount = subtotal - discountAmount + taxAmount;

  const invalidateAllFinancialQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    queryClient.invalidateQueries({ queryKey: ['payments'] });
    queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    queryClient.invalidateQueries({ queryKey: ['financial-dashboard-stats'] });
    queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['financial-reports'] });
    queryClient.invalidateQueries({ queryKey: ['pending-invoices'] });
    queryClient.invalidateQueries({ queryKey: ['recent-invoices'] });
    queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
    queryClient.invalidateQueries({ queryKey: ['treatment-plans-financial'] });
  };

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error('Profile not found');
      if (!patientId) throw new Error('Patient is required');

      // Clinical rule: prevent invoice creation before linking to a completed
      // clinical encounter (completed appointment or treatment record).
      const [appointmentsRes, treatmentsRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', profile.id)
          .eq('patient_id', patientId)
          .eq('status', 'completed'),
        supabase
          .from('dental_treatments')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', profile.id)
          .eq('patient_id', patientId),
      ]);

      if (appointmentsRes.error) throw appointmentsRes.error;
      if (treatmentsRes.error) throw treatmentsRes.error;

      const hasClinicalLink = (appointmentsRes.count || 0) > 0 || (treatmentsRes.count || 0) > 0;
      if (!hasClinicalLink) {
        throw new Error('لا يمكن إنشاء فاتورة قبل تسجيل جلسة مكتملة أو علاج موثق للمريض');
      }

      // Generate invoice number
      const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number', {
        clinic_id_param: profile.id
      });

      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
          clinic_id: profile.id,
          patient_id: patientId,
          invoice_number: invoiceNumber || `INV-${Date.now()}`,
          issue_date: new Date().toISOString(),
          due_date: dueDate,
          subtotal,
          discount_percentage: discountPercentage,
          discount_amount: discountAmount,
          tax_percentage: taxPercentage,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          balance_due: totalAmount,
          paid_amount: 0,
          status: 'pending',
          notes,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert invoice items
      const invoiceItems = items.filter(i => i.service_name).map(item => ({
        invoice_id: invoice.id,
        service_name: item.service_name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.quantity * item.unit_price,
      }));

      if (invoiceItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(invoiceItems);
        if (itemsError) throw itemsError;
      }

      return invoice;
    },
    onSuccess: () => {
      toast.success('تم إنشاء الفاتورة بنجاح');
      invalidateAllFinancialQueries();
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('فشل في إنشاء الفاتورة: ' + error.message);
    },
  });

  const resetForm = () => {
    setPatientId(preselectedPatientId || "");
    setDueDate("");
    setNotes("");
    setDiscountPercentage(0);
    setTaxPercentage(0);
    setItems([{ service_name: "", description: "", quantity: 1, unit_price: 0 }]);
  };

  const addItem = () => {
    setItems([...items, { service_name: "", description: "", quantity: 1, unit_price: 0 }]);
  };

  const addServiceItem = (service: { service_name: string; base_price: number }) => {
    setItems([...items.filter(i => i.service_name), {
      service_name: service.service_name,
      description: "",
      quantity: 1,
      unit_price: Number(service.base_price),
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء فاتورة جديدة</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>المريض *</Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger><SelectValue placeholder="اختر المريض" /></SelectTrigger>
                <SelectContent>
                  {patients?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>تاريخ الاستحقاق *</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>

          {/* Quick Add from Service Prices */}
          {servicePrices && servicePrices.length > 0 && (
            <div>
              <Label className="text-sm font-semibold">إضافة سريعة من أسعار الخدمات</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {servicePrices.map(sp => (
                  <Button
                    key={sp.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => addServiceItem(sp)}
                  >
                    {sp.service_name} ({Number(sp.base_price).toLocaleString()})
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">بنود الفاتورة</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 ml-1" /> إضافة بند
              </Button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end border rounded-lg p-3">
                <div className="col-span-4">
                  <Label className="text-xs">الخدمة</Label>
                  <Input value={item.service_name} onChange={e => updateItem(idx, 'service_name', e.target.value)} placeholder="اسم الخدمة" />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">الوصف</Label>
                  <Input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="وصف" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">الكمية</Label>
                  <Input type="number" min={1} value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">السعر</Label>
                  <Input type="number" min={0} value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="col-span-1">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)} disabled={items.length === 1}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>نسبة الخصم %</Label>
              <Input type="number" min={0} max={100} value={discountPercentage} onChange={e => setDiscountPercentage(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>نسبة الضريبة %</Label>
              <Input type="number" min={0} max={100} value={taxPercentage} onChange={e => setTaxPercentage(parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>المجموع الفرعي:</span><span>{subtotal.toLocaleString()}</span></div>
            {discountAmount > 0 && <div className="flex justify-between text-destructive"><span>الخصم ({discountPercentage}%):</span><span>-{discountAmount.toLocaleString()}</span></div>}
            {taxAmount > 0 && <div className="flex justify-between"><span>الضريبة ({taxPercentage}%):</span><span>+{taxAmount.toLocaleString()}</span></div>}
            <div className="flex justify-between font-bold text-lg border-t pt-2"><span>الإجمالي:</span><span>{totalAmount.toLocaleString()}</span></div>
          </div>

          <div>
            <Label>ملاحظات</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات إضافية..." />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button
              onClick={() => createInvoiceMutation.mutate()}
              disabled={!patientId || !dueDate || items.every(i => !i.service_name) || createInvoiceMutation.isPending}
            >
              {createInvoiceMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الفاتورة'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}