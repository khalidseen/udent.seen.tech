import React from 'react';
import { Camera, Eye, RotateCcw } from 'lucide-react';
import { cn } from "@/lib/utils";
import { ConditionType, INTERNATIONAL_COLOR_SYSTEM } from "@/types/dental-enhanced";
import { ToothAnatomicalData, PatientToothImage, ToothTemplate } from "@/types/anatomical-dental";

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

  // يمكن إضافة باقي الأجزاء لاحقاً:
  // const upperRightMapping: { [key: string]: string } = { ... };
  // const lowerLeftMapping: { [key: string]: string } = { ... };
  // const lowerRightMapping: { [key: string]: string } = { ... };
  
  if (upperLeftMapping[toothNumber]) {
    const imagePath = `/teeth/U L/${upperLeftMapping[toothNumber]}`;
    console.log(`تم العثور على صورة للسن ${toothNumber}:`, imagePath);
    return imagePath;
  }
  
  console.log(`لم يتم العثور على صورة للسن ${toothNumber}`);
  return null;
};

interface AnatomicalToothProps {
  anatomicalData: ToothAnatomicalData;
  condition: ConditionType;
  templateImage?: ToothTemplate; // صورة الشكل الأساسي من الأدمن
  patientImage?: PatientToothImage; // صورة المريض الفعلية
  showPatientImage: boolean; // التبديل بين صورة المريض والشكل الأساسي
  onClick: () => void;
  onToggleImageType?: () => void; // للتبديل بين أنواع الصور
}

export const AnatomicalTooth: React.FC<AnatomicalToothProps> = ({
  anatomicalData,
  condition,
  templateImage,
  patientImage,
  showPatientImage,
  onClick,
  onToggleImageType
}) => {
  const { toothNumber, position, size } = anatomicalData;

  const getConditionColor = (condition: ConditionType) => {
    return INTERNATIONAL_COLOR_SYSTEM[condition] || INTERNATIONAL_COLOR_SYSTEM.sound;
  };

  const getToothSize = () => {
    const baseSize = 40; // الحجم الأساسي
    return baseSize * size;
  };

  const getCurrentImage = () => {
    // أولاً: البحث عن الصورة الحقيقية
    const realToothImage = getToothImagePath(toothNumber);
    console.log(`السن ${toothNumber} - مسار الصورة الحقيقية:`, realToothImage);
    
    if (realToothImage && !showPatientImage) {
      return realToothImage;
    }
    
    // ثانياً: صورة المريض المرفوعة
    if (showPatientImage && patientImage) {
      console.log(`السن ${toothNumber} - صورة المريض:`, patientImage.imageUrl);
      return patientImage.imageUrl;
    }
    
    // ثالثاً: صورة القالب من الأدمن (fallback)
    if (templateImage && templateImage.imageUrl) {
      console.log(`السن ${toothNumber} - صورة القالب:`, templateImage.imageUrl);
      return templateImage.imageUrl;
    }
    
    console.log(`السن ${toothNumber} - لا توجد صورة متاحة`);
    return null;
  };

  const currentImage = getCurrentImage();

  return (
    <div
      className="absolute group cursor-pointer transition-all duration-300 hover:scale-110 hover:z-10"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) rotate(${position.rotation}deg)`,
        width: `${getToothSize()}px`,
        height: `${getToothSize()}px`
      }}
      onClick={onClick}
    >
      {/* رقم السن */}
      <div 
        className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-1 rounded shadow-sm z-20"
        style={{ transform: `translateX(-50%) rotate(-${position.rotation}deg)` }}
      >
        {toothNumber}
      </div>

      {/* شكل السن */}
      <div className="relative w-full h-full">
        {currentImage ? (
          <img
            src={currentImage}
            alt={`السن ${toothNumber}`}
            className={cn(
              "w-full h-full object-contain rounded-lg shadow-lg",
              "border-2 transition-all duration-300",
              condition === ConditionType.SOUND ? "border-green-400" : "border-orange-400",
              "group-hover:border-blue-500 group-hover:shadow-xl"
            )}
            onError={(e) => {
              console.error(`فشل تحميل صورة السن ${toothNumber}:`, currentImage);
              e.currentTarget.style.display = 'none';
            }}
            onLoad={() => {
              console.log(`تم تحميل صورة السن ${toothNumber} بنجاح:`, currentImage);
            }}
          />
        ) : (
          <svg
            viewBox="0 0 24 24"
            className={cn(
              "w-full h-full transition-all duration-300 rounded-lg shadow-lg",
              "group-hover:shadow-xl"
            )}
            fill={getConditionColor(condition)}
          >
            {/* شكل السن الافتراضي */}
            <path d="M12 2C12 2 8 4 8 8V16C8 20 12 22 12 22C12 22 16 20 16 16V8C16 4 12 2 12 2Z" />
          </svg>
        )}

        {/* مؤشرات الحالة */}
        <div className="absolute top-0 right-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* مؤشر وجود صورة مريض */}
          {patientImage && (
            <div className={cn(
              "w-4 h-4 rounded-full bg-green-500 flex items-center justify-center",
              showPatientImage ? "ring-2 ring-white" : ""
            )}>
              <Camera className="w-2 h-2 text-white" />
            </div>
          )}

          {/* مؤشر وجود صورة حقيقية */}
          {getToothImagePath(toothNumber) && (
            <div className={cn(
              "w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center",
              !showPatientImage ? "ring-2 ring-white" : ""
            )}>
              <Eye className="w-2 h-2 text-white" />
            </div>
          )}

          {/* زر التبديل بين الصور */}
          {(patientImage || getToothImagePath(toothNumber)) && onToggleImageType && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleImageType();
              }}
              className="w-4 h-4 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center transition-colors"
              title="تبديل بين الصورة الحقيقية وصورة المريض"
              aria-label="تبديل بين صورة المريض والشكل الأساسي"
            >
              <RotateCcw className="w-2 h-2" />
            </button>
          )}
        </div>

        {/* مؤشر الحالة */}
        {condition !== ConditionType.SOUND && (
          <div 
            className="absolute bottom-0 left-0 w-3 h-3 rounded-full"
            style={{ backgroundColor: getConditionColor(condition) }}
          />
        )}
      </div>

      {/* تسمية نوع السن عند التمرير */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm whitespace-nowrap">
        نوع السن
      </div>
    </div>
  );
};
