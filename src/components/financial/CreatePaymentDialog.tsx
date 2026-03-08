import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CurrencyAmount } from "@/components/ui/currency-display";

interface CreatePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedPatientId?: string;
  preselectedInvoiceId?: string;
}

export function CreatePaymentDialog({ open, onOpenChange, preselectedPatientId, preselectedInvoiceId }: CreatePaymentDialogProps) {
  const queryClient = useQueryClient();
  const [patientId, setPatientId] = useState(preselectedPatientId || "");
  const [invoiceId, setInvoiceId] = useState(preselectedInvoiceId || "");
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  const { data: patients } = useQuery({
    queryKey: ['patients-for-payment'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      if (!profile) return [];
      const { data } = await supabase
        .from('patients')
        .select('id, full_name')
        .eq('clinic_id', profile.id)
        .eq('patient_status', 'active')
        .order('full_name');
      return data || [];
    },
    enabled: open,
  });

  const { data: pendingInvoices } = useQuery({
    queryKey: ['pending-invoices-for-payment', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data } = await supabase
        .from('invoices')
        .select('id, invoice_number, balance_due, total_amount')
        .eq('patient_id', patientId)
        .gt('balance_due', 0)
        .neq('status', 'paid')
        .order('issue_date', { ascending: false });
      return data || [];
    },
    enabled: !!patientId && open,
  });

  const selectedInvoice = pendingInvoices?.find(i => i.id === invoiceId);

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('payments')
        .insert({
          clinic_id: profile.id,
          patient_id: patientId,
          invoice_id: invoiceId || null,
          amount,
          payment_method: paymentMethod,
          payment_date: new Date().toISOString(),
          status: 'completed',
          notes,
          reference_number: referenceNumber || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم تسجيل الدفعة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard-stats'] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('فشل في تسجيل الدفعة: ' + error.message);
    },
  });

  const resetForm = () => {
    setPatientId(preselectedPatientId || "");
    setInvoiceId(preselectedInvoiceId || "");
    setAmount(0);
    setPaymentMethod("cash");
    setNotes("");
    setReferenceNumber("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>المريض *</Label>
            <Select value={patientId} onValueChange={(v) => { setPatientId(v); setInvoiceId(""); }}>
              <SelectTrigger><SelectValue placeholder="اختر المريض" /></SelectTrigger>
              <SelectContent>
                {patients?.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {patientId && pendingInvoices && pendingInvoices.length > 0 && (
            <div>
              <Label>ربط بفاتورة (اختياري)</Label>
              <Select value={invoiceId} onValueChange={setInvoiceId}>
                <SelectTrigger><SelectValue placeholder="اختر فاتورة" /></SelectTrigger>
                <SelectContent>
                  {pendingInvoices.map(inv => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoice_number} - متبقي: {Number(inv.balance_due).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedInvoice && (
                <p className="text-xs text-muted-foreground mt-1">
                  المبلغ المتبقي: <CurrencyAmount amount={Number(selectedInvoice.balance_due)} />
                </p>
              )}
            </div>
          )}

          <div>
            <Label>المبلغ *</Label>
            <Input
              type="number"
              min={0}
              value={amount}
              onChange={e => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div>
            <Label>طريقة الدفع</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">نقداً</SelectItem>
                <SelectItem value="card">بطاقة ائتمان</SelectItem>
                <SelectItem value="transfer">تحويل بنكي</SelectItem>
                <SelectItem value="check">شيك</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMethod !== 'cash' && (
            <div>
              <Label>رقم المرجع</Label>
              <Input value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} placeholder="رقم العملية أو الشيك" />
            </div>
          )}

          <div>
            <Label>ملاحظات</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات..." />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button
              onClick={() => createPaymentMutation.mutate()}
              disabled={!patientId || amount <= 0 || createPaymentMutation.isPending}
            >
              {createPaymentMutation.isPending ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
