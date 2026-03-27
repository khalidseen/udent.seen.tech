import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

const normalizeDigits = (value: string) => {
  const map: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  };
  return value.replace(/[٠-٩]/g, (char) => map[char] || char);
};

const parseFrequencyPerDay = (raw: string) => {
  const text = normalizeDigits((raw || '').toLowerCase());
  if (!text.trim()) return 1;

  const perDayKeywords: Array<[RegExp, number]> = [
    [/مرة|once/, 1],
    [/مرتين|twice/, 2],
    [/ثلاث|three/, 3],
    [/اربع|أربع|four/, 4],
  ];

  const everyMatch = text.match(/كل\s*(\d+(?:\.\d+)?)/);
  if (everyMatch) {
    const everyHours = Number(everyMatch[1]);
    if (everyHours > 0) return Math.max(1, Math.round(24 / everyHours));
  }

  const directNumber = text.match(/(\d+(?:\.\d+)?)(?:\s*(مرة|مرات|x|times|يوم))/);
  if (directNumber) {
    const value = Number(directNumber[1]);
    if (value > 0) return value;
  }

  for (const [pattern, value] of perDayKeywords) {
    if (pattern.test(text)) return value;
  }

  return 1;
};

const parseDurationDays = (raw: string) => {
  const text = normalizeDigits((raw || '').toLowerCase());
  if (!text.trim()) return 7;

  const numberMatch = text.match(/(\d+(?:\.\d+)?)/);
  const value = numberMatch ? Number(numberMatch[1]) : 7;

  if (/(week|اسبوع|أسبوع)/.test(text)) return Math.max(1, Math.round(value * 7));
  if (/(month|شهر)/.test(text)) return Math.max(1, Math.round(value * 30));
  return Math.max(1, Math.round(value));
};

interface CreatePrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  preselectedPatientId?: string;
}

interface SelectedMedication {
  id?: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

const CreatePrescriptionDialog = ({ open, onOpenChange, onSuccess, preselectedPatientId }: CreatePrescriptionDialogProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId || "");
  const [patientSearch, setPatientSearch] = useState("");
  const [medicationSearch, setMedicationSearch] = useState("");
  const [formData, setFormData] = useState({
    doctor_name: "",
    doctor_license: "",
    clinic_name: "",
    clinic_address: "",
    clinic_phone: "",
    diagnosis: "",
    notes: "",
  });
  const [selectedMedications, setSelectedMedications] = useState<SelectedMedication[]>([]);

  // Get clinic profile for proper clinic_id isolation
  const { data: profile } = useQuery({
    queryKey: ['current-profile'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_current_user_profile');
      return data;
    }
  });

  const clinicId = profile?.id;

  // Fetch active doctors for dropdown
  const { data: activeDoctors } = useQuery({
    queryKey: ['doctors-for-prescription', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, full_name, specialization, license_number')
        .eq('clinic_id', clinicId!)
        .eq('status', 'active')
        .order('full_name');
      if (error) throw error;
      return data;
    },
    enabled: !!clinicId
  });

  // Fetch patients filtered by clinic_id
  const { data: patients } = useQuery({
    queryKey: ['patients-for-prescription', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, phone, date_of_birth')
        .eq('clinic_id', clinicId!)
        .order('full_name');
      if (error) throw error;
      return data;
    },
    enabled: !!clinicId
  });

  // Fetch medications filtered by clinic_id
  const { data: medications } = useQuery({
    queryKey: ['medications-for-prescription', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medications')
        .select('id, trade_name, generic_name, strength, form, frequency, duration')
        .eq('clinic_id', clinicId!)
        .eq('is_active', true)
        .order('trade_name');
      if (error) throw error;
      return data;
    },
    enabled: !!clinicId
  });

  const { data: medicationSupplyMappings = {} } = useQuery({
    queryKey: ['medication-stock-mappings', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('custom_preferences')
        .eq('clinic_id', clinicId!)
        .maybeSingle();

      if (error) throw error;
      const prefs = (data?.custom_preferences ?? {}) as Record<string, any>;
      return (prefs.inventory?.medicationSupplyMappings ?? {}) as Record<string, { supplyId?: string; unitsPerDose?: number }>;
    },
    enabled: !!clinicId,
  });

  const filteredPatients = patients?.filter(patient =>
    patient.full_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    patient.phone?.includes(patientSearch)
  );

  const filteredMedications = medications?.filter(medication =>
    medication.trade_name.toLowerCase().includes(medicationSearch.toLowerCase()) ||
    medication.generic_name?.toLowerCase().includes(medicationSearch.toLowerCase())
  );

  const addMedication = (medication: any) => {
    const newMedication: SelectedMedication = {
      id: medication.id,
      medication_name: `${medication.trade_name} ${medication.strength} (${medication.form})`,
      dosage: medication.strength,
      frequency: medication.frequency,
      duration: medication.duration || "7 أيام",
      instructions: "تناول حسب إرشادات الطبيب"
    };
    setSelectedMedications([...selectedMedications, newMedication]);
    setMedicationSearch("");
  };

