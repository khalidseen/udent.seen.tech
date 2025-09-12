import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Save, 
  Calendar, 
  Activity, 
  FileText,
  AlertTriangle,
  Heart,
  Zap
} from "lucide-react";
import { 
  ConditionType, 
  MobilityLevel,
  ComprehensiveToothRecord,
  ClinicalMeasurements,
  RootDetails,
  ToothSurfaces,
  ToothNumberingSystem,
  CONDITION_LABELS_AR
} from "@/types/dental-enhanced";

interface ToothRecordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  toothNumber: string;
  existingRecord?: ComprehensiveToothRecord | null;
  onSave: (record: ComprehensiveToothRecord) => void;
  onUploadImage: () => void;
  hasImage: boolean;
}

export const ToothRecordDialog: React.FC<ToothRecordDialogProps> = ({
  isOpen,
  onClose,
  toothNumber,
  existingRecord,
  onSave,
  onUploadImage,
  hasImage
}) => {
  const [formData, setFormData] = useState<Partial<ComprehensiveToothRecord>>({});
  const [surfaces, setSurfaces] = useState<ToothSurfaces>({
    mesial: ConditionType.SOUND,
    distal: ConditionType.SOUND,
    buccal: ConditionType.SOUND,
    lingual: ConditionType.SOUND,
    occlusal: ConditionType.SOUND,
    incisal: ConditionType.SOUND
  });
  const [clinical, setClinical] = useState<ClinicalMeasurements>({
    mobility: MobilityLevel.ZERO,
    probingDepth: [2, 2, 2, 2, 2, 2],
    bleeding: false,
    recession: [0, 0, 0, 0, 0, 0]
  });
  const [roots, setRoots] = useState<RootDetails>({
    count: 1,
    conditions: [ConditionType.SOUND],
    endodonticTreatment: false
  });

  useEffect(() => {
    if (existingRecord) {
      setFormData(existingRecord);
      setSurfaces(existingRecord.surfaces);
      setClinical(existingRecord.clinical);
      setRoots(existingRecord.roots);
    } else {
      // إعادة تعيين القيم الافتراضية
      setFormData({
        toothNumber,
        numberingSystem: ToothNumberingSystem.FDI,
        diagnosis: { primary: ConditionType.SOUND },
        notes: '',
        priority: 'low'
      });
    }
  }, [existingRecord, toothNumber]);

  const handleSave = () => {
    const record: ComprehensiveToothRecord = {
      toothNumber,
      numberingSystem: formData.numberingSystem || ToothNumberingSystem.FDI,
      diagnosis: formData.diagnosis || { primary: ConditionType.SOUND },
      surfaces,
      roots,
      clinical,
      notes: formData.notes || '',
      priority: formData.priority || 'low',
      createdAt: existingRecord?.createdAt || new Date(),
      updatedAt: new Date(),
      clinicianId: 'current-user' // يجب استبداله بمعرف الطبيب الحقيقي
    };
    
    onSave(record);
  };

  const conditionOptions = [
    { value: 'sound', label: CONDITION_LABELS_AR.sound, color: 'bg-green-500' },
    { value: 'caries', label: CONDITION_LABELS_AR.caries, color: 'bg-red-500' },
    { value: 'filled', label: CONDITION_LABELS_AR.filled, color: 'bg-blue-500' },
    { value: 'crown', label: CONDITION_LABELS_AR.crown, color: 'bg-purple-500' },
    { value: 'root_canal', label: CONDITION_LABELS_AR.root_canal, color: 'bg-pink-500' },
    { value: 'implant', label: CONDITION_LABELS_AR.implant, color: 'bg-gray-500' },
    { value: 'missing', label: CONDITION_LABELS_AR.missing, color: 'bg-gray-400' },
    { value: 'fractured', label: CONDITION_LABELS_AR.fractured, color: 'bg-orange-500' },
    { value: 'periapical_lesion', label: CONDITION_LABELS_AR.periapical_lesion, color: 'bg-yellow-500' },
    { value: 'periodontal_disease', label: CONDITION_LABELS_AR.periodontal_disease, color: 'bg-lime-500' },
    { value: 'has_notes', label: CONDITION_LABELS_AR.has_notes, color: 'bg-indigo-500' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            🦷 سجل السن رقم {toothNumber}
            {hasImage && <Badge variant="secondary">يحتوي على صورة</Badge>}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="diagnosis" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="diagnosis">التشخيص</TabsTrigger>
            <TabsTrigger value="surfaces">الأسطح</TabsTrigger>
            <TabsTrigger value="clinical">القياسات</TabsTrigger>
            <TabsTrigger value="roots">الجذور</TabsTrigger>
            <TabsTrigger value="notes">الملاحظات</TabsTrigger>
          </TabsList>

          {/* 🩺 تبويب التشخيص */}
          <TabsContent value="diagnosis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  التشخيص الأساسي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الحالة الأساسية</Label>
                    <Select 
                      value={formData.diagnosis?.primary} 
                      onValueChange={(value) => 
                        setFormData(prev => ({
                          ...prev,
                          diagnosis: { ...prev.diagnosis, primary: value as ConditionType }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {conditionOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${option.color}`} />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>الأولوية</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, priority: value as 'low' | 'medium' | 'high' }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">منخفضة</SelectItem>
                        <SelectItem value="medium">متوسطة</SelectItem>
                        <SelectItem value="high">عالية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>رمز ICD-10 (اختياري)</Label>
                  <Input 
                    placeholder="مثل: K02.9"
                    value={formData.diagnosis?.icd10Code || ''}
                    onChange={(e) => 
                      setFormData(prev => ({
                        ...prev,
                        diagnosis: { ...prev.diagnosis, icd10Code: e.target.value }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    <span>صورة السن</span>
                  </div>
                  <Button variant="outline" onClick={onUploadImage}>
                    {hasImage ? 'تغيير الصورة' : 'رفع صورة'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 🦷 تبويب الأسطح */}
          <TabsContent value="surfaces" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>أسطح السن</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {/* الأسطح الأساسية */}
                  {Object.entries(surfaces).map(([surface, condition]) => (
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
                        onValueChange={(value) => 
                          setSurfaces(prev => ({ ...prev, [surface]: value as ConditionType }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {conditionOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${option.color}`} />
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 📏 تبويب القياسات السريرية */}
          <TabsContent value="clinical" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  القياسات السريرية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* درجة الحركة */}
                <div className="space-y-2">
                  <Label>درجة حركة السن</Label>
                  <Select 
                    value={clinical.mobility.toString()} 
                    onValueChange={(value) => 
                      setClinical(prev => ({ ...prev, mobility: parseInt(value) as MobilityLevel }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 - لا توجد حركة</SelectItem>
                      <SelectItem value="1">1 - حركة خفيفة</SelectItem>
                      <SelectItem value="2">2 - حركة متوسطة</SelectItem>
                      <SelectItem value="3">3 - حركة شديدة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* عمق الجيوب */}
                <div className="space-y-2">
                  <Label>عمق الجيوب اللثوية (6 قياسات - مم)</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {clinical.probingDepth.map((depth, index) => (
                      <Input
                        key={index}
                        type="number"
                        min="0"
                        max="15"
                        value={depth}
                        onChange={(e) => {
                          const newDepths = [...clinical.probingDepth];
                          newDepths[index] = parseInt(e.target.value) || 0;
                          setClinical(prev => ({ ...prev, probingDepth: newDepths }));
                        }}
                        className="text-center"
                        placeholder={`${index + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* النزيف */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="bleeding"
                    checked={clinical.bleeding}
                    onCheckedChange={(checked) => 
                      setClinical(prev => ({ ...prev, bleeding: checked as boolean }))
                    }
                  />
                  <Label htmlFor="bleeding">نزيف عند الفحص</Label>
                </div>

                {/* انحسار اللثة */}
                <div className="space-y-2">
                  <Label>انحسار اللثة (6 قياسات - مم)</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {clinical.recession.map((recession, index) => (
                      <Input
                        key={index}
                        type="number"
                        min="0"
                        max="10"
                        value={recession}
                        onChange={(e) => {
                          const newRecession = [...clinical.recession];
                          newRecession[index] = parseInt(e.target.value) || 0;
                          setClinical(prev => ({ ...prev, recession: newRecession }));
                        }}
                        className="text-center"
                        placeholder={`${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 🦴 تبويب الجذور */}
          <TabsContent value="roots" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  تفاصيل الجذور
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>عدد الجذور</Label>
                    <Select 
                      value={roots.count.toString()} 
                      onValueChange={(value) => 
                        setRoots(prev => ({ ...prev, count: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">جذر واحد</SelectItem>
                        <SelectItem value="2">جذران</SelectItem>
                        <SelectItem value="3">ثلاثة جذور</SelectItem>
                        <SelectItem value="4">أربعة جذور</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="endodontic"
                      checked={roots.endodonticTreatment}
                      onCheckedChange={(checked) => 
                        setRoots(prev => ({ ...prev, endodonticTreatment: checked as boolean }))
                      }
                    />
                    <Label htmlFor="endodontic">تم علاج العصب</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 📝 تبويب الملاحظات */}
          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  الملاحظات والتعليقات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="أدخل الملاحظات السريرية، خطة العلاج، أو أي تعليقات أخرى..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={8}
                  className="resize-none"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* أزرار الحفظ والإلغاء */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            حفظ السجل
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
