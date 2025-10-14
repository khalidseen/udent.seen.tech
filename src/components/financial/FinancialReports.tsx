import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, Download } from "lucide-react";

export function FinancialReports() {
  const [reportType, setReportType] = useState<string>("monthly");
  const [period, setPeriod] = useState<string>("current");

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['financial-reports', reportType, period],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // حساب تواريخ الفترة بناءً على الاختيار
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

      // جلب البيانات المالية
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('clinic_id', profile.id)
        .gte('issue_date', startDate.toISOString())
        .lte('issue_date', endDate.toISOString());

      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('clinic_id', profile.id)
        .gte('payment_date', startDate.toISOString())
        .lte('payment_date', endDate.toISOString());

      const totalInvoiced = invoices?.reduce((sum, inv) => 
        sum + Number(inv.total_amount || 0), 0) || 0;
      const totalPaid = payments?.reduce((sum, pay) => 
        sum + Number(pay.amount || 0), 0) || 0;
      const totalPending = invoices?.reduce((sum, inv) => 
        sum + Number(inv.balance_due || 0), 0) || 0;

      return {
        totalInvoiced,
        totalPaid,
        totalPending,
        invoicesCount: invoices?.length || 0,
        paymentsCount: payments?.length || 0,
        period: `من ${startDate.toLocaleDateString('ar-SA')} إلى ${endDate.toLocaleDateString('ar-SA')}`,
      };
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Report Filters */}
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
              <label className="text-sm font-medium mb-2 block">نوع التقرير</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">تقرير شهري</SelectItem>
                  <SelectItem value="quarterly">تقرير ربع سنوي</SelectItem>
                  <SelectItem value="yearly">تقرير سنوي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">الفترة</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">الفترة الحالية</SelectItem>
                  <SelectItem value="last-month">الشهر الماضي</SelectItem>
                  <SelectItem value="last-quarter">الربع الأخير</SelectItem>
                  <SelectItem value="year">هذا العام</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button className="w-full">
                <Download className="w-4 h-4 mr-2" />
                تصدير التقرير
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {reportData?.period}
          </div>
        </CardContent>
      </Card>

      {/* Report Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">إجمالي الفواتير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData?.totalInvoiced.toFixed(2)} ريال
            </div>
            <p className="text-xs text-muted-foreground">
              {reportData?.invoicesCount} فاتورة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">المدفوعات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reportData?.totalPaid.toFixed(2)} ريال
            </div>
            <p className="text-xs text-muted-foreground">
              {reportData?.paymentsCount} دفعة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">المبالغ المستحقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {reportData?.totalPending.toFixed(2)} ريال
            </div>
            <p className="text-xs text-muted-foreground">
              مبالغ معلقة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">معدل التحصيل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {reportData?.totalInvoiced 
                ? ((reportData.totalPaid / reportData.totalInvoiced) * 100).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              من الإجمالي
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
