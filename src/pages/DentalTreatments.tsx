import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, Activity, Calendar, User } from "lucide-react";
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

interface DentalTreatment {
  id: string;
  tooth_number: string;
  tooth_surface?: string;
  diagnosis: string;
  treatment_plan: string;
  treatment_date: string;
  status: string;
  numbering_system: string;
  notes?: string;
  created_at: string;
  patients?: {
    full_name: string;
  };
}

const DentalTreatments = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const { data: treatments = [], isLoading, refetch } = useQuery({
    queryKey: ['dental-treatments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dental_treatments')
        .select(`
          *,
          patients(full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DentalTreatment[];
    }
  });

  const filteredTreatments = treatments.filter(treatment =>
    treatment.patients?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    treatment.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
    treatment.treatment_plan.toLowerCase().includes(searchQuery.toLowerCase()) ||
    treatment.tooth_number.includes(searchQuery)
  );

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العلاج؟')) return;
    
    try {
      const { error } = await supabase.from('dental_treatments').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('تم حذف العلاج بنجاح');
      refetch();
    } catch (error) {
      console.error('Error deleting treatment:', error);
      toast.error('حدث خطأ في حذف العلاج');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      planned: { label: 'مخطط', variant: 'secondary' as const },
      in_progress: { label: 'قيد التنفيذ', variant: 'default' as const },
      completed: { label: 'مكتمل', variant: 'default' as const },
      cancelled: { label: 'ملغي', variant: 'destructive' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getToothDisplay = (toothNumber: string, surface?: string, system: string = 'universal') => {
    const systemLabels = {
      universal: 'عالمي',
      palmer: 'بالمر',
      fdi: 'FDI'
    };
    
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {toothNumber}
          {surface && ` (${surface})`}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {systemLabels[system as keyof typeof systemLabels] || system}
        </span>
      </div>
    );
  };

  return (
    <PageContainer>
      <PageHeader 
        title="علاجات الأسنان"
        description="إدارة ومتابعة علاجات الأسنان والخطط العلاجية"
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="البحث في العلاجات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button>
          <Plus className="w-4 h-4 ml-2" />
          إضافة علاج جديد
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
          {filteredTreatments.map((treatment) => (
            <Card key={treatment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{treatment.diagnosis}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {treatment.patients?.full_name}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(treatment.status)}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <div>
                      {getToothDisplay(treatment.tooth_number, treatment.tooth_surface, treatment.numbering_system)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{format(new Date(treatment.treatment_date), 'dd/MM/yyyy', { locale: ar })}</span>
                  </div>
                  
                  <div className="text-sm">
                    <div className="font-medium mb-1">خطة العلاج:</div>
                    <div className="text-muted-foreground bg-muted/50 p-2 rounded text-xs">
                      {treatment.treatment_plan}
                    </div>
                  </div>
                  
                  {treatment.notes && (
                    <div className="text-sm">
                      <div className="font-medium mb-1">ملاحظات:</div>
                      <div className="text-muted-foreground bg-muted/50 p-2 rounded text-xs">
                        {treatment.notes}
                      </div>
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
                    onClick={() => handleDelete(treatment.id)}
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

      {!isLoading && filteredTreatments.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد علاجات</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'لم يتم العثور على علاجات مطابقة للبحث' : 'لم يتم إضافة أي علاجات بعد'}
            </p>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              إضافة أول علاج
            </Button>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
};

export default DentalTreatments;