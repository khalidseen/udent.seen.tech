import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Receipt, Plus, FileText } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CurrencyAmount } from "@/components/ui/currency-display";

interface PatientFinancialsProps {
  patientId: string;
}

export function PatientFinancials({ patientId }: PatientFinancialsProps) {
  const { data: financialData, isLoading } = useQuery({
    queryKey: ['patient-financials', patientId],
    queryFn: async () => {
      const [invoicesResult, paymentsResult] = await Promise.all([
        supabase
          .from('invoices')
          .select('*')
          .eq('patient_id', patientId)
          .order('issue_date', { ascending: false }),
        supabase
          .from('payments')
          .select('*')
          .eq('patient_id', patientId)
          .order('payment_date', { ascending: false })
      ]);

      const totalInvoiced = invoicesResult.data?.reduce((sum, inv) => 
        sum + Number(inv.total_amount || 0), 0) || 0;
      const totalPaid = paymentsResult.data?.reduce((sum, pay) => 
        sum + Number(pay.amount || 0), 0) || 0;
      const totalBalance = invoicesResult.data?.reduce((sum, inv) => 
        sum + Number(inv.balance_due || 0), 0) || 0;

      return {
        invoices: invoicesResult.data || [],
        payments: paymentsResult.data || [],
        totalInvoiced,
        totalPaid,
        totalBalance,
      };
    },
  });

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getInvoiceStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'مدفوعة';
      case 'pending': return 'معلقة';
      case 'overdue': return 'متأخرة';
      case 'cancelled': return 'ملغاة';
      default: return status;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              إجمالي الفواتير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyAmount amount={financialData?.totalInvoiced || 0} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              المبالغ المدفوعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              <CurrencyAmount amount={financialData?.totalPaid || 0} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-red-600" />
              الرصيد المستحق
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              <CurrencyAmount amount={financialData?.totalBalance || 0} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">الفواتير</h3>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            فاتورة جديدة
          </Button>
        </div>

        {!financialData?.invoices || financialData.invoices.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">لا توجد فواتير</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {financialData.invoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          فاتورة: {invoice.invoice_number}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        تاريخ الإصدار: {format(new Date(invoice.issue_date), 'PPP', { locale: ar })}
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span>الإجمالي: {Number(invoice.total_amount).toFixed(2)} ريال</span>
                        <span>المدفوع: {Number(invoice.paid_amount).toFixed(2)} ريال</span>
                        <span className="text-red-600">
                          المتبقي: {Number(invoice.balance_due).toFixed(2)} ريال
                        </span>
                      </div>
                    </div>
                    <Badge className={getInvoiceStatusColor(invoice.status)}>
                      {getInvoiceStatusText(invoice.status)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Payments List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">المدفوعات</h3>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            تسجيل دفعة
          </Button>
        </div>

        {!financialData?.payments || financialData.payments.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">لا توجد مدفوعات مسجلة</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {financialData.payments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-600">
                          {Number(payment.amount).toFixed(2)} ريال
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(payment.payment_date), 'PPP', { locale: ar })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        طريقة الدفع: {payment.payment_method}
                      </div>
                    </div>
                    <Badge className="bg-green-500">مدفوعة</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
