import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, TrendingDown, Filter, User, Receipt } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useState } from "react";
import { CurrencyAmount } from "@/components/ui/currency-display";
import { useNavigate } from "react-router-dom";

export default function PatientFinancialTransactions() {
  const navigate = useNavigate();
  const [filterPeriod, setFilterPeriod] = useState<string>("month");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['financial-transactions', filterPeriod],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
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

      // Fetch payments and invoices in parallel
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

      // Fetch patient names
      const allPatientIds = [...new Set([
        ...(paymentsRes.data?.map(p => p.patient_id) || []),
        ...(invoicesRes.data?.map(i => i.patient_id) || []),
      ])];
      const { data: patientsData } = await supabase
        .from('patients')
        .select('id, full_name')
        .in('id', allPatientIds.length > 0 ? allPatientIds : ['none']);
      const patientMap = new Map(patientsData?.map(p => [p.id, p.full_name]) || []);

      // Fetch invoice numbers for payments
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

      const totalIncome = paymentsWithNames.reduce((sum, t) => sum + Number(t.amount || 0), 0);
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
    switch (method) {
      case 'cash': return 'نقداً';
      case 'card': return 'بطاقة';
      case 'transfer': return 'تحويل';
      case 'check': return 'شيك';
      default: return method;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">سجل المعاملات المالية</h1>
          <p className="text-muted-foreground">تتبع شامل لجميع المعاملات المالية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/invoice-management')}>
            <Receipt className="ml-2 h-4 w-4" /> الفواتير
          </Button>
          <Button variant="outline" onClick={() => navigate('/payment-management')}>
            <DollarSign className="ml-2 h-4 w-4" /> المدفوعات
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" />المدفوعات المستلمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success"><CurrencyAmount amount={transactions?.stats.totalIncome || 0} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><Receipt className="h-4 w-4 text-blue-600" />الفواتير الصادرة</CardTitle>
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
            <CardTitle className="text-sm font-medium flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" />صافي الدخل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary"><CurrencyAmount amount={transactions?.stats.netIncome || 0} /></div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" />الفترة الزمنية</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">آخر أسبوع</SelectItem>
              <SelectItem value="month">آخر شهر</SelectItem>
              <SelectItem value="quarter">آخر 3 أشهر</SelectItem>
              <SelectItem value="year">آخر سنة</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

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
                        <button onClick={() => navigate(`/patient/${payment.patient_id}`)} className="font-medium text-primary hover:underline flex items-center gap-1">
                          <User className="h-3 w-3" /> {payment.patient_name}
                        </button>
                        <Badge variant="outline" className={getMethodColor(payment.payment_method)}>{getMethodText(payment.payment_method)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{format(new Date(payment.payment_date), 'PPP', { locale: ar })}</p>
                      {payment.invoice_number && (
                        <p className="text-xs text-muted-foreground">فاتورة: {payment.invoice_number}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-success shrink-0">
                    +<CurrencyAmount amount={Number(payment.amount)} />
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
