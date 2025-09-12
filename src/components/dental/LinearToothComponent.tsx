import React, { useState, useEffect } from 'react';
import { RotateCcw, FileText } from 'lucide-react';
import { cn } from "@/lib/utils";
import { ConditionType, INTERNATIONAL_COLOR_SYSTEM } from "@/types/dental-enhanced";
import { PatientToothImage } from "@/types/anatomical-dental";
import { ToothRecordDialog } from "./ToothRecordDialog";

// 🖼️ دالة لربط أرقام الأسنان بالصور الحقيقية حسب قسم الفم (ربط مباشر منطقي)
const getToothImagePath = (toothNumber: string, quadrant: 'UL' | 'UR' | 'LL' | 'LR'): string | null => {
  // ربط مباشر: رقم السن = اسم ملف الصورة
  
  let folderPath = '';
  let fileName = '';
  
  switch (quadrant) {
    case 'UL': // الفك العلوي الأيسر (Upper Left)
      folderPath = '/teeth/U%20L/';
      // أرقام مثل: 11, 22, 33, 44, 55, 66, 77, 88
      fileName = `${toothNumber}.png`;
      break;
      
    case 'UR': // الفك العلوي الأيمن (Upper Right)
      folderPath = '/teeth/U%20R/';
      // أرقام مثل: 111, 222, 333, 444, 555, 666, 777, 888
      fileName = `${toothNumber}.png`;
      break;
      
    case 'LL': // الفك السفلي الأيسر (Lower Left)
      folderPath = '/teeth/L%20L/';
      // أرقام مثل: 1, 2, 3, 4, 5, 6, 7, 8
      fileName = `${toothNumber}.png`;
      break;
      
    case 'LR': // الفك السفلي الأيمن (Lower Right)
      folderPath = '/teeth/L%20R/';
      // أرقام مثل: 1, 2, 3, 4, 5, 6, 7, 8
      fileName = `${toothNumber}.png`;
      break;
  }
  
  const fullPath = `${folderPath}${fileName}`;
  console.log(`🦷 Tooth ${toothNumber} in ${quadrant}: ${fullPath}`);
  return fullPath;
};

// 🦷 دالة تحديد نوع السن حسب الرقم الجديد (تعمل مع جميع الأنساق)
const getToothType = (toothNumber: string) => {
  // استخراج الرقم الأساسي (الرقم الأخير أو المنفرد)
  const lastDigit = toothNumber.slice(-1);
  
  switch (lastDigit) {
    case '1': 
    case '2': return 'قاطع';       // Incisors
    case '3': return 'ناب';        // Canine
    case '4': 
    case '5': return 'ضاحك';       // Premolars
    case '6': 
    case '7': 
    case '8': return 'طاحن';       // Molars
    default: return 'سن';
  }
};

interface UploadData {
  toothId: string;
  imageData: string;
  metadata: {
    toothNumber: string;
    quadrant: string;
    editedAt: string;
    patientId?: string;
    originalImage?: string;
  };
}

interface LinearToothComponentProps {
  toothNumber: string;
  displayNumber?: string;
  quadrant: 'UL' | 'UR' | 'LL' | 'LR';
  condition: ConditionType;
  patientImage?: PatientToothImage;
  showPatientImage: boolean;
  patientId?: string;
  onClick: () => void;
  onToggleImageType?: () => void;
  onPatientImageUpload?: (data: UploadData) => void;
}

