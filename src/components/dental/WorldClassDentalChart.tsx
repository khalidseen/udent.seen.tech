import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Download, 
  Settings, 
  Eye, 
  Palette,
  Globe,
  Accessibility
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  ToothNumberingSystem, 
  ViewMode, 
  INTERNATIONAL_COLOR_SYSTEM,
  ComprehensiveToothRecord,
  EnhancedDentalChartProps 
} from "@/types/dental-enhanced";
import { EnhancedTooth } from "./EnhancedTooth";

// 🦷 تخطيط الأسنان حسب النظام
const getToothLayout = (system: ToothNumberingSystem) => {
  switch (system) {
    case ToothNumberingSystem.FDI:
      return {
        upper: ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'],
        lower: ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38']
      };
    case ToothNumberingSystem.PALMER:
      return {
        upper: ['8⁺', '7⁺', '6⁺', '5⁺', '4⁺', '3⁺', '2⁺', '1⁺', '1⁺', '2⁺', '3⁺', '4⁺', '5⁺', '6⁺', '7⁺', '8⁺'],
        lower: ['8⁻', '7⁻', '6⁻', '5⁻', '4⁻', '3⁻', '2⁻', '1⁻', '1⁻', '2⁻', '3⁻', '4⁻', '5⁻', '6⁻', '7⁻', '8⁻']
      };
    default: // UNIVERSAL
      return {
        upper: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'],
        lower: ['32', '31', '30', '29', '28', '27', '26', '25', '24', '23', '22', '21', '20', '19', '18', '17']
      };
  }
};

