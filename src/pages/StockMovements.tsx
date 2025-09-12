import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, TrendingUp, TrendingDown, Package, Calendar, User } from "lucide-react";
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

interface StockMovement {
  id: string;
  movement_type: string;
  reference_type?: string;
  reference_id?: string;
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
  const { user } = useAuth();

  const { data: movements = [], isLoading, refetch } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          medical_supplies(name, unit)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as StockMovement[];
    }
  });

  const filteredMovements = movements.filter(movement =>
    movement.medical_supplies?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    movement.movement_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    movement.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMovementBadge = (type: string) => {
    const typeMap = {
      in: { label: 'إدخال', variant: 'default' as const, icon: TrendingUp },
      out: { label: 'إخراج', variant: 'destructive' as const, icon: TrendingDown },
      adjustment: { label: 'تعديل', variant: 'secondary' as const, icon: Package },
      transfer: { label: 'تحويل', variant: 'outline' as const, icon: Package }
    };
    
    const typeInfo = typeMap[type as keyof typeof typeMap] || { 
      label: type, 
      variant: 'outline' as const, 
      icon: Package 
    };
    
    const Icon = typeInfo.icon;
    
    return (
      <Badge variant={typeInfo.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {typeInfo.label}
      </Badge>
    );
  };

  const getReferenceTypeBadge = (type?: string) => {
    if (!type) return null;
    
    const typeMap = {
      purchase_order: { label: 'أمر شراء', variant: 'outline' as const },
      treatment: { label: 'علاج', variant: 'secondary' as const },
      adjustment: { label: 'تعديل', variant: 'outline' as const },
      return: { label: 'إرجاع', variant: 'outline' as const }
    };
    
    const typeInfo = typeMap[type as keyof typeof typeMap] || { 
      label: type, 
      variant: 'outline' as const 
    };
    
    return <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>;
  };

  return (
    <PageContainer>
      <PageHeader 
        title="حركة المخزون"
        description="متابعة حركات الإدخال والإخراج للمواد الطبية"
      />

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
        <Button>
          <Plus className="w-4 h-4 ml-2" />
          تسجيل حركة جديدة
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-48"></div>
                      <div className="h-3 bg-muted rounded w-32"></div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="h-4 bg-muted rounded w-20"></div>
                    <div className="h-3 bg-muted rounded w-16"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMovements.map((movement) => (
            <Card key={movement.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      movement.movement_type === 'in' 
                        ? 'bg-green-100' 
                        : movement.movement_type === 'out' 
                        ? 'bg-red-100' 
                        : 'bg-blue-100'
                    }`}>
                      {movement.movement_type === 'in' ? (
                        <TrendingUp className={`w-6 h-6 ${
                          movement.movement_type === 'in' ? 'text-green-600' : 'text-blue-600'
                        }`} />
                      ) : movement.movement_type === 'out' ? (
                        <TrendingDown className="w-6 h-6 text-red-600" />
                      ) : (
                        <Package className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {movement.medical_supplies?.name}
                        </h3>
                        {getMovementBadge(movement.movement_type)}
                        {getReferenceTypeBadge(movement.reference_type)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}</span>
                        </div>
                      </div>
                      
                      {movement.notes && (
                        <div className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          {movement.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      movement.movement_type === 'in' 
                        ? 'text-green-600' 
                        : movement.movement_type === 'out' 
                        ? 'text-red-600' 
                        : 'text-blue-600'
                    }`}>
                      {movement.movement_type === 'out' ? '-' : '+'}{movement.quantity}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {movement.medical_supplies?.unit}
                    </div>
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
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'لم يتم العثور على حركات مطابقة للبحث' : 'لم يتم تسجيل أي حركات مخزون بعد'}
            </p>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              تسجيل أول حركة
            </Button>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
};

export default StockMovements;