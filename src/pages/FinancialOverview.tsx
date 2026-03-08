import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Receipt, CreditCard, PieChart, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { FinancialDashboard } from "@/components/financial/FinancialDashboard";
import { TreatmentPlansManager } from "@/components/financial/TreatmentPlansManager";
import { FinancialReports } from "@/components/financial/FinancialReports";
import { CurrencyAmount } from "@/components/ui/currency-display";
import { useNavigate } from "react-router-dom";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

export default function FinancialOverview() {
  const navigate = useNavigate();

  const { data: financialSummary, isLoading } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: async () => {
      const { data: profile } = await supabase.rpc('get_current_user_profile');
      if (!profile) throw new Error('Profile not found');

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const [invoicesRes, paymentsRes, lastMonthPaymentsRes] = await Promise.all([
        supabase.from('invoices').select('total_amount, paid_amount, balance_due, status').eq('clinic_id', profile.id),
        supabase.from('payments').select('amount, payment_date, status').eq('clinic_id', profile.id).eq('status', 'completed'),
        supabase.from('payments').select('amount').eq('clinic_id', profile.id).eq('status', 'completed')
          .gte('payment_date', lastMonthStart.toISOString())
          .lte('payment_date', lastMonthEnd.toISOString()),
      ]);

      const invoices = invoicesRes.data || [];
      const payments = paymentsRes.data || [];

      const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
      const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paid_amount || 0), 0);
      const totalPending = invoices.reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0);
      const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
      const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
      const overdueInvoices = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled').length;

      const today = new Date().toISOString().split('T')[0];
      const todayCollection = payments.filter(p => p.payment_date.startsWith(today)).reduce((s, p) => s + Number(p.amount || 0), 0);

      const thisMonthCollection = payments.filter(p => new Date(p.payment_date) >= thisMonthStart).reduce((s, p) => s + Number(p.amount || 0), 0);
      const lastMonthCollection = lastMonthPaymentsRes.data?.reduce((s, p) => s + Number(p.amount || 0), 0) || 0;
      const growthPercent = lastMonthCollection > 0 ? ((thisMonthCollection - lastMonthCollection) / lastMonthCollection) * 100 : 0;

      return {
        totalRevenue, totalPaid, totalPending, pendingInvoices, paidInvoices, todayCollection,
        totalInvoices: invoices.length, overdueInvoices, thisMonthCollection, growthPercent,
        collectionRate: totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0,
      };
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <PermissionGuard requiredPermissions={['financial.view', 'financial.manage']}>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">💰 الإدارة المالية الشاملة</h1>
            <p className="text-muted-foreground">نظرة شاملة على الوضع المالي للعيادة</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => navigate('/invoice-management')}>
              <Receipt className="ml-1 h-4 w-4" /> الفواتير
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/payment-management')}>
              <CreditCard className="ml-1 h-4 w-4" /> المدفوعات
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/financial-transactions')}>
              <Activity className="ml-1 h-4 w-4" /> السجل
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2"><DollarSign className="h-4 w-4 text-success" />الإيرادات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success"><CurrencyAmount amount={financialSummary?.totalRevenue || 0} /></div>
              <p className="text-xs text-muted-foreground">{financialSummary?.totalInvoices} فاتورة</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2"><CreditCard className="h-4 w-4 text-blue-600" />تحصيل الشهر</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600"><CurrencyAmount amount={financialSummary?.thisMonthCollection || 0} /></div>
              <div className="flex items-center gap-1 text-xs mt-1">
                {(financialSummary?.growthPercent || 0) >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-success" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-destructive" />
                )}
                <span className={(financialSummary?.growthPercent || 0) >= 0 ? 'text-success' : 'text-destructive'}>
                  {Math.abs(financialSummary?.growthPercent || 0).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2"><Receipt className="h-4 w-4 text-destructive" />المستحق</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive"><CurrencyAmount amount={financialSummary?.totalPending || 0} /></div>
              <p className="text-xs text-muted-foreground">{financialSummary?.pendingInvoices} فاتورة معلقة</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />تحصيل اليوم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary"><CurrencyAmount amount={financialSummary?.todayCollection || 0} /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2"><PieChart className="h-4 w-4 text-purple-600" />نسبة التحصيل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {(financialSummary?.collectionRate || 0).toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="dashboard">لوحة التحكم</TabsTrigger>
            <TabsTrigger value="treatment-plans">خطط العلاج</TabsTrigger>
            <TabsTrigger value="reports">التقارير</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <FinancialDashboard />
          </TabsContent>
          <TabsContent value="treatment-plans">
            <TreatmentPlansManager />
          </TabsContent>
          <TabsContent value="reports">
            <FinancialReports />
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGuard>
  );
}
