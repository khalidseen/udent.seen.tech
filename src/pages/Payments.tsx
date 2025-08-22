import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, CreditCard, Calendar, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  status: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  invoices?: {
    invoice_number: string;
  };
  patients?: {
    full_name: string;
  } | null;
}

const Payments = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const { data: payments = [], isLoading, refetch } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          invoices(invoice_number),
          patients(full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as Payment[];
    }
  });

  const filteredPayments = payments.filter(payment =>
    payment.patients?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.invoices?.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.reference_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدفعة؟')) return;
    
    try {
      const { error } = await supabase.from('payments').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('تم حذف الدفعة بنجاح');
      refetch();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('حدث خطأ في حذف الدفعة');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      completed: { label: 'مكتملة', variant: 'default' as const },
      pending: { label: 'معلقة', variant: 'secondary' as const },
      failed: { label: 'فاشلة', variant: 'destructive' as const },
      refunded: { label: 'مستردة', variant: 'outline' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getMethodBadge = (method: string) => {
    const methodMap = {
      cash: { label: 'نقدي', variant: 'default' as const },
      card: { label: 'بطاقة', variant: 'secondary' as const },
      bank_transfer: { label: 'تحويل بنكي', variant: 'outline' as const },
      check: { label: 'شيك', variant: 'secondary' as const }
    };
    
    const methodInfo = methodMap[method as keyof typeof methodMap] || { label: method, variant: 'outline' as const };
    return <Badge variant={methodInfo.variant}>{methodInfo.label}</Badge>;
  };

  return (
    <PageContainer>
      <PageHeader 
        title="إدارة المدفوعات"
        description="متابعة وإدارة جميع المدفوعات والدفعات"
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="البحث في المدفوعات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button>
          <Plus className="w-4 h-4 ml-2" />
          تسجيل دفعة جديدة
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPayments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{payment.amount.toLocaleString()} د.ع</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {payment.patients?.full_name}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(payment.status)}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Receipt className="w-4 h-4 text-muted-foreground" />
                    <span>فاتورة: {payment.invoices?.invoice_number}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{format(new Date(payment.payment_date), 'dd/MM/yyyy', { locale: ar })}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getMethodBadge(payment.payment_method)}
                  </div>
                  
                  {payment.reference_number && (
                    <div className="text-sm text-muted-foreground">
                      مرجع: {payment.reference_number}
                    </div>
                  )}
                  
                  {payment.notes && (
                    <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      {payment.notes}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="w-4 h-4 ml-1" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(payment.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredPayments.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد مدفوعات</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'لم يتم العثور على مدفوعات مطابقة للبحث' : 'لم يتم تسجيل أي مدفوعات بعد'}
            </p>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              تسجيل أول دفعة
            </Button>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
};

export default Payments;