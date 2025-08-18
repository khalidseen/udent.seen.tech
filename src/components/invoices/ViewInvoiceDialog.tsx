import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Printer } from "lucide-react";
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
  notes?: string;
  patients: {
    full_name: string;
  } | null;
}

interface ViewInvoiceDialogProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewInvoiceDialog({ invoice, isOpen, onClose }: ViewInvoiceDialogProps) {
  const { data: invoiceItems } = useQuery({
    queryKey: ['invoice-items', invoice.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id)
        .order('created_at');
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!invoice.id
  });

  const { data: payments } = useQuery({
    queryKey: ['invoice-payments', invoice.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', invoice.id)
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!invoice.id
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

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash':
        return 'نقدي';
      case 'check':
        return 'شيك';
      case 'bank_transfer':
        return 'تحويل بنكي';
      case 'credit_card':
        return 'بطاقة ائتمان';
      default:
        return method;
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-print-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>فاتورة ${invoice.invoice_number}</title>
              <style>
                body { font-family: Arial, sans-serif; direction: rtl; }
                .header { text-align: center; margin-bottom: 20px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                .table th { background-color: #f5f5f5; }
                .totals { text-align: left; margin-top: 20px; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>عرض الفاتورة - {invoice.invoice_number}</DialogTitle>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 ml-2" />
            طباعة
          </Button>
        </DialogHeader>

        <div id="invoice-print-content" className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold">فاتورة</h1>
            <p className="text-lg text-muted-foreground">{invoice.invoice_number}</p>
          </div>

          {/* Invoice Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>معلومات الفاتورة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">رقم الفاتورة:</span>
                  <span className="font-medium">{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تاريخ الإصدار:</span>
                  <span>{format(new Date(invoice.issue_date), 'yyyy/MM/dd')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تاريخ الاستحقاق:</span>
                  <span>{format(new Date(invoice.due_date), 'yyyy/MM/dd')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الحالة:</span>
                  <Badge className={getStatusColor(invoice.status)}>
                    {getStatusText(invoice.status)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>معلومات المريض</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">اسم المريض:</span>
                  <span className="font-medium">{invoice.patients?.full_name}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle>عناصر الفاتورة</CardTitle>
            </CardHeader>
            <CardContent>
              <Table className="table">
                <TableHeader>
                  <TableRow>
                    <TableHead>الخدمة</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>المجموع</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceItems?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.service_name}</TableCell>
                      <TableCell>{item.description || '-'}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${Number(item.unit_price).toFixed(2)}</TableCell>
                      <TableCell>${Number(item.line_total).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-lg">
                  <span>المجموع الفرعي:</span>
                  <span>${Number(invoice.total_amount).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold">
                  <span>المجموع الكلي:</span>
                  <span>${Number(invoice.total_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg text-success">
                  <span>المبلغ المدفوع:</span>
                  <span>${Number(invoice.paid_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg text-warning">
                  <span>الرصيد المستحق:</span>
                  <span>${Number(invoice.balance_due).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          {payments && payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>سجل المدفوعات</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>تاريخ الدفع</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>طريقة الدفع</TableHead>
                      <TableHead>رقم المرجع</TableHead>
                      <TableHead>ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.payment_date), 'yyyy/MM/dd')}</TableCell>
                        <TableCell className="text-success">${Number(payment.amount).toFixed(2)}</TableCell>
                        <TableCell>{getPaymentMethodText(payment.payment_method)}</TableCell>
                        <TableCell>{payment.reference_number || '-'}</TableCell>
                        <TableCell>{payment.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>ملاحظات</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}