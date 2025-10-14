import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Eye, Download } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

export function InvoiceManager() {
  const { formatAmount } = useCurrency();

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
        .select(`
          *,
          patients (full_name, phone)
        `)
        .eq('clinic_id', profile.id)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      return data;
    },
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

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة الفواتير</h2>
          <p className="text-muted-foreground">عرض وإدارة جميع الفواتير</p>
        </div>
        <Button>
          <Plus className="ml-2 h-4 w-4" />
          فاتورة جديدة
        </Button>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفواتير المدفوعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {invoices?.filter(i => i.status === 'paid').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفواتير المعلقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {invoices?.filter(i => i.status === 'pending').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفواتير المتأخرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {invoices?.filter(i => i.status === 'overdue').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      <div className="grid gap-4">
        {invoices?.map((invoice: any) => (
          <Card key={invoice.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{invoice.invoice_number}</h3>
                    <Badge className={getStatusColor(invoice.status)}>
                      {getStatusText(invoice.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    المريض: {invoice.patients?.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    تاريخ الإصدار: {new Date(invoice.issue_date).toLocaleDateString('ar-SA')}
                  </p>
                </div>

                <div className="text-left space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">المبلغ الإجمالي</p>
                    <p className="text-xl font-bold">{formatAmount(invoice.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">المتبقي</p>
                    <p className="text-lg font-semibold text-warning">
                      {formatAmount(invoice.balance_due)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="ml-2 h-4 w-4" />
                    عرض
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="ml-2 h-4 w-4" />
                    تحميل
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!invoices || invoices.length === 0) && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد فواتير</h3>
            <p className="text-muted-foreground mb-4">ابدأ بإنشاء فاتورة جديدة</p>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              إنشاء فاتورة
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
