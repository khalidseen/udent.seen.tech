-- Add missing patient information fields
ALTER TABLE public.patients 
ADD COLUMN national_id TEXT,
ADD COLUMN emergency_contact TEXT,
ADD COLUMN emergency_phone TEXT,
ADD COLUMN patient_status TEXT NOT NULL DEFAULT 'active',
ADD COLUMN insurance_info TEXT,
ADD COLUMN blood_type TEXT,
ADD COLUMN occupation TEXT,
ADD COLUMN marital_status TEXT;

-- Add indexes for better performance
CREATE INDEX idx_patients_national_id ON public.patients(national_id);
CREATE INDEX idx_patients_status ON public.patients(patient_status);

-- Add comments for better documentation
COMMENT ON COLUMN public.patients.national_id IS 'رقم الهوية الوطنية';
COMMENT ON COLUMN public.patients.emergency_contact IS 'اسم جهة الاتصال في حالات الطوارئ';
COMMENT ON COLUMN public.patients.emergency_phone IS 'رقم هاتف الطوارئ';
COMMENT ON COLUMN public.patients.patient_status IS 'حالة المريض: active, inactive, transferred, deceased';
COMMENT ON COLUMN public.patients.insurance_info IS 'معلومات التأمين الطبي';
COMMENT ON COLUMN public.patients.blood_type IS 'فصيلة الدم';
COMMENT ON COLUMN public.patients.occupation IS 'المهنة';
COMMENT ON COLUMN public.patients.marital_status IS 'الحالة الاجتماعية';