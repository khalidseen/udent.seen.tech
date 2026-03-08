import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Activity as TreatmentIcon,
  Plus,
  Search,
  Filter,
  FileText,
  Clock,
  DollarSign,
  Users,
  Calendar,
  User,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface DentalTreatment {
  id: string;
  patient_id: string;
  tooth_number: string;
  diagnosis: string;
  treatment_plan: string;
  status: string;
  treatment_date: string;
  numbering_system: string;
  tooth_surface: string | null;
  notes: string | null;
  created_at: string;
  patients?: {
    id: string;
    full_name: string;
    phone: string | null;
  };
  doctors?: {
    full_name: string;
  } | null;
}

const DentalTreatmentsManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Get clinic ID
  const { data: profile } = useQuery({
    queryKey: ['current-profile'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_current_user_profile');
      return data;
    }
  });

  const clinicId = profile?.id;

  // Fetch real treatments from DB
  const { data: treatments, isLoading } = useQuery({
    queryKey: ['dental-treatments', clinicId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('dental_treatments')
        .select(`
          *,
          patients (id, full_name, phone),
          doctors (full_name)
        `)
        .eq('clinic_id', clinicId!)
        .order('treatment_date', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DentalTreatment[];
    },
    enabled: !!clinicId
  });

  // Real stats from data
  const stats = {
    total: treatments?.length || 0,
    active: treatments?.filter(t => t.status === 'in_progress' || t.status === 'planned').length || 0,
    completed: treatments?.filter(t => t.status === 'completed').length || 0,
    uniquePatients: new Set(treatments?.map(t => t.patient_id)).size
  };

  const filteredTreatments = treatments?.filter(t =>
    t.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.treatment_plan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.tooth_number?.includes(searchTerm)
  ) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="gap-1"><CheckCircle className="w-3 h-3" />مكتمل</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="gap-1"><Clock className="w-3 h-3" />قيد التنفيذ</Badge>;
      case 'planned':
        return <Badge variant="outline" className="gap-1"><AlertCircle className="w-3 h-3" />مخطط</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />ملغي</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="العلاجات السنية"
        description="إدارة شاملة لجميع العلاجات السنية المسجلة للمرضى"
      />

      <div className="space-y-6">
        {/* Stats Cards - Real Data */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي العلاجات</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <TreatmentIcon className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">علاجات نشطة</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
                <Clock className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">مكتملة</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">المرضى المعالجين</p>
                  <p className="text-2xl font-bold">{stats.uniquePatients}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="البحث عن علاج، مريض، سن..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="planned">مخطط</SelectItem>
              <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
              <SelectItem value="cancelled">ملغي</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => navigate('/appointments/new')}>
            <Plus className="h-4 w-4 ml-2" />
            موعد علاج جديد
          </Button>
        </div>

        {/* Treatments List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTreatments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <TreatmentIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                لا توجد علاجات مسجلة
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                ابدأ بتسجيل علاج جديد من ملف المريض أو من صفحة المواعيد
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => navigate('/patients')}>
                  <Users className="w-4 h-4 ml-2" />
                  قائمة المرضى
                </Button>
                <Button variant="outline" onClick={() => navigate('/appointments')}>
                  <Calendar className="w-4 h-4 ml-2" />
                  المواعيد
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTreatments.map((treatment) => (
              <Card key={treatment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <button
                        className="font-semibold text-primary hover:underline"
                        onClick={() => treatment.patients?.id && navigate(`/patients/${treatment.patients.id}`)}
                      >
                        {treatment.patients?.full_name || 'مريض غير محدد'}
                      </button>
                    </div>
                    {getStatusBadge(treatment.status)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">سن #{treatment.tooth_number}</Badge>
                      {treatment.tooth_surface && (
                        <Badge variant="outline" className="text-xs">سطح: {treatment.tooth_surface}</Badge>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground">التشخيص: </span>
                      <span>{treatment.diagnosis}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">خطة العلاج: </span>
                      <span>{treatment.treatment_plan}</span>
                    </div>
                    {treatment.doctors?.full_name && (
                      <div>
                        <span className="text-muted-foreground">الطبيب: </span>
                        <span>{treatment.doctors.full_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(treatment.treatment_date), 'dd MMMM yyyy', { locale: ar })}
                    </div>
                    {treatment.notes && (
                      <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mt-1">
                        {treatment.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => treatment.patients?.id && navigate(`/patients/${treatment.patients.id}?tab=dental`)}
                    >
                      <ExternalLink className="w-3 h-3 ml-1" />
                      ملف المريض
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/appointments/new?patient=${treatment.patient_id}`)}
                    >
                      <Calendar className="w-3 h-3 ml-1" />
                      حجز موعد
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default DentalTreatmentsManagement;