export const WorldClassDentalChart: React.FC<EnhancedDentalChartProps> = ({
  patientId,
  primarySystem,
  viewMode,
  showAlternativeNumbers,
  accessibilityOptions,
  onToothSelect,
  onSaveRecord
}) => {
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [currentSystem, setCurrentSystem] = useState(primarySystem);
  const [currentViewMode, setCurrentViewMode] = useState(viewMode);
  const [showAlternative, setShowAlternative] = useState(showAlternativeNumbers);
  const [toothRecords, setToothRecords] = useState<Record<string, ComprehensiveToothRecord>>({});
  const [isLoading, setIsLoading] = useState(false);

  const toothLayout = getToothLayout(currentSystem);

  // 📊 تحميل سجلات الأسنان
  useEffect(() => {
    const loadToothRecords = async () => {
      if (!patientId) return;
      
      setIsLoading(true);
      try {
        // هنا يمكن تحميل البيانات من قاعدة البيانات
        // const records = await fetchToothRecords(patientId);
        // setToothRecords(records);
      } catch (error) {
        console.error('خطأ في تحميل سجلات الأسنان:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadToothRecords();
  }, [patientId]);

  const handleToothSelect = (toothNumber: string) => {
    setSelectedTooth(toothNumber);
    onToothSelect(toothNumber);
  };

  // 🎨 مكون مفتاح الألوان المحسن
  const ColorLegend = () => (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Palette className="w-5 h-5 text-blue-600" />
        مفتاح الألوان العالمي (معيار WHO)
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Object.entries(INTERNATIONAL_COLOR_SYSTEM).map(([condition, color]) => {
          if (typeof color === 'object') return null;
          
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
            <div key={condition} className="flex items-center gap-2 text-sm">
              <div 
                className="w-5 h-5 rounded-lg border-2 border-gray-300 shadow-sm"
                style={{ backgroundColor: color }}
              />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {conditionNames[condition as keyof typeof conditionNames] || condition}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  // 🔧 لوحة الإعدادات
  const SettingsPanel = () => (
    <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="w-5 h-5" />
          إعدادات العرض
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* نظام الترقيم */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Globe className="w-4 h-4" />
            نظام ترقيم الأسنان
          </Label>
          <Select value={currentSystem} onValueChange={(value) => setCurrentSystem(value as ToothNumberingSystem)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ToothNumberingSystem.UNIVERSAL}>
                Universal System (1-32) 🇺🇸
              </SelectItem>
              <SelectItem value={ToothNumberingSystem.FDI}>
                FDI System (11-48) 🌍
              </SelectItem>
              <SelectItem value={ToothNumberingSystem.PALMER}>
                Palmer System (⁺⁻) 🇬🇧
              </SelectItem>
              <SelectItem value={ToothNumberingSystem.ARABIC}>
                Arabic Numbers (١-٣٢) 🇸🇦
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* نمط العرض */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Eye className="w-4 h-4" />
            نمط العرض
          </Label>
          <Select value={currentViewMode} onValueChange={(value) => setCurrentViewMode(value as ViewMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ViewMode.ANATOMICAL}>تشريحي دقيق 🔬</SelectItem>
              <SelectItem value={ViewMode.SIMPLIFIED}>مبسط 📋</SelectItem>
              <SelectItem value={ViewMode.PERIODONTAL}>لثوي متخصص 🦷</SelectItem>
              <SelectItem value={ViewMode.ORTHODONTIC}>تقويم أسنان 🔧</SelectItem>
              <SelectItem value={ViewMode.PEDIATRIC}>أطفال 👶</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* عرض الأرقام البديلة */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Accessibility className="w-4 h-4" />
            عرض الأرقام البديلة
          </Label>
          <Switch
            checked={showAlternative}
            onCheckedChange={setShowAlternative}
          />
        </div>

        {/* إمكانيات الوصول */}
        <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">
            إمكانيات الوصول
          </Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>التباين العالي</span>
              <Switch checked={accessibilityOptions.highContrast} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>قارئ الشاشة</span>
              <Switch checked={accessibilityOptions.screenReader} />
            </div>
          </div>
        </div>

        {/* أزرار التصدير */}
        <div className="space-y-2">
          <Button variant="outline" size="sm" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            تصدير PDF
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            تصدير صورة
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mr-3">جاري تحميل مخطط الأسنان...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* العنوان والمعلومات */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            🦷 مخطط الأسنان العالمي المحسن
          </CardTitle>
          <div className="flex justify-center items-center gap-4 text-sm">
            <Badge variant="secondary" className="bg-white/20 text-white">
              {currentSystem.toUpperCase()}
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white">
              {currentViewMode}
            </Badge>
            {selectedTooth && (
              <Badge variant="secondary" className="bg-yellow-500 text-black">
                السن المحدد: {selectedTooth}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* التخطيط الرئيسي */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* الإعدادات - يسار */}
        <div className="xl:col-span-1">
          <SettingsPanel />
        </div>

        {/* مخطط الأسنان - وسط */}
        <div className="xl:col-span-2">
          <Card className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
            <CardContent className="p-8">
              <div className="space-y-8">
                {/* الفك العلوي */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-center text-gray-600 dark:text-gray-400 border-b border-dashed pb-2">
                    الفك العلوي (Maxillary)
                  </h3>
                  <div className="flex justify-center items-end gap-2 bg-gradient-to-b from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 p-6 rounded-xl">
                    {toothLayout.upper.map((toothNumber) => (
                      <EnhancedTooth
                        key={`upper-${toothNumber}`}
                        toothNumber={toothNumber}
                        numberingSystem={currentSystem}
                        record={toothRecords[toothNumber]}
                        isSelected={selectedTooth === toothNumber}
                        isUpper={true}
                        onSelect={handleToothSelect}
                        showAlternativeNumbers={showAlternative}
                      />
                    ))}
                  </div>
                </div>

                {/* خط الإطباق */}
                <div className="relative">
                  <div className="border-t-4 border-dashed border-blue-300 dark:border-blue-700"></div>
                  <div className="absolute inset-x-0 -top-3 text-center">
                    <span className="bg-white dark:bg-gray-900 px-4 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-700">
                      خط الإطباق المركزي
                    </span>
                  </div>
                </div>

                {/* الفك السفلي */}
                <div className="space-y-4">
                  <div className="flex justify-center items-start gap-2 bg-gradient-to-t from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-6 rounded-xl">
                    {toothLayout.lower.map((toothNumber) => (
                      <EnhancedTooth
                        key={`lower-${toothNumber}`}
                        toothNumber={toothNumber}
                        numberingSystem={currentSystem}
                        record={toothRecords[toothNumber]}
                        isSelected={selectedTooth === toothNumber}
                        isUpper={false}
                        onSelect={handleToothSelect}
                        showAlternativeNumbers={showAlternative}
                      />
                    ))}
                  </div>
                  <h3 className="text-lg font-semibold text-center text-gray-600 dark:text-gray-400 border-b border-dashed pb-2">
                    الفك السفلي (Mandibular)
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* معلومات السن المحدد - يمين */}
        <div className="xl:col-span-1">
          {selectedTooth ? (
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="text-lg text-yellow-800 dark:text-yellow-200">
                  السن رقم {selectedTooth}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {toothRecords[selectedTooth] ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">الحالة الأولية:</Label>
                      <Badge variant="outline" className="mr-2">
                        {toothRecords[selectedTooth].diagnosis.primary}
                      </Badge>
                    </div>
                    {toothRecords[selectedTooth].notes && (
                      <div>
                        <Label className="text-sm font-medium">الملاحظات:</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {toothRecords[selectedTooth].notes}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <p className="text-sm">لا توجد سجلات لهذا السن</p>
                    <Button size="sm" className="mt-2">
                      إضافة سجل جديد
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
              <CardContent className="p-6 text-center text-gray-500 dark:text-gray-400">
                <p>اختر سناً من المخطط لعرض المعلومات</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* مفتاح الألوان */}
      <ColorLegend />
    </div>
  );
};

export default WorldClassDentalChart;
