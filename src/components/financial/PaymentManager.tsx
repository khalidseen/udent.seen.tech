import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Plus, TrendingUp, TrendingDown, Search, Receipt, User } from "lucide-react";
import { CurrencyAmount } from "@/components/ui/currency-display";
import { CreatePaymentDialog } from "./CreatePaymentDialog";
import { useNavigate } from "react-router-dom";

export function PaymentManager() {
  const navigate = useNavigate();
  const [showCreatePayment, setShowCreatePayment] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");

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
        .select('*')
        .eq('clinic_id', profile.id)
        .order('payment_date', { ascending: false })
        .limit(100);
      if (error) throw error;

      // Fetch patient names and invoice numbers
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

  const filteredPayments = payments?.filter(p => {
    const matchesSearch = !searchTerm ||
      p.patient?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoice?.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === 'all' || p.payment_method === methodFilter;
    return matchesSearch && matchesMethod;
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

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'bg-success/10 text-success';
      case 'card': return 'bg-blue-500/10 text-blue-600';
      case 'transfer': return 'bg-purple-500/10 text-purple-600';
      case 'check': return 'bg-orange-500/10 text-orange-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const totalPayments = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
  const completedPayments = payments?.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
  const today = new Date().toISOString().split('T')[0];
  const todayPayments = payments?.filter(p => p.payment_date.startsWith(today)).reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
  const cashTotal = payments?.filter(p => p.payment_method === 'cash').reduce((s, p) => s + Number(p.amount || 0), 0) || 0;

  if (isLoading) {
    return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة المدفوعات</h2>
          <p className="text-muted-foreground">تتبع وإدارة جميع المدفوعات</p>
        </div>
        <div className="flex gap-2">
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
            <p className="text-xs text-muted-foreground mt-1">{payments?.length || 0} عملية</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المكتملة</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success"><CurrencyAmount amount={completedPayments} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مدفوعات اليوم</CardTitle>
            <TrendingDown className="h-4 w-4 text-primary" />
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
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث باسم المريض أو رقم الفاتورة..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-10" />
        </div>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الطرق</SelectItem>
            <SelectItem value="cash">نقداً</SelectItem>
            <SelectItem value="card">بطاقة</SelectItem>
            <SelectItem value="transfer">تحويل</SelectItem>
            <SelectItem value="check">شيك</SelectItem>
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
                <div className="text-2xl font-bold text-success shrink-0">
                  <CurrencyAmount amount={payment.amount} />
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
  );
}
