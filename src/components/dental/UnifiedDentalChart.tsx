import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  Camera, 
  Save, 
  Settings, 
  Eye, 
  Palette,
  Globe,
  Accessibility,
  Download,
  Star,
  Heart,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  ToothNumberingSystem, 
  ViewMode,
  ConditionType, 
  MobilityLevel,
  ComprehensiveToothRecord,
  ClinicalMeasurements,
  RootDetails,
  ToothSurfaces,
  INTERNATIONAL_COLOR_SYSTEM,
  AccessibilityOptions,
  ExportOptions
} from "@/types/dental-enhanced";
import { ToothRecordDialog } from "./ToothRecordDialog";

// 🦷 مكون السن الموحد مع جميع المميزات
interface UnifiedToothProps {
  toothNumber: string;
  condition: ConditionType;
  hasImage?: boolean;
  imageUrl?: string;
  onClick: () => void;
  className?: string;
  numberingSystem: ToothNumberingSystem;
  showAlternativeNumbers: boolean;
  viewMode: ViewMode;
}

const UnifiedToothComponent: React.FC<UnifiedToothProps> = ({
  toothNumber,
  condition,
  hasImage,
  imageUrl,
  onClick,
  className,
  numberingSystem,
  showAlternativeNumbers,
  viewMode
}) => {
  const getConditionColor = (condition: ConditionType) => {
    return INTERNATIONAL_COLOR_SYSTEM[condition] || INTERNATIONAL_COLOR_SYSTEM.missing;
  };

  const getAlternativeNumber = (tooth: string, currentSystem: ToothNumberingSystem) => {
    // تحويل بسيط بين الأنظمة - يمكن تطويره أكثر
    if (currentSystem === ToothNumberingSystem.FDI && showAlternativeNumbers) {
      // مثال تحويل من FDI إلى Universal
      const fdiToUniversal: { [key: string]: string } = {
        '18': '1', '17': '2', '16': '3', '15': '4', '14': '5', '13': '6', '12': '7', '11': '8',
        '21': '9', '22': '10', '23': '11', '24': '12', '25': '13', '26': '14', '27': '15', '28': '16',
        '48': '32', '47': '31', '46': '30', '45': '29', '44': '28', '43': '27', '42': '26', '41': '25',
        '31': '24', '32': '23', '33': '22', '34': '21', '35': '20', '36': '19', '37': '18', '38': '17'
      };
      return fdiToUniversal[tooth] || tooth;
    }
    return tooth;
  };

  const getToothName = (condition: ConditionType) => {
    const names = {
      [ConditionType.SOUND]: 'سليم',
      [ConditionType.CARIES]: 'تسوس',
      [ConditionType.FILLED]: 'محشو',
      [ConditionType.CROWN]: 'تاج',
      [ConditionType.ROOT_CANAL]: 'علاج عصب',
      [ConditionType.IMPLANT]: 'زراعة',
      [ConditionType.MISSING]: 'مفقود',
      [ConditionType.FRACTURED]: 'مكسور',
      [ConditionType.PERIAPICAL_LESION]: 'آفة ذروية',
      [ConditionType.PERIODONTAL_DISEASE]: 'مرض لثوي'
    };
    return names[condition] || 'غير محدد';
  };

  return (
    <div 
      className={cn(
        "relative group cursor-pointer transition-all duration-300 hover:scale-110",
        "flex flex-col items-center justify-center p-3 rounded-xl",
        "border-2 border-gray-200 hover:border-blue-400 dark:border-gray-700",
        "bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg",
        viewMode === ViewMode.ANATOMICAL && "p-4",
        className
      )}
      onClick={onClick}
    >
      {/* رقم السن الأساسي */}
      <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
        {toothNumber}
      </div>
      
      {/* رقم السن البديل إذا كان مفعلاً */}
      {showAlternativeNumbers && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          ({getAlternativeNumber(toothNumber, numberingSystem)})
        </div>
      )}
      
      {/* شكل السن أو الصورة */}
      <div className="relative w-14 h-14 mb-2">
        {hasImage && imageUrl ? (
          <img 
            src={imageUrl} 
            alt={`السن ${toothNumber}`}
            className="w-full h-full object-cover rounded-lg border border-gray-300 shadow-sm"
          />
        ) : (
          <svg 
            viewBox="0 0 24 24" 
            className="w-full h-full transition-all duration-300"
            fill={getConditionColor(condition)}
          >
            <path d="M12 2C12 2 8 4 8 8V16C8 20 12 22 12 22C12 22 16 20 16 16V8C16 4 12 2 12 2Z" />
          </svg>
        )}
        
        {/* أيقونات المؤشرات */}
        <div className="absolute -top-1 -right-1 flex flex-col gap-1">
          {hasImage && (
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <Camera className="w-2 h-2 text-white" />
            </div>
          )}
          {condition !== ConditionType.SOUND && (
            <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
              <Star className="w-2 h-2 text-white" />
            </div>
          )}
        </div>
      </div>
      
      {/* اسم الحالة */}
      <div className="text-xs text-center text-gray-600 dark:text-gray-300 font-medium">
        {getToothName(condition)}
      </div>
    </div>
  );
};

