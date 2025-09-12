// Enhanced Dental Chart Types - Version 2.0
// تعريفات الأنواع المحسنة لمخطط الأسنان

// 🌍 أنظمة ترقيم الأسنان العالمية
export enum ToothNumberingSystem {
  FDI = 'fdi',              // النظام الدولي (11-48)
  UNIVERSAL = 'universal',   // النظام الأمريكي (1-32)
  PALMER = 'palmer',        // نظام Palmer
  ARABIC = 'arabic'         // الترقيم العربي التقليدي
}

// 📊 أنواع الحالات المتقدمة - معيار WHO
export enum ConditionType {
  SOUND = 'sound',                    // سليم
  CARIES = 'caries',                  // تسوس
  FILLED = 'filled',                  // محشو
  CROWN = 'crown',                    // تاج
  ROOT_CANAL = 'root_canal',          // علاج عصب
  IMPLANT = 'implant',                // زراعة
  MISSING = 'missing',                // مفقود
  FRACTURED = 'fractured',            // مكسور
  PERIAPICAL_LESION = 'periapical_lesion', // آفة ذروية
  PERIODONTAL_DISEASE = 'periodontal_disease', // مرض لثوي
  HAS_NOTES = 'has_notes'             // له ملاحظات
}

// 🦷 أسطح السن التشريحية
export interface ToothSurfaces {
  mesial: ConditionType;      // وجه إنسي
  distal: ConditionType;      // وجه وحشي  
  buccal: ConditionType;      // وجه شدقي
  lingual: ConditionType;     // وجه لساني
  occlusal?: ConditionType;   // سطح إطباقي (للخلفيات)
  incisal?: ConditionType;    // حافة قاطعة (للأماميات)
}

// 🎨 نظام الألوان العالمي - معيار WHO المحدث
export const INTERNATIONAL_COLOR_SYSTEM = {
  // معيار WHO للحالات الأساسية
  sound: '#4CAF50',                   // سليم - أخضر طبيعي
  caries: '#FF5722',                  // تسوس - أحمر برتقالي
  filled: '#2196F3',                  // محشو - أزرق
  crown: '#9C27B0',                   // تاج - بنفسجي
  root_canal: '#E91E63',              // علاج عصب - وردي غامق
  implant: '#607D8B',                 // زراعة - رمادي أزرق معدني
  missing: '#9E9E9E',                 // مفقود - رمادي
  fractured: '#FF9800',               // مكسور - برتقالي تحذيري
  periapical_lesion: '#FFC107',       // آفة ذروية - أصفر تحذيري
  periodontal_disease: '#CDDC39',     // مرض لثوي - أخضر فاتح
  has_notes: '#3F51B5',               // له ملاحظات - أزرق نيلي
  
  // تدرجات للشدة
  severity: {
    mild: 0.3,      // خفيف
    moderate: 0.6,  // متوسط
    severe: 1.0     // شديد
  }
} as const;

// 🏥 درجات الحركة السنية
export enum MobilityLevel {
  ZERO = 0,    // لا توجد حركة
  ONE = 1,     // حركة خفيفة
  TWO = 2,     // حركة متوسطة  
  THREE = 3    // حركة شديدة
}

// 🔬 القياسات السريرية
export interface ClinicalMeasurements {
  mobility: MobilityLevel;
  probingDepth: number[];     // عمق الجيوب اللثوية (6 قياسات)
  bleeding: boolean;          // نزيف عند الفحص
  recession: number[];        // انحسار اللثة
}

// 🦴 تفاصيل الجذور
export interface RootDetails {
  count: number;              // عدد الجذور
  conditions: ConditionType[];
  endodonticTreatment?: boolean; // علاج عصب
}

// 📋 سجل السن الشامل
export interface ComprehensiveToothRecord {
  toothNumber: string;
  numberingSystem: ToothNumberingSystem;
  
  // التشخيص
  diagnosis: {
    primary: ConditionType;
    secondary?: ConditionType[];
    icd10Code?: string;        // رمز التصنيف الدولي
  };
  
  // الأسطح التشريحية
  surfaces: ToothSurfaces;
  
  // الجذور
  roots: RootDetails;
  
  // القياسات السريرية
  clinical: ClinicalMeasurements;
  
  // الملاحظات والتعليقات
  notes: string;
  priority: 'low' | 'medium' | 'high';
  
  // الطوابع الزمنية
  createdAt: Date;
  updatedAt: Date;
  clinicianId: string;
}

// 🎭 أنماط العرض
export enum ViewMode {
  ANATOMICAL = 'anatomical',     // تشريحي دقيق
  SIMPLIFIED = 'simplified',     // مبسط (الحالي)
  PERIODONTAL = 'periodontal',   // لثوي متخصص
  ORTHODONTIC = 'orthodontic',   // تقويم أسنان
  PEDIATRIC = 'pediatric'        // أطفال
}

// 🔄 خيارات التصدير العالمية
export interface ExportOptions {
  format: 'pdf' | 'png' | 'dicom' | 'hl7' | 'json';
  includeNotes: boolean;
  includeMeasurements: boolean;
  language: 'ar' | 'en';
  numberingSystem: ToothNumberingSystem;
}

// 🌐 دعم الوصول
export interface AccessibilityOptions {
  screenReader: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  voiceControl: boolean;
}

// 🎯 خصائص المخطط المحسن
export interface EnhancedDentalChartProps {
  patientId: string;
  primarySystem: ToothNumberingSystem;
  viewMode: ViewMode;
  showAlternativeNumbers: boolean;
  accessibilityOptions: AccessibilityOptions;
  onToothSelect: (tooth: string) => void;
  onSaveRecord: (record: ComprehensiveToothRecord) => void;
}

// 🌍 قاموس الترجمة العربية - معيار WHO
export const CONDITION_LABELS_AR = {
  sound: 'سليم',
  caries: 'تسوس',
  filled: 'محشو',
  crown: 'تاج',
  root_canal: 'علاج عصب',
  implant: 'زراعة',
  missing: 'مفقود',
  fractured: 'مكسور',
  periapical_lesion: 'آفة ذروية',
  periodontal_disease: 'مرض لثوي',
  has_notes: 'له ملاحظات'
} as const;

// 📝 وصف مفصل للحالات
export const CONDITION_DESCRIPTIONS_AR = {
  sound: 'سن سليم بدون أي مشاكل',
  caries: 'تسوس في السن يحتاج علاج',
  filled: 'سن محشو بحشوة دائمة',
  crown: 'سن مغطى بتاج اصطناعي',
  root_canal: 'تم علاج عصب السن',
  implant: 'زراعة سن اصطناعي',
  missing: 'سن مفقود يحتاج استبدال',
  fractured: 'سن مكسور أو متشقق',
  periapical_lesion: 'التهاب في منطقة جذر السن',
  periodontal_disease: 'مرض في اللثة والأنسجة المحيطة',
  has_notes: 'يوجد ملاحظات خاصة لهذا السن'
} as const;

// ملف الأنواع مكتمل ✅
