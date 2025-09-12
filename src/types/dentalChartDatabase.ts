// 🦷 Enhanced Dental Chart Database Types
// أنواع قاعدة البيانات لنظام مخطط الأسنان المحسن

export interface DatabaseToothRecord {
  id: string;
  tooth_number: string;
  patient_id: string;
  clinic_id: string;
  
  // تبويب التشخيص
  primary_condition: string;
  priority_level: string;
  icd10_code?: string;
  diagnosis_notes?: string;
  image_url?: string;
  image_data?: string; // Base64
  
  // تبويب الأسطح
  surface_mesial: string;
  surface_distal: string;
  surface_buccal: string;
  surface_lingual: string;
  surface_occlusal: string;
  surface_incisal: string;
  
  // تبويب القياسات السريرية
  mobility_degree: number;
  pocket_depth_mesial_buccal: number;
  pocket_depth_mid_buccal: number;
  pocket_depth_distal_buccal: number;
  pocket_depth_mesial_lingual: number;
  pocket_depth_mid_lingual: number;
  pocket_depth_distal_lingual: number;
  bleeding_on_probing: boolean;
  gingival_recession_buccal: number;
  gingival_recession_lingual: number;
  plaque_index: number;
  
  // تبويب الجذور
  number_of_roots: number;
  root_canal_completed: boolean;
  root_canal_date?: string;
  root_canal_notes?: string;
  
  // تبويب الملاحظات
  clinical_notes?: string;
  treatment_plan?: string;
  additional_comments?: string;
  follow_up_date?: string;
  
  created_at: string;
  updated_at: string;
}

export interface ToothRootCondition {
  id: string;
  tooth_record_id: string;
  root_number: number;
  condition: string;
  notes?: string;
  created_at: string;
}

export interface ToothTreatmentHistory {
  id: string;
  tooth_record_id: string;
  treatment_type: string;
  treatment_date: string;
  dentist_id?: string;
  notes?: string;
  cost?: number;
  status: string;
  created_at: string;
}

export interface ToothImage {
  id: string;
  tooth_record_id: string;
  image_type: string;
  image_url?: string;
  image_data?: string;
  thumbnail_data?: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  description?: string;
  captured_date: string;
  created_at: string;
}

export interface DiagnosisTemplate {
  id: string;
  clinic_id: string;
  template_name: string;
  condition_type: string;
  priority_level: string;
  icd10_code?: string;
  default_notes?: string;
  treatment_plan_template?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
}

export interface DentalChartStatistics {
  total_teeth: number;
  recorded_teeth: number;
  healthy_teeth: number;
  decay_teeth: number;
  filled_teeth: number;
  missing_teeth: number;
  urgent_cases: number;
  with_images: number;
  last_updated?: string;
}

export interface ToothSearchResult {
  tooth_record_id: string;
  patient_id: string;
  patient_name: string;
  tooth_number: string;
  condition: string;
  priority: string;
  has_image: boolean;
  updated_at: string;
}

