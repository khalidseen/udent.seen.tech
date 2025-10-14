import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, Receipt } from "lucide-react";

export function FinancialDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['financial-dashboard-stats'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // جمع إحصائيات مالية شاملة
      const [invoicesResult, paymentsResult, patientsResult] = await Promise.all([
        supabase
          .from('invoices')
          .select('total_amount, paid_amount, balance_due, status')
          .eq('clinic_id', profile.id),
        supabase
          .from('payments')
          .select('amount')
          .eq('clinic_id', profile.id),
        supabase
          .from('patients')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', profile.id)
      ]);

      const totalRevenue = invoicesResult.data?.reduce((sum, inv) => 
        sum + Number(inv.total_amount || 0), 0) || 0;
      const totalPaid = paymentsResult.data?.reduce((sum, pay) => 
        sum + Number(pay.amount || 0), 0) || 0;
      const totalPending = invoicesResult.data?.reduce((sum, inv) => 
        sum + Number(inv.balance_due || 0), 0) || 0;
      const patientsCount = patientsResult.count || 0;
      const invoicesCount = invoicesResult.data?.length || 0;

      return {
        totalRevenue,
        totalPaid,
        totalPending,
        patientsCount,
        invoicesCount,
        collectionRate: totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0,
      };
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            إجمالي الإيرادات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats?.totalRevenue.toFixed(2)} ريال
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            من {stats?.invoicesCount} فاتورة
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Receipt className="h-4 w-4 text-blue-600" />
            المدفوعات المستلمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats?.totalPaid.toFixed(2)} ريال
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            معدل التحصيل: {stats?.collectionRate.toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-red-600" />
            المبالغ المستحقة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {stats?.totalPending.toFixed(2)} ريال
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            من عدة مرضى
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
          <div className="text-2xl font-bold text-purple-600">
            {stats?.patientsCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            مريض نشط
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
