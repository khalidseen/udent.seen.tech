import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Plus, TrendingUp, TrendingDown, Search, Receipt, User, RotateCcw, Download } from "lucide-react";
import { CurrencyAmount } from "@/components/ui/currency-display";
import { CreatePaymentDialog } from "./CreatePaymentDialog";
import { useNavigate } from "react-router-dom";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { toast } from "sonner";

export function PaymentManager() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreatePayment, setShowCreatePayment] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data: profile } = await supabase.rpc('get_current_user_profile');
      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('clinic_id', profile.id)
        .order('payment_date', { ascending: false })
        .limit(200);
      if (error) throw error;

      const patientIds = [...new Set(data?.map(p => p.patient_id) || [])];
      const invoiceIds = [...new Set(data?.filter(p => p.invoice_id).map(p => p.invoice_id!) || [])];

      const [patientsRes, invoicesRes] = await Promise.all([
        supabase.from('patients').select('id, full_name').in('id', patientIds.length > 0 ? patientIds : ['none']),
        invoiceIds.length > 0 ? supabase.from('invoices').select('id, invoice_number').in('id', invoiceIds) : { data: [] },
      ]);

      const patientMap = new Map(patientsRes.data?.map(p => [p.id, p]) || []);
      const invoiceMap = new Map((invoicesRes as any).data?.map((i: any) => [i.id, i]) || []);

      return data?.map(p => ({
        ...p,
        patient: patientMap.get(p.patient_id) as { id: string; full_name: string } | undefined,
        invoice: (p.invoice_id ? invoiceMap.get(p.invoice_id) : null) as { id: string; invoice_number: string } | null,
      })) || [];
    },
  });

  const refundMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'refunded', updated_at: new Date().toISOString() })
        .eq('id', paymentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إرجاع المبلغ');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
    onError: (e) => toast.error('فشل في عملية الإرجاع: ' + e.message),
  });

  const filteredPayments = payments?.filter(p => {
    const matchesSearch = !searchTerm ||
      p.patient?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoice?.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === 'all' || p.payment_method === methodFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesMethod && matchesStatus;
  });

  const getPaymentMethodText = (method: string) => {
    const map: Record<string, string> = { cash: 'نقداً', card: 'بطاقة', transfer: 'تحويل بنكي', check: 'شيك' };
    return map[method] || method;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'failed': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'refunded': return 'bg-orange-500/10 text-orange-600 border-orange-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = { completed: 'مكتملة', pending: 'معلقة', failed: 'فاشلة', refunded: 'مُرتجعة' };
    return map[status] || status;
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'bg-success/10 text-success';
      case 'card': return 'bg-blue-500/10 text-blue-600';
      case 'transfer': return 'bg-purple-500/10 text-purple-600';
      case 'check': return 'bg-orange-500/10 text-orange-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const exportCSV = () => {
    if (!filteredPayments) return;
    const BOM = '\uFEFF';
    let csv = 'المريض,التاريخ,المبلغ,طريقة الدفع,الحالة,رقم الفاتورة,ملاحظات\n';
    filteredPayments.forEach(p => {
      csv += `${p.patient?.full_name || ''},${p.payment_date.split('T')[0]},${p.amount},${getPaymentMethodText(p.payment_method)},${getStatusText(p.status)},${p.invoice?.invoice_number || ''},${p.notes || ''}\n`;
    });
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `مدفوعات_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('تم تصدير المدفوعات');
  };

  const totalPayments = payments?.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
  const refundedTotal = payments?.filter(p => p.status === 'refunded').reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
  const today = new Date().toISOString().split('T')[0];
  const todayPayments = payments?.filter(p => p.payment_date.startsWith(today) && p.status === 'completed').reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
  const cashTotal = payments?.filter(p => p.payment_method === 'cash' && p.status === 'completed').reduce((s, p) => s + Number(p.amount || 0), 0) || 0;

  if (isLoading) {
    return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <PermissionGuard requiredPermissions={['financial.view', 'payments.view', 'financial.manage']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">إدارة المدفوعات</h2>
            <p className="text-muted-foreground">تتبع وإدارة جميع المدفوعات</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="ml-1 h-4 w-4" /> تصدير
            </Button>
            <Button variant="outline" onClick={() => navigate('/invoice-management')}>
              <Receipt className="ml-2 h-4 w-4" /> الفواتير
            </Button>
            <Button onClick={() => setShowCreatePayment(true)}>
              <Plus className="ml-2 h-4 w-4" /> تسجيل دفعة
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المدفوعات</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold"><CurrencyAmount amount={totalPayments} /></div>
              <p className="text-xs text-muted-foreground mt-1">{payments?.filter(p => p.status === 'completed').length || 0} عملية</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مدفوعات اليوم</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary"><CurrencyAmount amount={todayPayments} /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">النقدي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold"><CurrencyAmount amount={cashTotal} /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <RotateCcw className="h-3 w-3 text-orange-500" /> المُرتجعات
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600"><CurrencyAmount amount={refundedTotal} /></div>
              <p className="text-xs text-muted-foreground">{payments?.filter(p => p.status === 'refunded').length || 0} عملية</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث باسم المريض أو رقم الفاتورة..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-10" />
          </div>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الطرق</SelectItem>
              <SelectItem value="cash">نقداً</SelectItem>
              <SelectItem value="card">بطاقة</SelectItem>
              <SelectItem value="transfer">تحويل</SelectItem>
              <SelectItem value="check">شيك</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="completed">مكتملة</SelectItem>
              <SelectItem value="pending">معلقة</SelectItem>
              <SelectItem value="refunded">مُرتجعة</SelectItem>
              <SelectItem value="failed">فاشلة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Payments List */}
        <div className="grid gap-3">
          {filteredPayments?.map((payment: any) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getStatusColor(payment.status)}>{getStatusText(payment.status)}</Badge>
                      <Badge variant="outline" className={getMethodColor(payment.payment_method)}>{getPaymentMethodText(payment.payment_method)}</Badge>
                    </div>
                    <button
                      onClick={() => navigate(`/patient/${payment.patient_id}`)}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <User className="h-3 w-3" /> {payment.patient?.full_name}
                    </button>
                    {payment.invoice?.invoice_number && (
                      <p className="text-xs text-muted-foreground">فاتورة: {payment.invoice.invoice_number}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{new Date(payment.payment_date).toLocaleDateString('ar-IQ')}</p>
                    {payment.notes && <p className="text-xs text-muted-foreground truncate">{payment.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className={`text-2xl font-bold ${payment.status === 'refunded' ? 'text-orange-600' : 'text-success'}`}>
                      {payment.status === 'refunded' ? '-' : '+'}<CurrencyAmount amount={payment.amount} />
                    </div>
                    {payment.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-orange-600 hover:text-orange-700"
                        onClick={() => {
                          if (confirm('هل أنت متأكد من إرجاع هذه الدفعة؟')) {
                            refundMutation.mutate(payment.id);
                          }
                        }}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!filteredPayments || filteredPayments.length === 0) && (
          <Card>
            <CardContent className="p-12 text-center">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد مدفوعات</h3>
              <p className="text-muted-foreground mb-4">ابدأ بتسجيل مدفوعات المرضى</p>
              <Button onClick={() => setShowCreatePayment(true)}>
                <Plus className="ml-2 h-4 w-4" /> تسجيل دفعة
              </Button>
            </CardContent>
          </Card>
        )}

        <CreatePaymentDialog open={showCreatePayment} onOpenChange={setShowCreatePayment} />
      </div>
    </PermissionGuard>
  );
}
