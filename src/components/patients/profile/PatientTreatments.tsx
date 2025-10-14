import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Plus } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface PatientTreatmentsProps {
  patientId: string;
}

export function PatientTreatments({ patientId }: PatientTreatmentsProps) {
  const { data: treatments, isLoading } = useQuery({
    queryKey: ['patient-treatments', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dental_treatments')
        .select('*')
        .eq('patient_id', patientId)
        .order('treatment_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned': return 'مخطط';
      case 'in_progress': return 'قيد التنفيذ';
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
        <h3 className="text-lg font-semibold">العلاجات</h3>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          إضافة علاج جديد
        </Button>
      </div>

      {!treatments || treatments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">لا توجد علاجات مسجلة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {treatments.map((treatment) => (
            <Card key={treatment.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        السن: {treatment.tooth_number} ({treatment.numbering_system})
                      </span>
                    </div>
                    <div className="text-sm">
                      <strong>التشخيص:</strong> {treatment.diagnosis}
                    </div>
                    <div className="text-sm">
                      <strong>خطة العلاج:</strong> {treatment.treatment_plan}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(treatment.treatment_date), 'PPP', { locale: ar })}
                    </div>
                    {treatment.notes && (
                      <div className="text-sm text-muted-foreground">
                        <strong>ملاحظات:</strong> {treatment.notes}
                      </div>
                    )}
                  </div>
                  <Badge className={getStatusColor(treatment.status)}>
                    {getStatusText(treatment.status)}
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
