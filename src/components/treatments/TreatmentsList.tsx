import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Activity, Search, Filter, Edit, Trash2, Calendar, User, Circle } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Treatment {
  id: string;
  patient_id: string;
  tooth_number: string;
  tooth_surface?: string;
  numbering_system: string;
  diagnosis: string;
  treatment_plan: string;
  treatment_date: string;
  status: string;
  notes?: string;
  created_at: string;
  patients: {
    full_name: string;
  };
}

interface TreatmentsListProps {
  patientId?: string;
  onEditTreatment?: (treatment: Treatment) => void;
  refreshTrigger?: number;
}

const TreatmentsList = ({ patientId, onEditTreatment, refreshTrigger }: TreatmentsListProps) => {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchTreatments = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('dental_treatments')
        .select(`
          *,
          patients(full_name)
        `)
        .order('treatment_date', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTreatments(data || []);
    } catch (error) {
      console.error('Error fetching treatments:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحميل العلاجات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchTreatments();
  }, [patientId, refreshTrigger, fetchTreatments]);

  const handleDeleteTreatment = async (treatmentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العلاج؟')) return;

    try {
      const { error } = await supabase
        .from('dental_treatments')
        .delete()
        .eq('id', treatmentId);

      if (error) throw error;

      toast({
        title: 'تم الحذف',
        description: 'تم حذف العلاج بنجاح'
      });

      fetchTreatments();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      planned: { label: 'مخطط', variant: 'outline' as const },
      in_progress: { label: 'قيد التنفيذ', variant: 'default' as const },
      completed: { label: 'مكتمل', variant: 'secondary' as const },
      cancelled: { label: 'ملغي', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { label: status, variant: 'outline' as const };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredTreatments = treatments.filter(treatment => {
    const matchesSearch = 
      treatment.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      treatment.treatment_plan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      treatment.tooth_number.includes(searchTerm) ||
      treatment.patients.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || treatment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">جاري تحميل العلاجات...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            العلاجات المسجلة
            <Badge variant="secondary" className="ml-auto">
              {filteredTreatments.length} علاج
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في العلاجات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 ml-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="planned">مخطط</SelectItem>
                  <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Treatments List */}
      <div className="space-y-4">
        {filteredTreatments.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" 
                  ? 'لا توجد علاجات تطابق المرشحات' 
                  : 'لا توجد علاجات مسجلة بعد'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTreatments.map((treatment) => (
            <Card key={treatment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <div>
                      <h3 className="font-semibold text-lg">{treatment.treatment_plan}</h3>
                      <p className="text-sm text-muted-foreground">
                        {treatment.diagnosis}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(treatment.status)}
                    <div className="flex gap-1">
                      {onEditTreatment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditTreatment(treatment)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTreatment(treatment.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {!patientId && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">المريض:</span>
                      <span>{treatment.patients.full_name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Circle className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">السن:</span>
                    <span>
                      {treatment.tooth_number}
                      {treatment.tooth_surface && ` (${treatment.tooth_surface})`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">التاريخ:</span>
                    <span>
                      {format(new Date(treatment.treatment_date), 'dd/MM/yyyy', { locale: ar })}
                    </span>
                  </div>
                </div>

                {treatment.notes && (
                  <div className="mt-4 p-3 bg-accent rounded-lg">
                    <p className="text-sm">
                      <span className="font-medium">ملاحظات:</span> {treatment.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TreatmentsList;
