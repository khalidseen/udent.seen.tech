import React from 'react';
import { cn } from "@/lib/utils";
import { 
  ToothNumberingSystem, 
  ConditionType, 
  INTERNATIONAL_COLOR_SYSTEM,
  ComprehensiveToothRecord 
} from "@/types/dental-enhanced";

interface EnhancedToothProps {
  toothNumber: string;
  numberingSystem: ToothNumberingSystem;
  record?: ComprehensiveToothRecord;
  isSelected?: boolean;
  isUpper?: boolean;
  onSelect?: (toothNumber: string) => void;
  showAlternativeNumbers?: boolean;
}

// 🦷 أشكال الأسنان التشريحية
const getToothShape = (toothNumber: string, isUpper: boolean) => {
  const universalNumber = parseInt(toothNumber);
  
  // تحديد نوع السن
  let toothType = 'molar';
  if (isUpper) {
    if ([6, 7, 11, 12].includes(universalNumber)) toothType = 'incisor';
    else if ([5, 13].includes(universalNumber)) toothType = 'canine';
    else if ([4, 14, 3, 15].includes(universalNumber)) toothType = 'premolar';
    else toothType = 'molar';
  } else {
    if ([22, 23, 26, 27].includes(universalNumber)) toothType = 'incisor';
    else if ([21, 28].includes(universalNumber)) toothType = 'canine';
    else if ([20, 29, 19, 30].includes(universalNumber)) toothType = 'premolar';
    else toothType = 'molar';
  }

  return toothType;
};

// 🎨 الحصول على لون السن حسب الحالة
const getToothColor = (condition: ConditionType, severity: number = 1): string => {
  const baseColor = INTERNATIONAL_COLOR_SYSTEM[condition] || INTERNATIONAL_COLOR_SYSTEM.sound;
  
  // تطبيق التدرج حسب الشدة
  if (severity < 1) {
    return `${baseColor}${Math.round(severity * 255).toString(16).padStart(2, '0')}`;
  }
  
  return baseColor;
};

// 🔢 تحويل أرقام الأسنان بين الأنظمة
const convertToothNumber = (toothNumber: string, targetSystem: ToothNumberingSystem): string => {
  const universalNumber = parseInt(toothNumber);
  
  switch (targetSystem) {
    case ToothNumberingSystem.FDI:
      // تحويل من Universal إلى FDI
      if (universalNumber >= 1 && universalNumber <= 16) {
        return `1${17 - universalNumber}`;
      } else if (universalNumber >= 17 && universalNumber <= 32) {
        return `${universalNumber - 16 + 30}`;
      }
      return toothNumber;
      
    case ToothNumberingSystem.PALMER:
      // نظام Palmer يستخدم رموز خاصة
      if (universalNumber >= 1 && universalNumber <= 8) {
        return `${9 - universalNumber}⁺`;
      } else if (universalNumber >= 9 && universalNumber <= 16) {
        return `${universalNumber - 8}⁺`;
      } else if (universalNumber >= 17 && universalNumber <= 24) {
        return `${universalNumber - 16}⁻`;
      } else if (universalNumber >= 25 && universalNumber <= 32) {
        return `${33 - universalNumber}⁻`;
      }
      return toothNumber;
      
    case ToothNumberingSystem.ARABIC: {
      // الترقيم العربي التقليدي
      const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      return toothNumber.split('').map(digit => arabicNumbers[parseInt(digit)] || digit).join('');
    }
    default:
      return toothNumber;
  }
};

