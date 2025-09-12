// 🦷 Enhanced Tooth Modal Component
// نافذة السن المحسنة مع 5 تبويبات

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import ImageUpload from './ImageUpload';
import {
  ToothModalProps,
  ToothRecord,
  ConditionType,
  PriorityLevel,
  SurfaceCondition,
  WHO_COLORS,
  ICD10_DENTAL_CODES,
  TOOTH_POSITIONS
} from '@/types/dentalChart';
import {
  Save,
  X,
  Stethoscope,
  Layers,
  Ruler,
  TreePine,
  FileText,
  Camera,
  AlertTriangle,
  Heart,
  Activity
} from 'lucide-react';

const ToothModal: React.FC<ToothModalProps> = ({
  isOpen,
  onClose,
  toothNumber,
  patientId,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState('diagnosis');
  const [toothData, setToothData] = useState<Partial<ToothRecord>>({
    tooth_number: toothNumber,
    patient_id: patientId,
    clinic_id: '',
    diagnosis: {
      primary_condition: ConditionType.SOUND,
      priority_level: PriorityLevel.LOW,
      icd10_code: '',
      diagnosis_notes: '',
      image_url: '',
      image_data: ''
    },
    surfaces: {
      mesial: SurfaceCondition.SOUND,
      distal: SurfaceCondition.SOUND,
      buccal: SurfaceCondition.SOUND,
      lingual: SurfaceCondition.SOUND,
      occlusal: SurfaceCondition.SOUND,
      incisal: SurfaceCondition.SOUND
    },
    clinical_measurements: {
      mobility: 0,
      pocket_depths: {
        mesial_buccal: 2,
        mid_buccal: 2,
        distal_buccal: 2,
        mesial_lingual: 2,
        mid_lingual: 2,
        distal_lingual: 2
      },
      bleeding_on_probing: false,
      gingival_recession: {
        buccal: 0,
        lingual: 0
      },
      plaque_index: 0
    },
    roots: {
      number_of_roots: 1,
      root_conditions: [{
        root_number: 1,
        condition: 'healthy',
        notes: ''
      }],
      root_canal_treatment: {
        completed: false,
        date: '',
        notes: ''
      }
    },
    notes: {
      clinical_notes: '',
      treatment_plan: '',
      additional_comments: '',
      follow_up_date: ''
    }
  });

  const { toast } = useToast();

  useEffect(() => {
    // تحديث رمز ICD-10 تلقائياً حسب الحالة
    if (toothData.diagnosis?.primary_condition) {
      const icdCode = ICD10_DENTAL_CODES[toothData.diagnosis.primary_condition];
      if (icdCode) {
        setToothData(prev => ({
          ...prev,
          diagnosis: {
            ...prev.diagnosis!,
            icd10_code: icdCode
          }
        }));
      }
    }
  }, [toothData.diagnosis?.primary_condition]);

  const handleSave = () => {
    if (!toothData.diagnosis?.primary_condition) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى تحديد حالة السن الأساسية",
        variant: "destructive"
      });
      return;
    }

    const completeRecord: ToothRecord = {
      id: crypto.randomUUID(),
      tooth_number: toothNumber,
      patient_id: patientId,
      clinic_id: toothData.clinic_id || '',
      diagnosis: toothData.diagnosis!,
      surfaces: toothData.surfaces!,
      clinical_measurements: toothData.clinical_measurements!,
      roots: toothData.roots!,
      notes: toothData.notes!,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    onSave(completeRecord);
    toast({
      title: "تم حفظ البيانات",
      description: `تم حفظ بيانات السن رقم ${toothNumber} بنجاح`
    });
    onClose();
  };

  const updateDiagnosis = (field: string, value: any) => {
    setToothData(prev => ({
      ...prev,
      diagnosis: {
        ...prev.diagnosis!,
        [field]: value
      }
    }));
  };

  const updateSurface = (surface: string, condition: SurfaceCondition) => {
    setToothData(prev => ({
      ...prev,
      surfaces: {
        ...prev.surfaces!,
        [surface]: condition
      }
    }));
  };

  const updateClinicalMeasurement = (field: string, value: any) => {
    setToothData(prev => ({
      ...prev,
      clinical_measurements: {
        ...prev.clinical_measurements!,
        [field]: value
      }
    }));
  };

  const updatePocketDepth = (position: string, value: number) => {
    setToothData(prev => ({
      ...prev,
      clinical_measurements: {
        ...prev.clinical_measurements!,
        pocket_depths: {
          ...prev.clinical_measurements!.pocket_depths,
          [position]: value
        }
      }
    }));
  };

  const updateRoots = (field: string, value: any) => {
    setToothData(prev => ({
      ...prev,
      roots: {
        ...prev.roots!,
        [field]: value
      }
    }));
  };

  const updateNotes = (field: string, value: string) => {
    setToothData(prev => ({
      ...prev,
      notes: {
        ...prev.notes!,
        [field]: value
      }
    }));
  };

  const getToothTypeInfo = () => {
    const num = parseInt(toothNumber);
    const lastDigit = num % 10;
    
    if (lastDigit === 1 || lastDigit === 2) return { type: 'قاطع', expectedRoots: 1 };
    if (lastDigit === 3) return { type: 'ناب', expectedRoots: 1 };
    if (lastDigit === 4 || lastDigit === 5) return { type: 'ضاحك', expectedRoots: 1 };
    if (lastDigit === 6 || lastDigit === 7 || lastDigit === 8) return { type: 'طاحن', expectedRoots: 3 };
    
    return { type: 'غير محدد', expectedRoots: 1 };
  };

  const toothInfo = getToothTypeInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: WHO_COLORS[toothData.diagnosis?.primary_condition || ConditionType.SOUND] }}
            >
              {toothNumber}
            </div>
            <div>
              <div>السن رقم {toothNumber}</div>
              <div className="text-sm text-muted-foreground font-normal">
                {TOOTH_POSITIONS[parseInt(toothNumber) as keyof typeof TOOTH_POSITIONS]} ({toothInfo.type})
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full mb-6">
            <TabsTrigger value="diagnosis" className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              التشخيص
            </TabsTrigger>
            <TabsTrigger value="surfaces" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              الأسطح
            </TabsTrigger>
            <TabsTrigger value="measurements" className="flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              القياسات
            </TabsTrigger>
            <TabsTrigger value="roots" className="flex items-center gap-2">
              <TreePine className="w-4 h-4" />
              الجذور
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              الملاحظات
            </TabsTrigger>
          </TabsList>

          {/* تبويب التشخيص */}
          <TabsContent value="diagnosis" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>الحالة الأساسية</Label>
                  <Select
                    value={toothData.diagnosis?.primary_condition}
                    onValueChange={(value) => updateDiagnosis('primary_condition', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ConditionType).map((condition) => (
                        <SelectItem key={condition} value={condition}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: WHO_COLORS[condition] }}
                            />
                            {condition}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>مستوى الأولوية</Label>
                  <Select
                    value={toothData.diagnosis?.priority_level}
                    onValueChange={(value) => updateDiagnosis('priority_level', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الأولوية" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(PriorityLevel).map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          <div className="flex items-center gap-2">
                            {priority === PriorityLevel.EMERGENCY && <AlertTriangle className="w-4 h-4 text-red-500" />}
                            {priority === PriorityLevel.URGENT && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                            {priority === PriorityLevel.HIGH && <Activity className="w-4 h-4 text-yellow-500" />}
                            {priority === PriorityLevel.MEDIUM && <Heart className="w-4 h-4 text-blue-500" />}
                            {priority === PriorityLevel.LOW && <Heart className="w-4 h-4 text-green-500" />}
                            {priority}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>رمز ICD-10</Label>
                  <Input
                    value={toothData.diagnosis?.icd10_code || ''}
                    onChange={(e) => updateDiagnosis('icd10_code', e.target.value)}
                    placeholder="رمز التصنيف الطبي"
                  />
                </div>

                <div className="space-y-2">
                  <Label>ملاحظات التشخيص</Label>
                  <Textarea
                    value={toothData.diagnosis?.diagnosis_notes || ''}
                    onChange={(e) => updateDiagnosis('diagnosis_notes', e.target.value)}
                    placeholder="تفاصيل إضافية حول التشخيص..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    صورة السن
                  </Label>
                  <ImageUpload
                    onImageSelect={(imageData) => updateDiagnosis('image_data', imageData)}
                    currentImage={toothData.diagnosis?.image_data}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* تبويب الأسطح */}
          <TabsContent value="surfaces" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(toothData.surfaces || {}).map(([surface, condition]) => (
                <div key={surface} className="space-y-2">
                  <Label className="capitalize">
                    {surface === 'mesial' && 'الوجه الإنسي'}
                    {surface === 'distal' && 'الوجه الوحشي'}
                    {surface === 'buccal' && 'الوجه الشدقي'}
                    {surface === 'lingual' && 'الوجه اللساني'}
                    {surface === 'occlusal' && 'السطح الإطباقي'}
                    {surface === 'incisal' && 'الحافة القاطعة'}
                  </Label>
                  <Select
                    value={condition}
                    onValueChange={(value) => updateSurface(surface, value as SurfaceCondition)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(SurfaceCondition).map((surfaceCondition) => (
                        <SelectItem key={surfaceCondition} value={surfaceCondition}>
                          {surfaceCondition}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* تبويب القياسات السريرية */}
          <TabsContent value="measurements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>درجة حركة السن (0-3)</Label>
                  <Slider
                    value={[toothData.clinical_measurements?.mobility || 0]}
                    onValueChange={(value) => updateClinicalMeasurement('mobility', value[0])}
                    max={3}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-sm text-muted-foreground">
                    الدرجة الحالية: {toothData.clinical_measurements?.mobility || 0}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>مؤشر البلاك (0-3)</Label>
                  <Slider
                    value={[toothData.clinical_measurements?.plaque_index || 0]}
                    onValueChange={(value) => updateClinicalMeasurement('plaque_index', value[0])}
                    max={3}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={toothData.clinical_measurements?.bleeding_on_probing || false}
                    onCheckedChange={(checked) => updateClinicalMeasurement('bleeding_on_probing', checked)}
                  />
                  <Label>نزيف عند الفحص</Label>
                </div>
              </div>

              <div className="space-y-4">
                <Label>عمق الجيوب اللثوية (مم)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(toothData.clinical_measurements?.pocket_depths || {}).map(([position, depth]) => (
                    <div key={position} className="space-y-1">
                      <Label className="text-xs">
                        {position.replace('_', ' ').replace('mesial', 'إنسي').replace('distal', 'وحشي').replace('buccal', 'شدقي').replace('lingual', 'لساني').replace('mid', 'متوسط')}
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="15"
                        value={depth}
                        onChange={(e) => updatePocketDepth(position, parseInt(e.target.value) || 1)}
                        className="h-8"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* تبويب الجذور */}
          <TabsContent value="roots" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>عدد الجذور</Label>
                  <Select
                    value={toothData.roots?.number_of_roots?.toString()}
                    onValueChange={(value) => updateRoots('number_of_roots', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 جذر</SelectItem>
                      <SelectItem value="2">2 جذر</SelectItem>
                      <SelectItem value="3">3 جذور</SelectItem>
                      <SelectItem value="4">4 جذور</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground">
                    العدد المتوقع لهذا النوع: {toothInfo.expectedRoots}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>علاج عصب السن</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={toothData.roots?.root_canal_treatment?.completed || false}
                      onCheckedChange={(checked) => updateRoots('root_canal_treatment', {
                        ...toothData.roots?.root_canal_treatment,
                        completed: checked
                      })}
                    />
                    <Label>تم العلاج</Label>
                  </div>
                </div>

                {toothData.roots?.root_canal_treatment?.completed && (
                  <div className="space-y-2">
                    <Label>تاريخ العلاج</Label>
                    <Input
                      type="date"
                      value={toothData.roots?.root_canal_treatment?.date || ''}
                      onChange={(e) => updateRoots('root_canal_treatment', {
                        ...toothData.roots?.root_canal_treatment,
                        date: e.target.value
                      })}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Label>ملاحظات علاج العصب</Label>
                <Textarea
                  value={toothData.roots?.root_canal_treatment?.notes || ''}
                  onChange={(e) => updateRoots('root_canal_treatment', {
                    ...toothData.roots?.root_canal_treatment,
                    notes: e.target.value
                  })}
                  placeholder="تفاصيل العلاج والملاحظات..."
                  rows={4}
                />
              </div>
            </div>
          </TabsContent>

          {/* تبويب الملاحظات */}
          <TabsContent value="notes" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label>الملاحظات السريرية</Label>
                <Textarea
                  value={toothData.notes?.clinical_notes || ''}
                  onChange={(e) => updateNotes('clinical_notes', e.target.value)}
                  placeholder="ملاحظات من الفحص السريري..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>خطة العلاج</Label>
                <Textarea
                  value={toothData.notes?.treatment_plan || ''}
                  onChange={(e) => updateNotes('treatment_plan', e.target.value)}
                  placeholder="خطة العلاج المقترحة..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>تعليقات إضافية</Label>
                <Textarea
                  value={toothData.notes?.additional_comments || ''}
                  onChange={(e) => updateNotes('additional_comments', e.target.value)}
                  placeholder="أي تعليقات أو ملاحظات إضافية..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>موعد المتابعة</Label>
                <Input
                  type="date"
                  value={toothData.notes?.follow_up_date || ''}
                  onChange={(e) => updateNotes('follow_up_date', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            إلغاء
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            حفظ البيانات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ToothModal;
