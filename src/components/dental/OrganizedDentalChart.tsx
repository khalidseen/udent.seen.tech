import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Upload, 
  Camera, 
  Save, 
  Edit3, 
  FileText,
  AlertTriangle,
  Calendar,
  User,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  ToothNumberingSystem, 
  ConditionType, 
  MobilityLevel,
  ComprehensiveToothRecord,
  ClinicalMeasurements,
  RootDetails,
  ToothSurfaces,
  INTERNATIONAL_COLOR_SYSTEM,
  CONDITION_LABELS_AR
} from "@/types/dental-enhanced";
import { ToothRecordDialog } from "./ToothRecordDialog";
import { ColorLegend } from "./ColorLegend";

// 🖼️ دالة لربط أرقام الأسنان بالصور الحقيقية
const getToothImagePath = (toothNumber: string): string | null => {
  // تحويل أرقام FDI للفك العلوي الأيسر إلى أرقام الصور
  const upperLeftMapping: { [key: string]: string } = {
    '11': '11.png',
    '12': '22.png',
    '13': '33.png',
    '14': '44.png',
    '15': '55.png',
    '16': '66.png',
    '17': '77.png',
    '18': '88.png'
  };

  // إضافة مسارات أخرى للأجزاء الأخرى (يمكن إضافتها لاحقاً)
  
  if (upperLeftMapping[toothNumber]) {
    return `/teeth/U L/${upperLeftMapping[toothNumber]}`;
  }
  
  return null;
};

// 🦷 كومبونينت السن المحسن مع إمكانية رفع الصور
interface EnhancedToothProps {
  toothNumber: string;
  condition: ConditionType;
  hasImage?: boolean;
  imageUrl?: string;
  onClick: () => void;
  className?: string;
}

const EnhancedToothComponent: React.FC<EnhancedToothProps> = ({
  toothNumber,
  condition,
  hasImage,
  imageUrl,
  onClick,
  className
}) => {
  const getConditionColor = (condition: ConditionType) => {
    return INTERNATIONAL_COLOR_SYSTEM[condition] || INTERNATIONAL_COLOR_SYSTEM.sound;
  };

  return (
    <div 
      className={cn(
        "relative group cursor-pointer transition-all duration-300 hover:scale-110",
        "flex flex-col items-center justify-center p-2 rounded-xl",
        "border-2 border-gray-200 hover:border-blue-400 dark:border-gray-700",
        "bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg",
        className
      )}
      onClick={onClick}
    >
      {/* رقم السن */}
      <div className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
        {toothNumber}
      </div>
      
      {/* شكل السن أو الصورة */}
      <div className="relative w-12 h-12 mb-1">
        {(() => {
          const realToothImage = getToothImagePath(toothNumber);
          console.log(`السن ${toothNumber} - مسار الصورة الحقيقية:`, realToothImage);
          
          if (realToothImage) {
            return (
              <img 
                src={realToothImage} 
                alt={`السن ${toothNumber}`}
                className="w-full h-full object-contain rounded-lg border border-gray-300"
                onError={(e) => {
                  console.error(`فشل تحميل صورة السن ${toothNumber}:`, realToothImage);
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => {
                  console.log(`تم تحميل صورة السن ${toothNumber} بنجاح:`, realToothImage);
                }}
              />
            );
          } else if (hasImage && imageUrl) {
            return (
              <img 
                src={imageUrl} 
                alt={`السن ${toothNumber}`}
                className="w-full h-full object-cover rounded-lg border border-gray-300"
                onError={(e) => {
                  console.error(`فشل تحميل صورة المريض للسن ${toothNumber}:`, imageUrl);
                }}
                onLoad={() => {
                  console.log(`تم تحميل صورة المريض للسن ${toothNumber} بنجاح:`, imageUrl);
                }}
              />
            );
          } else {
            return (
              <svg 
                viewBox="0 0 24 24" 
                className="w-full h-full"
                fill={getConditionColor(condition)}
              >
                <path d="M12 2C12 2 8 4 8 8V16C8 20 12 22 12 22C12 22 16 20 16 16V8C16 4 12 2 12 2Z" />
              </svg>
            );
          }
        })()}
        
        {/* صورة المريض المرفوعة (تظهر فوق الصورة الحقيقية) */}
        {hasImage && imageUrl && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
            <img 
              src={imageUrl} 
              alt={`صورة مريض للسن ${toothNumber}`}
              className="w-8 h-8 object-cover rounded border border-white"
            />
          </div>
        )}
        
        {/* أيقونة التحميل */}
        {hasImage && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <Camera className="w-2 h-2 text-white" />
          </div>
        )}
      </div>
      
      {/* حالة السن */}
      <div className="text-xs text-center text-gray-600 dark:text-gray-300">
        {condition === ConditionType.SOUND && 'سليم'}
        {condition === ConditionType.CARIES && 'تسوس'}
        {condition === ConditionType.FILLED && 'محشو'}
        {condition === ConditionType.CROWN && 'تاج'}
        {condition === ConditionType.ROOT_CANAL && 'علاج عصب'}
        {condition === ConditionType.IMPLANT && 'زراعة'}
        {condition === ConditionType.MISSING && 'مفقود'}
        {condition === ConditionType.FRACTURED && 'مكسور'}
      </div>
    </div>
  );
};

// 🦷 مخطط الأسنان العالمي المحسن والمنظم
interface OrganizedDentalChartProps {
  patientId: string;
  onSaveRecord?: (record: ComprehensiveToothRecord) => void;
}

