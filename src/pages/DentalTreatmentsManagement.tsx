import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TreatmentFormDialog } from "@/components/treatments/TreatmentFormDialog";
import { TreatmentAdvancedFilters } from "@/components/treatments/TreatmentAdvancedFilters";
import { CreateRecordDialog } from "@/components/medical-records/CreateRecordDialog";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import {
  applyAdvancedFilters,
  buildTreatmentStats,
  resolveTreatmentPageMeta,
  DEFAULT_ADVANCED_FILTERS,
  type AdvancedTreatmentFilters,
} from "@/pages/dentalTreatmentsManagement.helpers";
import { formatToothSurface } from "@/utils/dentalChart";
import { treatmentService, type Treatment } from "@/services/treatmentService";
import {
  Activity as TreatmentIcon,
  Plus,
  FileText,
  Clock,
  DollarSign,
  Users,
  Calendar,
  User,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCcw,
  Trash2,
  Pencil,
  UserRound,
  Package,
  ArrowLeftRight,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "planned", label: "مخطط" },
  { value: "in_progress", label: "قيد التنفيذ" },
  { value: "completed", label: "مكتمل" },
  { value: "cancelled", label: "ملغي" },
];

const DentalTreatmentsManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("patient") || undefined;
  const doctorId = searchParams.get("doctor") || undefined;

  const [filters, setFilters] = useState<AdvancedTreatmentFilters>(DEFAULT_ADVANCED_FILTERS);
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [recordTreatment, setRecordTreatment] = useState<Treatment | null>(null);

  const { hasAnyPermission } = usePermissions();
  const canCreate = hasAnyPermission(["treatments.create", "dental_treatments.create", "medical_records.create"]);
  const canEdit = hasAnyPermission(["treatments.edit", "dental_treatments.edit", "medical_records.edit"]);

  const { data: profile } = useQuery({
    queryKey: ["current-profile"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_current_user_profile");
      if (error) throw error;
      return data;
    },
  });

  const clinicId = profile?.id;

  const { data: patientContext } = useQuery({
    queryKey: ["treatment-context-patient", patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("id, full_name, phone").eq("id", patientId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  const { data: doctorContext } = useQuery({
    queryKey: ["treatment-context-doctor", doctorId],
    queryFn: async () => {
      const { data, error } = await supabase.from("doctors").select("id, full_name").eq("id", doctorId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!doctorId,
  });

  const {
    data: treatments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["treatments-management", clinicId, patientId, doctorId],
    queryFn: async () => treatmentService.getAll({ patientId, doctorId }),
    enabled: !!clinicId,
  });

  const invalidateTreatmentQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["treatments-management"] }),
      queryClient.invalidateQueries({ queryKey: ["patient-treatments"] }),
      queryClient.invalidateQueries({ queryKey: ["patient-stats"] }),
      queryClient.invalidateQueries({ queryKey: ["patient-workflow"] }),
      queryClient.invalidateQueries({ queryKey: ["doctor-treatments"] }),
      queryClient.invalidateQueries({ queryKey: ["treatment-plans"] }),
      queryClient.invalidateQueries({ queryKey: ["treatment-plans-financial"] }),
      queryClient.invalidateQueries({ queryKey: ["invoices"] }),
    ]);
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => treatmentService.updateStatus(id, status),
    onSuccess: async () => {
      toast.success("تم تحديث حالة العلاج");
      await invalidateTreatmentQueries();
    },
    onError: (mutationError: any) => {
      toast.error(mutationError?.message || "تعذر تحديث حالة العلاج");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => treatmentService.remove(id),
    onSuccess: async () => {
      toast.success("تم حذف العلاج");
      await invalidateTreatmentQueries();
    },
    onError: (mutationError: any) => {
      toast.error(mutationError?.message || "تعذر حذف العلاج");
    },
  });

  const filteredTreatments = useMemo(
    () => applyAdvancedFilters(treatments, filters),
    [treatments, filters]
  );

  const stats = useMemo(() => buildTreatmentStats(treatments), [treatments]);

  const pageMeta = useMemo(
    () => resolveTreatmentPageMeta(patientContext?.full_name, doctorContext?.full_name),
    [doctorContext?.full_name, patientContext?.full_name]
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary" className="gap-1"><CheckCircle className="w-3 h-3" />مكتمل</Badge>;
      case "in_progress":
        return <Badge variant="default" className="gap-1"><Clock className="w-3 h-3" />قيد التنفيذ</Badge>;
      case "planned":
        return <Badge variant="outline" className="gap-1"><AlertCircle className="w-3 h-3" />مخطط</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />ملغي</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openCreateDialog = () => {
    setSelectedTreatment(null);
    setTreatmentDialogOpen(true);
  };

  const openEditDialog = (treatment: Treatment) => {
    setSelectedTreatment(treatment);
    setTreatmentDialogOpen(true);
  };

  const openRecordForTreatment = (treatment: Treatment) => {
    setRecordTreatment(treatment);
    setRecordDialogOpen(true);
  };

  if (isError) {
    return (
      <PageContainer>
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
            <div>
              <h3 className="text-lg font-semibold">تعذر تحميل العلاجات</h3>
              <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message || "حدث خطأ غير متوقع أثناء جلب البيانات"}</p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCcw className="w-4 h-4 ml-2" />
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PermissionGuard requiredPermissions={["treatments.view", "dental_treatments.view"]}>
      <PageContainer>
        <PageHeader
          title={pageMeta.title}
          description={pageMeta.description}
          action={
            <>
              {(patientId || doctorId) && (
                <Button variant="outline" onClick={() => navigate("/dental-treatments-management")}>
                  عرض الكل
                </Button>
              )}
              {canCreate && (
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 ml-2" />
                  علاج جديد
                </Button>
              )}
            </>
          }
        />

        <div className="space-y-6 mt-6">
          {(patientContext || doctorContext) && (
            <div className="flex flex-wrap gap-2">
              {patientContext && (
                <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                  <UserRound className="w-3.5 h-3.5" />
                  المريض: {patientContext.full_name}
                </Badge>
              )}
              {doctorContext && (
                <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                  <User className="w-3.5 h-3.5" />
                  الطبيب: {doctorContext.full_name}
                </Badge>
              )}
            </div>
          )}

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
                    <p className="text-sm text-muted-foreground">مرضى مميزون</p>
                    <p className="text-2xl font-bold">{stats.uniquePatients}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          <TreatmentAdvancedFilters
            filters={filters}
            onChange={setFilters}
            clinicId={clinicId}
          />

          {isLoading ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {[...Array(4)].map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-6 space-y-3">
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                    <div className="h-9 bg-muted rounded w-full mt-4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTreatments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <TreatmentIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">لا توجد علاجات مطابقة</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {filters.searchTerm.trim() || filters.status !== "all" || filters.doctorId !== "all" || filters.toothNumber || filters.period !== "all"
                    ? "غيّر معايير الفلترة لرؤية نتائج أخرى"
                    : "ابدأ بإضافة علاج جديد أو افتح الصفحة من سياق مريض أو طبيب محدد"}
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {canCreate && (
                    <Button onClick={openCreateDialog}>
                      <Plus className="w-4 h-4 ml-2" />
                      إنشاء علاج
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => navigate("/patients")}>
                    <Users className="w-4 h-4 ml-2" />
                    قائمة المرضى
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredTreatments.map((treatment) => (
                <Card key={treatment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <User className="w-4 h-4 text-muted-foreground shrink-0" />
                          <button
                            className="font-semibold text-primary hover:underline truncate"
                            onClick={() => navigate(`/patients/${treatment.patient_id}?tab=treatments`)}
                          >
                            {treatment.patient?.full_name || "مريض غير محدد"}
                          </button>
                        </div>
                        {treatment.doctor?.full_name && (
                          <div className="text-sm text-muted-foreground">الطبيب: {treatment.doctor.full_name}</div>
                        )}
                      </div>
                      {getStatusBadge(treatment.status)}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">سن #{treatment.tooth_number}</Badge>
                      {treatment.tooth_surface && (
                        <Badge variant="outline">سطح: {formatToothSurface(treatment.tooth_surface)}</Badge>
                      )}
                      {treatment.numbering_system && <Badge variant="outline">{treatment.numbering_system.toUpperCase()}</Badge>}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">التشخيص: </span>
                        <span>{treatment.diagnosis}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">خطة العلاج: </span>
                        <span>{treatment.treatment_plan}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(treatment.treatment_date), "dd MMMM yyyy", { locale: ar })}
                      </div>
                      {treatment.notes && (
                        <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">{treatment.notes}</div>
                      )}
                    </div>

                    {canEdit && (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">تغيير حالة العلاج</div>
                        <Select
                          value={treatment.status}
                          onValueChange={(value) => updateStatusMutation.mutate({ id: treatment.id, status: value })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/patients/${treatment.patient_id}?tab=treatments`)}>
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                        ملف المريض
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/invoice-management?patient=${treatment.patient_id}&treatment=${treatment.id}&openCreate=true`)}>
                        <DollarSign className="w-3.5 h-3.5 ml-1" />
                        فاتورة
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/appointments/new?patient=${treatment.patient_id}`)}>
                        <Calendar className="w-3.5 h-3.5 ml-1" />
                        موعد جديد
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/prescriptions?patient=${treatment.patient_id}`)}>
                        <FileText className="w-3.5 h-3.5 ml-1" />
                        وصفة
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/inventory?from=treatments`)}>
                        <Package className="w-3.5 h-3.5 ml-1" />
                        المخزون
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/stock-movements?reference=usage&from=treatments`)}>
                        <ArrowLeftRight className="w-3.5 h-3.5 ml-1" />
                        حركات
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openRecordForTreatment(treatment)}>
                        <FileText className="w-3.5 h-3.5 ml-1" />
                        سجل طبي
                      </Button>
                      {canEdit && (
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(treatment)}>
                          <Pencil className="w-3.5 h-3.5 ml-1" />
                          تعديل
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("هل أنت متأكد من حذف هذا العلاج؟")) {
                              deleteMutation.mutate(treatment.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 ml-1" />
                          حذف
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <TreatmentFormDialog
          open={treatmentDialogOpen}
          onOpenChange={setTreatmentDialogOpen}
          clinicId={clinicId}
          treatment={selectedTreatment}
          preselectedPatientId={patientId}
          onSaved={invalidateTreatmentQueries}
        />

        <CreateRecordDialog
          isOpen={recordDialogOpen}
          onClose={() => setRecordDialogOpen(false)}
          onRecordCreated={async () => {
            toast.success("تم إنشاء السجل الطبي");
            if (recordTreatment?.patient_id) {
              await queryClient.invalidateQueries({ queryKey: ["patient-records", recordTreatment.patient_id] });
            }
          }}
          preselectedPatientId={recordTreatment?.patient_id || patientId}
          initialValues={recordTreatment ? {
            recordType: "treatment",
            title: `علاج سن ${recordTreatment.tooth_number}`,
            diagnosis: recordTreatment.diagnosis,
            treatmentPlan: recordTreatment.treatment_plan,
            notes: recordTreatment.notes || "",
            treatmentDate: recordTreatment.treatment_date?.split("T")[0],
          } : undefined}
        />
      </PageContainer>
    </PermissionGuard>
  );
};

export default DentalTreatmentsManagement;
