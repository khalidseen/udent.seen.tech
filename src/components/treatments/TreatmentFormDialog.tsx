import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { treatmentService, type Treatment, type TreatmentCreateInput } from "@/services/treatmentService";
import { toast } from "sonner";

interface TreatmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicId?: string;
  treatment?: Treatment | null;
  preselectedPatientId?: string;
  onSaved: () => void;
}

type FormState = {
  patient_id: string;
  assigned_doctor_id: string;
  tooth_number: string;
  tooth_surface: string;
  numbering_system: string;
  diagnosis: string;
  treatment_plan: string;
  treatment_date: string;
  status: string;
  notes: string;
};

const defaultForm: FormState = {
  patient_id: "",
  assigned_doctor_id: "unassigned",
  tooth_number: "",
  tooth_surface: "",
  numbering_system: "universal",
  diagnosis: "",
  treatment_plan: "",
  treatment_date: new Date().toISOString().split("T")[0],
  status: "planned",
  notes: "",
};

export function TreatmentFormDialog({
  open,
  onOpenChange,
  clinicId,
  treatment,
  preselectedPatientId,
  onSaved,
}: TreatmentFormDialogProps) {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (treatment) {
      setForm({
        patient_id: treatment.patient_id,
        assigned_doctor_id: treatment.assigned_doctor_id || "unassigned",
        tooth_number: treatment.tooth_number || "",
        tooth_surface: treatment.tooth_surface || "",
        numbering_system: treatment.numbering_system || "universal",
        diagnosis: treatment.diagnosis || "",
        treatment_plan: treatment.treatment_plan || "",
        treatment_date: treatment.treatment_date?.split("T")[0] || new Date().toISOString().split("T")[0],
        status: treatment.status || "planned",
        notes: treatment.notes || "",
      });
      return;
    }

    setForm({
      ...defaultForm,
      patient_id: preselectedPatientId || "",
    });
  }, [open, preselectedPatientId, treatment]);

  const { data: patients } = useQuery({
    queryKey: ["treatment-form-patients", clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name")
        .eq("clinic_id", clinicId!)
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!clinicId,
  });

  const { data: doctors } = useQuery({
    queryKey: ["treatment-form-doctors", clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("id, full_name")
        .eq("clinic_id", clinicId!)
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!clinicId,
  });

  const dialogTitle = useMemo(() => (treatment ? "تعديل العلاج" : "إضافة علاج جديد"), [treatment]);

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.patient_id || !form.diagnosis.trim() || !form.treatment_plan.trim() || !form.tooth_number.trim()) {
      toast.error("يرجى تعبئة الحقول الأساسية للعلاج");
      return;
    }

    setSubmitting(true);
    try {
      const payload: TreatmentCreateInput = {
        patient_id: form.patient_id,
        assigned_doctor_id: form.assigned_doctor_id === "unassigned" ? undefined : form.assigned_doctor_id,
        tooth_number: form.tooth_number,
        tooth_surface: form.tooth_surface,
        numbering_system: form.numbering_system,
        diagnosis: form.diagnosis,
        treatment_plan: form.treatment_plan,
        treatment_date: form.treatment_date,
        status: form.status,
        notes: form.notes,
      };

      if (treatment?.id) {
        await treatmentService.update(treatment.id, payload);
        toast.success("تم تحديث العلاج بنجاح");
      } else {
        await treatmentService.create(payload);
        toast.success("تم إنشاء العلاج بنجاح");
      }

      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "تعذر حفظ بيانات العلاج");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>المريض *</Label>
              {preselectedPatientId ? (
                <div className="h-10 rounded-md border bg-muted/40 px-3 flex items-center text-sm text-muted-foreground">
                  {(patients || []).find((patient) => patient.id === form.patient_id)?.full_name || "مريض محدد"}
                </div>
              ) : (
                <Select value={form.patient_id} onValueChange={(value) => setField("patient_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المريض" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients?.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>الطبيب المعالج</Label>
              <Select value={form.assigned_doctor_id} onValueChange={(value) => setField("assigned_doctor_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الطبيب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">غير محدد</SelectItem>
                  {doctors?.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>رقم السن *</Label>
              <Input value={form.tooth_number} onChange={(e) => setField("tooth_number", e.target.value)} placeholder="11 أو 26" />
            </div>
            <div className="space-y-2">
              <Label>سطح السن</Label>
              <Input value={form.tooth_surface} onChange={(e) => setField("tooth_surface", e.target.value)} placeholder="O / M / D" />
            </div>
            <div className="space-y-2">
              <Label>نظام الترقيم</Label>
              <Select value={form.numbering_system} onValueChange={(value) => setField("numbering_system", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="universal">Universal</SelectItem>
                  <SelectItem value="fdi">FDI</SelectItem>
                  <SelectItem value="palmer">Palmer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>تاريخ العلاج *</Label>
              <Input type="date" value={form.treatment_date} onChange={(e) => setField("treatment_date", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>الحالة *</Label>
              <Select value={form.status} onValueChange={(value) => setField("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">مخطط</SelectItem>
                  <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>التشخيص *</Label>
            <Textarea value={form.diagnosis} onChange={(e) => setField("diagnosis", e.target.value)} rows={3} placeholder="وصف التشخيص السريري" />
          </div>

          <div className="space-y-2">
            <Label>خطة العلاج *</Label>
            <Textarea value={form.treatment_plan} onChange={(e) => setField("treatment_plan", e.target.value)} rows={3} placeholder="الإجراء أو الخطة العلاجية" />
          </div>

          <div className="space-y-2">
            <Label>ملاحظات إضافية</Label>
            <Textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} rows={3} placeholder="ملاحظات سريرية أو تشغيلية" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "جاري الحفظ..." : treatment ? "حفظ التعديلات" : "إنشاء العلاج"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}