export const EnhancedTooth: React.FC<EnhancedToothProps> = ({
  toothNumber,
  numberingSystem,
  record,
  isSelected = false,
  isUpper = true,
  onSelect,
  showAlternativeNumbers = false
}) => {
  const toothType = getToothShape(toothNumber, isUpper);
  const primaryCondition = record?.diagnosis.primary || ConditionType.SOUND;
  const toothColor = getToothColor(primaryCondition);
  
  // أشكال الأسنان المختلفة
  const getToothSVG = () => {
    const baseWidth = 40;
    const baseHeight = 50;
    
    switch (toothType) {
      case 'incisor':
        return (
          <svg width={baseWidth} height={baseHeight} viewBox="0 0 40 50" className="tooth-svg">
            {/* شكل القاطعة */}
            <path
              d="M10 5 Q10 0 15 0 L25 0 Q30 0 30 5 L30 35 Q30 45 20 45 Q10 45 10 35 Z"
              fill={toothColor}
              stroke="#374151"
              strokeWidth="1.5"
              className="tooth-body"
            />
            {/* الجذر */}
            <path
              d="M15 35 Q15 50 20 50 Q25 50 25 35"
              fill={toothColor}
              stroke="#374151"
              strokeWidth="1.5"
              className="tooth-root"
            />
            {/* خط الحفة القاطعة */}
            <line
              x1="12" y1="8"
              x2="28" y2="8"
              stroke="#1f2937"
              strokeWidth="1"
              className="incisal-edge"
            />
          </svg>
        );
        
      case 'canine':
        return (
          <svg width={baseWidth} height={baseHeight + 5} viewBox="0 0 40 55" className="tooth-svg">
            {/* شكل الناب */}
            <path
              d="M12 8 Q12 0 15 0 L25 0 Q28 0 28 8 L25 12 Q20 5 20 5 Q15 12 12 8 L15 38 Q15 48 20 48 Q25 48 25 38 Z"
              fill={toothColor}
              stroke="#374151"
              strokeWidth="1.5"
              className="tooth-body"
            />
            {/* الجذر الطويل */}
            <path
              d="M17 38 Q17 55 20 55 Q23 55 23 38"
              fill={toothColor}
              stroke="#374151"
              strokeWidth="1.5"
              className="tooth-root"
            />
            {/* النتوء المدبب */}
            <path
              d="M15 8 L20 2 L25 8"
              fill="none"
              stroke="#1f2937"
              strokeWidth="1"
              className="cusp"
            />
          </svg>
        );
        
      case 'premolar':
        return (
          <svg width={baseWidth + 5} height={baseHeight} viewBox="0 0 45 50" className="tooth-svg">
            {/* شكل الضاحك */}
            <path
              d="M8 10 Q8 5 12 5 L33 5 Q37 5 37 10 L37 30 Q37 40 22.5 40 Q8 40 8 30 Z"
              fill={toothColor}
              stroke="#374151"
              strokeWidth="1.5"
              className="tooth-body"
            />
            {/* الجذور المتعددة */}
            <path
              d="M15 30 Q15 45 18 45 Q21 45 21 30"
              fill={toothColor}
              stroke="#374151"
              strokeWidth="1.5"
              className="tooth-root-1"
            />
            <path
              d="M24 30 Q24 45 27 45 Q30 45 30 30"
              fill={toothColor}
              stroke="#374151"
              strokeWidth="1.5"
              className="tooth-root-2"
            />
            {/* النتوءات الطاحنة */}
            <circle cx="15" cy="15" r="2" fill="#1f2937" className="cusp-1" />
            <circle cx="30" cy="15" r="2" fill="#1f2937" className="cusp-2" />
          </svg>
        );
        
      case 'molar':
        return (
          <svg width={baseWidth + 10} height={baseHeight} viewBox="0 0 50 50" className="tooth-svg">
            {/* شكل الطاحن */}
            <path
              d="M5 12 Q5 8 8 8 L42 8 Q45 8 45 12 L45 28 Q45 35 25 35 Q5 35 5 28 Z"
              fill={toothColor}
              stroke="#374151"
              strokeWidth="1.5"
              className="tooth-body"
            />
            {/* جذور متعددة */}
            <path
              d="M12 28 Q12 45 15 45 Q18 45 18 28"
              fill={toothColor}
              stroke="#374151"
              strokeWidth="1.5"
              className="tooth-root-1"
            />
            <path
              d="M22 28 Q22 50 25 50 Q28 50 28 28"
              fill={toothColor}
              stroke="#374151"
              strokeWidth="1.5"
              className="tooth-root-2"
            />
            <path
              d="M32 28 Q32 45 35 45 Q38 45 38 28"
              fill={toothColor}
              stroke="#374151"
              strokeWidth="1.5"
              className="tooth-root-3"
            />
            {/* النتوءات الطاحنة */}
            <circle cx="15" cy="15" r="2" fill="#1f2937" className="cusp-1" />
            <circle cx="25" cy="15" r="2" fill="#1f2937" className="cusp-2" />
            <circle cx="35" cy="15" r="2" fill="#1f2937" className="cusp-3" />
            <circle cx="20" cy="22" r="1.5" fill="#1f2937" className="cusp-4" />
            <circle cx="30" cy="22" r="1.5" fill="#1f2937" className="cusp-5" />
          </svg>
        );
        
      default:
        return (
          <div 
            className="w-8 h-10 rounded-md border-2 border-gray-400 bg-gray-100"
            style={{ backgroundColor: toothColor }}
          />
        );
    }
  };

  const displayNumber = showAlternativeNumbers 
    ? convertToothNumber(toothNumber, numberingSystem)
    : toothNumber;

  return (
    <div className="flex flex-col items-center space-y-1">
      {/* رقم السن */}
      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
        {displayNumber}
      </div>
      
      {/* السن */}
      <button
        onClick={() => onSelect?.(toothNumber)}
        className={cn(
          "relative transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1",
          isSelected && "ring-2 ring-blue-500 ring-offset-2 scale-110"
        )}
        title={`السن ${toothNumber} - ${primaryCondition}`}
      >
        {getToothSVG()}
        
        {/* مؤشرات إضافية */}
        {record?.clinical.mobility && record.clinical.mobility > 0 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
            {record.clinical.mobility}
          </div>
        )}
        
        {record?.notes && (
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">!</span>
          </div>
        )}
      </button>
      
      {/* مؤشر الحالة */}
      <div className="flex space-x-1">
        {record?.diagnosis.secondary?.map((condition, index) => (
          <div
            key={index}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: getToothColor(condition, 0.7) }}
            title={condition}
          />
        ))}
      </div>
    </div>
  );
};

export default EnhancedTooth;
