import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateSupplyDialog } from "@/components/inventory/CreateSupplyDialog";
import { CreatePurchaseOrderDialog } from "@/components/inventory/CreatePurchaseOrderDialog";
import { StockMovementDialog } from "@/components/inventory/StockMovementDialog";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Package, AlertTriangle, Truck, Search, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { AdvancedInventoryReports } from "@/components/inventory/AdvancedInventoryReports";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  expiry_date?: string;
  is_active: boolean;
}

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isCreateSupplyOpen, setIsCreateSupplyOpen] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [isStockMovementOpen, setIsStockMovementOpen] = useState(false);
  const { toast } = useToast();

  const { data: supplies, isLoading, refetch } = useQuery({
    queryKey: ['medical-supplies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_supplies')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Supply[];
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_supplies')
        .select('current_stock, minimum_stock, unit_cost')
        .eq('is_active', true);

      if (error) throw error;

      const totalItems = data.length;
      const lowStockItems = data.filter(item => item.current_stock <= item.minimum_stock).length;
      const totalValue = data.reduce((sum, item) => sum + (item.current_stock * Number(item.unit_cost)), 0);
      const outOfStockItems = data.filter(item => item.current_stock === 0).length;

      return { totalItems, lowStockItems, totalValue, outOfStockItems };
    }
  });

  const filteredSupplies = supplies?.filter(supply => {
    const matchesSearch = supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supply.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supply.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || supply.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (supply: Supply) => {
    if (supply.current_stock === 0) return { status: "out", color: "bg-destructive text-destructive-foreground", text: "نفدت" };
    if (supply.current_stock <= supply.minimum_stock) return { status: "low", color: "bg-warning text-warning-foreground", text: "منخفض" };
    return { status: "good", color: "bg-success text-success-foreground", text: "جيد" };
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow;
  };

  const handleStockMovement = (supply: Supply) => {
    setSelectedSupply(supply);
    setIsStockMovementOpen(true);
  };

  const handleSupplyCreated = () => {
    refetch();
    toast({
      title: "تم إضافة المستلزم",
      description: "تم إضافة المستلزم الطبي بنجاح",
    });
  };

  const handleOrderCreated = () => {
    toast({
      title: "تم إنشاء أمر الشراء",
      description: "تم إنشاء أمر الشراء بنجاح",
    });
  };

  const handleMovementRecorded = () => {
    refetch();
    toast({
      title: "تم تسجيل الحركة",
      description: "تم تسجيل حركة المخزون بنجاح",
    });
  };

  return (
    <PageContainer>
      <PageHeader 
        title="إدارة المخزون"
        description="تتبع المستلزمات والأدوات الطبية"
        action={
          <div className="flex gap-2">
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

      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList>
          <TabsTrigger value="inventory">المخزون</TabsTrigger>
          <TabsTrigger value="reports">
            <BarChart3 className="w-4 h-4 ml-2" />
            التقارير المتقدمة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأصناف</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيمة المخزون</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalValue?.toFixed(2) || '0.00'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أصناف منخفضة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats?.lowStockItems || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أصناف نفدت</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.outOfStockItems || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في المستلزمات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="تصفية حسب الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                <SelectItem value="instruments">أدوات</SelectItem>
                <SelectItem value="materials">مواد</SelectItem>
                <SelectItem value="medications">أدوية</SelectItem>
                <SelectItem value="disposables">مستهلكات</SelectItem>
                <SelectItem value="equipment">معدات</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Supplies Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستلزمات</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المستلزم</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>الماركة</TableHead>
                  <TableHead>المخزون الحالي</TableHead>
                  <TableHead>الحد الأدنى</TableHead>
                  <TableHead>تكلفة الوحدة</TableHead>
                  <TableHead>المورد</TableHead>
                  <TableHead>تاريخ الانتهاء</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSupplies?.map((supply) => {
                  const stockStatus = getStockStatus(supply);
                  const expiringSoon = isExpiringSoon(supply.expiry_date);
                  
                  return (
                    <TableRow key={supply.id}>
                      <TableCell className="font-medium">{supply.name}</TableCell>
                      <TableCell>{supply.category}</TableCell>
                      <TableCell>{supply.brand || '-'}</TableCell>
                      <TableCell>{supply.current_stock} {supply.unit}</TableCell>
                      <TableCell>{supply.minimum_stock} {supply.unit}</TableCell>
                      <TableCell>${Number(supply.unit_cost).toFixed(2)}</TableCell>
                      <TableCell>{supply.supplier || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {supply.expiry_date ? format(new Date(supply.expiry_date), 'yyyy/MM/dd') : '-'}
                          {expiringSoon && (
                            <Badge variant="destructive" className="text-xs">
                              قريب الانتهاء
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={stockStatus.color}>
                          {stockStatus.text}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStockMovement(supply)}
                        >
                          حركة مخزون
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateSupplyDialog
        isOpen={isCreateSupplyOpen}
        onClose={() => setIsCreateSupplyOpen(false)}
        onSupplyCreated={handleSupplyCreated}
      />

      <CreatePurchaseOrderDialog
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        onOrderCreated={handleOrderCreated}
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
  );
}