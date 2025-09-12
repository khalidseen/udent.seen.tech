// 🦷 Enhanced Dental Chart System Types
// نظام مخطط الأسنان المحسن - أنواع البيانات

export interface ToothRecord {
  id: string;
  tooth_number: string;
  patient_id: string;
  clinic_id: string;
  
  // تبويب التشخيص
  diagnosis: {
    primary_condition: ConditionType;
    priority_level: PriorityLevel;
    icd10_code?: string;
    diagnosis_notes?: string;
    image_url?: string;
    image_data?: string;
  };
  
  // تبويب الأسطح
  surfaces: {
    mesial: SurfaceCondition;
    distal: SurfaceCondition;
    buccal: SurfaceCondition;
    lingual: SurfaceCondition;
    occlusal: SurfaceCondition;
    incisal: SurfaceCondition;
  };
  
  // تبويب القياسات السريرية
  clinical_measurements: {
    mobility: number; // 0-3
    pocket_depths: {
      mesial_buccal: number;
      mid_buccal: number;
      distal_buccal: number;
      mesial_lingual: number;
      mid_lingual: number;
      distal_lingual: number;
    };
    bleeding_on_probing: boolean;
    gingival_recession: {
      buccal: number;
      lingual: number;
    };
    plaque_index: number; // 0-3
  };
  
  // تبويب الجذور
  roots: {
    number_of_roots: number; // 1-4
    root_conditions: RootCondition[];
    root_canal_treatment: {
      completed: boolean;
      date?: string;
      notes?: string;
    };
  };
  
  // تبويب الملاحظات
  notes: {
    clinical_notes: string;
    treatment_plan: string;
    additional_comments: string;
    follow_up_date?: string;
  };
  
  created_at: string;
  updated_at: string;
}

export enum ConditionType {
  SOUND = 'sound',
  DECAY = 'decay',
  FILLED = 'filled',
  CROWN = 'crown',
  MISSING = 'missing',
  ROOT_CANAL = 'root_canal',
  IMPLANT = 'implant',
  BRIDGE = 'bridge',
  VENEER = 'veneer',
  ORTHODONTIC = 'orthodontic',
  FRACTURED = 'fractured',
  IMPACTED = 'impacted',
  EXTRACTED = 'extracted',
  NEEDS_TREATMENT = 'needs_treatment'
}

export enum PriorityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  EMERGENCY = 'emergency'
}

export enum SurfaceCondition {
  SOUND = 'sound',
  DECAY = 'decay',
  RESTORATION = 'restoration',
  FRACTURE = 'fracture',
  WEAR = 'wear',
  STAIN = 'stain',
  PLAQUE = 'plaque',
  CALCULUS = 'calculus'
}

export interface RootCondition {
  root_number: number;
  condition: 'healthy' | 'infected' | 'treated' | 'fractured' | 'resorbed';
  notes?: string;
}

export enum ToothNumberingSystem {
  FDI = 'fdi',          // النظام الدولي (18, 17, 16...)
  UNIVERSAL = 'universal', // النظام الأمريكي (1, 2, 3...)
  PALMER = 'palmer',    // نظام بالمر
  ARABIC = 'arabic'     // الترقيم العربي التقليدي
}

export interface ToothLayout {
  upperRight: string[];
  upperLeft: string[];
  lowerRight: string[];
  lowerLeft: string[];
}

export interface DentalChartProps {
  patientId: string;
  clinicId: string;
  onToothSelect?: (toothNumber: string) => void;
  selectedTooth?: string;
  numberingSystem?: ToothNumberingSystem;
  readOnly?: boolean;
}

export interface ToothModalProps {
  isOpen: boolean;
  onClose: () => void;
  toothNumber: string;
  patientId: string;
  clinicId: string;
  onSave: (data: ToothRecord) => void;
}

export interface ImageUploadProps {
  onImageSelect: (imageData: string) => void;
  currentImage?: string;
  maxSize?: number; // بالميجابايت
  acceptedFormats?: string[];
}

