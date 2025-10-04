-- ============================================
-- إصلاح مشكلة تسجيل الدخول - Migration
-- ============================================

-- 1. تفعيل RLS على جدول permissions
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- 2. إنشاء سياسات RLS لجدول permissions
-- سياسة للقراءة للمستخدمين المصادق عليهم (صلاحيات نشطة فقط)
CREATE POLICY "Authenticated users can view active permissions"
ON public.permissions
FOR SELECT
TO authenticated
USING (is_active = true);

-- سياسة كاملة للـ super_admin
CREATE POLICY "Super admins have full access to permissions"
ON public.permissions
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- 3. التأكد من وجود دالة is_super_admin (إذا لم تكن موجودة)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    -- Primary role on profile
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
    )
    OR
    -- Additional roles via assignments
    EXISTS (
      SELECT 1
      FROM public.user_role_assignments ura
      JOIN public.user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
        AND ura.is_active = true
        AND (ura.expires_at IS NULL OR ura.expires_at > now())
        AND ur.is_active = true
        AND ur.role_name = 'super_admin'
    )
  );
$$;

-- 4. إعادة إنشاء دوال dashboard مع SECURITY DEFINER
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

CREATE OR REPLACE FUNCTION public.set_dashboard_dismissed(p_profile_id uuid, p_value boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles 
  SET dashboard_link_validation_dismissed = p_value 
  WHERE id = p_profile_id;
END;
$$;