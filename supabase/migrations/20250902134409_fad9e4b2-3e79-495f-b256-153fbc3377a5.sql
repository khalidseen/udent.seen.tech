-- إنشاء bucket للنماذج ثلاثية الأبعاد
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dental-3d-models',
  'dental-3d-models',
  true,
  52428800, -- 50MB limit
  ARRAY['model/gltf-binary', 'application/octet-stream']
);

-- إنشاء جدول للنماذج الافتراضية
CREATE TABLE public.dental_3d_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tooth_number TEXT NOT NULL,
  numbering_system TEXT NOT NULL DEFAULT 'universal',
  model_path TEXT NOT NULL,
  model_name TEXT NOT NULL,
  model_type TEXT NOT NULL DEFAULT 'default',
  file_size INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tooth_number, numbering_system, model_type)
);

-- إنشاء جدول للنماذج المخصصة للمرضى
CREATE TABLE public.patient_dental_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  tooth_number TEXT NOT NULL,
  numbering_system TEXT NOT NULL DEFAULT 'universal',
  model_path TEXT NOT NULL,
  annotations JSONB DEFAULT '[]'::jsonb,
  modifications JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(patient_id, tooth_number, numbering_system)
);

-- تمكين RLS على الجداول
ALTER TABLE public.dental_3d_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_dental_models ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للنماذج الافتراضية
CREATE POLICY "Everyone can view default dental models"
  ON public.dental_3d_models
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage default dental models"
  ON public.dental_3d_models
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  ));

-- سياسات RLS للنماذج المخصصة للمرضى
CREATE POLICY "Users can view patient models from their clinic"
  ON public.patient_dental_models
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM patients p
    JOIN profiles prof ON p.clinic_id = prof.id
    WHERE p.id = patient_id 
    AND prof.user_id = auth.uid()
  ));

CREATE POLICY "Users can create patient models for their clinic"
  ON public.patient_dental_models
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM patients p
    JOIN profiles prof ON p.clinic_id = prof.id
    WHERE p.id = patient_id 
    AND prof.user_id = auth.uid()
  ));

CREATE POLICY "Users can update patient models from their clinic"
  ON public.patient_dental_models
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM patients p
    JOIN profiles prof ON p.clinic_id = prof.id
    WHERE p.id = patient_id 
    AND prof.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete patient models from their clinic"
  ON public.patient_dental_models
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM patients p
    JOIN profiles prof ON p.clinic_id = prof.id
    WHERE p.id = patient_id 
    AND prof.user_id = auth.uid()
  ));

-- سياسات التخزين للنماذج ثلاثية الأبعاد
CREATE POLICY "Public access to default models"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'dental-3d-models' AND (storage.foldername(name))[1] = 'default-models');

CREATE POLICY "Admins can upload default models"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'dental-3d-models' 
    AND (storage.foldername(name))[1] = 'default-models'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can manage patient models for their clinic"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'dental-3d-models' 
    AND (storage.foldername(name))[1] = 'patient-models'
    AND EXISTS (
      SELECT 1 FROM patients p
      JOIN profiles prof ON p.clinic_id = prof.id
      WHERE p.id::text = (storage.foldername(name))[2]
      AND prof.user_id = auth.uid()
    )
  );

-- إضافة trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_dental_models_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dental_3d_models_updated_at
  BEFORE UPDATE ON public.dental_3d_models
  FOR EACH ROW
  EXECUTE FUNCTION update_dental_models_updated_at();

CREATE TRIGGER update_patient_dental_models_updated_at
  BEFORE UPDATE ON public.patient_dental_models
  FOR EACH ROW
  EXECUTE FUNCTION update_dental_models_updated_at();