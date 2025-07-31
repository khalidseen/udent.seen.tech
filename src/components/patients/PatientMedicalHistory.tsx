import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Plus, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Treatment {
  id: string;
  tooth_number: string;
  tooth_surface: string;
  diagnosis: string;
  treatment_plan: string;
  treatment_date: string;
  status: string;
  notes: string;
  created_at: string;
}

interface PatientMedicalHistoryProps {
  patientId: string;
}

const PatientMedicalHistory = ({ patientId }: PatientMedicalHistoryProps) => {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetchTreatments();
  }, [patientId]);

  const fetchTreatments = async () => {
    try {
      const { data, error } = await supabase
        .from('dental_treatments')
        .select('*')
        .eq('patient_id', patientId)
        .order('treatment_date', { ascending: false });

      if (error) throw error;
      setTreatments(data || []);
    } catch (error) {
      console.error('Error fetching treatments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      planned: { label: 'مخطط', variant: 'secondary' as const },
      in_progress: { label: 'قيد التنفيذ', variant: 'default' as const },
      completed: { label: 'مكتمل', variant: 'default' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { label: status, variant: 'outline' as const };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredTreatments = treatments.filter(treatment => {
    const matchesSearch = 
      treatment.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      treatment.treatment_plan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      treatment.tooth_number.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || treatment.status === statusFilter;
    const matchesType = typeFilter === "all" || treatment.treatment_plan.includes(typeFilter);
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return <div className="text-center">جاري تحميل العلاجات...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{treatments.length}</div>
            <div className="text-sm text-muted-foreground">إجمالي العلاجات</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {treatments.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-sm text-muted-foreground">علاجات مكتملة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {treatments.filter(t => t.status === 'in_progress').length}
            </div>
            <div className="text-sm text-muted-foreground">قيد التنفيذ</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {treatments.filter(t => t.status === 'planned').length}
            </div>
            <div className="text-sm text-muted-foreground">مخططة</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="البحث في العلاجات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="حالة العلاج" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="planned">مخطط</SelectItem>
                <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="نوع العلاج" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="حشو">حشو</SelectItem>
                <SelectItem value="خلع">خلع</SelectItem>
                <SelectItem value="علاج عصب">علاج عصب</SelectItem>
                <SelectItem value="تنظيف">تنظيف</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Add New Treatment */}
      <Card>
        <CardContent className="p-4">
          <Button className="w-full md:w-auto">
            <Plus className="w-4 h-4 ml-2" />
            إضافة علاج جديد
          </Button>
        </CardContent>
      </Card>

      {/* Treatments List */}
      <div className="space-y-4">
        {filteredTreatments.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all" 
                  ? 'لا توجد علاجات تطابق المرشحات' 
                  : 'لا توجد علاجات مسجلة لهذا المريض'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTreatments.map((treatment) => (
            <Card key={treatment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    السن رقم {treatment.tooth_number}
                    {treatment.tooth_surface && ` - ${treatment.tooth_surface}`}
                  </CardTitle>
                  {getStatusBadge(treatment.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">التشخيص</p>
                    <p className="font-medium">{treatment.diagnosis}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">خطة العلاج</p>
                    <p className="font-medium">{treatment.treatment_plan}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">تاريخ العلاج</p>
                    <p className="font-medium">
                      {format(new Date(treatment.treatment_date), 'yyyy/MM/dd', { locale: ar })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">تاريخ الإضافة</p>
                    <p className="font-medium">
                      {format(new Date(treatment.created_at), 'yyyy/MM/dd', { locale: ar })}
                    </p>
                  </div>
                </div>
                {treatment.notes && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">ملاحظات</p>
                    <p className="text-sm bg-muted/50 p-2 rounded">{treatment.notes}</p>
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

export default PatientMedicalHistory;