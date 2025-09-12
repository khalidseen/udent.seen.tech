-- Complete multi-clinic system implementation
-- Update remaining tables to include clinic_id where missing

-- 1. Add clinic_id to tables that don't have it yet
ALTER TABLE IF EXISTS public.tooth_conditions 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id);

-- Update existing tooth_conditions to link to default clinic
UPDATE public.tooth_conditions 
SET clinic_id = (SELECT id FROM public.clinics LIMIT 1)
WHERE clinic_id IS NULL;

-- 2. Create user management permissions for multi-clinic
INSERT INTO public.permissions (permission_key, permission_name, permission_name_ar, category) VALUES
('clinic.manage_users', 'Manage Clinic Users', 'إدارة مستخدمي العيادة', 'clinic_management'),
('clinic.view_all_data', 'View All Clinic Data', 'عرض جميع بيانات العيادة', 'clinic_management'),
('clinic.switch_clinic', 'Switch Between Clinics', 'التنقل بين العيادات', 'clinic_management'),
('system.manage_all_clinics', 'Manage All Clinics', 'إدارة جميع العيادات', 'system_admin')
ON CONFLICT (permission_key) DO NOTHING;

-- 3. Grant permissions to roles
-- Grant clinic management permissions to admin role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT ur.id, p.id
FROM user_roles ur
CROSS JOIN permissions p
WHERE ur.role_name = 'admin' 
  AND p.permission_key IN ('clinic.manage_users', 'clinic.view_all_data', 'clinic.switch_clinic')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = ur.id AND rp.permission_id = p.id
  );

-- Grant system admin permissions to super_admin role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT ur.id, p.id
FROM user_roles ur
CROSS JOIN permissions p
WHERE ur.role_name = 'super_admin' 
  AND p.permission_key = 'system.manage_all_clinics'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = ur.id AND rp.permission_id = p.id
  );

-- 4. Create function to switch user clinic
CREATE OR REPLACE FUNCTION public.switch_user_clinic(new_clinic_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile RECORD;
BEGIN
  -- Check if user has access to the clinic
  SELECT * INTO user_profile 
  FROM profiles 
  WHERE user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has permission to switch clinics or is a member of the target clinic
  IF user_profile.role = 'admin' OR 
     EXISTS (
       SELECT 1 FROM clinic_memberships 
       WHERE user_id = auth.uid() 
         AND clinic_id = new_clinic_id 
         AND is_active = true
     ) THEN
    
    -- Update user's current clinic
    UPDATE profiles 
    SET clinic_id = new_clinic_id, updated_at = now()
    WHERE user_id = auth.uid();
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- 5. Create function to get user accessible clinics
CREATE OR REPLACE FUNCTION public.get_user_accessible_clinics()
RETURNS TABLE(
  clinic_id UUID,
  clinic_name TEXT,
  is_current BOOLEAN,
  access_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile RECORD;
BEGIN
  SELECT * INTO user_profile 
  FROM profiles 
  WHERE user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- If user is super admin, return all clinics
  IF user_profile.role = 'admin' AND EXISTS (
    SELECT 1 FROM user_role_assignments ura
    JOIN user_roles ur ON ura.role_id = ur.id
    WHERE ura.user_id = auth.uid() 
      AND ur.role_name = 'super_admin'
      AND ura.is_active = true
  ) THEN
    RETURN QUERY
    SELECT 
      c.id,
      c.name,
      (c.id = user_profile.clinic_id) as is_current,
      'super_admin'::TEXT as access_type
    FROM clinics c
    WHERE c.is_active = true
    ORDER BY c.name;
    RETURN;
  END IF;
  
  -- Return user's primary clinic
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    true as is_current,
    'primary'::TEXT as access_type
  FROM clinics c
  WHERE c.id = user_profile.clinic_id
    AND c.is_active = true;
  
  -- Return clinics user is a member of
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    false as is_current,
    cm.role::TEXT as access_type
  FROM clinics c
  JOIN clinic_memberships cm ON c.id = cm.clinic_id
  WHERE cm.user_id = auth.uid()
    AND cm.is_active = true
    AND c.is_active = true
    AND c.id != user_profile.clinic_id
  ORDER BY c.name;
END;
$$;