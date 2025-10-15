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
import { CurrencyAmount } from "@/components/ui/currency-display";

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  patients: {
    full_name: string;
  } | null;
}

interface RecordPaymentDialogProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onPaymentRecorded: () => void;
}

export function RecordPaymentDialog({ invoice, isOpen, onClose, onPaymentRecorded }: RecordPaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const paymentMethods = [
    { value: "cash", label: "نقدي" },
    { value: "check", label: "شيك" },
    { value: "bank_transfer", label: "تحويل بنكي" },
    { value: "credit_card", label: "بطاقة ائتمان" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مبلغ صحيح",
        variant: "destructive"
      });
      return;
    }

    if (paymentAmount > invoice.balance_due) {
      toast({
        title: "خطأ",
        description: "لا يمكن أن يكون المبلغ المدفوع أكبر من الرصيد المستحق",
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

      // Record payment
      const { error } = await supabase
        .from('payments')
        .insert({
          clinic_id: profile.id,
          invoice_id: invoice.id,
          patient_id: invoice.patients ? invoice.patients.full_name : '', // This will need patient_id lookup
          amount: paymentAmount,
          payment_method: paymentMethod,
          payment_date: paymentDate,
          reference_number: referenceNumber || null,
          notes: notes || null,
          status: 'completed'
        });

      if (error) throw error;

      onPaymentRecorded();
      onClose();
      resetForm();
      
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تسجيل الدفعة",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAmount("");
    setPaymentMethod("cash");
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setReferenceNumber("");
    setNotes("");
  };

  const suggestFullPayment = () => {
    setAmount(invoice.balance_due.toString());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تسجيل دفعة - {invoice.invoice_number}</DialogTitle>
        </DialogHeader>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">تفاصيل الفاتورة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>المريض:</span>
              <span>{invoice.patients?.full_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>المجموع الكلي:</span>
              <span><CurrencyAmount amount={Number(invoice.total_amount)} /></span>
            </div>
            <div className="flex justify-between text-sm text-success">
              <span>المبلغ المدفوع:</span>
              <span><CurrencyAmount amount={Number(invoice.paid_amount)} /></span>
            </div>
            <div className="flex justify-between text-sm text-warning font-medium">
              <span>الرصيد المستحق:</span>
              <span><CurrencyAmount amount={Number(invoice.balance_due)} /></span>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">المبلغ المدفوع</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={invoice.balance_due}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={suggestFullPayment}
                size="sm"
              >
                دفع كامل
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="payment_method">طريقة الدفع</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="payment_date">تاريخ الدفع</Label>
            <Input
              id="payment_date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>

          {paymentMethod !== 'cash' && (
            <div>
              <Label htmlFor="reference_number">رقم المرجع</Label>
              <Input
                id="reference_number"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="رقم الشيك، رقم التحويل، إلخ..."
              />
            </div>
          )}

          <div>
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات إضافية..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : "تسجيل الدفعة"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}