import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pill, Plus } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface PatientPrescriptionsProps {
  patientId: string;
}

export function PatientPrescriptions({ patientId }: PatientPrescriptionsProps) {
  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['patient-prescriptions', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">الوصفات الطبية</h3>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          وصفة جديدة
        </Button>
      </div>

      {!prescriptions || prescriptions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">لا توجد وصفات طبية</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((prescription) => (
            <Card key={prescription.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        وصفة رقم: {prescription.id.substring(0, 8)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(prescription.created_at), 'PPP', { locale: ar })}
                    </div>
                    {prescription.notes && (
                      <div className="text-sm">
                        <strong>ملاحظات:</strong> {prescription.notes}
                      </div>
                    )}
                  </div>
                  <Badge>نشطة</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