export const LinearToothComponent: React.FC<LinearToothComponentProps> = ({
  toothNumber,
  displayNumber,
  quadrant,
  condition,
  patientImage,
  showPatientImage,
  patientId,
  onClick,
  onToggleImageType,
  onPatientImageUpload
}) => {
  const [showRecord, setShowRecord] = useState(false);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  
  // تتبع تغييرات الحالات
  useEffect(() => {
    console.log(`🦷 السن ${toothNumber}: showRecord=${showRecord}`);
  }, [showRecord, toothNumber]);
  const getConditionColor = (condition: ConditionType) => {
    return INTERNATIONAL_COLOR_SYSTEM[condition] || INTERNATIONAL_COLOR_SYSTEM.sound;
  };

  const getCurrentImage = () => {
    // إذا كانت هناك صورة محررة، استخدمها أولاً
    if (editedImage) {
      return editedImage;
    }
    
    const realToothImage = getToothImagePath(toothNumber, quadrant);
    
    if (showPatientImage && patientImage) {
      return patientImage.imageUrl;
    }
    
    if (realToothImage) {
      return realToothImage;
    }
    
    return null;
  };

  const currentImage = getCurrentImage();

  return (
    <div
      className={`relative group cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10 flex-shrink-0 -mr-1 ${(quadrant === 'LL' || quadrant === 'LR') ? 'flex flex-col-reverse' : 'flex flex-col'}`}
      onClick={onClick}
      style={{ margin: 0, padding: 0 }}
    >
      {/* رقم السن - مضغوط أكثر */}
      <div className={`text-xs font-bold text-gray-700 dark:text-gray-300 text-center mb-0.5 ${(quadrant === 'LL' || quadrant === 'LR') ? 'order-last mt-0.5 mb-0' : ''}`}>
        {displayNumber || toothNumber}
      </div>
      
      {/* صورة السن - مضغوطة ومتلاصقة */}
      <div className="relative w-14 h-18 bg-white" style={{ border: 'none', margin: 0, padding: 0 }}>
        {currentImage ? (
          <img
            src={currentImage}
            alt={`السن ${toothNumber}`}
            className={`w-full h-full object-contain block ${(quadrant === 'LL' || quadrant === 'LR') ? 'rotate-180' : ''}`}
            style={{ margin: 0, padding: 0, border: 'none' }}
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
            className={`w-full h-full ${(quadrant === 'LL' || quadrant === 'LR') ? 'rotate-180' : ''}`}
            fill={getConditionColor(condition)}
            style={{ margin: 0, padding: 0 }}
          >
            <path d="M12 2C12 2 8 4 8 8V16C8 20 12 22 12 22C12 22 16 20 16 16V8C16 4 12 2 12 2Z" />
          </svg>
        )}

        {/* أزرار التحرير عند التمرير */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          {/* زر سجل السن */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('🟠 تم الضغط على زر سجل السن - السن:', toothNumber);
              setShowRecord(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white p-1.5 rounded-full transition-colors"
            title="سجل السن"
          >
            <FileText className="w-3 h-3" />
          </button>
        </div>

        {/* مؤشرات الحالة */}
        <div className="absolute top-0 right-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* زر تبديل نوع الصورة */}
          {patientImage && onToggleImageType && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleImageType();
              }}
              className="w-3 h-3 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center transition-colors"
              title="تبديل نوع الصورة"
            >
              <RotateCcw className="w-1.5 h-1.5 text-white" />
            </button>
          )}
        </div>

        {/* مؤشر الحالة */}
        {condition !== ConditionType.SOUND && (
          <div 
            className="absolute bottom-0 left-0 w-2 h-2 rounded-full"
            style={{ backgroundColor: getConditionColor(condition) }}
          />
        )}
      </div>

      {/* نوع السن عند التمرير - مضغوط */}
      <div className={`text-xs text-center text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity ${(quadrant === 'LL' || quadrant === 'LR') ? 'order-first mb-0.5' : 'mt-0.5'}`}>
        {getToothType(toothNumber)}
      </div>

      {/* حوار سجل السن */}
      <ToothRecordDialog
        isOpen={showRecord}
        onClose={() => {
          console.log('🟠 إغلاق سجل السن - السن:', toothNumber);
          setShowRecord(false);
        }}
        toothNumber={toothNumber}
        existingRecord={null}
        onSave={(record) => {
          console.log('✅ تم حفظ سجل السن:', record);
          setShowRecord(false);
        }}
        onUploadImage={() => {}}
        hasImage={!!getCurrentImage()}
      />
    </div>
  );
};