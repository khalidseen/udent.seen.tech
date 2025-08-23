import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Activity, Save, Stethoscope, Pill } from "lucide-react";
import ToothChart from "./ToothChart";
import SmartTreatmentRecommendations from "../treatments/SmartTreatmentRecommendations";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import MedicationSelector from "@/components/medications/MedicationSelector";

interface Patient {
  id: string;
  full_name: string;
}

interface SelectedMedication {
  id: string;
  trade_name: string;
  generic_name?: string;
  strength: string;
  form: string;
  frequency: string;
  duration?: string;
  instructions?: string;
  custom_dosage?: string;
  custom_duration?: string;
  custom_instructions?: string;
}

interface DentalTreatmentFormProps {
  patientId?: string;
}

const DentalTreatmentForm = ({ patientId }: DentalTreatmentFormProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState(patientId || '');
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [numberingSystem, setNumberingSystem] = useState<'universal' | 'palmer' | 'fdi'>('universal');
  const [selectedMedications, setSelectedMedications] = useState<SelectedMedication[]>([]);
  const [formData, setFormData] = useState({
    toothSurface: '',
    diagnosis: '',
    treatmentPlan: '',
    treatmentDate: new Date().toISOString().split('T')[0],
    status: 'planned',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name')
        .order('full_name');

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToothSelect = (toothNumber: string, system: string) => {
    setSelectedTooth(parseInt(toothNumber));
    setNumberingSystem(system as 'universal' | 'palmer' | 'fdi');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTooth || !selectedPatient) {
      toast({
        title: 'خطأ',
        description: 'يجب اختيار المريض والسن من المخطط',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      // Get current user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('لم يتم العثور على ملف المستخدم');

      const treatmentData = {
        clinic_id: profile.id,
        patient_id: selectedPatient,
        tooth_number: selectedTooth.toString(),
        tooth_surface: formData.toothSurface,
        numbering_system: numberingSystem,
        diagnosis: formData.diagnosis,
        treatment_plan: formData.treatmentPlan,
        treatment_date: formData.treatmentDate,
        status: formData.status,
        notes: formData.notes,
        prescribed_medications: selectedMedications.map(med => ({
          medication_id: med.id,
          trade_name: med.trade_name,
          generic_name: med.generic_name,
          strength: med.strength,
          form: med.form,
          dosage: med.custom_dosage || med.frequency,
          duration: med.custom_duration || med.duration,
          instructions: med.custom_instructions || med.instructions
        }))
      };

      if (editingId) {
        const { error } = await supabase
          .from('dental_treatments')
          .update(treatmentData)
          .eq('id', editingId);

        if (error) throw error;
        
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث العلاج بنجاح'
        });
      } else {
        const { error } = await supabase
          .from('dental_treatments')
          .insert(treatmentData);

        if (error) throw error;
        
        toast({
          title: 'تم الإضافة',
          description: 'تم إضافة العلاج بنجاح'
        });
      }

      // Reset form
      setFormData({
        toothSurface: '',
        diagnosis: '',
        treatmentPlan: '',
        treatmentDate: new Date().toISOString().split('T')[0],
        status: 'planned',
        notes: ''
      });
      setSelectedTooth(null);
      setSelectedMedications([]);

    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toothSurfaces = [
    'Mesial (أمامي)',
    'Distal (خلفي)',
    'Buccal/Facial (خدي)',
    'Lingual/Palatal (لساني)',
    'Occlusal (إطباقي)',
    'Incisal (قاطع)',
    'Cervical (عنقي)'
  ];

  const commonDiagnoses = [
    'تسوس',
    'التهاب اللثة',
    'التهاب دواعم السن',
    'كسر في السن',
    'حساسية الأسنان',
    'خراج',
    'تآكل المينا',
    'انطمار السن',
    'سوء الإطباق'
  ];

  const treatmentOptions = [
    'حشو',
    'تنظيف',
    'خلع',
    'علاج عصب',
    'تاج',
    'جسر',
    'زراعة',
    'تقويم',
    'تبييض',
    'علاج اللثة'
  ];

  return (
    <PageContainer>
      <PageHeader 
        title="العلاجات السنية" 
        description="إدارة وتسجيل العلاجات السنية" 
      />

      {/* Patient Selection */}
      {!patientId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Stethoscope className="w-5 h-5 ml-2" />
              اختيار المريض
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المريض" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Smart Treatment Recommendations */}
      {selectedPatient && (formData.diagnosis || formData.treatmentPlan) && (
        <SmartTreatmentRecommendations
          patientId={selectedPatient}
          proposedTreatment={formData.treatmentPlan}
          proposedMedication={formData.diagnosis}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tooth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>مخطط الأسنان</CardTitle>
          </CardHeader>
          <CardContent>
            <ToothChart onToothSelect={handleToothSelect} />
            {selectedTooth && (
              <div className="mt-4 p-3 bg-accent rounded-lg">
                <p className="text-sm">
                  <strong>السن المختار:</strong> {selectedTooth} ({numberingSystem})
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Treatment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 ml-2" />
              بيانات العلاج
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tooth Surface */}
              <div className="space-y-2">
                <Label>سطح السن</Label>
                <Select onValueChange={(value) => handleChange('toothSurface', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر سطح السن" />
                  </SelectTrigger>
                  <SelectContent>
                    {toothSurfaces.map((surface) => (
                      <SelectItem key={surface} value={surface}>
                        {surface}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Diagnosis */}
              <div className="space-y-2">
                <Label>التشخيص *</Label>
                <Select onValueChange={(value) => handleChange('diagnosis', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التشخيص" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonDiagnoses.map((diagnosis) => (
                      <SelectItem key={diagnosis} value={diagnosis}>
                        {diagnosis}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Treatment Plan */}
              <div className="space-y-2">
                <Label>خطة العلاج *</Label>
                <Select onValueChange={(value) => handleChange('treatmentPlan', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العلاج" />
                  </SelectTrigger>
                  <SelectContent>
                    {treatmentOptions.map((treatment) => (
                      <SelectItem key={treatment} value={treatment}>
                        {treatment}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Treatment Date */}
              <div className="space-y-2">
                <Label>تاريخ العلاج</Label>
                <Input
                  type="date"
                  value={formData.treatmentDate}
                  onChange={(e) => handleChange('treatmentDate', e.target.value)}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>حالة العلاج</Label>
                <Select onValueChange={(value) => handleChange('status', value)} value={formData.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">مخطط</SelectItem>
                    <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="ملاحظات إضافية..."
                  rows={3}
                />
              </div>

              {/* Medications */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Pill className="w-4 h-4" />
                  الأدوية الموصوفة
                </Label>
                <MedicationSelector
                  selectedMedications={selectedMedications}
                  onMedicationsChange={setSelectedMedications}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                <Save className="w-4 h-4 ml-2" />
                {loading ? 'جاري الحفظ...' : editingId ? 'تحديث العلاج' : 'حفظ العلاج'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default DentalTreatmentForm;