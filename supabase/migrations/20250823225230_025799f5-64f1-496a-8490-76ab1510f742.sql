-- إصلاح مسارات البحث في الدوال لحل تحذيرات الأمان
ALTER FUNCTION public.get_user_permissions(uuid) SET search_path = public;
ALTER FUNCTION public.get_user_roles(uuid) SET search_path = public;

-- تحديث دالة get_current_user_profile لإضافة search_path
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS profiles
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- تحديث دالة has_permission لإضافة search_path
CREATE OR REPLACE FUNCTION public.has_permission(permission_key_param text, user_id_param uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.get_user_permissions(user_id_param) 
    WHERE permission_key = permission_key_param
  );
$$;