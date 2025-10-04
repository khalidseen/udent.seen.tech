-- إصلاح RLS policies لجدول permissions
-- حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.permissions;
DROP POLICY IF EXISTS "Enable all operations for admins" ON public.permissions;

-- إنشاء سياسات RLS جديدة وآمنة
-- السماح لجميع المستخدمين المصادق عليهم بقراءة الصلاحيات النشطة
CREATE POLICY "authenticated_users_can_read_active_permissions"
ON public.permissions
FOR SELECT
TO authenticated
USING (is_active = true);

-- السماح للـ super_admin بكل العمليات
CREATE POLICY "super_admin_full_access_permissions"
ON public.permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = 'super_admin'
  )
);

-- إنشاء دالة get_dashboard_dismissed المفقودة
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

-- إضافة تعليق على الدالة
COMMENT ON FUNCTION public.get_dashboard_dismissed(uuid) IS 'Returns the dashboard dismissed status for a given profile';
