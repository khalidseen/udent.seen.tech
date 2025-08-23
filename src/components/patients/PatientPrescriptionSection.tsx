import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronDown, ChevronUp, Printer, Share2, MessageCircle, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";

interface PatientPrescriptionSectionProps {
  patientId: string;
  patientData: {
    full_name: string;
    date_of_birth?: string;
    phone?: string;
  };
}

interface SelectedMedication {
  id?: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

const PatientPrescriptionSection = ({ patientId, patientData }: PatientPrescriptionSectionProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  // Fetch patient's prescriptions
  const { data: prescriptions, refetch } = useQuery({
    queryKey: ['patient-prescriptions', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          prescription_medications (
            medication_name,
            dosage,
            frequency,
            duration,
            instructions
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch medications
  const { data: medications } = useQuery({
    queryKey: ['medications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medications')
        .select('id, trade_name, generic_name, strength, form, frequency, duration')
        .eq('is_active', true)
        .order('trade_name');
      if (error) throw error;
      return data;
    },
  });

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

  const removeMedication = (index: number) => {
    setSelectedMedications(selectedMedications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof SelectedMedication, value: string) => {
    const updated = [...selectedMedications];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedMedications(updated);
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMedications.length === 0 || !user) {
      toast.error("يرجى إضافة الأدوية");
      return;
    }

    // Get clinic_id from user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      toast.error("خطأ في تحديد العيادة");
      return;
    }

    setIsLoading(true);
    try {
      // Create prescription
      const { data: prescription, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert({
          clinic_id: profile.id, // Use clinic_id from user profile
          patient_id: patientId,
          doctor_name: formData.doctor_name,
          doctor_license: formData.doctor_license,
          clinic_name: formData.clinic_name,
          clinic_address: formData.clinic_address,
          clinic_phone: formData.clinic_phone,
          diagnosis: formData.diagnosis,
          notes: formData.notes,
        })
        .select()
        .single();

      if (prescriptionError) throw prescriptionError;

      // Add medications
      const medicationInserts = selectedMedications.map(med => ({
        prescription_id: prescription.id,
        medication_id: med.id,
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

      toast.success("تم إنشاء الوصفة الطبية بنجاح");
      refetch();
      setIsCreating(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating prescription:', error);
      toast.error("حدث خطأ أثناء إنشاء الوصفة الطبية");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
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
    setMedicationSearch("");
  };

  const handlePrintPrescription = (prescription: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const patientAge = patientData.date_of_birth
        ? new Date().getFullYear() - new Date(patientData.date_of_birth).getFullYear()
        : null;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>وصفة طبية</title>
          <style>
            body { font-family: 'Arial', sans-serif; background: white; margin: 0; padding: 20px; }
            .prescription { max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 2px solid #16a34a; padding-bottom: 20px; margin-bottom: 20px; }
            .doctor-info { text-align: right; }
            .clinic-info { text-align: left; }
            .patient-section { border-bottom: 1px solid #e5e7eb; padding: 20px 0; }
            .rx-symbol { font-size: 60px; color: #16a34a; font-weight: bold; }
            .medication { border-right: 4px solid #16a34a; background: #f0fdf4; padding: 15px; margin: 10px 0; border-radius: 8px; }
            .footer { border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px; }
            .signature { text-align: center; border-top: 2px solid #374151; width: 200px; margin: 0 auto; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="prescription">
            <div class="header" style="display: flex; justify-content: space-between;">
              <div class="doctor-info">
                <h1>${prescription.doctor_name}</h1>
                <p>طبيب عام (M.B.Ch.B)</p>
                <p>عضو نقابة أطباء العراق - ${prescription.doctor_license || ''}</p>
              </div>
              <div class="clinic-info">
                <h2>${prescription.clinic_name}</h2>
                <p>${prescription.clinic_address}</p>
                <p>هاتف: ${prescription.clinic_phone}</p>
              </div>
            </div>
            
            <div class="patient-section">
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
                <div>
                  <strong>اسم المريض:</strong>
                  <p>${patientData.full_name}</p>
                </div>
                <div>
                  <strong>العمر:</strong>
                  <p>${patientAge ? `${patientAge} سنة` : 'غير محدد'}</p>
                </div>
                <div>
                  <strong>تاريخ الفحص:</strong>
                  <p>${new Date(prescription.prescription_date).toLocaleDateString('ar-IQ')}</p>
                </div>
              </div>
              <div style="margin-top: 15px;">
                <strong>التشخيص الطبي:</strong>
                <p>${prescription.diagnosis}</p>
              </div>
            </div>
            
            <div style="display: flex; margin: 30px 0;">
              <div class="rx-symbol">℞</div>
              <div style="flex: 1; margin-right: 20px;">
                ${prescription.prescription_medications?.map((med: any, index: number) => `
                  <div class="medication">
                    <h3>${med.medication_name}</h3>
                    <p>${med.dosage} - ${med.frequency} - ${med.instructions}</p>
                    <p><strong>المدة: ${med.duration}</strong></p>
                  </div>
                `).join('') || ''}
              </div>
            </div>
            
            <div class="footer">
              <div style="display: flex; justify-content: space-between;">
                <div style="width: 60%;">
                  <h4>ملاحظات هامة:</h4>
                  ${prescription.notes ? `<p>${prescription.notes}</p>` : `
                    <p>- يجب إكمال كورس المضاد الحيوي كاملاً حتى مع الشعور بالتحسن.</p>
                    <p>- شرب كميات وافرة من السوائل.</p>
                  `}
                </div>
                <div class="signature">
                  <p>ختم وتوقيع الطبيب</p>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleShareWhatsApp = (prescription: any) => {
    let message = `*وصفة طبية*\\\\n\\\\n`;
    message += `👤 *المريض:* ${patientData.full_name}\\\\n`;
    message += `👨‍⚕️ *الطبيب:* ${prescription.doctor_name}\\\\n`;
    message += `🏥 *العيادة:* ${prescription.clinic_name}\\\\n`;
    message += `📅 *التاريخ:* ${new Date(prescription.prescription_date).toLocaleDateString('ar-IQ')}\\\\n`;
    message += `🩺 *التشخيص:* ${prescription.diagnosis}\\\\n\\\\n`;
    
    message += `💊 *الأدوية:*\\\\n`;
    prescription.prescription_medications?.forEach((med: any, index: number) => {
      message += `${index + 1}. *${med.medication_name}*\\\\n`;
      message += `   - الجرعة: ${med.dosage}\\\\n`;
      message += `   - التكرار: ${med.frequency}\\\\n`;
      message += `   - المدة: ${med.duration}\\\\n`;
      message += `   - التعليمات: ${med.instructions}\\\\n\\\\n`;
    });

    if (prescription.notes) {
      message += `📝 *ملاحظات:*\\\\n${prescription.notes}\\\\n\\\\n`;
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const patientAge = patientData.date_of_birth
    ? new Date().getFullYear() - new Date(patientData.date_of_birth).getFullYear()
    : null;

  return (
    <div className="space-y-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              الوصفات الطبية ({prescriptions?.length || 0})
            </div>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2"
              disabled={isCreating}
            >
              <Plus className="w-4 h-4" />
              وصفة طبية جديدة
            </Button>
          </div>

          {/* Create New Prescription Form */}
          {isCreating && (
            <Card>
              <CardHeader>
                <CardTitle>وصفة طبية جديدة - {patientData.full_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePrescription} className="space-y-4">
                  {/* Patient Info (Read-only) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">المريض</Label>
                      <p className="font-medium">{patientData.full_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">العمر</Label>
                      <p>{patientAge ? `${patientAge} سنة` : 'غير محدد'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">الهاتف</Label>
                      <p>{patientData.phone || 'غير محدد'}</p>
                    </div>
                  </div>

                  {/* Doctor Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>اسم الطبيب *</Label>
                      <Input
                        value={formData.doctor_name}
                        onChange={(e) => setFormData({...formData, doctor_name: e.target.value})}
                        placeholder="د. أحمد محمد"
                        required
                      />
                    </div>
                    <div>
                      <Label>رقم الإجازة</Label>
                      <Input
                        value={formData.doctor_license}
                        onChange={(e) => setFormData({...formData, doctor_license: e.target.value})}
                        placeholder="١٢٣٤٥/ص"
                      />
                    </div>
                    <div>
                      <Label>اسم العيادة</Label>
                      <Input
                        value={formData.clinic_name}
                        onChange={(e) => setFormData({...formData, clinic_name: e.target.value})}
                        placeholder="عيادة الشفاء"
                      />
                    </div>
                    <div>
                      <Label>هاتف العيادة</Label>
                      <Input
                        value={formData.clinic_phone}
                        onChange={(e) => setFormData({...formData, clinic_phone: e.target.value})}
                        placeholder="٠١٢٣٤٥٦٧٨٩"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>عنوان العيادة</Label>
                    <Input
                      value={formData.clinic_address}
                      onChange={(e) => setFormData({...formData, clinic_address: e.target.value})}
                      placeholder="شارع الأطباء، بغداد"
                    />
                  </div>

                  <div>
                    <Label>التشخيص الطبي *</Label>
                    <Textarea
                      value={formData.diagnosis}
                      onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                      placeholder="التهاب الجهاز التنفسي العلوي"
                      required
                    />
                  </div>

                  {/* Medications */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">الأدوية</Label>
                    
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="البحث عن دواء..."
                        value={medicationSearch}
                        onChange={(e) => setMedicationSearch(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                    
                    {medicationSearch && (
                      <div className="max-h-40 overflow-y-auto border rounded-md">
                        {filteredMedications?.map((medication) => (
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
                        ))}
                      </div>
                    )}

                    <div className="space-y-3">
                      {selectedMedications.map((medication, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-medium">{medication.medication_name}</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMedication(index)}
                                className="text-red-500 hover:text-red-700"
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
                                />
                              </div>
                              <div>
                                <Label className="text-xs">التكرار</Label>
                                <Input
                                  value={medication.frequency}
                                  onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                  placeholder="3 مرات يومياً"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">المدة</Label>
                                <Input
                                  value={medication.duration}
                                  onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                  placeholder="7 أيام"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">التعليمات</Label>
                                <Input
                                  value={medication.instructions}
                                  onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                                  placeholder="بعد الطعام"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>ملاحظات إضافية</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="شرب كميات وافرة من السوائل..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "جارٍ الحفظ..." : "حفظ الوصفة"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                      إلغاء
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Existing Prescriptions */}
          <div className="space-y-3">
            {prescriptions?.map((prescription) => (
              <Card key={prescription.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{prescription.diagnosis}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {prescription.doctor_name} - {new Date(prescription.prescription_date).toLocaleDateString('ar-IQ')}
                      </p>
                    </div>
                    <Badge variant="secondary">{prescription.status === 'active' ? 'نشطة' : 'مكتملة'}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {prescription.prescription_medications?.map((med: any, index: number) => (
                      <div key={index} className="text-sm">
                        <strong>{med.medication_name}</strong> - {med.frequency} - {med.duration}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintPrescription(prescription)}
                    >
                      <Printer className="w-3 h-3 ml-1" />
                      طباعة
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShareWhatsApp(prescription)}
                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    >
                      <MessageCircle className="w-3 h-3 ml-1" />
                      واتساب
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {prescriptions?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>لا توجد وصفات طبية لهذا المريض</p>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default PatientPrescriptionSection;
