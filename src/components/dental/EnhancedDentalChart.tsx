// 🦷 Enhanced Dental Chart Component
// المكون الرئيسي لمخطط الأسنان المحسن

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useDentalChartEnhanced } from '@/hooks/useDentalChartEnhanced';
import ToothModal from './ToothModal';
import {
  DentalChartProps,
  ToothNumberingSystem,
  PriorityLevel,
  ConditionType
} from '@/types/dentalChart';
import {
  Camera,
  Download,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  Circle,
  Minus,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

const EnhancedDentalChart: React.FC<DentalChartProps> = ({
  patientId,
  clinicId,
  onToothSelect,
  selectedTooth,
  numberingSystem = ToothNumberingSystem.FDI,
  readOnly = false
}) => {
  const [currentNumberingSystem, setCurrentNumberingSystem] = useState(numberingSystem);
  const [selectedToothForModal, setSelectedToothForModal] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [highlightPriorities, setHighlightPriorities] = useState(false);

  const {
    records,
    statistics,
    loading,
    error,
    saveToothRecord,
    getToothColor,
    exportData
  } = useDentalChartEnhanced({ 
    patientId, 
    clinicId,
    numberingSystem: currentNumberingSystem 
  });

  const { toast } = useToast();

  // دوال مساعدة للحصول على معلومات الأسنان
  const hasToothImage = (toothNumber: string): boolean => {
    const record = records.get(toothNumber);
    return !!(record?.imageUrl || record?.imageData);
  };

  const getToothPriority = (toothNumber: string): PriorityLevel => {
    return records.get(toothNumber)?.priority || PriorityLevel.LOW;
  };

  const getToothLayout = () => {
    // تخطيط الأسنان - الفك العلوي والسفلي
    return {
      upperRight: ['18', '17', '16', '15', '14', '13', '12', '11'],
      upperLeft: ['21', '22', '23', '24', '25', '26', '27', '28'],
      lowerLeft: ['38', '37', '36', '35', '34', '33', '32', '31'],
      lowerRight: ['41', '42', '43', '44', '45', '46', '47', '48']
    };
  };

  const layout = getToothLayout();

  const handleToothClick = (toothNumber: string) => {
    if (readOnly) {
      onToothSelect?.(toothNumber);
      return;
    }

    setSelectedToothForModal(toothNumber);
    setIsModalOpen(true);
    onToothSelect?.(toothNumber);
  };

  const getToothShape = (index: number): string => {
    // تحديد شكل السن حسب موقعه
    const isMolar = index <= 2 || index >= 5; // الطواحن
    const isPremolar = index === 3 || index === 4; // الضواحك
    const isCanine = index === 2; // الناب (في وسط 8 أسنان)
    const isIncisor = index === 0 || index === 1; // القواطع

    const baseClass = "h-10 w-8 transition-all duration-200 cursor-pointer border-2 flex items-center justify-center text-xs font-bold relative";
    
    if (isMolar) return `${baseClass} rounded-lg`;
    if (isPremolar) return `${baseClass} rounded-md`;
    if (isCanine) return `${baseClass} rounded-full`;
    if (isIncisor) return `${baseClass} rounded-sm`;
    
    return `${baseClass} rounded-md`;
  };

  const getToothStyle = (toothNumber: string) => {
    const baseColor = getToothColor(toothNumber);
    const priority = getToothPriority(toothNumber);
    const isSelected = selectedTooth === toothNumber;
    
    let style = {
      backgroundColor: baseColor + '20',
      borderColor: baseColor,
      color: baseColor,
      transform: `scale(${zoomLevel})`
    };

    if (isSelected) {
      style = {
        ...style,
        backgroundColor: baseColor,
        color: 'white',
        transform: `scale(${zoomLevel * 1.1})`
      };
    }

    // إبراز الأولويات العالية
    if (highlightPriorities && priority) {
      if (priority === PriorityLevel.EMERGENCY || priority === PriorityLevel.URGENT) {
        const shadowColor = 'rgba(239, 68, 68, 0.5)';
        style = {
          ...style,
          borderWidth: '3px'
        };
      }
    }

    return style;
  };

  const renderTooth = (toothNumber: string, index: number) => {
    const hasImage = hasToothImage(toothNumber);
    const priority = getToothPriority(toothNumber);
    const record = records.get(toothNumber);

    return (
      <div key={toothNumber} className="relative group">
        <div
          className={getToothShape(index)}
          style={getToothStyle(toothNumber)}
          onClick={() => handleToothClick(toothNumber)}
          title={`السن ${toothNumber}${record ? ` - ${record.diagnosis.primary_condition}` : ''}`}
        >
          {toothNumber}
          
          {/* أيقونة الصورة */}
          {hasImage && (
            <div className="absolute -top-1 -right-1">
              <Camera className="w-3 h-3 text-green-600 bg-white rounded-full p-0.5" />
            </div>
          )}
          
          {/* أيقونة الأولوية */}
          {priority && priority !== PriorityLevel.LOW && (
            <div className="absolute -top-1 -left-1">
              {priority === PriorityLevel.EMERGENCY && (
                <AlertTriangle className="w-3 h-3 text-red-600 bg-white rounded-full p-0.5" />
              )}
              {priority === PriorityLevel.URGENT && (
                <AlertTriangle className="w-3 h-3 text-orange-600 bg-white rounded-full p-0.5" />
              )}
              {priority === PriorityLevel.HIGH && (
                <Circle className="w-3 h-3 text-yellow-600 bg-white rounded-full p-0.5" />
              )}
            </div>
          )}
        </div>
        
        {/* تفاصيل عند التمرير */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
          {record ? (
            <div>
              <div>السن {toothNumber}</div>
              <div>{record.diagnosis.primary_condition}</div>
              {priority && <div>الأولوية: {priority}</div>}
            </div>
          ) : (
            `السن ${toothNumber} - غير مسجل`
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>جاري تحميل مخطط الأسنان...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* شريط التحكم */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              🦷 مخطط الأسنان المحسن
              {statistics && (
                <Badge variant="secondary">
                  {Math.round((statistics.recordedTeeth / statistics.totalTeeth) * 100)}% مكتمل
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* نظام الترقيم */}
              <Select
                value={currentNumberingSystem}
                onValueChange={(value) => setCurrentNumberingSystem(value as ToothNumberingSystem)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ToothNumberingSystem.FDI}>FDI</SelectItem>
                  <SelectItem value={ToothNumberingSystem.UNIVERSAL}>Universal</SelectItem>
                  <SelectItem value={ToothNumberingSystem.PALMER}>Palmer</SelectItem>
                </SelectContent>
              </Select>

              {/* التحكم في التكبير */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-sm w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* إبراز الأولويات */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHighlightPriorities(!highlightPriorities)}
                className={cn(highlightPriorities && "bg-primary text-primary-foreground")}
              >
                {highlightPriorities ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>

              {/* الإحصائيات */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStatistics(!showStatistics)}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>

              {/* التصدير */}
              <Select onValueChange={(value) => exportData(value as 'json' | 'csv' | 'pdf')}>
                <SelectTrigger className="w-32">
                  <Download className="w-4 h-4 mr-2" />
                  تصدير
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        {/* الإحصائيات */}
        {showStatistics && statistics && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{statistics.totalTeeth}</div>
                <div className="text-sm text-muted-foreground">إجمالي الأسنان</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{statistics.recordedTeeth}</div>
                <div className="text-sm text-muted-foreground">مسجل</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{statistics.healthyTeeth}</div>
                <div className="text-sm text-muted-foreground">سليم</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{statistics.decayedTeeth}</div>
                <div className="text-sm text-muted-foreground">يحتاج علاج</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{statistics.filledTeeth}</div>
                <div className="text-sm text-muted-foreground">معالج</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{statistics.missingTeeth}</div>
                <div className="text-sm text-muted-foreground">مفقود</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* مخطط الأسنان */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-8">
            {/* الفك العلوي */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center text-gray-700">الفك العلوي</h3>
              
              <div className="flex justify-center gap-2">
                <div className="flex gap-1">
                  {layout.upperRight.map((tooth, index) => renderTooth(tooth, index))}
                </div>
                
                <div className="w-8 flex items-center justify-center">
                  <div className="w-px h-8 bg-red-500"></div>
                </div>
                
                <div className="flex gap-1">
                  {layout.upperLeft.map((tooth, index) => renderTooth(tooth, index))}
                </div>
              </div>
            </div>

            {/* الخط الفاصل */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex-1 h-px bg-border"></div>
              <span>الفك العلوي ⬆️ | الفك السفلي ⬇️</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            {/* الفك السفلي */}
            <div className="space-y-4">
              <div className="flex justify-center gap-2">
                <div className="flex gap-1">
                  {layout.lowerRight.map((tooth, index) => renderTooth(tooth, index))}
                </div>
                
                <div className="w-8 flex items-center justify-center">
                  <div className="w-px h-8 bg-red-500"></div>
                </div>
                
                <div className="flex gap-1">
                  {layout.lowerLeft.map((tooth, index) => renderTooth(tooth, index))}
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-center text-gray-700">الفك السفلي</h3>
            </div>
          </div>

          {/* المفتاح */}
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-3">مفتاح الألوان:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
              {Object.entries({
                [ConditionType.SOUND]: { color: '#22c55e', label: 'سليم' },
                [ConditionType.DECAY]: { color: '#ef4444', label: 'تسوس' },
                [ConditionType.FILLED]: { color: '#3b82f6', label: 'محشو' },
                [ConditionType.CROWN]: { color: '#f59e0b', label: 'تاج' },
                [ConditionType.MISSING]: { color: '#6b7280', label: 'مفقود' },
                [ConditionType.ROOT_CANAL]: { color: '#8b5cf6', label: 'علاج عصب' },
                [ConditionType.IMPLANT]: { color: '#06b6d4', label: 'زراعة' }
              }).map(([condition, { color, label }]) => (
                <div key={condition} className="flex items-center gap-1">
                  <div
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: color }}
                  />
                  <span>{label}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-2 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <Camera className="w-3 h-3 text-green-600" />
                <span>يحتوي على صورة</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-600" />
                <span>أولوية عالية</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نافذة السن */}
      {selectedToothForModal && (
        <ToothModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedToothForModal(null);
          }}
          toothNumber={selectedToothForModal}
          patientId={patientId}
          clinicId={clinicId}
          onSave={saveToothRecord}
        />
      )}
    </div>
  );
};

export default EnhancedDentalChart;
