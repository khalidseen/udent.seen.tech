import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, Download } from "lucide-react";
import { CurrencyAmount } from "@/components/ui/currency-display";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

export function FinancialReports() {
  const [period, setPeriod] = useState<string>("current");

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['financial-reports', period],
    queryFn: async () => {
      const { data: profile } = await supabase.rpc('get_current_user_profile');
      if (!profile) throw new Error('Profile not found');

      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;

      switch (period) {
        case 'current':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last-month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'last-quarter':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const [invoicesRes, paymentsRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('*')
          .eq('clinic_id', profile.id)
          .gte('issue_date', startDate.toISOString())
          .lte('issue_date', endDate.toISOString()),
        supabase
          .from('payments')
          .select('*')
          .eq('clinic_id', profile.id)
          .gte('payment_date', startDate.toISOString())
          .lte('payment_date', endDate.toISOString()),
      ]);

      const invoices = invoicesRes.data || [];
      const payments = paymentsRes.data || [];

      // Fetch patient names for export
      const patientIds = [...new Set([
        ...invoices.map(i => i.patient_id),
        ...payments.map(p => p.patient_id),
      ])];
      const { data: patients } = patientIds.length > 0
        ? await supabase.from('patients').select('id, full_name').in('id', patientIds)
        : { data: [] };
      const patientMap = new Map((patients || []).map(p => [p.id, p.full_name] as const));

      const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
      const totalPaid = payments.filter(p => p.status === 'completed').reduce((sum, pay) => sum + Number(pay.amount || 0), 0);
      const totalPending = invoices.reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0);
      const overdueCount = invoices.filter(inv => inv.status !== 'paid' && new Date(inv.due_date) < now).length;

      // Payment method breakdown
      const methodBreakdown: Record<string, number> = {};
      payments.filter(p => p.status === 'completed').forEach(p => {
        methodBreakdown[p.payment_method] = (methodBreakdown[p.payment_method] || 0) + Number(p.amount || 0);
      });

      // Daily chart data
      const dailyMap = new Map<string, number>();
      payments.filter(p => p.status === 'completed').forEach(p => {
        const day = p.payment_date.split('T')[0];
        dailyMap.set(day, (dailyMap.get(day) || 0) + Number(p.amount || 0));
      });
      const dailyData = Array.from(dailyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-30)
        .map(([date, amount]) => ({
          date: new Date(date).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'short' }),
          amount,
        }));

      const periodLabel = `${startDate.toLocaleDateString('ar-IQ')} - ${endDate.toLocaleDateString('ar-IQ')}`;

      return {
        totalInvoiced, totalPaid, totalPending, overdueCount,
        invoicesCount: invoices.length,
        paymentsCount: payments.length,
        period: periodLabel,
        collectionRate: totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0,
        methodBreakdown,
        dailyData,
        // Raw data for export
        invoices: invoices.map(inv => ({ ...inv, patient_name: patientMap.get(inv.patient_id) || '' })),
        payments: payments.map(p => ({ ...p, patient_name: patientMap.get(p.patient_id) || '' })),
      };
    },
  });

  const methodLabels: Record<string, string> = {
    cash: 'نقداً', card: 'بطاقة', transfer: 'تحويل', check: 'شيك',
  };

  const exportCSV = (type: 'invoices' | 'payments') => {
    if (!reportData) return;

    let csv = '';
    if (type === 'invoices') {
      csv = 'رقم الفاتورة,المريض,تاريخ الإصدار,الاستحقاق,الإجمالي,المدفوع,المتبقي,الحالة\n';
      reportData.invoices.forEach((inv: any) => {
        csv += `${inv.invoice_number},${inv.patient_name},${inv.issue_date.split('T')[0]},${inv.due_date},${inv.total_amount},${inv.paid_amount},${inv.balance_due},${inv.status}\n`;
      });
    } else {
      csv = 'المريض,التاريخ,المبلغ,طريقة الدفع,الحالة,ملاحظات\n';
      reportData.payments.forEach((p: any) => {
        csv += `${p.patient_name},${p.payment_date.split('T')[0]},${p.amount},${methodLabels[p.payment_method] || p.payment_method},${p.status},${p.notes || ''}\n`;
      });
    }

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${type === 'invoices' ? 'فواتير' : 'مدفوعات'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('تم تصدير التقرير بنجاح');
  };

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <PermissionGuard requiredPermissions={['financial.view', 'reports.view', 'financial.manage']}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              إعدادات التقرير
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">الفترة</label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">الشهر الحالي</SelectItem>
                    <SelectItem value="last-month">الشهر الماضي</SelectItem>
                    <SelectItem value="last-quarter">الربع الأخير</SelectItem>
                    <SelectItem value="year">هذا العام</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button variant="outline" onClick={() => exportCSV('invoices')}>
                  <Download className="w-4 h-4 ml-1" /> تصدير الفواتير
                </Button>
                <Button variant="outline" onClick={() => exportCSV('payments')}>
                  <Download className="w-4 h-4 ml-1" /> تصدير المدفوعات
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">{reportData?.period}</div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">إجمالي الفواتير</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold"><CurrencyAmount amount={reportData?.totalInvoiced || 0} /></div>
              <p className="text-xs text-muted-foreground">{reportData?.invoicesCount} فاتورة</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">المدفوعات</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success"><CurrencyAmount amount={reportData?.totalPaid || 0} /></div>
              <p className="text-xs text-muted-foreground">{reportData?.paymentsCount} دفعة</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">المستحقة</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive"><CurrencyAmount amount={reportData?.totalPending || 0} /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">المتأخرة</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{reportData?.overdueCount || 0}</div>
              <p className="text-xs text-muted-foreground">فاتورة متأخرة</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">معدل التحصيل</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {(reportData?.collectionRate || 0).toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Method Breakdown */}
        {reportData?.methodBreakdown && Object.keys(reportData.methodBreakdown).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">توزيع طرق الدفع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(reportData.methodBreakdown).map(([method, amount]) => (
                  <div key={method} className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm font-medium">{methodLabels[method] || method}</p>
                    <p className="text-lg font-bold mt-1"><CurrencyAmount amount={amount as number} /></p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily Chart */}
        {reportData?.dailyData && reportData.dailyData.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">المدفوعات اليومية</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={reportData.dailyData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => [value.toLocaleString(), 'المبلغ']} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </PermissionGuard>
  );
}
