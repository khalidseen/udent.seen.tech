import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, TrendingDown, Filter, User, Download } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useState } from "react";
import { CurrencyAmount } from "@/components/ui/currency-display";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function FinancialTransactions() {
  const navigate = useNavigate();
  const [filterPeriod, setFilterPeriod] = useState<string>("month");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['financial-transactions', filterPeriod],
    queryFn: async () => {
      const { data: profile } = await supabase.rpc('get_current_user_profile');
      if (!profile) throw new Error('Profile not found');

      const now = new Date();
      let startDate: Date;
      switch (filterPeriod) {
        case 'week': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
        case 'month': startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); break;
        case 'quarter': startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()); break;
        case 'year': startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
        default: startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      }

      const [paymentsRes, invoicesRes] = await Promise.all([
        supabase
          .from('payments')
          .select('*')
          .eq('clinic_id', profile.id)
          .gte('payment_date', startDate.toISOString())
          .order('payment_date', { ascending: false }),
        supabase
          .from('invoices')
          .select('*')
          .eq('clinic_id', profile.id)
          .gte('issue_date', startDate.toISOString())
          .order('issue_date', { ascending: false }),
      ]);

      const allPatientIds = [...new Set([
        ...(paymentsRes.data?.map(p => p.patient_id) || []),
        ...(invoicesRes.data?.map(i => i.patient_id) || []),
      ])];
      const { data: patientsData } = await supabase
        .from('patients')
        .select('id, full_name')
        .in('id', allPatientIds.length > 0 ? allPatientIds : ['none']);
      const patientMap = new Map(patientsData?.map(p => [p.id, p.full_name]) || []);

      const invoiceIds = [...new Set(paymentsRes.data?.filter(p => p.invoice_id).map(p => p.invoice_id!) || [])];
      const { data: invoiceNames } = invoiceIds.length > 0
        ? await supabase.from('invoices').select('id, invoice_number').in('id', invoiceIds)
        : { data: [] as any[] };
      const invoiceMap = new Map<string, string>();
      invoiceNames?.forEach((i: any) => invoiceMap.set(i.id, i.invoice_number));

      const paymentsWithNames = (paymentsRes.data || []).map(p => ({
        ...p,
        patient_name: patientMap.get(p.patient_id) || 'غير محدد',
        invoice_number: p.invoice_id ? invoiceMap.get(p.invoice_id) || null : null,
      }));
      const invoices = invoicesRes.data || [];

      const totalIncome = paymentsWithNames.filter(t => t.status === 'completed').reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
      const totalOutstanding = invoices.reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0);
      const totalRefunds = paymentsWithNames.filter(t => t.status === 'refunded').reduce((s, t) => s + Number(t.amount || 0), 0);

      return {
        payments: paymentsWithNames,
        invoices,
        stats: { totalIncome, totalInvoiced, totalOutstanding, totalRefunds, netIncome: totalIncome - totalRefunds }
      };
    },
  });

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'bg-success/10 text-success';
      case 'card': return 'bg-blue-500/10 text-blue-600';
      case 'transfer': return 'bg-purple-500/10 text-purple-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getMethodText = (method: string) => {
    const map: Record<string, string> = { cash: 'نقداً', card: 'بطاقة', transfer: 'تحويل', check: 'شيك' };
    return map[method] || method;
  };

  const exportCSV = () => {
    if (!transactions?.payments) return;
    const BOM = '\uFEFF';
    let csv = 'المريض,التاريخ,المبلغ,طريقة الدفع,الحالة,رقم الفاتورة\n';
    transactions.payments.forEach((p: any) => {
      csv += `${p.patient_name},${p.payment_date.split('T')[0]},${p.amount},${getMethodText(p.payment_method)},${p.status},${p.invoice_number || ''}\n`;
    });
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `سجل_المعاملات_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('تم التصدير بنجاح');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" />المدفوعات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success"><CurrencyAmount amount={transactions?.stats.totalIncome || 0} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><DollarSign className="h-4 w-4 text-blue-600" />الفواتير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600"><CurrencyAmount amount={transactions?.stats.totalInvoiced || 0} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingDown className="h-4 w-4 text-destructive" />المستحقات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive"><CurrencyAmount amount={transactions?.stats.totalOutstanding || 0} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-600">المرتجعات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600"><CurrencyAmount amount={transactions?.stats.totalRefunds || 0} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" />صافي الدخل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary"><CurrencyAmount amount={transactions?.stats.netIncome || 0} /></div>
          </CardContent>
        </Card>
      </div>

      {/* Filter + Export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">آخر أسبوع</SelectItem>
              <SelectItem value="month">آخر شهر</SelectItem>
              <SelectItem value="quarter">آخر 3 أشهر</SelectItem>
              <SelectItem value="year">آخر سنة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="ml-1 h-4 w-4" /> تصدير CSV
        </Button>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>المدفوعات ({transactions?.payments.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!transactions?.payments.length ? (
            <p className="text-center text-muted-foreground py-8">لا توجد معاملات في الفترة المحددة</p>
          ) : (
            <div className="space-y-3">
              {transactions.payments.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`p-2 rounded-full ${getMethodColor(payment.payment_method)}`}>
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => navigate(`/patients/${payment.patient_id}`)} className="font-medium text-primary hover:underline flex items-center gap-1">
                          <User className="h-3 w-3" /> {payment.patient_name}
                        </button>
                        <Badge variant="outline" className={getMethodColor(payment.payment_method)}>{getMethodText(payment.payment_method)}</Badge>
                        {payment.status === 'refunded' && (
                          <Badge variant="outline" className="bg-orange-500/10 text-orange-600">مُرتجعة</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{format(new Date(payment.payment_date), 'PPP', { locale: ar })}</p>
                      {payment.invoice_number && (
                        <p className="text-xs text-muted-foreground">فاتورة: {payment.invoice_number}</p>
                      )}
                    </div>
                  </div>
                  <div className={`text-lg font-bold shrink-0 ${payment.status === 'refunded' ? 'text-orange-600' : 'text-success'}`}>
                    {payment.status === 'refunded' ? '-' : '+'}<CurrencyAmount amount={Number(payment.amount)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
