-- إنشاء جدول tooth_records المطلوب لمخطط الأسنان
CREATE TABLE public.tooth_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tooth_number TEXT NOT NULL,
  patient_id UUID NOT NULL,
  clinic_id UUID NOT NULL,
  
  -- تبويب التشخيص
  diagnosis JSONB NOT NULL DEFAULT '{"primary_condition": "sound", "priority_level": "low"}'::jsonb,
  
  -- تبويب الأسطح
  surfaces JSONB NOT NULL DEFAULT '{
    "mesial": "sound",
    "distal": "sound", 
    "buccal": "sound",
    "lingual": "sound",
    "occlusal": "sound",
    "incisal": "sound"
  }'::jsonb,
  
  -- تبويب القياسات السريرية
  clinical_measurements JSONB NOT NULL DEFAULT '{
    "mobility": 0,
    "pocket_depths": {
      "mesial_buccal": 0,
      "mid_buccal": 0,
      "distal_buccal": 0,
      "mesial_lingual": 0,
      "mid_lingual": 0,
      "distal_lingual": 0
    },
    "bleeding_on_probing": false,
    "gingival_recession": {
      "buccal": 0,
      "lingual": 0
    },
    "plaque_index": 0
  }'::jsonb,
  
  -- تبويب الجذور
  roots JSONB NOT NULL DEFAULT '{
    "number_of_roots": 1,
    "root_conditions": [],
    "root_canal_treatment": {
      "completed": false
    }
  }'::jsonb,
  
  -- تبويب الملاحظات
  notes JSONB NOT NULL DEFAULT '{
    "clinical_notes": "",
    "treatment_plan": "",
    "additional_comments": ""
  }'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة RLS
ALTER TABLE public.tooth_records ENABLE ROW LEVEL SECURITY;

-- سياسات الحماية
CREATE POLICY "Users can view their clinic tooth records" 
ON public.tooth_records 
FOR SELECT 
USING (clinic_id = (SELECT get_current_user_profile()).id);

CREATE POLICY "Users can create tooth records for their clinic" 
ON public.tooth_records 
FOR INSERT 
WITH CHECK (clinic_id = (SELECT get_current_user_profile()).id);

CREATE POLICY "Users can update their clinic tooth records" 
ON public.tooth_records 
FOR UPDATE 
USING (clinic_id = (SELECT get_current_user_profile()).id);

CREATE POLICY "Users can delete their clinic tooth records" 
ON public.tooth_records 
FOR DELETE 
USING (clinic_id = (SELECT get_current_user_profile()).id);

-- إضافة مؤشرات للأداء
CREATE INDEX idx_tooth_records_patient_id ON public.tooth_records(patient_id);
CREATE INDEX idx_tooth_records_clinic_id ON public.tooth_records(clinic_id);
CREATE INDEX idx_tooth_records_tooth_number ON public.tooth_records(tooth_number);

-- إضافة حقول مفقودة لجدول المرضى
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS insurance_info TEXT,
ADD COLUMN IF NOT EXISTS medical_history TEXT,
ADD COLUMN IF NOT EXISTS financial_balance NUMERIC DEFAULT 0;

-- إضافة trigger للتحديث التلقائي
CREATE OR REPLACE FUNCTION update_tooth_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tooth_records_updated_at
BEFORE UPDATE ON public.tooth_records
FOR EACH ROW
EXECUTE FUNCTION update_tooth_records_updated_at();