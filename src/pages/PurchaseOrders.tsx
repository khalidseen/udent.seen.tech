import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, ShoppingCart, Calendar, Truck } from "lucide-react";
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

interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier: string;
  supplier_contact?: string;
  order_date: string;
  expected_delivery?: string;
  total_amount: number;
  status: string;
  notes?: string;
  created_at: string;
}

const PurchaseOrders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PurchaseOrder[];
    }
  });

  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
    
    try {
      const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('تم حذف الطلب بنجاح');
      refetch();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('حدث خطأ في حذف الطلب');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'معلق', variant: 'secondary' as const },
      approved: { label: 'موافق عليه', variant: 'default' as const },
      ordered: { label: 'مطلوب', variant: 'default' as const },
      delivered: { label: 'مُسلم', variant: 'default' as const },
      cancelled: { label: 'ملغي', variant: 'destructive' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <PageContainer>
      <PageHeader 
        title="أوامر الشراء"
        description="إدارة ومتابعة أوامر شراء المواد والمعدات الطبية"
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="البحث في أوامر الشراء..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button>
          <Plus className="w-4 h-4 ml-2" />
          إنشاء أمر شراء جديد
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
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{order.order_number}</CardTitle>
                      <p className="text-sm text-muted-foreground">{order.supplier}</p>
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>تاريخ الطلب: {format(new Date(order.order_date), 'dd/MM/yyyy', { locale: ar })}</span>
                  </div>
                  
                  {order.expected_delivery && (
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="w-4 h-4 text-muted-foreground" />
                      <span>التسليم المتوقع: {format(new Date(order.expected_delivery), 'dd/MM/yyyy', { locale: ar })}</span>
                    </div>
                  )}
                  
                  <div className="text-lg font-semibold text-primary">
                    {order.total_amount.toLocaleString()} د.ع
                  </div>
                  
                  {order.supplier_contact && (
                    <div className="text-sm text-muted-foreground">
                      جهة الاتصال: {order.supplier_contact}
                    </div>
                  )}
                  
                  {order.notes && (
                    <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      {order.notes}
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
                    onClick={() => handleDelete(order.id)}
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

      {!isLoading && filteredOrders.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد أوامر شراء</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'لم يتم العثور على أوامر مطابقة للبحث' : 'لم يتم إنشاء أي أوامر شراء بعد'}
            </p>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              إنشاء أول أمر شراء
            </Button>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
};

export default PurchaseOrders;