// 🌟 المخطط الموحد العالمي مع جميع المميزات
interface UnifiedDentalChartProps {
  patientId: string;
  onSaveRecord?: (record: ComprehensiveToothRecord) => void;
}

export const UnifiedDentalChart: React.FC<UnifiedDentalChartProps> = ({
  patientId,
  onSaveRecord
}) => {
  // حالات النظام
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [toothRecords, setToothRecords] = useState<Map<string, ComprehensiveToothRecord>>(new Map());
  const [toothImages, setToothImages] = useState<Map<string, string>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // إعدادات النظام العالمي
  const [numberingSystem, setNumberingSystem] = useState<ToothNumberingSystem>(ToothNumberingSystem.FDI);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.ANATOMICAL);
  const [showAlternativeNumbers, setShowAlternativeNumbers] = useState(true);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  
  // إعدادات إمكانية الوصول
  const [accessibilityOptions, setAccessibilityOptions] = useState<AccessibilityOptions>({
    screenReader: false,
    highContrast: false,
    fontSize: 'medium',
    voiceControl: false
  });

  // 🦷 تخطيط الأسنان المنظم حسب النظام المختار
  const getToothLayout = () => {
    switch (numberingSystem) {
      case ToothNumberingSystem.FDI:
        return {
          upperRight: ['18', '17', '16', '15', '14', '13', '12', '11'],
          upperLeft: ['21', '22', '23', '24', '25', '26', '27', '28'],
          lowerRight: ['48', '47', '46', '45', '44', '43', '42', '41'],
          lowerLeft: ['31', '32', '33', '34', '35', '36', '37', '38']
        };
      case ToothNumberingSystem.UNIVERSAL:
        return {
          upperRight: ['1', '2', '3', '4', '5', '6', '7', '8'],
          upperLeft: ['9', '10', '11', '12', '13', '14', '15', '16'],
          lowerRight: ['32', '31', '30', '29', '28', '27', '26', '25'],
          lowerLeft: ['24', '23', '22', '21', '20', '19', '18', '17']
        };
      case ToothNumberingSystem.PALMER:
        return {
          upperRight: ['8⁺', '7⁺', '6⁺', '5⁺', '4⁺', '3⁺', '2⁺', '1⁺'],
          upperLeft: ['1⁺', '2⁺', '3⁺', '4⁺', '5⁺', '6⁺', '7⁺', '8⁺'],
          lowerRight: ['8⁻', '7⁻', '6⁻', '5⁻', '4⁻', '3⁻', '2⁻', '1⁻'],
          lowerLeft: ['1⁻', '2⁻', '3⁻', '4⁻', '5⁻', '6⁻', '7⁻', '8⁻']
        };
      default: // ARABIC
        return {
          upperRight: ['٨ع', '٧ع', '٦ع', '٥ع', '٤ع', '٣ع', '٢ع', '١ع'],
          upperLeft: ['١ع', '٢ع', '٣ع', '٤ع', '٥ع', '٦ع', '٧ع', '٨ع'],
          lowerRight: ['٨س', '٧س', '٦س', '٥س', '٤س', '٣س', '٢س', '١س'],
          lowerLeft: ['١س', '٢س', '٣س', '٤س', '٥س', '٦س', '٧س', '٨س']
        };
    }
  };

  // 📸 رفع صورة للسن
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedTooth) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setToothImages(prev => new Map(prev.set(selectedTooth, imageUrl)));
      };
      reader.readAsDataURL(file);
    }
  };

  // 💾 حفظ سجل السن
  const handleSaveToothRecord = (record: ComprehensiveToothRecord) => {
    setToothRecords(prev => new Map(prev.set(record.toothNumber, record)));
    onSaveRecord?.(record);
    setShowDialog(false);
  };

  // 📊 إحصائيات المخطط
  const getChartStatistics = () => {
    const totalTeeth = 32;
    const recordedTeeth = toothRecords.size;
    const teethWithImages = toothImages.size;
    const healthyTeeth = Array.from(toothRecords.values()).filter(record => 
      record.diagnosis.primary === ConditionType.SOUND
    ).length;
    
    return { totalTeeth, recordedTeeth, teethWithImages, healthyTeeth };
  };

  const layout = getToothLayout();
  const selectedRecord = selectedTooth ? toothRecords.get(selectedTooth) : null;
  const stats = getChartStatistics();

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* 📊 رأس النظام الموحد */}
      <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-2 border-blue-200 dark:border-blue-700">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center flex items-center justify-center gap-4">
            <Sparkles className="w-8 h-8 text-blue-600" />
            🦷 النظام الموحد العالمي لمخططات الأسنان
            <Sparkles className="w-8 h-8 text-purple-600" />
          </CardTitle>
          
          {/* إحصائيات سريعة */}
          <div className="flex justify-center items-center gap-6 mt-4">
            <Badge variant="secondary" className="text-sm">
              <Globe className="w-4 h-4 mr-2" />
              {numberingSystem.toUpperCase()}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              📊 {stats.recordedTeeth}/{stats.totalTeeth} مسجل
            </Badge>
            <Badge variant="secondary" className="text-sm">
              📸 {stats.teethWithImages} صورة
            </Badge>
            <Badge variant="secondary" className="text-sm">
              💚 {stats.healthyTeeth} سليم
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* 🔧 لوحة الإعدادات العالمية */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" />
              الإعدادات العالمية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* نظام الترقيم */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                نظام الترقيم
              </Label>
              <Select value={numberingSystem} onValueChange={(value) => setNumberingSystem(value as ToothNumberingSystem)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ToothNumberingSystem.FDI}>🌍 FDI - النظام الدولي</SelectItem>
                  <SelectItem value={ToothNumberingSystem.UNIVERSAL}>🇺🇸 Universal - الأمريكي</SelectItem>
                  <SelectItem value={ToothNumberingSystem.PALMER}>📋 Palmer Notation</SelectItem>
                  <SelectItem value={ToothNumberingSystem.ARABIC}>🇸🇦 الترقيم العربي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* نمط العرض */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Eye className="w-4 h-4" />
                نمط العرض
              </Label>
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ViewMode.ANATOMICAL}>🦷 تشريحي دقيق</SelectItem>
                  <SelectItem value={ViewMode.SIMPLIFIED}>🔸 مبسط</SelectItem>
                  <SelectItem value={ViewMode.PERIODONTAL}>🦴 لثوي متخصص</SelectItem>
                  <SelectItem value={ViewMode.ORTHODONTIC}>📐 تقويم أسنان</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* أرقام بديلة */}
            <div className="flex items-center space-x-2">
              <Switch 
                id="alternative-numbers"
                checked={showAlternativeNumbers}
                onCheckedChange={setShowAlternativeNumbers}
              />
              <Label htmlFor="alternative-numbers" className="text-sm">
                عرض أرقام بديلة
              </Label>
            </div>

            {/* إعدادات إمكانية الوصول */}
            <div className="space-y-3 border-t pt-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Accessibility className="w-4 h-4" />
                إمكانية الوصول
              </Label>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="high-contrast"
                  checked={accessibilityOptions.highContrast}
                  onCheckedChange={(checked) => 
                    setAccessibilityOptions(prev => ({ ...prev, highContrast: checked }))
                  }
                />
                <Label htmlFor="high-contrast" className="text-xs">
                  تباين عالي
                </Label>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">حجم النص</Label>
                <Select 
                  value={accessibilityOptions.fontSize} 
                  onValueChange={(value) => 
                    setAccessibilityOptions(prev => ({ ...prev, fontSize: value as 'small' | 'medium' | 'large' }))
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">صغير</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="large">كبير</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* أزرار التصدير */}
            <div className="space-y-2 border-t pt-3">
              <Button variant="outline" size="sm" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                تصدير PDF
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                تصدير صورة
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 🦷 مخطط الأسنان الموحد */}
        <Card className="lg:col-span-3">
          <CardContent className="p-8">
            <div className="space-y-8">
              {/* الفك العلوي */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2">
                  <Star className="w-5 h-5" />
                  الفك العلوي
                </h3>
                
                <div className="flex justify-center">
                  <div className="grid grid-cols-17 gap-2 max-w-5xl items-center">
                    {/* الجانب الأيمن العلوي */}
                    {layout.upperRight.reverse().map((tooth) => (
                      <UnifiedToothComponent
                        key={tooth}
                        toothNumber={tooth}
                        condition={toothRecords.get(tooth)?.diagnosis.primary || ConditionType.SOUND}
                        hasImage={toothImages.has(tooth)}
                        imageUrl={toothImages.get(tooth)}
                        numberingSystem={numberingSystem}
                        showAlternativeNumbers={showAlternativeNumbers}
                        viewMode={viewMode}
                        onClick={() => {
                          setSelectedTooth(tooth);
                          setShowDialog(true);
                        }}
                      />
                    ))}
                    
                    {/* خط المنتصف */}
                    <div className="col-span-1 flex items-center justify-center">
                      <div className="w-1 h-16 bg-gradient-to-b from-red-400 to-red-600 dark:from-red-500 dark:to-red-700 rounded-full shadow-lg"></div>
                    </div>
                    
                    {/* الجانب الأيسر العلوي */}
                    {layout.upperLeft.map((tooth) => (
                      <UnifiedToothComponent
                        key={tooth}
                        toothNumber={tooth}
                        condition={toothRecords.get(tooth)?.diagnosis.primary || ConditionType.SOUND}
                        hasImage={toothImages.has(tooth)}
                        imageUrl={toothImages.get(tooth)}
                        numberingSystem={numberingSystem}
                        showAlternativeNumbers={showAlternativeNumbers}
                        viewMode={viewMode}
                        onClick={() => {
                          setSelectedTooth(tooth);
                          setShowDialog(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* خط الفصل الرئيسي */}
              <div className="flex justify-center">
                <div className="w-[600px] h-1 bg-gradient-to-r from-transparent via-gray-400 to-transparent rounded-full"></div>
              </div>

              {/* الفك السفلي */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2">
                  <Heart className="w-5 h-5" />
                  الفك السفلي
                </h3>
                
                <div className="flex justify-center">
                  <div className="grid grid-cols-17 gap-2 max-w-5xl items-center">
                    {/* الجانب الأيمن السفلي */}
                    {layout.lowerRight.map((tooth) => (
                      <UnifiedToothComponent
                        key={tooth}
                        toothNumber={tooth}
                        condition={toothRecords.get(tooth)?.diagnosis.primary || ConditionType.SOUND}
                        hasImage={toothImages.has(tooth)}
                        imageUrl={toothImages.get(tooth)}
                        numberingSystem={numberingSystem}
                        showAlternativeNumbers={showAlternativeNumbers}
                        viewMode={viewMode}
                        onClick={() => {
                          setSelectedTooth(tooth);
                          setShowDialog(true);
                        }}
                      />
                    ))}
                    
                    {/* خط المنتصف */}
                    <div className="col-span-1 flex items-center justify-center">
                      <div className="w-1 h-16 bg-gradient-to-b from-red-400 to-red-600 dark:from-red-500 dark:to-red-700 rounded-full shadow-lg"></div>
                    </div>
                    
                    {/* الجانب الأيسر السفلي */}
                    {layout.lowerLeft.reverse().map((tooth) => (
                      <UnifiedToothComponent
                        key={tooth}
                        toothNumber={tooth}
                        condition={toothRecords.get(tooth)?.diagnosis.primary || ConditionType.SOUND}
                        hasImage={toothImages.has(tooth)}
                        imageUrl={toothImages.get(tooth)}
                        numberingSystem={numberingSystem}
                        showAlternativeNumbers={showAlternativeNumbers}
                        viewMode={viewMode}
                        onClick={() => {
                          setSelectedTooth(tooth);
                          setShowDialog(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🎨 مفتاح الألوان العالمي */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="w-5 h-5" />
            مفتاح الألوان العالمي (معايير WHO)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(INTERNATIONAL_COLOR_SYSTEM).map(([condition, color]) => {
              if (typeof color === 'string') {
                const conditionNames = {
                  sound: 'سليم',
                  caries: 'تسوس',
                  filled: 'محشو',
                  crown: 'تاج',
                  root_canal: 'علاج عصب',
                  implant: 'زراعة',
                  missing: 'مفقود',
                  fractured: 'مكسور',
                  periapical_lesion: 'آفة ذروية',
                  periodontal_disease: 'مرض لثوي'
                };

                return (
                  <div key={condition} className="flex items-center gap-3 text-sm">
                    <div 
                      className="w-6 h-6 rounded-lg border-2 border-gray-300 shadow-sm"
                      data-color={condition}
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {conditionNames[condition as keyof typeof conditionNames] || condition}
                    </span>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </CardContent>
      </Card>

      {/* مرجع رفع الملفات المخفي */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        title="رفع صورة السن"
        aria-label="رفع صورة السن"
      />

      {/* 🔧 نافذة تحرير سجل السن الشاملة */}
      <ToothRecordDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        toothNumber={selectedTooth || ''}
        existingRecord={selectedRecord}
        onSave={handleSaveToothRecord}
        onUploadImage={() => fileInputRef.current?.click()}
        hasImage={selectedTooth ? toothImages.has(selectedTooth) : false}
      />
    </div>
  );
};

export default UnifiedDentalChart;
