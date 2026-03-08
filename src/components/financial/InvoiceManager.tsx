import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Eye, CreditCard, Search, User } from "lucide-react";
import { CurrencyAmount } from "@/components/ui/currency-display";
import { CreateInvoiceDialog } from "./CreateInvoiceDialog";
import { CreatePaymentDialog } from "./CreatePaymentDialog";
import { useNavigate } from "react-router-dom";

export function InvoiceManager() {
  const navigate = useNavigate();
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showCreatePayment, setShowCreatePayment] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<{ patientId: string; invoiceId: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('invoices')
        .select(`*, patients (full_name, phone)`)
        .eq('clinic_id', profile.id)
        .order('issue_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredInvoices = invoices?.filter(inv => {
    const matchesSearch = !searchTerm || 
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success/10 text-success border-success/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'overdue': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'cancelled': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'مدفوعة';
      case 'pending': return 'معلقة';
      case 'overdue': return 'متأخرة';
      case 'cancelled': return 'ملغاة';
      default: return status;
    }
  };

  const handlePayInvoice = (invoice: any) => {
    setSelectedInvoiceForPayment({ patientId: invoice.patient_id, invoiceId: invoice.id });
    setShowCreatePayment(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const totalInvoiced = invoices?.reduce((s, i) => s + Number(i.total_amount || 0), 0) || 0;
  const totalPaid = invoices?.reduce((s, i) => s + Number(i.paid_amount || 0), 0) || 0;
  const totalPending = invoices?.reduce((s, i) => s + Number(i.balance_due || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة الفواتير</h2>
          <p className="text-muted-foreground">عرض وإدارة جميع الفواتير</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/payment-management')}>
            <CreditCard className="ml-2 h-4 w-4" /> المدفوعات
          </Button>
          <Button onClick={() => setShowCreateInvoice(true)}>
            <Plus className="ml-2 h-4 w-4" /> فاتورة جديدة
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الفواتير</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices?.length || 0}</div>
            <p className="text-xs text-muted-foreground"><CurrencyAmount amount={totalInvoiced} /></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المدفوعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{invoices?.filter(i => i.status === 'paid').length || 0}</div>
            <p className="text-xs text-muted-foreground"><CurrencyAmount amount={totalPaid} /></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المعلقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{invoices?.filter(i => i.status === 'pending').length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المبالغ المستحقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive"><CurrencyAmount amount={totalPending} /></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث برقم الفاتورة أو اسم المريض..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="pending">معلقة</SelectItem>
            <SelectItem value="paid">مدفوعة</SelectItem>
            <SelectItem value="overdue">متأخرة</SelectItem>
            <SelectItem value="cancelled">ملغاة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices List */}
      <div className="grid gap-3">
        {filteredInvoices?.map((invoice: any) => (
          <Card key={invoice.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold">{invoice.invoice_number}</h3>
                    <Badge className={getStatusColor(invoice.status)}>{getStatusText(invoice.status)}</Badge>
                  </div>
                  <button
                    onClick={() => navigate(`/patient/${invoice.patient_id}`)}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <User className="h-3 w-3" /> {invoice.patients?.full_name}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    {new Date(invoice.issue_date).toLocaleDateString('ar-IQ')} | استحقاق: {new Date(invoice.due_date).toLocaleDateString('ar-IQ')}
                  </p>
                </div>

                <div className="text-left space-y-1 shrink-0">
                  <p className="text-sm text-muted-foreground">الإجمالي</p>
                  <p className="text-lg font-bold"><CurrencyAmount amount={invoice.total_amount} /></p>
                  {invoice.balance_due > 0 && (
                    <p className="text-sm text-destructive">متبقي: <CurrencyAmount amount={invoice.balance_due} /></p>
                  )}
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/patient/${invoice.patient_id}?tab=financials`)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                    <Button size="sm" onClick={() => handlePayInvoice(invoice)}>
                      <CreditCard className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!filteredInvoices || filteredInvoices.length === 0) && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد فواتير</h3>
            <p className="text-muted-foreground mb-4">ابدأ بإنشاء فاتورة جديدة</p>
            <Button onClick={() => setShowCreateInvoice(true)}>
              <Plus className="ml-2 h-4 w-4" /> إنشاء فاتورة
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateInvoiceDialog open={showCreateInvoice} onOpenChange={setShowCreateInvoice} />
      <CreatePaymentDialog
        open={showCreatePayment}
        onOpenChange={(open) => { setShowCreatePayment(open); if (!open) setSelectedInvoiceForPayment(null); }}
        preselectedPatientId={selectedInvoiceForPayment?.patientId}
        preselectedInvoiceId={selectedInvoiceForPayment?.invoiceId}
      />
    </div>
  );
}
