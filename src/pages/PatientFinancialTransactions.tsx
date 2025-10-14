import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, TrendingDown, Filter, Download } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useState } from "react";

export default function PatientFinancialTransactions() {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPeriod, setFilterPeriod] = useState<string>("month");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['financial-transactions', filterType, filterPeriod],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // حساب تاريخ البداية بناءً على الفترة
      const now = new Date();
      let startDate: Date;
      
      switch (filterPeriod) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'quarter':
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(now.setMonth(now.getMonth() - 1));
      }

      let query = supabase
        .from('payments')
        .select('*')
        .eq('clinic_id', profile.id)
        .gte('payment_date', startDate.toISOString())
        .order('payment_date', { ascending: false });

      const { data: paymentsData, error } = await query;
      if (error) throw error;

      // جلب أسماء المرضى
      const patientIds = [...new Set(paymentsData?.map(p => p.patient_id))];
      const { data: patients } = await supabase
        .from('patients')
        .select('id, full_name')
        .in('id', patientIds);

      // دمج البيانات
      const data = paymentsData?.map(payment => ({
        ...payment,
        patient_name: patients?.find(p => p.id === payment.patient_id)?.full_name || 'مريض غير محدد'
      }));

      // حساب الإحصائيات
      const totalIncome = data?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;
      const totalCharges = 0; // يمكن حسابه من الفواتير
      const totalAdjustments = 0;
      const totalRefunds = data?.filter(t => t.status === 'refunded')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;

      return {
        transactions: data || [],
        stats: {
          totalIncome,
          totalCharges,
          totalAdjustments,
          totalRefunds,
          netIncome: totalIncome - totalRefunds,
        }
      };
    },
  });

  const getTransactionTypeColor = (method: string) => {
    switch (method) {
      case 'cash': return 'bg-green-500';
      case 'card': return 'bg-blue-500';
      case 'transfer': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getTransactionTypeText = (method: string) => {
    switch (method) {
      case 'cash': return 'نقداً';
      case 'card': return 'بطاقة';
      case 'transfer': return 'تحويل';
      default: return method;
    }
  };

  const getTransactionIcon = (status: string) => {
    return <DollarSign className="h-4 w-4" />;
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">سجل المعاملات المالية</h1>
          <p className="text-muted-foreground">
            تتبع شامل لجميع المعاملات المالية للمرضى
          </p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          تصدير
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              إجمالي المدفوعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {transactions?.stats.totalIncome.toFixed(2)} ريال
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-blue-600" />
              إجمالي الرسوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {transactions?.stats.totalCharges.toFixed(2)} ريال
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-yellow-600" />
              التعديلات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {transactions?.stats.totalAdjustments.toFixed(2)} ريال
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              المرتجعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {transactions?.stats.totalRefunds.toFixed(2)} ريال
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            تصفية المدفوعات
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">الفترة الزمنية</label>
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">آخر أسبوع</SelectItem>
                <SelectItem value="month">آخر شهر</SelectItem>
                <SelectItem value="quarter">آخر 3 أشهر</SelectItem>
                <SelectItem value="year">آخر سنة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>المدفوعات ({transactions?.transactions.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!transactions?.transactions || transactions.transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              لا توجد مدفوعات في الفترة المحددة
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.transactions.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-2 rounded-full ${getTransactionTypeColor(payment.payment_method)} text-white`}>
                      {getTransactionIcon(payment.status)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {payment.patient_name}
                        </span>
                        <Badge className={getTransactionTypeColor(payment.payment_method)}>
                          {getTransactionTypeText(payment.payment_method)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(payment.payment_date), 'PPP - HH:mm', { locale: ar })}
                      </div>
                      {payment.invoice_id && (
                        <div className="text-sm text-muted-foreground">
                          فاتورة رقم: {payment.invoice_id.substring(0, 8)}
                        </div>
                      )}
                      {payment.notes && (
                        <div className="text-sm text-muted-foreground">
                          {payment.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    +{Number(payment.amount).toFixed(2)} ريال
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