// دوال التحويل بين أنواع UI وقاعدة البيانات
export function toothRecordToDatabase(record: any): Partial<DatabaseToothRecord> {
  return {
    tooth_number: record.toothNumber,
    patient_id: record.patientId,
    clinic_id: record.clinicId,
    
    // تبويب التشخيص
    primary_condition: record.condition,
    priority_level: record.priority,
    icd10_code: record.icd10Code,
    diagnosis_notes: record.notes,
    image_url: record.imageUrl,
    image_data: record.imageData,
    
    // تبويب الأسطح
    surface_mesial: record.surfaces?.mesial || 'sound',
    surface_distal: record.surfaces?.distal || 'sound',
    surface_buccal: record.surfaces?.buccal || 'sound',
    surface_lingual: record.surfaces?.lingual || 'sound',
    surface_occlusal: record.surfaces?.occlusal || 'sound',
    surface_incisal: record.surfaces?.incisal || 'sound',
    
    // تبويب القياسات السريرية
    mobility_degree: record.measurements?.mobility || 0,
    pocket_depth_mesial_buccal: record.measurements?.pocketDepths?.mesialBuccal || 2,
    pocket_depth_mid_buccal: record.measurements?.pocketDepths?.midBuccal || 2,
    pocket_depth_distal_buccal: record.measurements?.pocketDepths?.distalBuccal || 2,
    pocket_depth_mesial_lingual: record.measurements?.pocketDepths?.mesialLingual || 2,
    pocket_depth_mid_lingual: record.measurements?.pocketDepths?.midLingual || 2,
    pocket_depth_distal_lingual: record.measurements?.pocketDepths?.distalLingual || 2,
    bleeding_on_probing: record.measurements?.bleedingOnProbing || false,
    gingival_recession_buccal: record.measurements?.gingivalRecession?.buccal || 0,
    gingival_recession_lingual: record.measurements?.gingivalRecession?.lingual || 0,
    plaque_index: record.measurements?.plaqueIndex || 0,
    
    // تبويب الجذور
    number_of_roots: record.roots?.number_of_roots || 1,
    root_canal_completed: record.roots?.canalCompleted || false,
    root_canal_date: record.roots?.canalDate,
    root_canal_notes: record.roots?.canalNotes,
    
    // تبويب الملاحظات
    clinical_notes: record.notes,
    treatment_plan: record.treatmentPlan,
    additional_comments: record.additionalComments,
    follow_up_date: record.followUpDate,
  };
}

export function databaseToToothRecord(dbRecord: DatabaseToothRecord): any {
  return {
    id: dbRecord.id,
    toothNumber: dbRecord.tooth_number,
    patientId: dbRecord.patient_id,
    clinicId: dbRecord.clinic_id,
    
    // تبويب التشخيص
    condition: dbRecord.primary_condition as any,
    priority: dbRecord.priority_level as any,
    notes: dbRecord.diagnosis_notes as any,
    imageUrl: dbRecord.image_url,
    imageData: dbRecord.image_data,
    
    // تبويب الأسطح
    surfaces: {
      mesial: dbRecord.surface_mesial as any,
      distal: dbRecord.surface_distal as any,
      buccal: dbRecord.surface_buccal as any,
      lingual: dbRecord.surface_lingual as any,
      occlusal: dbRecord.surface_occlusal as any,
      incisal: dbRecord.surface_incisal as any,
    },
    
    // تبويب القياسات السريرية
    measurements: {
      mobility: dbRecord.mobility_degree,
      pocketDepths: {
        mesialBuccal: dbRecord.pocket_depth_mesial_buccal,
        midBuccal: dbRecord.pocket_depth_mid_buccal,
        distalBuccal: dbRecord.pocket_depth_distal_buccal,
        mesialLingual: dbRecord.pocket_depth_mesial_lingual,
        midLingual: dbRecord.pocket_depth_mid_lingual,
        distalLingual: dbRecord.pocket_depth_distal_lingual,
      },
      bleedingOnProbing: dbRecord.bleeding_on_probing,
      gingivalRecession: {
        buccal: dbRecord.gingival_recession_buccal,
        lingual: dbRecord.gingival_recession_lingual,
      },
      plaqueIndex: dbRecord.plaque_index,
    },
    
    // تبويب الجذور
    roots: {
      numberOfRoots: dbRecord.number_of_roots,
      canalCompleted: dbRecord.root_canal_completed,
      canalDate: dbRecord.root_canal_date,
      canalNotes: dbRecord.root_canal_notes,
    },
    
    // تبويب الملاحظات
    treatmentPlan: dbRecord.treatment_plan,
    additionalComments: dbRecord.additional_comments,
    followUpDate: dbRecord.follow_up_date,
    
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at,
  };
}

// استيراد الأنواع من الملف الأصلي
import type { 
  ToothRecord, 
  ConditionType, 
  PriorityLevel 
} from './dentalChart';

export type { 
  ToothRecord, 
  ConditionType, 
  PriorityLevel 
} from './dentalChart';
