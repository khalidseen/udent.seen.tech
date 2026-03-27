import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateSupplyDialog } from "@/components/inventory/CreateSupplyDialog";
import { CreatePurchaseOrderDialog } from "@/components/inventory/CreatePurchaseOrderDialog";
import { StockMovementDialog } from "@/components/inventory/StockMovementDialog";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Package, AlertTriangle, Truck, BarChart3, Trash2, PackageX, DollarSign, ArrowLeftRight, ShoppingCart, Pill } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { AdvancedInventoryReports } from "@/components/inventory/AdvancedInventoryReports";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { CurrencyAmount } from "@/components/ui/currency-display";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Supply {
  id: string;
  name: string;
  category: string;
  brand?: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  unit_cost: number;
  supplier?: string;
  supplier_contact?: string;
  expiry_date?: string;
  batch_number?: string;
  is_active: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  instruments: 'أدوات',
  materials: 'مواد',
  medications: 'أدوية',
  disposables: 'مستهلكات',
  equipment: 'معدات',
};

export default function Inventory() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [isCreateSupplyOpen, setIsCreateSupplyOpen] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [isStockMovementOpen, setIsStockMovementOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("inventory");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const workflowSource = searchParams.get('from');
  const preselectedSupplyId = searchParams.get('supply') || undefined;
  const prefillName = searchParams.get('name') || undefined;
  const prefillCategory = searchParams.get('category') || undefined;
  const prefillBrand = searchParams.get('brand') || undefined;

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab && ['inventory', 'reports'].includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
    if (searchParams.get('search')) {
      setSearchTerm(searchParams.get('search') || '');
    }
    if (searchParams.get('category')) {
      setCategoryFilter(searchParams.get('category') || 'all');
    }
    if (searchParams.get('stock')) {
      setStockFilter(searchParams.get('stock') || 'all');
    }
    if (searchParams.get('openCreate') === 'true') {
      setIsCreateSupplyOpen(true);
    }
    if (searchParams.get('openOrder') === 'true') {
      setIsCreateOrderOpen(true);
    }
  }, [searchParams]);

  const { data: profile } = useQuery({
    queryKey: ['current-profile'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_current_user_profile');
      return data;
    }
  });

  const clinicId = profile?.id;

  const { data: supplies = [], isLoading, refetch } = useQuery({
    queryKey: ['medical-supplies', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_supplies')
        .select('*')
        .eq('clinic_id', clinicId!)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Supply[];
    },
    enabled: !!clinicId
  });

  const stats = useMemo(() => {
    if (!supplies.length) return { totalItems: 0, lowStockItems: 0, totalValue: 0, outOfStockItems: 0, expiringItems: 0 };
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return {
      totalItems: supplies.length,
      lowStockItems: supplies.filter(s => s.current_stock <= s.minimum_stock && s.current_stock > 0).length,
      outOfStockItems: supplies.filter(s => s.current_stock === 0).length,
      totalValue: supplies.reduce((sum, s) => sum + (s.current_stock * Number(s.unit_cost)), 0),
      expiringItems: supplies.filter(s => s.expiry_date && new Date(s.expiry_date) <= thirtyDaysFromNow).length,
    };
  }, [supplies]);

  const filteredSupplies = supplies.filter(supply => {
    const matchesSearch = supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supply.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supply.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || supply.category === categoryFilter;
    const matchesStock = stockFilter === "all" ||
      (stockFilter === "low" && supply.current_stock <= supply.minimum_stock && supply.current_stock > 0) ||
      (stockFilter === "out" && supply.current_stock === 0) ||
      (stockFilter === "good" && supply.current_stock > supply.minimum_stock);
    const matchesSupply = !preselectedSupplyId || supply.id === preselectedSupplyId;
    return matchesSearch && matchesCategory && matchesStock && matchesSupply;
  });

  const updateWorkflowParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    setSearchParams(next);
  };

  const getStockStatus = (supply: Supply) => {
    if (supply.current_stock === 0) return { status: "out", color: "destructive" as const, text: "نفدت" };
    if (supply.current_stock <= supply.minimum_stock) return { status: "low", color: "secondary" as const, text: "منخفض" };
    return { status: "good", color: "default" as const, text: "جيد" };
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const handleStockMovement = (supply: Supply) => {
    setSelectedSupply(supply);
    setIsStockMovementOpen(true);
  };

  const handleDeleteSupply = async (supplyId: string, supplyName: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${supplyName}"؟`)) return;
    try {
      const { error } = await supabase
        .from('medical_supplies')
        .update({ is_active: false })
        .eq('id', supplyId);
      if (error) throw error;
      toast({ title: "تم الحذف", description: `تم إلغاء تفعيل "${supplyName}"` });
      invalidateAll();
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ أثناء الحذف", variant: "destructive" });
    }
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['medical-supplies'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
    queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    queryClient.invalidateQueries({ queryKey: ['low-stock-items'] });
    queryClient.invalidateQueries({ queryKey: ['expiring-items'] });
  };

  const handleSupplyCreated = () => {
    invalidateAll();
    toast({ title: "تم إضافة المستلزم", description: "تم إضافة المستلزم الطبي بنجاح" });
  };

  const handleOrderCreated = () => {
    invalidateAll();
    toast({ title: "تم إنشاء أمر الشراء", description: "تم إنشاء أمر الشراء بنجاح" });
  };

  const handleMovementRecorded = () => {
    invalidateAll();
    toast({ title: "تم تسجيل الحركة", description: "تم تسجيل حركة المخزون بنجاح" });
  };

  const activeFiltersCount = [categoryFilter !== "all", stockFilter !== "all"].filter(Boolean).length;

  return (
    <PermissionGuard requiredPermissions={['inventory.view']}>
      <PageContainer>
        <PageToolbar
          title="إدارة المخزون"
          searchQuery={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="البحث في المستلزمات..."
          showViewToggle={false}
          filterContent={
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">تصفية حسب الفئة</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفئات</SelectItem>
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">حالة المخزون</label>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="حالة المخزون" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="good">جيد</SelectItem>
                    <SelectItem value="low">منخفض</SelectItem>
                    <SelectItem value="out">نفدت</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          }
          activeFiltersCount={activeFiltersCount}
          actions={
            <div className="flex gap-2">
              <Button onClick={() => navigate('/medications?from=inventory')} variant="outline" size="sm">
                <Pill className="w-4 h-4 ml-2" />
                الأدوية
              </Button>
              <Button onClick={() => navigate('/stock-movements')} variant="outline" size="sm">
                <ArrowLeftRight className="w-4 h-4 ml-2" />
                حركة المخزون
              </Button>
              <Button onClick={() => navigate('/purchase-orders')} variant="outline" size="sm">
                <ShoppingCart className="w-4 h-4 ml-2" />
                أوامر الشراء
              </Button>
              <Button onClick={() => setIsCreateOrderOpen(true)} variant="outline">
                <Truck className="w-4 h-4 ml-2" />
                أمر شراء
              </Button>
              <Button onClick={() => setIsCreateSupplyOpen(true)}>
                <Plus className="w-4 h-4 ml-2" />
                مستلزم جديد
              </Button>
            </div>
          }
        />

        {(preselectedSupplyId || prefillName || workflowSource) && (
          <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
            {preselectedSupplyId && <span>تم تضييق العرض على صنف محدد لتتبع حالته وتوريده. </span>}
            {prefillName && <span>سيتم تجهيز نموذج مستلزم جديد ببيانات مسبقة. </span>}
            {workflowSource === 'medications' && <span>تم الوصول من شاشة الأدوية لربط الدواء بالمخزون. </span>}
            {workflowSource === 'purchase-orders' && <span>تم الوصول من شاشة أوامر الشراء لمراجعة أثر التوريد. </span>}
            {workflowSource === 'stock-movements' && <span>تم الوصول من شاشة حركة المخزون لمراجعة الصنف. </span>}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          updateWorkflowParams({ tab: value });
        }} className="space-y-6">
          <TabsList>
            <TabsTrigger value="inventory">المخزون</TabsTrigger>
            <TabsTrigger value="reports">
              <BarChart3 className="w-4 h-4 ml-2" />
              التقارير المتقدمة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الأصناف</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalItems}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">قيمة المخزون</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <CurrencyAmount amount={stats.totalValue} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">مخزون منخفض</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-500">{stats.lowStockItems}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">أصناف نفدت</CardTitle>
                  <PackageX className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{stats.outOfStockItems}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">قرب الانتهاء</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{stats.expiringItems}</div>
                </CardContent>
              </Card>
            </div>

            {/* Supplies Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>قائمة المستلزمات ({filteredSupplies.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">جاري التحميل...</div>
                ) : filteredSupplies.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">لا توجد مستلزمات</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || categoryFilter !== "all" ? 'لم يتم العثور على نتائج مطابقة' : 'لم يتم إضافة أي مستلزمات بعد'}
                    </p>
                    <Button onClick={() => setIsCreateSupplyOpen(true)}>
                      <Plus className="w-4 h-4 ml-2" /> إضافة مستلزم
                    </Button>
                  </div>
                ) : (
                  <TooltipProvider>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>اسم المستلزم</TableHead>
                          <TableHead>الفئة</TableHead>
                          <TableHead>الماركة</TableHead>
                          <TableHead>المخزون</TableHead>
                          <TableHead>الحد الأدنى</TableHead>
                          <TableHead>تكلفة الوحدة</TableHead>
                          <TableHead>المورد</TableHead>
                          <TableHead>تاريخ الانتهاء</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSupplies.map((supply) => {
                          const stockStatus = getStockStatus(supply);
                          const expiringSoon = isExpiringSoon(supply.expiry_date);
                          const expired = isExpired(supply.expiry_date);

                          return (
                            <TableRow key={supply.id} className={expired ? 'bg-destructive/5' : expiringSoon ? 'bg-orange-500/5' : ''}>
                              <TableCell className="font-medium">
                                {supply.name}
                                {supply.batch_number && (
                                  <span className="block text-xs text-muted-foreground">دفعة: {supply.batch_number}</span>
                                )}
                              </TableCell>
                              <TableCell>{CATEGORY_LABELS[supply.category] || supply.category}</TableCell>
                              <TableCell>{supply.brand || '-'}</TableCell>
                              <TableCell>
                                <span className={stockStatus.status === 'out' ? 'text-destructive font-bold' : stockStatus.status === 'low' ? 'text-orange-500 font-semibold' : ''}>
                                  {supply.current_stock}
                                </span>
                                {' '}{supply.unit}
                              </TableCell>
                              <TableCell>{supply.minimum_stock} {supply.unit}</TableCell>
                              <TableCell><CurrencyAmount amount={Number(supply.unit_cost)} /></TableCell>
                              <TableCell>
                                {supply.supplier ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="cursor-help">{supply.supplier}</span>
                                    </TooltipTrigger>
                                    {supply.supplier_contact && (
                                      <TooltipContent>{supply.supplier_contact}</TooltipContent>
                                    )}
                                  </Tooltip>
                                ) : '-'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {supply.expiry_date ? (
                                    <>
                                      <span className={expired ? 'text-destructive' : expiringSoon ? 'text-orange-500' : ''}>
                                        {format(new Date(supply.expiry_date), 'yyyy/MM/dd')}
                                      </span>
                                      {expired && <Badge variant="destructive" className="text-xs">منتهي</Badge>}
                                      {!expired && expiringSoon && <Badge variant="secondary" className="text-xs">قريب الانتهاء</Badge>}
                                    </>
                                  ) : '-'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={stockStatus.color}>{stockStatus.text}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button variant="outline" size="sm" onClick={() => handleStockMovement(supply)}>
                                    حركة سريعة
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => navigate(`/stock-movements?supply=${supply.id}&from=inventory`)}>
                                    كل الحركات
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => navigate(`/purchase-orders?supply=${supply.id}&openCreate=true&from=inventory`)}>
                                    طلب شراء
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => handleDeleteSupply(supply.id, supply.name)} className="text-destructive hover:text-destructive">
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TooltipProvider>
                )}
              </CardContent>
            </Card>

            <CreateSupplyDialog
              isOpen={isCreateSupplyOpen}
              onClose={() => {
                setIsCreateSupplyOpen(false);
                updateWorkflowParams({ openCreate: null, name: null, category: null, brand: null, from: null });
              }}
              onSupplyCreated={handleSupplyCreated}
              initialValues={{ name: prefillName, category: prefillCategory, brand: prefillBrand }}
            />

            <CreatePurchaseOrderDialog
              isOpen={isCreateOrderOpen}
              onClose={() => {
                setIsCreateOrderOpen(false);
                updateWorkflowParams({ openOrder: null, supply: null, from: null });
              }}
              onOrderCreated={handleOrderCreated}
              preselectedSupplyId={preselectedSupplyId}
            />

            {selectedSupply && (
              <StockMovementDialog
                supply={selectedSupply}
                isOpen={isStockMovementOpen}
                onClose={() => {
                  setIsStockMovementOpen(false);
                  setSelectedSupply(null);
                }}
                onMovementRecorded={handleMovementRecorded}
              />
            )}
          </TabsContent>

          <TabsContent value="reports">
            <AdvancedInventoryReports />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </PermissionGuard>
  );
}
