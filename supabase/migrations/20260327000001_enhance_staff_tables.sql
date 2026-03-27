-- تطوير جداول الكادر الطبي: إضافة حقول مهنية للسكرتارية والمساعدين

-- 1. إضافة أعمدة جديدة لجدول السكرتارية
ALTER TABLE public.secretaries 
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS salary NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS hired_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  ADD COLUMN IF NOT EXISTS working_hours TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. إضافة عمود الحالة لجدول مساعدي الأطباء
ALTER TABLE public.doctor_assistants 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  ADD COLUMN IF NOT EXISTS hired_date DATE DEFAULT CURRENT_DATE;

-- 3. تحديث السجلات الموجودة بالقيم الافتراضية
UPDATE public.secretaries SET status = 'active' WHERE status IS NULL;
UPDATE public.secretaries SET hired_date = created_at::date WHERE hired_date IS NULL;
UPDATE public.doctor_assistants SET status = 'active' WHERE status IS NULL;
UPDATE public.doctor_assistants SET hired_date = created_at::date WHERE hired_date IS NULL;

-- 4. Trigger لتحديث updated_at تلقائياً في السكرتارية
CREATE OR REPLACE FUNCTION public.update_secretaries_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_secretaries_updated_at ON public.secretaries;
CREATE TRIGGER trigger_update_secretaries_updated_at
  BEFORE UPDATE ON public.secretaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_secretaries_updated_at();

-- 5. فهارس للأعمدة الجديدة
CREATE INDEX IF NOT EXISTS idx_secretaries_clinic ON public.secretaries(clinic_id);
CREATE INDEX IF NOT EXISTS idx_secretaries_status ON public.secretaries(status);
CREATE INDEX IF NOT EXISTS idx_doctor_assistants_status ON public.doctor_assistants(status);
