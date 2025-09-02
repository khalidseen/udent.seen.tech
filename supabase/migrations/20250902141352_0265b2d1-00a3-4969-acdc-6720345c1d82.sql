-- إصلاح مسارات البحث للدوال الأمنية
-- تحديث دالة get_current_user_profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
 RETURNS profiles
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT * FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$function$;

-- تحديث دالة has_permission
CREATE OR REPLACE FUNCTION public.has_permission(permission_key_param text, user_id_param uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT (
        -- الصلاحيات العادية
        EXISTS (
            SELECT 1 FROM public.get_user_permissions(user_id_param) 
            WHERE permission_key = permission_key_param
        )
        OR
        -- الصلاحيات المؤقتة
        public.has_temporary_permission(user_id_param, permission_key_param)
    );
$function$;

-- تحديث دالة has_temporary_permission
CREATE OR REPLACE FUNCTION public.has_temporary_permission(user_id_param uuid, permission_key_param text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM temporary_permissions tp
        WHERE tp.user_id = user_id_param
        AND tp.permission_key = permission_key_param
        AND tp.is_active = true
        AND tp.expires_at > NOW()
    );
$function$;