  const addManualMedication = () => {
    setSelectedMedications([...selectedMedications, {
      medication_name: "",
      dosage: "",
      frequency: "",
      duration: "7 أيام",
      instructions: ""
    }]);
  };

  const removeMedication = (index: number) => {
    setSelectedMedications(selectedMedications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof SelectedMedication, value: string) => {
    const updated = [...selectedMedications];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedMedications(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || selectedMedications.length === 0 || !clinicId) {
      toast.error("يرجى اختيار المريض وإضافة الأدوية");
      return;
    }

    if (!formData.doctor_name.trim() || !formData.diagnosis.trim()) {
      toast.error("يرجى إدخال اسم الطبيب والتشخيص");
      return;
    }

    setIsLoading(true);
    try {
      // Use clinic_id from profile, NOT user.id
      const { data: prescription, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert({
          clinic_id: clinicId,
          patient_id: selectedPatientId,
          doctor_name: formData.doctor_name.trim(),
          doctor_license: formData.doctor_license.trim(),
          clinic_name: formData.clinic_name.trim(),
          clinic_address: formData.clinic_address.trim(),
          clinic_phone: formData.clinic_phone.trim(),
          diagnosis: formData.diagnosis.trim(),
          notes: formData.notes.trim(),
        })
        .select()
        .single();

      if (prescriptionError) throw prescriptionError;

      // Add medications
      const medicationInserts = selectedMedications.map(med => ({
        prescription_id: prescription.id,
        medication_id: med.id || null,
        medication_name: med.medication_name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions,
      }));

      const { error: medicationsError } = await supabase
        .from('prescription_medications')
        .insert(medicationInserts);

      if (medicationsError) throw medicationsError;

      // Stock usage registration based on explicit medication->supply mappings.
      const stockWarnings: string[] = [];
      for (const med of selectedMedications) {
        if (!med.id) {
          stockWarnings.push(`دواء يدوي بدون معرف: ${med.medication_name || 'غير مسمى'}`);
          continue;
        }

        const mapping = medicationSupplyMappings[med.id];
        if (!mapping?.supplyId) {
          stockWarnings.push(`لا توجد مطابقة مخزون للدواء ${med.medication_name}`);
          continue;
        }

        const dosesPerDay = parseFrequencyPerDay(med.frequency);
        const durationDays = parseDurationDays(med.duration);
        const unitsPerDose = Number(mapping.unitsPerDose || 1);
        const deductionQty = Math.max(1, Math.ceil(unitsPerDose * dosesPerDay * durationDays));

        const { data: supply } = await supabase
          .from('medical_supplies')
          .select('id, name, current_stock')
          .eq('clinic_id', clinicId)
          .eq('is_active', true)
          .eq('id', mapping.supplyId)
          .maybeSingle();

        if (!supply) {
          stockWarnings.push(`الصنف المرتبط غير موجود للدواء ${med.medication_name}`);
          continue;
        }

        if ((supply.current_stock || 0) < deductionQty) {
          stockWarnings.push(`المخزون غير كاف للصنف ${supply.name} (مطلوب ${deductionQty})`);
          continue;
        }

        const { error: updateSupplyError } = await supabase
          .from('medical_supplies')
          .update({ current_stock: supply.current_stock - deductionQty })
          .eq('id', supply.id);

        if (updateSupplyError) {
          stockWarnings.push(`تعذر تحديث مخزون الصنف ${supply.name}`);
          continue;
        }

        await supabase
          .from('stock_movements')
          .insert({
            clinic_id: clinicId,
            supply_id: supply.id,
            movement_type: 'out',
            quantity: -deductionQty,
            reference_id: prescription.id,
            reference_type: 'usage',
            notes: `صرف دواء عبر وصفة رقم ${prescription.id.slice(0, 8)} - ${med.medication_name} | ${unitsPerDose} وحدة/جرعة × ${dosesPerDay} يومياً × ${durationDays} يوم`,
            created_by: clinicId,
          });
      }

      toast.success("تم إنشاء الوصفة الطبية بنجاح");
      if (stockWarnings.length > 0) {
        toast.warning(stockWarnings[0]);
      }
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating prescription:', error);
      toast.error("حدث خطأ أثناء إنشاء الوصفة الطبية");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPatientId(preselectedPatientId || "");
    setPatientSearch("");
    setMedicationSearch("");
    setFormData({
      doctor_name: "",
      doctor_license: "",
      clinic_name: "",
      clinic_address: "",
      clinic_phone: "",
      diagnosis: "",
      notes: "",
    });
    setSelectedMedications([]);
  };

  const selectedPatient = patients?.find(p => p.id === selectedPatientId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">إنشاء وصفة طبية جديدة</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <div className="space-y-2">
            <Label>اختيار المريض *</Label>
            {selectedPatient ? (
              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                <div>
                  <span className="font-medium">{selectedPatient.full_name}</span>
                  <span className="text-sm text-muted-foreground mr-2">{selectedPatient.phone}</span>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedPatientId(""); setPatientSearch(""); }}>
                  تغيير
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="البحث عن مريض..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="pr-10"
                  />
                </div>
                {patientSearch && (
                  <div className="max-h-40 overflow-y-auto border rounded-md">
                    {filteredPatients?.length === 0 ? (
                      <div className="p-3 text-center text-muted-foreground text-sm">لا توجد نتائج</div>
                    ) : (
                      filteredPatients?.map((patient) => (
                        <div
                          key={patient.id}
                          className="p-3 cursor-pointer hover:bg-muted border-b last:border-b-0"
                          onClick={() => {
                            setSelectedPatientId(patient.id);
                            setPatientSearch("");
                          }}
                        >
                          <div className="font-medium">{patient.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {patient.phone} -
                            {patient.date_of_birth ?
                              ` ${new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} سنة` :
                              ' العمر غير محدد'
                            }
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Doctor Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الطبيب المعالج *</Label>
              <Select
                value={formData.doctor_name}
                onValueChange={(value) => {
                  const doctor = activeDoctors?.find(d => d.full_name === value);
                  setFormData({
                    ...formData,
                    doctor_name: value,
                    doctor_license: doctor?.license_number || formData.doctor_license
                  });
                }}
              >
                <SelectTrigger><SelectValue placeholder="اختر الطبيب" /></SelectTrigger>
                <SelectContent>
                  {activeDoctors?.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.full_name}>
                      د. {doctor.full_name} {doctor.specialization ? `- ${doctor.specialization}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>رقم الإجازة</Label>
              <Input
                value={formData.doctor_license}
                onChange={(e) => setFormData({ ...formData, doctor_license: e.target.value })}
                placeholder="١٢٣٤٥/ص"
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label>اسم العيادة</Label>
              <Input
                value={formData.clinic_name}
                onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                placeholder="عيادة الشفاء"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>هاتف العيادة</Label>
              <Input
                value={formData.clinic_phone}
                onChange={(e) => setFormData({ ...formData, clinic_phone: e.target.value })}
                placeholder="٠١٢٣٤٥٦٧٨٩"
                maxLength={20}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>عنوان العيادة</Label>
            <Input
              value={formData.clinic_address}
              onChange={(e) => setFormData({ ...formData, clinic_address: e.target.value })}
              placeholder="شارع الأطباء، بغداد"
              maxLength={200}
            />
          </div>

          {/* Diagnosis */}
          <div className="space-y-2">
            <Label>التشخيص الطبي *</Label>
            <Textarea
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              placeholder="التهاب الجهاز التنفسي العلوي"
              required
              maxLength={500}
            />
          </div>

          {/* Medications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">الأدوية *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addManualMedication}>
                <Plus className="w-3 h-3 ml-1" />
                إضافة يدوي
              </Button>
            </div>

            {/* Search from DB medications */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="البحث عن دواء من قاعدة البيانات..."
                value={medicationSearch}
                onChange={(e) => setMedicationSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            {medicationSearch && (
              <div className="max-h-40 overflow-y-auto border rounded-md">
                {filteredMedications?.length === 0 ? (
                  <div className="p-3 text-center text-muted-foreground text-sm">لا توجد أدوية مطابقة - يمكنك الإضافة يدوياً</div>
                ) : (
                  filteredMedications?.map((medication) => (
                    <div
                      key={medication.id}
                      className="p-3 cursor-pointer hover:bg-muted border-b last:border-b-0"
                      onClick={() => addMedication(medication)}
                    >
                      <div className="font-medium">
                        {medication.trade_name} {medication.strength}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {medication.generic_name} - {medication.form}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Selected Medications */}
            <div className="space-y-3">
              {selectedMedications.map((medication, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      {medication.medication_name ? (
                        <h4 className="font-medium">{medication.medication_name}</h4>
                      ) : (
                        <Input
                          value={medication.medication_name}
                          onChange={(e) => updateMedication(index, 'medication_name', e.target.value)}
                          placeholder="اسم الدواء"
                          className="max-w-xs"
                        />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMedication(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">الجرعة</Label>
                        <Input
                          value={medication.dosage}
                          onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                          placeholder="500mg"
                          maxLength={50}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">التكرار</Label>
                        <Input
                          value={medication.frequency}
                          onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                          placeholder="3 مرات يومياً"
                          maxLength={50}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">المدة</Label>
                        <Input
                          value={medication.duration}
                          onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                          placeholder="7 أيام"
                          maxLength={50}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">التعليمات</Label>
                        <Input
                          value={medication.instructions}
                          onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                          placeholder="بعد الطعام"
                          maxLength={200}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>ملاحظات إضافية</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="شرب كميات وافرة من السوائل..."
              maxLength={1000}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "جارٍ الإنشاء..." : "إنشاء الوصفة"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePrescriptionDialog;