// WHO Color Standards
export const WHO_COLORS = {
  [ConditionType.SOUND]: '#22c55e',        // أخضر - سليم
  [ConditionType.DECAY]: '#ef4444',        // أحمر - تسوس
  [ConditionType.FILLED]: '#3b82f6',       // أزرق - محشو
  [ConditionType.CROWN]: '#f59e0b',        // برتقالي - تاج
  [ConditionType.MISSING]: '#6b7280',      // رمادي - مفقود
  [ConditionType.ROOT_CANAL]: '#8b5cf6',   // بنفسجي - علاج عصب
  [ConditionType.IMPLANT]: '#06b6d4',      // سماوي - زراعة
  [ConditionType.BRIDGE]: '#f97316',       // برتقالي داكن - جسر
  [ConditionType.VENEER]: '#ec4899',       // وردي - قشرة
  [ConditionType.ORTHODONTIC]: '#84cc16',  // أخضر فاتح - تقويم
  [ConditionType.FRACTURED]: '#dc2626',    // أحمر داكن - كسر
  [ConditionType.IMPACTED]: '#7c3aed',     // بنفسجي داكن - منطمر
  [ConditionType.EXTRACTED]: '#374151',    // رمادي داكن - مقلوع
  [ConditionType.NEEDS_TREATMENT]: '#fbbf24' // أصفر - يحتاج علاج
};

// ICD-10 Dental Codes
export const ICD10_DENTAL_CODES = {
  [ConditionType.DECAY]: 'K02',
  [ConditionType.FILLED]: 'Z87.891',
  [ConditionType.MISSING]: 'K08.1',
  [ConditionType.FRACTURED]: 'S02.5',
  [ConditionType.ROOT_CANAL]: 'Z98.811'
};

// Tooth Position Mapping
export const TOOTH_POSITIONS = {
  // الفك العلوي
  18: 'الطاحن الثالث الأيمن العلوي',
  17: 'الطاحن الثاني الأيمن العلوي',
  16: 'الطاحن الأول الأيمن العلوي',
  15: 'الضاحك الثاني الأيمن العلوي',
  14: 'الضاحك الأول الأيمن العلوي',
  13: 'الناب الأيمن العلوي',
  12: 'القاطع الجانبي الأيمن العلوي',
  11: 'القاطع المركزي الأيمن العلوي',
  21: 'القاطع المركزي الأيسر العلوي',
  22: 'القاطع الجانبي الأيسر العلوي',
  23: 'الناب الأيسر العلوي',
  24: 'الضاحك الأول الأيسر العلوي',
  25: 'الضاحك الثاني الأيسر العلوي',
  26: 'الطاحن الأول الأيسر العلوي',
  27: 'الطاحن الثاني الأيسر العلوي',
  28: 'الطاحن الثالث الأيسر العلوي',
  
  // الفك السفلي
  48: 'الطاحن الثالث الأيمن السفلي',
  47: 'الطاحن الثاني الأيمن السفلي',
  46: 'الطاحن الأول الأيمن السفلي',
  45: 'الضاحك الثاني الأيمن السفلي',
  44: 'الضاحك الأول الأيمن السفلي',
  43: 'الناب الأيمن السفلي',
  42: 'القاطع الجانبي الأيمن السفلي',
  41: 'القاطع المركزي الأيمن السفلي',
  31: 'القاطع المركزي الأيسر السفلي',
  32: 'القاطع الجانبي الأيسر السفلي',
  33: 'الناب الأيسر السفلي',
  34: 'الضاحك الأول الأيسر السفلي',
  35: 'الضاحك الثاني الأيسر السفلي',
  36: 'الطاحن الأول الأيسر السفلي',
  37: 'الطاحن الثاني الأيسر السفلي',
  38: 'الطاحن الثالث الأيسر السفلي',
};

// أنواع التصدير
export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf'
}

// إحصائيات المخطط
export interface ChartStatistics {
  totalTeeth: number;
  recordedTeeth: number;
  healthyTeeth: number;
  decayedTeeth: number;
  filledTeeth: number;
  missingTeeth: number;
  urgentCases: number;
  withImages: number;
  lastUpdated?: string;
}
