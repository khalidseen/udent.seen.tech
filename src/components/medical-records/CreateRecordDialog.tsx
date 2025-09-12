import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateRecordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordCreated: () => void;
}

export function CreateRecordDialog({ isOpen, onClose, onRecordCreated }: CreateRecordDialogProps) {
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [recordType, setRecordType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [treatmentDate, setTreatmentDate] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name')
        .order('full_name');
      
      if (error) throw error;
      return data;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !title || !recordType) {
      toast({
        title: "خطأ",
        description: "يرجى ملء الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user profile for clinic_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .single();

      if (!profile) throw new Error('لم يتم العثور على ملف المستخدم');

      const { error } = await supabase
        .from('medical_records')
        .insert({
          clinic_id: profile.id,
          patient_id: selectedPatientId,
          record_type: recordType,
          title,
          description: description || null,
          treatment_date: treatmentDate || new Date().toISOString().split('T')[0],
          diagnosis: diagnosis || null,
          treatment_plan: treatmentPlan || null,
          notes: notes || null
        });

      if (error) throw error;

      onRecordCreated();
      onClose();
      resetForm();
      
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إنشاء السجل الطبي",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedPatientId("");
    setRecordType("");
    setTitle("");
    setDescription("");
    setTreatmentDate("");
    setDiagnosis("");
    setTreatmentPlan("");
    setNotes("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء سجل طبي جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="patient">المريض *</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
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
            </div>

            <div>
              <Label htmlFor="recordType">نوع السجل *</Label>
              <Select value={recordType} onValueChange={setRecordType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع السجل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">استشارة</SelectItem>
                  <SelectItem value="treatment">علاج</SelectItem>
                  <SelectItem value="surgery">جراحة</SelectItem>
                  <SelectItem value="followup">متابعة</SelectItem>
                  <SelectItem value="xray">أشعة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">العنوان *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان السجل الطبي"
                required
              />
            </div>

            <div>
              <Label htmlFor="treatmentDate">تاريخ العلاج</Label>
              <Input
                id="treatmentDate"
                type="date"
                value={treatmentDate}
                onChange={(e) => setTreatmentDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف الحالة أو الإجراء..."
            />
          </div>

          <div>
            <Label htmlFor="diagnosis">التشخيص</Label>
            <Textarea
              id="diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="التشخيص الطبي..."
            />
          </div>

          <div>
            <Label htmlFor="treatmentPlan">خطة العلاج</Label>
            <Textarea
              id="treatmentPlan"
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
              placeholder="خطة العلاج المقترحة..."
            />
          </div>

          <div>
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات إضافية..."
            />
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : "إنشاء السجل"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}