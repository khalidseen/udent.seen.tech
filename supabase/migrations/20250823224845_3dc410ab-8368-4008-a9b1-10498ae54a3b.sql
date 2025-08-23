-- Update eng.khalid.work@gmail.com to super admin with proper data
UPDATE profiles 
SET 
  full_name = 'خالد محمد - مدير عام',
  role = 'admin',
  status = 'approved'
WHERE user_id = '18240bb1-e63b-4ee5-8a7a-67094b49436b';

-- Assign super admin role to this user
INSERT INTO user_role_assignments (user_id, role_id, assigned_by, is_active)
SELECT 
  '18240bb1-e63b-4ee5-8a7a-67094b49436b',
  ur.id,
  '18240bb1-e63b-4ee5-8a7a-67094b49436b',
  true
FROM user_roles ur 
WHERE ur.role_name = 'super_admin'
ON CONFLICT (user_id, role_id) 
DO UPDATE SET is_active = true, assigned_at = now();