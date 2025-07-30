import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Activity, Save, Edit3, Trash2, Plus } from "lucide-react";
import ToothChart from "./ToothChart";

interface DentalTreatment {
  id: string;
  tooth_number: string;
  numbering_system: string;
  tooth_surface?: string;
  diagnosis?: string;
  treatment_plan?: string;
  notes?: string;
  status: string;
  treatment_date?: string;
}

interface DentalTreatmentFormProps {
  patientId: string;
  patientName: string;
}

const DentalTreatmentForm = ({ patientId, patientName }: DentalTreatmentFormProps) => {
  const [treatments, setTreatments] = useState<DentalTreatment[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<string>('');
  const [numberingSystem, setNumberingSystem] = useState<'universal' | 'palmer' | 'fdi'>('universal');
  const [formData, setFormData] = useState({
    tooth_surface: '',
    diagnosis: '',
    treatment_plan: '',
    notes: '',
    status: 'planned',
    treatment_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTreatments();
  }, [patientId]);

  const fetchTreatments = async () => {
    try {
      const { data, error } = await supabase
        .from('dental_treatments')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTreatments(data || []);
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل العلاجات',
        variant: 'destructive'
      });
    }
  };

  const handleToothSelect = (toothNumber: string, system: string) => {
    setSelectedTooth(toothNumber);
    setNumberingSystem(system as 'universal' | 'palmer' | 'fdi');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTooth) {
      toast({
        title: 'خطأ',
        description: 'يجب اختيار سن من المخطط',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      const treatmentData = {
        patient_id: patientId,
        tooth_number: selectedTooth,
        numbering_system: numberingSystem,
        ...formData
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
        tooth_surface: '',
        diagnosis: '',
        treatment_plan: '',
        notes: '',
        status: 'planned',
        treatment_date: ''
      });
      setSelectedTooth('');
      setEditingId(null);
      await fetchTreatments();

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

  const handleEdit = (treatment: DentalTreatment) => {
    setEditingId(treatment.id);
    setSelectedTooth(treatment.tooth_number);
    setNumberingSystem(treatment.numbering_system as 'universal' | 'palmer' | 'fdi');
    setFormData({
      tooth_surface: treatment.tooth_surface || '',
      diagnosis: treatment.diagnosis || '',
      treatment_plan: treatment.treatment_plan || '',
      notes: treatment.notes || '',
      status: treatment.status,
      treatment_date: treatment.treatment_date || ''
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا العلاج؟')) return;

    try {
      const { error } = await supabase
        .from('dental_treatments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'تم الحذف',
        description: 'تم حذف العلاج بنجاح'
      });
      
      await fetchTreatments();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      planned: 'secondary',
      in_progress: 'default',
      completed: 'secondary',
      cancelled: 'destructive'
    };

    const labels: { [key: string]: string } = {
      planned: 'مخطط',
      in_progress: 'قيد التنفيذ',
      completed: 'مكتمل',
      cancelled: 'ملغي'
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">علاجات الأسنان</h1>
        <p className="text-muted-foreground mt-2">المريض: {patientName}</p>
      </div>

      {/* Tooth Chart */}
      <ToothChart
        onToothSelect={handleToothSelect}
        selectedTooth={selectedTooth}
        numberingSystem={numberingSystem}
      />

      {/* Treatment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 ml-2" />
            {editingId ? 'تعديل العلاج' : 'إضافة علاج جديد'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tooth_surface">سطح السن</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, tooth_surface: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر سطح السن" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mesial">أنسي (Mesial)</SelectItem>
                    <SelectItem value="distal">وحشي (Distal)</SelectItem>
                    <SelectItem value="buccal">خدي (Buccal)</SelectItem>
                    <SelectItem value="lingual">لساني (Lingual)</SelectItem>
                    <SelectItem value="occlusal">إطباقي (Occlusal)</SelectItem>
                    <SelectItem value="incisal">قاطع (Incisal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">حالة العلاج</Label>
                <Select 
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
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
              <Label htmlFor="diagnosis">التشخيص</Label>
              <Textarea
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                placeholder="تشخيص الحالة..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment_plan">خطة العلاج</Label>
              <Textarea
                id="treatment_plan"
                value={formData.treatment_plan}
                onChange={(e) => setFormData(prev => ({ ...prev, treatment_plan: e.target.value }))}
                placeholder="خطة العلاج المقترحة..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="treatment_date">تاريخ العلاج</Label>
                <Input
                  id="treatment_date"
                  type="date"
                  value={formData.treatment_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, treatment_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="ملاحظات إضافية..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 space-x-reverse">
              {editingId && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setEditingId(null);
                    setSelectedTooth('');
                    setFormData({
                      tooth_surface: '',
                      diagnosis: '',
                      treatment_plan: '',
                      notes: '',
                      status: 'planned',
                      treatment_date: ''
                    });
                  }}
                >
                  إلغاء
                </Button>
              )}
              <Button type="submit" disabled={loading || !selectedTooth}>
                {editingId ? (
                  <>
                    <Edit3 className="w-4 h-4 ml-2" />
                    تحديث العلاج
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة العلاج
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Treatments List */}
      <Card>
        <CardHeader>
          <CardTitle>العلاجات المحفوظة</CardTitle>
        </CardHeader>
        <CardContent>
          {treatments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              لا توجد علاجات مسجلة لهذا المريض
            </p>
          ) : (
            <div className="space-y-4">
              {treatments.map((treatment) => (
                <div key={treatment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        السن {treatment.tooth_number} ({treatment.numbering_system.toUpperCase()})
                      </Badge>
                      {treatment.tooth_surface && (
                        <Badge variant="secondary">{treatment.tooth_surface}</Badge>
                      )}
                      {getStatusBadge(treatment.status)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(treatment)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(treatment.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {treatment.diagnosis && (
                    <div className="mb-2">
                      <strong>التشخيص:</strong> {treatment.diagnosis}
                    </div>
                  )}
                  
                  {treatment.treatment_plan && (
                    <div className="mb-2">
                      <strong>خطة العلاج:</strong> {treatment.treatment_plan}
                    </div>
                  )}
                  
                  {treatment.treatment_date && (
                    <div className="mb-2">
                      <strong>تاريخ العلاج:</strong> {new Date(treatment.treatment_date).toLocaleDateString('ar-EG')}
                    </div>
                  )}
                  
                  {treatment.notes && (
                    <div className="text-muted-foreground">
                      <strong>ملاحظات:</strong> {treatment.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DentalTreatmentForm;