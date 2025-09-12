import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { 
  ConditionType,
  ComprehensiveToothRecord,
  ToothNumberingSystem,
  INTERNATIONAL_COLOR_SYSTEM,
  CONDITION_LABELS_AR
} from "@/types/dental-enhanced";
import { 
  ANATOMICAL_POSITIONS,
  ToothTemplate,
  PatientToothImage,
  AnatomicalChartProps
} from "@/types/anatomical-dental";
import { AnatomicalTooth } from "./AnatomicalTooth";
import { ToothRecordDialog } from "./ToothRecordDialog";
import { LinearToothComponent } from "./LinearToothComponent";
import { ColorLegend } from "./ColorLegend";

export const AnatomicalDentalChart: React.FC<AnatomicalChartProps> = ({
  patientId,
  onToothSelect,
  onSaveRecord
}) => {
  // حالات النظام
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [toothRecords, setToothRecords] = useState<Map<string, ComprehensiveToothRecord>>(new Map());
  const [numberingSystem, setNumberingSystem] = useState<ToothNumberingSystem>(ToothNumberingSystem.UNIVERSAL);
  const [showAlternativeNumbers, setShowAlternativeNumbers] = useState(false);
  
  // إدارة الصور
  const [toothTemplates, setToothTemplates] = useState<Map<string, ToothTemplate>>(new Map());
  const [patientImages, setPatientImages] = useState<Map<string, PatientToothImage>>(new Map());
  const [showPatientImages, setShowPatientImages] = useState<Map<string, boolean>>(new Map());
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // تحميل الصور المحفوظة
  useEffect(() => {
    loadToothTemplates();
    loadPatientImages();
  }, [patientId]);

  const loadToothTemplates = async () => {
    const templates = new Map();
    setToothTemplates(templates);
  };

  const loadPatientImages = async () => {
    const images = new Map();
    setPatientImages(images);
  };

  // معالج رفع صور المريض
  const handlePatientImageUpload = (data: { 
    toothId: string; 
    imageData: string; 
    metadata: {
      toothNumber: string;
      quadrant: string;
      editedAt: string;
      patientId?: string;
      originalImage?: string;
    }
  }) => {
    const { toothId, imageData, metadata } = data;
    
    // إنشاء سجل صورة المريض
    const patientImage = {
      id: `${patientId || 'demo'}-${toothId}-${Date.now()}`,
      patientId: patientId || 'demo',
      toothNumber: toothId,
      imageUrl: imageData,
      createdAt: new Date(),
      clinicianId: 'current-user',
      description: `صورة محررة للسن ${metadata.toothNumber} في ${metadata.quadrant}`
    };
    
    // حفظ الصورة في الحالة
    setPatientImages(prev => new Map(prev.set(toothId, patientImage)));
    setShowPatientImages(prev => new Map(prev.set(toothId, true)));
    
    console.log('✅ تم حفظ صورة السن المحررة:', toothId, 'للمريض:', patientId);
  };

  // تبديل نوع الصورة المعروضة
  const toggleImageType = (toothNumber: string) => {
    setShowPatientImages(prev => {
      const newMap = new Map(prev);
      newMap.set(toothNumber, !prev.get(toothNumber));
      return newMap;
    });
  };

  // وظائف تحويل ترقيم الأسنان
  const convertToothNumber = (universalNumber: string, targetSystem: ToothNumberingSystem): string => {
    const toothNum = parseInt(universalNumber);
    
    switch (targetSystem) {
      case ToothNumberingSystem.FDI:
        // تحويل من Universal إلى FDI
        if (toothNum >= 1 && toothNum <= 8) return `1${toothNum}`;  // أعلى يمين
        if (toothNum >= 9 && toothNum <= 16) return `2${17 - toothNum}`;  // أعلى يسار
        if (toothNum >= 17 && toothNum <= 24) return `3${25 - toothNum}`;  // أسفل يسار
        if (toothNum >= 25 && toothNum <= 32) return `4${toothNum - 24}`;  // أسفل يمين
        break;
        
      case ToothNumberingSystem.PALMER:
        // تحويل من Universal إلى Palmer
        if (toothNum >= 1 && toothNum <= 8) return `${toothNum}⌐`;  // أعلى يمين
        if (toothNum >= 9 && toothNum <= 16) return `${17 - toothNum}⌐`;  // أعلى يسار
        if (toothNum >= 17 && toothNum <= 24) return `${25 - toothNum}⌐`;  // أسفل يسار
        if (toothNum >= 25 && toothNum <= 32) return `${toothNum - 24}⌐`;  // أسفل يمين
        break;
        
      case ToothNumberingSystem.UNIVERSAL:
      default:
        return universalNumber;
    }
    
    return universalNumber;
  };

  // دالة لتحويل ترقيم النظام الحالي إلى Universal
  const convertToUniversal = (toothNumber: string, quadrant: string): string => {
    const num = parseInt(toothNumber);
    
    switch (quadrant) {
      case 'UR': // أعلى يمين
        // من 888,777,666,555,444,333,222,111 إلى 1,2,3,4,5,6,7,8
        return String(9 - Math.floor((num + 1) / 111));
      case 'UL': // أعلى يسار  
        // من 11,22,33,44,55,66,77,88 إلى 9,10,11,12,13,14,15,16
        return String(8 + Math.floor(num / 11));
      case 'LL': // أسفل يسار
        // من 1,2,3,4,5,6,7,8 إلى 17,18,19,20,21,22,23,24
        return String(16 + num);
      case 'LR': // أسفل يمين
        // من 1,2,3,4,5,6,7,8 إلى 32,31,30,29,28,27,26,25
        return String(33 - num);
      default:
        return toothNumber;
    }
  };

  const getToothDisplayNumber = (toothNumber: string, quadrant: string): string => {
    const universalNumber = convertToUniversal(toothNumber, quadrant);
    if (showAlternativeNumbers && numberingSystem !== ToothNumberingSystem.UNIVERSAL) {
      return `${convertToothNumber(universalNumber, numberingSystem)} (${universalNumber})`;
    }
    return convertToothNumber(universalNumber, numberingSystem);
  };

  // حفظ سجل السن
  const handleSaveToothRecord = (record: ComprehensiveToothRecord) => {
    setToothRecords(prev => new Map(prev.set(record.toothNumber, record)));
    onSaveRecord?.(record);
    setShowDialog(false);
  };

  // التعامل مع نقر السن
  const handleToothClick = (toothNumber: string) => {
    setSelectedTooth(toothNumber);
    onToothSelect(toothNumber);
    setShowDialog(true);
  };

  const selectedRecord = selectedTooth ? toothRecords.get(selectedTooth) : null;

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* 🦷 المخطط التشريحي المحسن - نسخة خطية مبسطة */}
      <Card className="bg-white dark:bg-gray-900 min-h-[600px] border-none shadow-none">
        <CardContent className="p-6">
          {/* مخطط الأسنان الخطي - مضغوط ومتقارب */}
          <div className="space-y-4">
            
            {/* الفك العلوي - ترتيب خطي مضغوط */}
            <div className="space-y-2">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  الفك العلوي
                </h3>
                <div className="h-0.5 bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
              </div>
              
              {/* أسنان الفك العلوي - صف كامل من اليمين لليسار */}
              <div className="flex justify-center items-center py-2 bg-white gap-0 m-0 px-0">
                {/* الفك العلوي الأيمن (UR) - من 888 إلى 111 */}
                {['888', '777', '666', '555', '444', '333', '222', '111'].map((toothNumber) => (
                  <LinearToothComponent
                    key={`UR-${toothNumber}`}
                    toothNumber={toothNumber}
                    displayNumber={getToothDisplayNumber(toothNumber, 'UR')}
                    quadrant="UR"
                    condition={toothRecords.get(`UR-${toothNumber}`)?.diagnosis.primary || ConditionType.SOUND}
                    patientImage={patientImages.get(`UR-${toothNumber}`)}
                    showPatientImage={showPatientImages.get(`UR-${toothNumber}`) || false}
                    patientId={patientId}
                    onClick={() => handleToothClick(`UR-${toothNumber}`)}
                    onToggleImageType={() => toggleImageType(`UR-${toothNumber}`)}
                    onPatientImageUpload={handlePatientImageUpload}
                  />
                ))}
                
                {/* خط الوسط العمودي */}
                <div className="w-0.5 h-16 bg-gray-300 mx-1"></div>
                
                {/* الفك العلوي الأيسر (UL) - من 11 إلى 88 */}
                {['11', '22', '33', '44', '55', '66', '77', '88'].map((toothNumber) => (
                  <LinearToothComponent
                    key={`UL-${toothNumber}`}
                    toothNumber={toothNumber}
                    displayNumber={getToothDisplayNumber(toothNumber, 'UL')}
                    quadrant="UL"
                    condition={toothRecords.get(`UL-${toothNumber}`)?.diagnosis.primary || ConditionType.SOUND}
                    patientImage={patientImages.get(`UL-${toothNumber}`)}
                    showPatientImage={showPatientImages.get(`UL-${toothNumber}`) || false}
                    patientId={patientId}
                    onClick={() => handleToothClick(`UL-${toothNumber}`)}
                    onToggleImageType={() => toggleImageType(`UL-${toothNumber}`)}
                    onPatientImageUpload={handlePatientImageUpload}
                  />
                ))}
              </div>
            </div>

            {/* الفك السفلي - ترتيب خطي مضغوط */}
            <div className="space-y-2">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  الفك السفلي
                </h3>
                <div className="h-0.5 bg-gradient-to-r from-transparent via-green-300 to-transparent"></div>
              </div>
              
              {/* أسنان الفك السفلي - صف كامل من اليمين لليسار */}
              <div className="flex justify-center items-center py-2 bg-white gap-0 m-0 px-0">
                {/* الفك السفلي الأيمن (LR) - من 8 إلى 1 */}
                {['8', '7', '6', '5', '4', '3', '2', '1'].map((toothNumber) => (
                  <LinearToothComponent
                    key={`LR-${toothNumber}`}
                    toothNumber={toothNumber}
                    displayNumber={getToothDisplayNumber(toothNumber, 'LR')}
                    quadrant="LR"
                    condition={toothRecords.get(`LR-${toothNumber}`)?.diagnosis.primary || ConditionType.SOUND}
                    patientImage={patientImages.get(`LR-${toothNumber}`)}
                    showPatientImage={showPatientImages.get(`LR-${toothNumber}`) || false}
                    patientId={patientId}
                    onClick={() => handleToothClick(`LR-${toothNumber}`)}
                    onToggleImageType={() => toggleImageType(`LR-${toothNumber}`)}
                    onPatientImageUpload={handlePatientImageUpload}
                  />
                ))}
                
                {/* خط الوسط العمودي */}
                <div className="w-0.5 h-16 bg-gray-300 mx-1"></div>
                
                {/* الفك السفلي الأيسر (LL) - من 1 إلى 8 */}
                {['1', '2', '3', '4', '5', '6', '7', '8'].map((toothNumber) => (
                  <LinearToothComponent
                    key={`LL-${toothNumber}`}
                    toothNumber={toothNumber}
                    displayNumber={getToothDisplayNumber(toothNumber, 'LL')}
                    quadrant="LL"
                    condition={toothRecords.get(`LL-${toothNumber}`)?.diagnosis.primary || ConditionType.SOUND}
                    patientImage={patientImages.get(`LL-${toothNumber}`)}
                    showPatientImage={showPatientImages.get(`LL-${toothNumber}`) || false}
                    patientId={patientId}
                    onClick={() => handleToothClick(`LL-${toothNumber}`)}
                    onToggleImageType={() => toggleImageType(`LL-${toothNumber}`)}
                    onPatientImageUpload={handlePatientImageUpload}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* لوحة التحكم في أنظمة الترقيم - أسفل المخطط */}
      <Card className="bg-gradient-to-r from-purple-50 via-blue-50 to-teal-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-teal-900/20 border-2 border-purple-200 dark:border-purple-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6 justify-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="numbering-system" className="text-sm font-medium">
                نظام ترقيم الأسنان:
              </Label>
              <Select value={numberingSystem} onValueChange={(value) => setNumberingSystem(value as ToothNumberingSystem)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ToothNumberingSystem.UNIVERSAL}>
                    Universal (1-32) - أمريكي
                  </SelectItem>
                  <SelectItem value={ToothNumberingSystem.FDI}>
                    FDI (11-48) - دولي
                  </SelectItem>
                  <SelectItem value={ToothNumberingSystem.PALMER}>
                    Palmer - بريطاني
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id="show-alternative"
                checked={showAlternativeNumbers}
                onCheckedChange={setShowAlternativeNumbers}
              />
              <Label htmlFor="show-alternative" className="text-sm">
                إظهار الترقيم البديل
              </Label>
            </div>
            
            <div className="text-xs text-muted-foreground bg-white/50 px-2 py-1 rounded">
              النظام الحالي: {numberingSystem === ToothNumberingSystem.UNIVERSAL ? 'أمريكي' : 
                              numberingSystem === ToothNumberingSystem.FDI ? 'دولي' : 'بريطاني'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* مفتاح الألوان العالمي - معيار WHO - أسفل المخطط */}
      <ColorLegend compact={false} showDescriptions={true} />

      {/* Input مخفي لرفع الصور */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          // معالج رفع الملف العادي - يمكن إضافة منطق لاحقاً
          console.log('تم اختيار ملف:', e.target.files?.[0]?.name);
        }}
        className="hidden"
        aria-label="رفع صورة المريض"
      />

      {/* حوار تسجيل بيانات السن */}
      <ToothRecordDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        toothNumber={selectedTooth || ''}
        existingRecord={selectedRecord}
        onSave={handleSaveToothRecord}
        onUploadImage={() => fileInputRef.current?.click()}
        hasImage={selectedTooth ? patientImages.has(selectedTooth) : false}
      />
    </div>
  );
};
