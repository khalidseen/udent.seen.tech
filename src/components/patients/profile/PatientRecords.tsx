import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface PatientRecordsProps {
  patientId: string;
}

export function PatientRecords({ patientId }: PatientRecordsProps) {
  const { data: records, isLoading } = useQuery({
    queryKey: ['patient-records', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('treatment_date', { ascending: false });
      
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
        <h3 className="text-lg font-semibold">السجلات الطبية</h3>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          سجل جديد
        </Button>
      </div>

      {!records || records.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">لا توجد سجلات طبية</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <Card key={record.id}>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium">{record.title}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(record.treatment_date), 'PPP', { locale: ar })}
                  </div>
                  {record.diagnosis && (
                    <div className="text-sm">
                      <strong>التشخيص:</strong> {record.diagnosis}
                    </div>
                  )}
                  {record.treatment_plan && (
                    <div className="text-sm">
                      <strong>خطة العلاج:</strong> {record.treatment_plan}
                    </div>
                  )}
                  {record.notes && (
                    <div className="text-sm text-muted-foreground">
                      <strong>ملاحظات:</strong> {record.notes}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
