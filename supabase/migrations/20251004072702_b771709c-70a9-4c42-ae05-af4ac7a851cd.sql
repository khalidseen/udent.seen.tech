-- ============================================
-- إصلاح infinite recursion والصلاحيات المفقودة
-- ============================================

-- 1. حذف السياسة المسببة للـ recursion
DROP POLICY IF EXISTS "Authorized users can manage user role assignments" ON public.user_role_assignments;
DROP POLICY IF EXISTS "Admins can manage role assignments" ON public.user_role_assignments;

-- 2. إنشاء دالة آمنة للتحقق من صلاحية إدارة الأدوار (بدون recursion)
CREATE OR REPLACE FUNCTION public.can_manage_role_assignments()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
      AND p.role IN ('super_admin', 'admin', 'clinic_owner')
  );
$$;

-- 3. إعادة إنشاء policies بدون recursion
CREATE POLICY "Admins can manage role assignments"
ON public.user_role_assignments
FOR ALL
TO authenticated
USING (public.can_manage_role_assignments())
WITH CHECK (public.can_manage_role_assignments());

-- 4. إضافة صلاحيات لدور secretary
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM user_roles WHERE role_name = 'secretary'),
  p.id
FROM permissions p
WHERE p.permission_key IN (
  'dashboard.view',
  'appointments.view',
  'appointments.create',
  'appointments.edit',
  'patients.view',
  'patients.create',
  'patients.edit',
  'medical_records.view',
  'reports.view'
)
AND p.is_active = true
ON CONFLICT DO NOTHING;