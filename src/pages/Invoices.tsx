import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";
import { ViewInvoiceDialog } from "@/components/invoices/ViewInvoiceDialog";
import { RecordPaymentDialog } from "@/components/invoices/RecordPaymentDialog";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Eye, DollarSign, FileText, CreditCard, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  patients: {
    full_name: string;
  } | null;
}

export default function Invoices() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: invoices, isLoading, refetch } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          patients (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['invoice-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('total_amount, paid_amount, balance_due, status');

      if (error) throw error;

      const totalInvoices = data.length;
      const totalRevenue = data.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
      const totalPaid = data.reduce((sum, inv) => sum + Number(inv.paid_amount), 0);
      const totalPending = data.reduce((sum, inv) => sum + Number(inv.balance_due), 0);
      const overdue = data.filter(inv => inv.status === 'overdue').length;

      return {
        totalInvoices,
        totalRevenue,
        totalPaid,
        totalPending,
        overdue
      };
    }
  });

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'overdue':
        return 'bg-destructive text-destructive-foreground';
      case 'draft':
        return 'bg-muted text-muted-foreground';
      case 'cancelled':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'مدفوعة';
      case 'pending':
        return 'معلقة';
      case 'overdue':
        return 'متأخرة';
      case 'draft':
        return 'مسودة';
      case 'cancelled':
        return 'ملغية';
      default:
        return status;
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  const handleRecordPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentDialogOpen(true);
  };

  const handleInvoiceCreated = () => {
    refetch();
    toast({
      title: "تم إنشاء الفاتورة",
      description: "تم إنشاء الفاتورة بنجاح",
    });
  };

  const handlePaymentRecorded = () => {
    refetch();
    toast({
      title: "تم تسجيل الدفعة",
      description: "تم تسجيل الدفعة بنجاح",
    });
  };

  return (
    <PageContainer>
      <PageToolbar
        title="الفواتير والمدفوعات"
        showViewToggle={false}
        showAdvancedFilter={false}
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 ml-2" />
            فاتورة جديدة
          </Button>
        }
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الفواتير</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalInvoices || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><CurrencyAmount amount={stats?.totalRevenue || 0} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المبلغ المدفوع</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success"><CurrencyAmount amount={stats?.totalPaid || 0} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المبلغ المعلق</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning"><CurrencyAmount amount={stats?.totalPending || 0} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فواتير متأخرة</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.overdue || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الفواتير</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>المريض</TableHead>
                  <TableHead>تاريخ الإصدار</TableHead>
                  <TableHead>تاريخ الاستحقاق</TableHead>
                  <TableHead>المبلغ الإجمالي</TableHead>
                  <TableHead>المبلغ المدفوع</TableHead>
                  <TableHead>الرصيد المستحق</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices?.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.patients?.full_name}</TableCell>
                    <TableCell>{format(new Date(invoice.issue_date), 'yyyy/MM/dd')}</TableCell>
                    <TableCell>{format(new Date(invoice.due_date), 'yyyy/MM/dd')}</TableCell>
                    <TableCell><CurrencyAmount amount={Number(invoice.total_amount)} /></TableCell>
                    <TableCell className="text-success"><CurrencyAmount amount={Number(invoice.paid_amount)} /></TableCell>
                    <TableCell className="text-warning"><CurrencyAmount amount={Number(invoice.balance_due)} /></TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(invoice.status)}>
                        {getStatusText(invoice.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewInvoice(invoice)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRecordPayment(invoice)}
                          >
                            <DollarSign className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateInvoiceDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onInvoiceCreated={handleInvoiceCreated}
      />

      {selectedInvoice && (
        <>
          <ViewInvoiceDialog
            invoice={selectedInvoice}
            isOpen={isViewDialogOpen}
            onClose={() => {
              setIsViewDialogOpen(false);
              setSelectedInvoice(null);
            }}
          />

          <RecordPaymentDialog
            invoice={selectedInvoice}
            isOpen={isPaymentDialogOpen}
            onClose={() => {
              setIsPaymentDialogOpen(false);
              setSelectedInvoice(null);
            }}
            onPaymentRecorded={handlePaymentRecorded}
          />
        </>
      )}
    </PageContainer>
  );
}