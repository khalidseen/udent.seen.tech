import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, TrendingDown, Receipt, CreditCard, PieChart } from "lucide-react";
import { FinancialDashboard } from "@/components/financial/FinancialDashboard";
import { TreatmentPlansManager } from "@/components/financial/TreatmentPlansManager";
import { FinancialReports } from "@/components/financial/FinancialReports";

export default function FinancialOverview() {
  const { data: financialSummary, isLoading } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // الإيرادات الإجمالية
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total_amount, paid_amount, balance_due, status')
        .eq('clinic_id', profile.id);

      const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;
      const totalPaid = invoices?.reduce((sum, inv) => sum + Number(inv.paid_amount || 0), 0) || 0;
      const totalPending = invoices?.reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0) || 0;

      // عدد الفواتير حسب الحالة
      const pendingInvoices = invoices?.filter(inv => inv.status === 'pending').length || 0;
      const paidInvoices = invoices?.filter(inv => inv.status === 'paid').length || 0;

      return {
        totalRevenue,
        totalPaid,
        totalPending,
        pendingInvoices,
        paidInvoices,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">💰 الإدارة المالية الشاملة</h1>
        <p className="text-muted-foreground">
          نظرة شاملة على الوضع المالي للعيادة
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              إجمالي الإيرادات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {financialSummary?.totalRevenue.toFixed(2)} ريال
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              إجمالي الفواتير
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              المدفوعات المستلمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {financialSummary?.totalPaid.toFixed(2)} ريال
            </div>
            <p className="text-xs text-muted-foreground">
              {financialSummary?.paidInvoices} فاتورة مدفوعة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Receipt className="h-4 w-4 text-red-600" />
              المبالغ المستحقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {financialSummary?.totalPending.toFixed(2)} ريال
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingDown className="h-3 w-3" />
              {financialSummary?.pendingInvoices} فاتورة معلقة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4 text-purple-600" />
              نسبة التحصيل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {financialSummary?.totalRevenue 
                ? ((financialSummary.totalPaid / financialSummary.totalRevenue) * 100).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              من إجمالي الفواتير
            </p>
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
  );
}
