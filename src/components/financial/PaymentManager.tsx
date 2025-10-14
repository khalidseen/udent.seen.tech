import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

export function PaymentManager() {
  const { formatAmount } = useCurrency();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          patients (full_name, phone),
          invoices (invoice_number)
        `)
        .eq('clinic_id', profile.id)
        .order('payment_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'نقداً';
      case 'card': return 'بطاقة';
      case 'transfer': return 'تحويل بنكي';
      case 'check': return 'شيك';
      default: return method;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'failed': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتملة';
      case 'pending': return 'معلقة';
      case 'failed': return 'فاشلة';
      default: return status;
    }
  };

  // Calculate statistics
  const totalPayments = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
  const completedPayments = payments?.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
  const pendingPayments = payments?.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
  
  // Today's payments
  const today = new Date().toISOString().split('T')[0];
  const todayPayments = payments?.filter(p => p.payment_date.startsWith(today)).reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة المدفوعات</h2>
          <p className="text-muted-foreground">تتبع وإدارة جميع المدفوعات</p>
        </div>
        <Button>
          <Plus className="ml-2 h-4 w-4" />
          تسجيل دفعة
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المدفوعات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totalPayments)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {payments?.length || 0} عملية دفع
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المدفوعات المكتملة</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatAmount(completedPayments)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المدفوعات المعلقة</CardTitle>
            <TrendingDown className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatAmount(pendingPayments)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مدفوعات اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatAmount(todayPayments)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <div className="grid gap-4">
        {payments?.map((payment: any) => (
          <Card key={payment.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(payment.status)}>
                      {getStatusText(payment.status)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {getPaymentMethodText(payment.payment_method)}
                    </span>
                  </div>
                  <p className="font-semibold">
                    المريض: {payment.patients?.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    الفاتورة: {payment.invoices?.invoice_number || 'غير محدد'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(payment.payment_date).toLocaleDateString('ar-SA')}
                  </p>
                  {payment.notes && (
                    <p className="text-sm text-muted-foreground mt-2">
                      ملاحظات: {payment.notes}
                    </p>
                  )}
                </div>

                <div className="text-left">
                  <p className="text-2xl font-bold text-success">
                    {formatAmount(payment.amount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!payments || payments.length === 0) && (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد مدفوعات</h3>
            <p className="text-muted-foreground mb-4">ابدأ بتسجيل مدفوعات المرضى</p>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              تسجيل دفعة
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
