import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, ShoppingCart, Calendar, Truck, CheckCircle, XCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { CreatePurchaseOrderDialog } from "@/components/inventory/CreatePurchaseOrderDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CurrencyAmount } from "@/components/ui/currency-display";

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
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['current-profile'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_current_user_profile');
      return data;
    }
  });

  const clinicId = profile?.id;

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['purchase-orders', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('clinic_id', clinicId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PurchaseOrder[];
    },
    enabled: !!clinicId
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalValue: orders.reduce((s, o) => s + o.total_amount, 0),
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
    try {
      const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
      if (error) throw error;
      toast.success('تم حذف الطلب بنجاح');
      invalidateAll();
    } catch {
      toast.error('حدث خطأ في حذف الطلب');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;

      // If delivered, update stock for linked items
      if (newStatus === 'delivered') {
        const { data: items } = await supabase
          .from('purchase_order_items')
          .select('supply_id, quantity')
          .eq('purchase_order_id', id)
          .not('supply_id', 'is', null);

        if (items) {
          for (const item of items) {
            if (item.supply_id) {
              const { data: supply } = await supabase
                .from('medical_supplies')
                .select('current_stock')
                .eq('id', item.supply_id)
                .single();

              if (supply) {
                await supabase
                  .from('medical_supplies')
                  .update({ current_stock: supply.current_stock + item.quantity })
                  .eq('id', item.supply_id);

                await supabase
                  .from('stock_movements')
                  .insert({
                    clinic_id: clinicId,
                    supply_id: item.supply_id,
                    movement_type: 'in',
                    quantity: item.quantity,
                    reference_type: 'purchase',
                    notes: `استلام أمر شراء`,
                    created_by: profile?.id
                  });
              }
            }
          }
        }
      }

      toast.success('تم تحديث حالة الطلب');
      invalidateAll();
    } catch {
      toast.error('حدث خطأ في تحديث الحالة');
    }
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    queryClient.invalidateQueries({ queryKey: ['medical-supplies'] });
    queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'معلق', variant: 'secondary' },
      approved: { label: 'موافق عليه', variant: 'default' },
      ordered: { label: 'مطلوب', variant: 'default' },
      delivered: { label: 'مُسلم', variant: 'default' },
      cancelled: { label: 'ملغي', variant: 'destructive' }
    };
    const info = statusMap[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  return (
    <PermissionGuard requiredPermissions={['inventory.view']}>
      <PageContainer>
        <PageHeader title="أوامر الشراء" description="إدارة ومتابعة أوامر شراء المواد والمعدات الطبية" />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">إجمالي الأوامر</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">قيد الانتظار</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-orange-500">{stats.pending}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">تم التسليم</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">{stats.delivered}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">إجمالي القيمة</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold"><CurrencyAmount amount={stats.totalValue} /></div></CardContent>
          </Card>
        </div>

        {/* Filters */}
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="حالة الطلب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="pending">معلق</SelectItem>
              <SelectItem value="approved">موافق عليه</SelectItem>
              <SelectItem value="ordered">مطلوب</SelectItem>
              <SelectItem value="delivered">مُسلم</SelectItem>
              <SelectItem value="cancelled">ملغي</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 ml-2" /> إنشاء أمر شراء
          </Button>
        </div>

        {/* Orders Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader><div className="h-4 bg-muted rounded w-3/4" /></CardHeader>
                <CardContent><div className="space-y-2"><div className="h-3 bg-muted rounded" /></div></CardContent>
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
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-primary" />
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
                      <CurrencyAmount amount={order.total_amount} />
                    </div>
                    
                    {order.notes && (
                      <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{order.notes}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
                    {order.status === 'pending' && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleStatusChange(order.id, 'approved')}>
                          <CheckCircle className="w-3 h-3 ml-1" /> موافقة
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleStatusChange(order.id, 'cancelled')}>
                          <XCircle className="w-3 h-3 ml-1" /> إلغاء
                        </Button>
                      </>
                    )}
                    {order.status === 'approved' && (
                      <Button variant="outline" size="sm" onClick={() => handleStatusChange(order.id, 'ordered')}>
                        <Truck className="w-3 h-3 ml-1" /> تم الطلب
                      </Button>
                    )}
                    {order.status === 'ordered' && (
                      <Button variant="outline" size="sm" onClick={() => handleStatusChange(order.id, 'delivered')}>
                        <CheckCircle className="w-3 h-3 ml-1" /> تم التسليم
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleDelete(order.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
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
                {searchQuery || statusFilter !== 'all' ? 'لم يتم العثور على أوامر مطابقة' : 'لم يتم إنشاء أي أوامر شراء بعد'}
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 ml-2" /> إنشاء أول أمر شراء
              </Button>
            </CardContent>
          </Card>
        )}

        <CreatePurchaseOrderDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onOrderCreated={() => {
            invalidateAll();
            toast.success('تم إنشاء أمر الشراء بنجاح');
          }}
        />
      </PageContainer>
    </PermissionGuard>
  );
};

export default PurchaseOrders;
