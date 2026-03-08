import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Receipt, Plus, FileText, User } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CurrencyAmount } from "@/components/ui/currency-display";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { CreateInvoiceDialog } from "@/components/financial/CreateInvoiceDialog";
import { CreatePaymentDialog } from "@/components/financial/CreatePaymentDialog";

interface PatientFinancialsProps {
  patientId: string;
}

export function PatientFinancials({ patientId }: PatientFinancialsProps) {
  const navigate = useNavigate();
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showCreatePayment, setShowCreatePayment] = useState(false);

  const { data: financialData, isLoading } = useQuery({
    queryKey: ['patient-financials', patientId],
    queryFn: async () => {
      const [invoicesResult, paymentsResult] = await Promise.all([
        supabase.from('invoices').select('*').eq('patient_id', patientId).order('issue_date', { ascending: false }),
        supabase.from('payments').select('*').eq('patient_id', patientId).order('payment_date', { ascending: false }),
      ]);

      const totalInvoiced = invoicesResult.data?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;
      const totalPaid = paymentsResult.data?.reduce((sum, pay) => sum + Number(pay.amount || 0), 0) || 0;
      const totalBalance = invoicesResult.data?.reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0) || 0;

      return { invoices: invoicesResult.data || [], payments: paymentsResult.data || [], totalInvoiced, totalPaid, totalBalance };
    },
  });

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success/10 text-success border-success/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'overdue': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'cancelled': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) { case 'paid': return 'مدفوعة'; case 'pending': return 'معلقة'; case 'overdue': return 'متأخرة'; case 'cancelled': return 'ملغاة'; default: return status; }
  };

  const getMethodText = (method: string) => {
    switch (method) { case 'cash': return 'نقداً'; case 'card': return 'بطاقة'; case 'transfer': return 'تحويل'; case 'check': return 'شيك'; default: return method; }
  };

  if (isLoading) return <div className="text-center py-8">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Receipt className="h-4 w-4 text-primary" />إجمالي الفواتير</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold"><CurrencyAmount amount={financialData?.totalInvoiced || 0} /></div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><DollarSign className="h-4 w-4 text-success" />المدفوع</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-success"><CurrencyAmount amount={financialData?.totalPaid || 0} /></div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-destructive" />المستحق</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive"><CurrencyAmount amount={financialData?.totalBalance || 0} /></div></CardContent>
        </Card>
      </div>

      {/* Invoices */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">الفواتير</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate('/invoice-management')}>عرض الكل</Button>
            <Button size="sm" onClick={() => setShowCreateInvoice(true)}><Plus className="w-4 h-4 ml-1" />فاتورة جديدة</Button>
          </div>
        </div>

        {!financialData?.invoices.length ? (
          <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">لا توجد فواتير</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {financialData.invoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{invoice.invoice_number}</span>
                        <Badge className={getInvoiceStatusColor(invoice.status)}>{getStatusText(invoice.status)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{format(new Date(invoice.issue_date), 'PPP', { locale: ar })}</p>
                      <div className="flex gap-4 text-sm">
                        <span>الإجمالي: <CurrencyAmount amount={Number(invoice.total_amount)} /></span>
                        <span>المدفوع: <CurrencyAmount amount={Number(invoice.paid_amount)} /></span>
                        {Number(invoice.balance_due) > 0 && <span className="text-destructive">متبقي: <CurrencyAmount amount={Number(invoice.balance_due)} /></span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Payments */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">المدفوعات</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate('/payment-management')}>عرض الكل</Button>
            <Button size="sm" onClick={() => setShowCreatePayment(true)}><Plus className="w-4 h-4 ml-1" />تسجيل دفعة</Button>
          </div>
        </div>

        {!financialData?.payments.length ? (
          <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">لا توجد مدفوعات</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {financialData.payments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-success" />
                        <span className="font-medium text-success"><CurrencyAmount amount={Number(payment.amount)} /></span>
                        <Badge variant="outline">{getMethodText(payment.payment_method)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{format(new Date(payment.payment_date), 'PPP', { locale: ar })}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateInvoiceDialog open={showCreateInvoice} onOpenChange={setShowCreateInvoice} preselectedPatientId={patientId} />
      <CreatePaymentDialog open={showCreatePayment} onOpenChange={setShowCreatePayment} preselectedPatientId={patientId} />
    </div>
  );
}
