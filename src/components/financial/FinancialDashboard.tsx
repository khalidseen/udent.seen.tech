import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, Receipt, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { CurrencyAmount } from "@/components/ui/currency-display";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const METHOD_COLORS = {
  cash: 'hsl(var(--success))',
  card: 'hsl(210, 80%, 55%)',
  transfer: 'hsl(270, 60%, 55%)',
  check: 'hsl(30, 80%, 55%)',
};

const METHOD_LABELS: Record<string, string> = {
  cash: 'نقداً',
  card: 'بطاقة',
  transfer: 'تحويل',
  check: 'شيك',
};

export function FinancialDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['financial-dashboard-stats'],
    queryFn: async () => {
      const { data: profile } = await supabase.rpc('get_current_user_profile');
      if (!profile) throw new Error('Profile not found');

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const [invoicesResult, paymentsResult, patientsResult, lastMonthPayments, recentPayments] = await Promise.all([
        supabase
          .from('invoices')
          .select('total_amount, paid_amount, balance_due, status, issue_date')
          .eq('clinic_id', profile.id),
        supabase
          .from('payments')
          .select('amount, payment_method, payment_date')
          .eq('clinic_id', profile.id)
          .eq('status', 'completed')
          .gte('payment_date', thisMonthStart.toISOString()),
        supabase
          .from('patients')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', profile.id),
        supabase
          .from('payments')
          .select('amount')
          .eq('clinic_id', profile.id)
          .eq('status', 'completed')
          .gte('payment_date', lastMonthStart.toISOString())
          .lte('payment_date', lastMonthEnd.toISOString()),
        supabase
          .from('payments')
          .select('amount, payment_method, payment_date, patient_id')
          .eq('clinic_id', profile.id)
          .eq('status', 'completed')
          .order('payment_date', { ascending: false })
          .limit(5),
      ]);

      // Fetch patient names for recent payments
      const recentPatientIds = [...new Set(recentPayments.data?.map(p => p.patient_id) || [])];
      const { data: recentPatients } = recentPatientIds.length > 0
        ? await supabase.from('patients').select('id, full_name').in('id', recentPatientIds)
        : { data: [] };
      const patientMap = new Map((recentPatients || []).map(p => [p.id, p.full_name] as const));

      const totalRevenue = invoicesResult.data?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;
      const totalPaid = invoicesResult.data?.reduce((sum, inv) => sum + Number(inv.paid_amount || 0), 0) || 0;
      const totalPending = invoicesResult.data?.reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0) || 0;
      const patientsCount = patientsResult.count || 0;
      const invoicesCount = invoicesResult.data?.length || 0;

      const thisMonthTotal = paymentsResult.data?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
      const lastMonthTotal = lastMonthPayments.data?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
      const growthPercent = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

      // Payment method breakdown
      const methodBreakdown: Record<string, number> = {};
      paymentsResult.data?.forEach(p => {
        methodBreakdown[p.payment_method] = (methodBreakdown[p.payment_method] || 0) + Number(p.amount || 0);
      });
      const pieData = Object.entries(methodBreakdown).map(([method, value]) => ({
        name: METHOD_LABELS[method] || method,
        value,
        color: (METHOD_COLORS as any)[method] || 'hsl(var(--muted))',
      }));

      // Monthly trend (last 6 months)
      const monthlyData: { month: string; amount: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthName = m.toLocaleDateString('ar-IQ', { month: 'short' });
        const monthInvoices = invoicesResult.data?.filter(inv => {
          const d = new Date(inv.issue_date);
          return d >= m && d <= mEnd;
        }) || [];
        monthlyData.push({
          month: monthName,
          amount: monthInvoices.reduce((s, inv) => s + Number(inv.paid_amount || 0), 0),
        });
      }

      const recentPaymentsList = (recentPayments.data || []).map(p => ({
        ...p,
        patient_name: patientMap.get(p.patient_id) || 'غير محدد',
      }));

      return {
        totalRevenue, totalPaid, totalPending, patientsCount, invoicesCount,
        collectionRate: totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0,
        thisMonthTotal, growthPercent, pieData, monthlyData, recentPayments: recentPaymentsList,
      };
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              إجمالي الإيرادات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              <CurrencyAmount amount={stats?.totalRevenue || 0} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">من {stats?.invoicesCount} فاتورة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Receipt className="h-4 w-4 text-blue-600" />
              تحصيل هذا الشهر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              <CurrencyAmount amount={stats?.thisMonthTotal || 0} />
            </div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {(stats?.growthPercent || 0) >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-success" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-destructive" />
              )}
              <span className={(stats?.growthPercent || 0) >= 0 ? 'text-success' : 'text-destructive'}>
                {Math.abs(stats?.growthPercent || 0).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">مقارنة بالشهر السابق</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-destructive" />
              المبالغ المستحقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              <CurrencyAmount amount={stats?.totalPending || 0} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              معدل التحصيل: {stats?.collectionRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              عدد المرضى
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.patientsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">مريض مسجل</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">اتجاه الإيرادات (آخر 6 أشهر)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats?.monthlyData || []}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => [value.toLocaleString(), 'المبلغ']} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Method Pie */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">طرق الدفع هذا الشهر</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.pieData && stats.pieData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={stats.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                      {stats.pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => value.toLocaleString()} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {stats.pieData.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span>{entry.name}: <CurrencyAmount amount={entry.value} /></span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">لا توجد مدفوعات هذا الشهر</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">آخر المدفوعات</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentPayments && stats.recentPayments.length > 0 ? (
            <div className="space-y-2">
              {stats.recentPayments.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{p.patient_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {METHOD_LABELS[p.payment_method] || p.payment_method} • {new Date(p.payment_date).toLocaleDateString('ar-IQ')}
                    </p>
                  </div>
                  <span className="font-bold text-success text-sm">
                    +<CurrencyAmount amount={Number(p.amount)} />
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">لا توجد مدفوعات حديثة</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
