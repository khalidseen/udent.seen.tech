-- إضافة حقول المنشئ والتعديل لجدول المرضى
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS created_by_id UUID,
ADD COLUMN IF NOT EXISTS created_by_name TEXT,
ADD COLUMN IF NOT EXISTS created_by_role TEXT,
ADD COLUMN IF NOT EXISTS last_modified_by_id UUID,
ADD COLUMN IF NOT EXISTS last_modified_by_name TEXT,
ADD COLUMN IF NOT EXISTS last_modified_by_role TEXT;

-- تحديث البيانات الموجودة للحقول الجديدة
UPDATE public.patients 
SET 
  created_by_name = 'النظام',
  created_by_role = 'system',
  last_modified_by_name = 'النظام',
  last_modified_by_role = 'system'
WHERE created_by_name IS NULL;

-- إنشاء دالة لحساب الرصيد المالي للمريض
CREATE OR REPLACE FUNCTION public.calculate_patient_financial_status(patient_id_param UUID)
RETURNS TABLE(
  total_charges NUMERIC,
  total_payments NUMERIC,
  balance_due NUMERIC,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(i.total_amount), 0) as total_charges,
    COALESCE(SUM(i.paid_amount), 0) as total_payments,
    COALESCE(SUM(i.balance_due), 0) as balance_due,
    CASE 
      WHEN COALESCE(SUM(i.balance_due), 0) = 0 THEN 'paid'
      WHEN COALESCE(SUM(i.balance_due), 0) > 0 AND COALESCE(SUM(i.paid_amount), 0) > 0 THEN 'partial'
      WHEN COALESCE(SUM(i.balance_due), 0) > 0 AND COALESCE(SUM(i.paid_amount), 0) = 0 THEN 'pending'
      ELSE 'pending'
    END as status
  FROM public.invoices i
  WHERE i.patient_id = patient_id_param;
END;
$$;

-- تحديث trigger لملء معلومات المنشئ تلقائياً
CREATE OR REPLACE FUNCTION public.set_patient_creator_info()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  current_profile RECORD;
BEGIN
  -- الحصول على معلومات المستخدم الحالي
  SELECT * INTO current_profile 
  FROM public.profiles 
  WHERE user_id = auth.uid() 
  LIMIT 1;

  -- ملء معلومات المنشئ للسجل الجديد
  IF TG_OP = 'INSERT' THEN
    NEW.created_by_id = auth.uid();
    NEW.created_by_name = COALESCE(current_profile.full_name, 'مستخدم غير معروف');
    NEW.created_by_role = COALESCE(current_profile.role, 'user');
    NEW.last_modified_by_id = auth.uid();
    NEW.last_modified_by_name = COALESCE(current_profile.full_name, 'مستخدم غير معروف');
    NEW.last_modified_by_role = COALESCE(current_profile.role, 'user');
  END IF;

  -- تحديث معلومات المعدّل للسجل المحدث
  IF TG_OP = 'UPDATE' THEN
    NEW.last_modified_by_id = auth.uid();
    NEW.last_modified_by_name = COALESCE(current_profile.full_name, 'مستخدم غير معروف');
    NEW.last_modified_by_role = COALESCE(current_profile.role, 'user');
  END IF;

  RETURN NEW;
END;
$$;

-- إنشاء trigger للمرضى
DROP TRIGGER IF EXISTS set_patient_creator_trigger ON public.patients;
CREATE TRIGGER set_patient_creator_trigger
  BEFORE INSERT OR UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.set_patient_creator_info();