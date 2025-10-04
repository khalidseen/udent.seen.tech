-- إصلاح التحذيرات الأمنية من Migration السابقة
-- تحديث الدوال لتحديد search_path

-- تحديث دالة get_dashboard_dismissed مع search_path
CREATE OR REPLACE FUNCTION public.get_dashboard_dismissed(p_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT dashboard_link_validation_dismissed 
     FROM public.profiles 
     WHERE id = p_profile_id),
    false
  );
END;
$$;

-- التأكد من وجود الدالة update_updated_at_column مع search_path صحيح
-- (موجودة بالفعل لكن نتأكد من search_path)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;