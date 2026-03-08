import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, TrendingUp, TrendingDown, Package, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface StockMovement {
  id: string;
  movement_type: string;
  reference_type?: string;
  quantity: number;
  notes?: string;
  created_at: string;
  medical_supplies?: {
    name: string;
    unit: string;
  };
}

const StockMovements = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: profile } = useQuery({
    queryKey: ['current-profile'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_current_user_profile');
      return data;
    }
  });

  const clinicId = profile?.id;

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['stock-movements', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`*, medical_supplies(name, unit)`)
        .eq('clinic_id', clinicId!)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as StockMovement[];
    },
    enabled: !!clinicId
  });

  const filteredMovements = movements.filter(movement => {
    const matchesSearch = movement.medical_supplies?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movement.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || movement.movement_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    totalIn: movements.filter(m => m.movement_type === 'in').reduce((s, m) => s + Math.abs(m.quantity), 0),
    totalOut: movements.filter(m => m.movement_type === 'out').reduce((s, m) => s + Math.abs(m.quantity), 0),
    totalMovements: movements.length,
  };

  const getMovementBadge = (type: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
      in: { label: 'إدخال', variant: 'default' },
      out: { label: 'إخراج', variant: 'destructive' },
      adjustment: { label: 'تعديل', variant: 'secondary' },
      transfer: { label: 'تحويل', variant: 'outline' }
    };
    const info = map[type] || { label: type, variant: 'outline' as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const getReferenceLabel = (type?: string) => {
    if (!type) return null;
    const map: Record<string, string> = { purchase: 'شراء', usage: 'استخدام', waste: 'تالف', return: 'إرجاع', transfer: 'تحويل', adjustment: 'تعديل' };
    return <Badge variant="outline">{map[type] || type}</Badge>;
  };

  return (
    <PermissionGuard requiredPermissions={['inventory.view']}>
      <PageContainer>
        <PageHeader title="حركة المخزون" description="متابعة حركات الإدخال والإخراج للمواد الطبية" />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الحركات</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.totalMovements}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الوارد</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">+{stats.totalIn}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الصادر</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-destructive">-{stats.totalOut}</div></CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="البحث في حركات المخزون..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="نوع الحركة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="in">إدخال</SelectItem>
              <SelectItem value="out">إخراج</SelectItem>
              <SelectItem value="adjustment">تعديل</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Movements List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-full" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-48" />
                      <div className="h-3 bg-muted rounded w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMovements.map((movement) => (
              <Card key={movement.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        movement.movement_type === 'in' ? 'bg-green-100 dark:bg-green-900/30' :
                        movement.movement_type === 'out' ? 'bg-red-100 dark:bg-red-900/30' :
                        'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        {movement.movement_type === 'in' ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : movement.movement_type === 'out' ? (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        ) : (
                          <Package className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{movement.medical_supplies?.name}</h3>
                          {getMovementBadge(movement.movement_type)}
                          {getReferenceLabel(movement.reference_type)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}</span>
                        </div>
                        {movement.notes && (
                          <p className="text-sm text-muted-foreground mt-1 bg-muted/50 p-1.5 rounded">{movement.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-xl font-bold ${
                        movement.movement_type === 'in' ? 'text-green-600' :
                        movement.movement_type === 'out' ? 'text-destructive' :
                        'text-blue-600'
                      }`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </div>
                      <div className="text-xs text-muted-foreground">{movement.medical_supplies?.unit}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredMovements.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد حركات مخزون</h3>
              <p className="text-muted-foreground">
                {searchQuery || typeFilter !== 'all' ? 'لم يتم العثور على حركات مطابقة' : 'لم يتم تسجيل أي حركات مخزون بعد'}
              </p>
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </PermissionGuard>
  );
};

export default StockMovements;
