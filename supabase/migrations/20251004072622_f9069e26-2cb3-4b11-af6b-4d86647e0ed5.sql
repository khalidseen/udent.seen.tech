-- ============================================
-- إصلاح المشاكل الحرجة في النظام
-- ============================================

-- 1. إصلاح infinite recursion في user_role_assignments policies
DROP POLICY IF EXISTS "Authorized users can manage user role assignments" ON public.user_role_assignments;

-- إنشاء دالة آمنة للتحقق من صلاحية إدارة الأدوار
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
      AND p.status = 'approved'
  );
$$;

-- إنشاء policy جديدة بدون recursion
CREATE POLICY "Authorized users can manage role assignments"
ON public.user_role_assignments
FOR ALL
TO authenticated
USING (public.can_manage_role_assignments())
WITH CHECK (public.can_manage_role_assignments());

-- 2. إضافة صلاحيات أساسية لدور secretary
-- الحصول على IDs المطلوبة
DO $$
DECLARE
  secretary_role_id UUID;
  perm_id UUID;
BEGIN
  -- الحصول على ID دور secretary
  SELECT id INTO secretary_role_id FROM user_roles WHERE role_name = 'secretary';
  
  IF secretary_role_id IS NOT NULL THEN
    -- إضافة صلاحيات الوصول الأساسية
    
    -- View Dashboard
    SELECT id INTO perm_id FROM permissions WHERE permission_key = 'dashboard.view';
    IF perm_id IS NOT NULL THEN
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (secretary_role_id, perm_id)
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- View Appointments
    SELECT id INTO perm_id FROM permissions WHERE permission_key = 'appointments.view';
    IF perm_id IS NOT NULL THEN
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (secretary_role_id, perm_id)
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Create Appointments
    SELECT id INTO perm_id FROM permissions WHERE permission_key = 'appointments.create';
    IF perm_id IS NOT NULL THEN
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (secretary_role_id, perm_id)
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Edit Appointments
    SELECT id INTO perm_id FROM permissions WHERE permission_key = 'appointments.edit';
    IF perm_id IS NOT NULL THEN
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (secretary_role_id, perm_id)
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- View Patients
    SELECT id INTO perm_id FROM permissions WHERE permission_key = 'patients.view';
    IF perm_id IS NOT NULL THEN
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (secretary_role_id, perm_id)
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Create Patients
    SELECT id INTO perm_id FROM permissions WHERE permission_key = 'patients.create';
    IF perm_id IS NOT NULL THEN
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (secretary_role_id, perm_id)
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- View Medical Records
    SELECT id INTO perm_id FROM permissions WHERE permission_key = 'medical_records.view';
    IF perm_id IS NOT NULL THEN
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (secretary_role_id, perm_id)
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- View Reports
    SELECT id INTO perm_id FROM permissions WHERE permission_key = 'reports.view';
    IF perm_id IS NOT NULL THEN
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (secretary_role_id, perm_id)
      ON CONFLICT DO NOTHING;
    END IF;

  END IF;
END $$;