export const OrganizedDentalChart: React.FC<OrganizedDentalChartProps> = ({
  patientId,
  onSaveRecord
}) => {
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [numberingSystem, setNumberingSystem] = useState<ToothNumberingSystem>(ToothNumberingSystem.FDI);
  const [showDialog, setShowDialog] = useState(false);
  const [toothRecords, setToothRecords] = useState<Map<string, ComprehensiveToothRecord>>(new Map());
  const [toothImages, setToothImages] = useState<Map<string, string>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🦷 تخطيط الأسنان المنظم
  const getToothLayout = () => {
    switch (numberingSystem) {
      case ToothNumberingSystem.FDI:
        return {
          upperRight: ['18', '17', '16', '15', '14', '13', '12', '11'],
          upperLeft: ['21', '22', '23', '24', '25', '26', '27', '28'],
          lowerRight: ['48', '47', '46', '45', '44', '43', '42', '41'],
          lowerLeft: ['31', '32', '33', '34', '35', '36', '37', '38']
        };
      default:
        return {
          upperRight: ['1', '2', '3', '4', '5', '6', '7', '8'],
          upperLeft: ['9', '10', '11', '12', '13', '14', '15', '16'],
          lowerRight: ['32', '31', '30', '29', '28', '27', '26', '25'],
          lowerLeft: ['24', '23', '22', '21', '20', '19', '18', '17']
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

  const layout = getToothLayout();
  const selectedRecord = selectedTooth ? toothRecords.get(selectedTooth) : null;

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* مفتاح الألوان العالمي - معيار WHO */}
      <ColorLegend compact={true} showDescriptions={false} />
      
      {/* 📊 رأس المخطط */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-3">
            🦷 مخطط الأسنان العالمي المحسن
          </CardTitle>
          <div className="flex justify-center items-center gap-4 mt-4">
            <Label htmlFor="numbering-system">نظام الترقيم:</Label>
            <Select value={numberingSystem} onValueChange={(value) => setNumberingSystem(value as ToothNumberingSystem)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ToothNumberingSystem.FDI}>النظام الدولي (FDI)</SelectItem>
                <SelectItem value={ToothNumberingSystem.UNIVERSAL}>النظام الأمريكي</SelectItem>
                <SelectItem value={ToothNumberingSystem.PALMER}>نظام Palmer</SelectItem>
                <SelectItem value={ToothNumberingSystem.ARABIC}>الترقيم العربي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* 🦷 مخطط الأسنان المنظم */}
      <Card className="bg-white dark:bg-gray-900">
        <CardContent className="p-8">
          <div className="space-y-8">
            {/* الفك العلوي */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center text-gray-700 dark:text-gray-300">
                الفك العلوي
              </h3>
              
              {/* الأسنان العلوية */}
              <div className="flex justify-center">
                <div className="grid grid-cols-16 gap-2 max-w-4xl">
                  {/* الجانب الأيمن العلوي */}
                  {layout.upperRight.reverse().map((tooth) => (
                    <EnhancedToothComponent
                      key={tooth}
                      toothNumber={tooth}
                      condition={toothRecords.get(tooth)?.diagnosis.primary || ConditionType.SOUND}
                      hasImage={toothImages.has(tooth)}
                      imageUrl={toothImages.get(tooth)}
                      onClick={() => {
                        setSelectedTooth(tooth);
                        setShowDialog(true);
                      }}
                    />
                  ))}
                  
                  {/* خط المنتصف */}
                  <div className="col-span-1 flex items-center justify-center">
                    <div className="w-0.5 h-12 bg-red-400 dark:bg-red-600"></div>
                  </div>
                  
                  {/* الجانب الأيسر العلوي */}
                  {layout.upperLeft.map((tooth) => (
                    <EnhancedToothComponent
                      key={tooth}
                      toothNumber={tooth}
                      condition={toothRecords.get(tooth)?.diagnosis.primary || ConditionType.SOUND}
                      hasImage={toothImages.has(tooth)}
                      imageUrl={toothImages.get(tooth)}
                      onClick={() => {
                        setSelectedTooth(tooth);
                        setShowDialog(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* خط الفصل */}
            <div className="flex justify-center">
              <div className="w-96 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
            </div>

            {/* الفك السفلي */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center text-gray-700 dark:text-gray-300">
                الفك السفلي
              </h3>
              
              {/* الأسنان السفلية */}
              <div className="flex justify-center">
                <div className="grid grid-cols-16 gap-2 max-w-4xl">
                  {/* الجانب الأيمن السفلي */}
                  {layout.lowerRight.map((tooth) => (
                    <EnhancedToothComponent
                      key={tooth}
                      toothNumber={tooth}
                      condition={toothRecords.get(tooth)?.diagnosis.primary || ConditionType.SOUND}
                      hasImage={toothImages.has(tooth)}
                      imageUrl={toothImages.get(tooth)}
                      onClick={() => {
                        setSelectedTooth(tooth);
                        setShowDialog(true);
                      }}
                    />
                  ))}
                  
                  {/* خط المنتصف */}
                  <div className="col-span-1 flex items-center justify-center">
                    <div className="w-0.5 h-12 bg-red-400 dark:bg-red-600"></div>
                  </div>
                  
                  {/* الجانب الأيسر السفلي */}
                  {layout.lowerLeft.reverse().map((tooth) => (
                    <EnhancedToothComponent
                      key={tooth}
                      toothNumber={tooth}
                      condition={toothRecords.get(tooth)?.diagnosis.primary || ConditionType.SOUND}
                      hasImage={toothImages.has(tooth)}
                      imageUrl={toothImages.get(tooth)}
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

      {/* 🔧 نافذة تحرير سجل السن */}
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

export default OrganizedDentalChart;
