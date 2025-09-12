-- Grant super admin permissions to eng.khalid.work@gmail.com
-- First, find and update the user's profile to admin role
UPDATE public.profiles 
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'eng.khalid.work@gmail.com'
  LIMIT 1
);

-- Also assign super_admin role if it doesn't exist in their assignments
INSERT INTO public.user_role_assignments (user_id, role_id, is_active)
SELECT 
  auth_user.id,
  ur.id,
  true
FROM auth.users auth_user
CROSS JOIN user_roles ur
WHERE auth_user.email = 'eng.khalid.work@gmail.com'
  AND ur.role_name = 'super_admin'
  AND NOT EXISTS (
    SELECT 1 FROM user_role_assignments ura 
    WHERE ura.user_id = auth_user.id 
    AND ura.role_id = ur.id
  );

-- Ensure super_admin role exists if not already there
INSERT INTO public.user_roles (role_name, role_name_ar, is_system_role, is_active)
VALUES ('super_admin', 'مدير عام', true, true)
ON CONFLICT (role_name) DO NOTHING;

-- Grant all permissions to super_admin role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT ur.id, p.id
FROM user_roles ur
CROSS JOIN permissions p
WHERE ur.role_name = 'super_admin'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = ur.id 
    AND rp.permission_id = p.id
  );