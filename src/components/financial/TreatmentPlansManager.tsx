import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export function TreatmentPlansManager() {
  const { data: treatmentPlans, isLoading } = useQuery({
    queryKey: ['treatment-plans'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // جلب خطط العلاج من جدول dental_treatments
      const { data, error } = await supabase
        .from('dental_treatments')
        .select(`
          *,
          patients!inner (full_name)
        `)
        .eq('clinic_id', profile.id)
        .eq('status', 'planned')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">خطط العلاج المالية</h3>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          خطة جديدة
        </Button>
      </div>

      {!treatmentPlans || treatmentPlans.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              لا توجد خطط علاج مالية. قم بإنشاء خطة جديدة للبدء.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {treatmentPlans.map((plan) => (
            <Card key={plan.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {plan.patients?.full_name || 'مريض غير محدد'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <strong>التشخيص:</strong> {plan.diagnosis}
                    </div>
                    <div className="text-sm">
                      <strong>خطة العلاج:</strong> {plan.treatment_plan}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      تاريخ العلاج: {format(new Date(plan.treatment_date), 'PPP', { locale: ar })}
                    </div>
                  </div>
                  <Badge className={getStatusColor(plan.status)}>
                    {getStatusText(plan.status)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
