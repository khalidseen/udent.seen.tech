import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { FlaskConical, Plus, Search, Package, Clock, CheckCircle, AlertTriangle, Truck } from "lucide-react";
import { CreateLabOrderDialog } from "@/components/lab/CreateLabOrderDialog";
import { ManageLabsDialog } from "@/components/lab/ManageLabsDialog";
import { LabOrderCard } from "@/components/lab/LabOrderCard";

export default function DentalLabManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showManageLabs, setShowManageLabs] = useState(false);
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['current-profile-lab'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_user_profile');
      if (error) throw error;
      return data;
    }
  });

  const clinicId = profile?.id;

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['lab-orders', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_orders')
        .select('*, dental_labs(name), patients(full_name), doctors(full_name)')
        .eq('clinic_id', clinicId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!clinicId
  });

  const { data: labs = [] } = useQuery({
    queryKey: ['dental-labs', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dental_labs')
        .select('*')
        .eq('clinic_id', clinicId!)
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
    enabled: !!clinicId
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('lab_orders')
        .update({ status: newStatus, updated_at: new Date().toISOString(), ...(newStatus === 'delivered' ? { actual_delivery: new Date().toISOString().split('T')[0] } : {}) })
        .eq('id', orderId);
      if (error) throw error;

      await supabase.from('lab_order_status_history').insert({
        order_id: orderId,
        status: newStatus,
        changed_by: (await supabase.auth.getUser()).data.user?.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] });
      toast.success('تم تحديث حالة الطلب');
    }
  });

  const filteredOrders = orders.filter((o: any) => {
    const matchesSearch = !search || 
      o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.patients?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o: any) => o.status === 'pending').length,
    in_progress: orders.filter((o: any) => o.status === 'in_progress').length,
    ready: orders.filter((o: any) => o.status === 'ready').length,
    delivered: orders.filter((o: any) => o.status === 'delivered').length,
    overdue: orders.filter((o: any) => o.estimated_delivery && new Date(o.estimated_delivery) < new Date() && o.status !== 'delivered').length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FlaskConical className="w-8 h-8 text-primary" />
            إدارة المختبر السني
          </h1>
          <p className="text-muted-foreground">إدارة طلبات المختبر والتركيبات والتتبع</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowManageLabs(true)}>
            <Package className="w-4 h-4 ml-2" />
            إدارة المختبرات
          </Button>
          <Button onClick={() => setShowCreateOrder(true)}>
            <Plus className="w-4 h-4 ml-2" />
            طلب جديد
          </Button>
        </div>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Clock className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-xs text-muted-foreground">بانتظار الإرسال</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Truck className="w-5 h-5 mx-auto mb-1 text-blue-500" />
          <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
          <p className="text-xs text-muted-foreground">قيد التصنيع</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-500" />
          <p className="text-2xl font-bold text-green-600">{stats.ready}</p>
          <p className="text-xs text-muted-foreground">جاهز للاستلام</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Package className="w-5 h-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{stats.delivered}</p>
          <p className="text-xs text-muted-foreground">تم التسليم</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-red-500" />
          <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
          <p className="text-xs text-muted-foreground">متأخر</p>
        </CardContent></Card>
      </div>

      {/* فلترة */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="بحث بالرقم أو اسم المريض..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">الكل</TabsTrigger>
            <TabsTrigger value="pending">معلق</TabsTrigger>
            <TabsTrigger value="sent_to_lab">مرسل</TabsTrigger>
            <TabsTrigger value="in_progress">قيد التصنيع</TabsTrigger>
            <TabsTrigger value="ready">جاهز</TabsTrigger>
            <TabsTrigger value="delivered">مستلم</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* قائمة الطلبات */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      ) : filteredOrders.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          لا توجد طلبات مختبر. أنشئ طلبك الأول!
        </CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order: any) => (
            <LabOrderCard key={order.id} order={order} onUpdateStatus={(id, status) => updateStatusMutation.mutate({ orderId: id, newStatus: status })} />
          ))}
        </div>
      )}

      {showCreateOrder && clinicId && (
        <CreateLabOrderDialog open={showCreateOrder} onClose={() => setShowCreateOrder(false)} clinicId={clinicId} labs={labs} />
      )}
      {showManageLabs && clinicId && (
        <ManageLabsDialog open={showManageLabs} onClose={() => setShowManageLabs(false)} clinicId={clinicId} />
      )}
    </div>
  );
}
