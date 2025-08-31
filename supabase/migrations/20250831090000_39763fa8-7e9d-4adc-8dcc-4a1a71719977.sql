-- إعطاء صلاحيات كاملة بلا قيود لمدير النظام
-- أولاً: تأكد من وجود profile للمستخدم وإعطاءه دور admin
INSERT INTO public.profiles (user_id, full_name, role, status)
SELECT 
  u.id,
  'Khalid - System Administrator',
  'admin',
  'active'
FROM auth.users u
WHERE u.email = 'eng.khalid.work@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = 'admin',
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  status = 'active',
  updated_at = now();

-- ثانياً: إنشاء دور super_admin إذا لم يكن موجوداً
INSERT INTO public.user_roles (role_name, role_name_ar, description, is_system_role, is_active)
VALUES (
  'super_admin',
  'مدير النظام الأعلى',
  'مدير النظام الأعلى مع صلاحيات كاملة بلا قيود',
  true,
  true
)
ON CONFLICT (role_name) DO NOTHING;

-- ثالثاً: إعطاء دور super_admin للمستخدم المحدد
INSERT INTO public.user_role_assignments (user_id, role_id, assigned_by, is_active)
SELECT 
  u.id,
  ur.id,
  u.id, -- يعطي نفسه الدور
  true
FROM auth.users u
CROSS JOIN public.user_roles ur
WHERE u.email = 'eng.khalid.work@gmail.com'
  AND ur.role_name = 'super_admin'
ON CONFLICT (user_id, role_id) 
DO UPDATE SET 
  is_active = true,
  updated_at = now();

-- رابعاً: تحديث get_current_user_profile function لإعطاء صلاحيات كاملة للمديرين
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  role text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(p.id, gen_random_uuid()) as id,
    COALESCE(p.user_id, auth.uid()) as user_id,
    COALESCE(p.full_name, 'مستخدم') as full_name,
    CASE 
      WHEN auth.email() = 'eng.khalid.work@gmail.com' THEN 'admin'
      WHEN EXISTS (
        SELECT 1 FROM user_role_assignments ura 
        JOIN user_roles ur ON ura.role_id = ur.id 
        WHERE ura.user_id = auth.uid() 
        AND ur.role_name IN ('admin', 'super_admin') 
        AND ura.is_active = true
      ) THEN 'admin'
      ELSE COALESCE(p.role, 'user')
    END as role,
    COALESCE(p.created_at, now()) as created_at,
    COALESCE(p.updated_at, now()) as updated_at,
    COALESCE(p.status, 'active') as status
  FROM profiles p
  WHERE p.user_id = auth.uid()
  UNION ALL
  SELECT 
    gen_random_uuid() as id,
    auth.uid() as user_id,
    'مدير النظام' as full_name,
    'admin' as role,
    now() as created_at,
    now() as updated_at,
    'active' as status
  WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid())
    AND auth.email() IS NOT NULL;
$$;