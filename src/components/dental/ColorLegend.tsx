import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  INTERNATIONAL_COLOR_SYSTEM, 
  CONDITION_LABELS_AR, 
  CONDITION_DESCRIPTIONS_AR,
  ConditionType 
} from '@/types/dental-enhanced';
import { Palette, Globe, Info } from 'lucide-react';

interface ColorLegendProps {
  compact?: boolean;
  showDescriptions?: boolean;
}

export const ColorLegend: React.FC<ColorLegendProps> = ({ 
  compact = false, 
  showDescriptions = true 
}) => {
  // قائمة الحالات مرتبة حسب الأهمية
  const conditions = [
    ConditionType.SOUND,
    ConditionType.CARIES,
    ConditionType.FILLED,
    ConditionType.CROWN,
    ConditionType.ROOT_CANAL,
    ConditionType.IMPLANT,
    ConditionType.MISSING,
    ConditionType.FRACTURED,
    ConditionType.PERIAPICAL_LESION,
    ConditionType.PERIODONTAL_DISEASE,
    ConditionType.HAS_NOTES
  ];

  if (compact) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="w-4 h-4" />
            مفتاح الألوان (معيار WHO)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {conditions.map((condition) => (
              <div key={condition} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: INTERNATIONAL_COLOR_SYSTEM[condition] }}
                />
                <span className="text-xs">{CONDITION_LABELS_AR[condition]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="w-5 h-5" />
          مفتاح الألوان العالمي للأسنان
          <Badge variant="outline" className="ml-auto">معيار WHO</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* شبكة الحالات */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {conditions.map((condition) => (
            <div key={condition} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              {/* مؤشر اللون */}
              <div 
                className="w-6 h-6 rounded-full border-2 border-white shadow-md flex-shrink-0 mt-0.5"
                style={{ backgroundColor: INTERNATIONAL_COLOR_SYSTEM[condition] }}
              />
              
              {/* معلومات الحالة */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">
                    {CONDITION_LABELS_AR[condition]}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                    style={{ 
                      backgroundColor: `${INTERNATIONAL_COLOR_SYSTEM[condition]}20`,
                      color: INTERNATIONAL_COLOR_SYSTEM[condition]
                    }}
                  >
                    {condition.toUpperCase()}
                  </Badge>
                </div>
                
                {showDescriptions && (
                  <p className="text-sm text-gray-600">
                    {CONDITION_DESCRIPTIONS_AR[condition]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* معلومات إضافية */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">
                ملاحظات هامة حول مفتاح الألوان
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• الألوان مطابقة لمعايير منظمة الصحة العالمية (WHO)</li>
                <li>• يمكن دمج عدة حالات في سن واحد حسب الأسطح المختلفة</li>
                <li>• الألوان الفاتحة تشير لحالات أقل خطورة</li>
                <li>• الألوان الداكنة تشير لحالات تحتاج تدخل فوري</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// مكون مفتاح الألوان المضغوط للشريط الجانبي
export const SidebarColorLegend: React.FC = () => {
  const mainConditions = [
    ConditionType.SOUND,
    ConditionType.CARIES,
    ConditionType.FILLED,
    ConditionType.CROWN,
    ConditionType.MISSING
  ];

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
        <Palette className="w-3 h-3" />
        الحالات الرئيسية
      </h4>
      <div className="space-y-1">
        {mainConditions.map((condition) => (
          <div key={condition} className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded border"
              style={{ backgroundColor: INTERNATIONAL_COLOR_SYSTEM[condition] }}
            />
            <span>{CONDITION_LABELS_AR[condition]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
