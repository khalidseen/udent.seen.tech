-- منح صلاحيات كاملة للمستخدم KLIDMORRE@GMAIL.COM كمدير نظام

-- 1. حذف أي تعيين دور سابق ثم إضافة دور super_admin
DELETE FROM public.user_role_assignments
WHERE user_id = '3466812f-6586-4186-87ef-72e8a3f36d54'::uuid
AND role_id IN (SELECT id FROM public.user_roles WHERE role_name = 'super_admin');

INSERT INTO public.user_role_assignments (
  user_id,
  role_id,
  is_active,
  assigned_by,
  assigned_at
)
SELECT 
  '3466812f-6586-4186-87ef-72e8a3f36d54'::uuid,
  ur.id,
  true,
  '3466812f-6586-4186-87ef-72e8a3f36d54'::uuid,
  now()
FROM public.user_roles ur
WHERE ur.role_name = 'super_admin';

-- 2. تحديث الدور الأساسي في profiles
UPDATE public.profiles
SET role = 'super_admin'
WHERE user_id = '3466812f-6586-4186-87ef-72e8a3f36d54';

-- 3. حذف ثم إضافة صلاحية إدارة جميع العيادات
DELETE FROM public.clinic_specific_permissions
WHERE user_id = '3466812f-6586-4186-87ef-72e8a3f36d54'::uuid
AND permission_key = 'system.manage_all_clinics';

INSERT INTO public.clinic_specific_permissions (
  clinic_id,
  user_id,
  permission_key,
  permission_category,
  is_granted,
  granted_by,
  is_active,
  reason
)
SELECT 
  p.clinic_id,
  '3466812f-6586-4186-87ef-72e8a3f36d54'::uuid,
  'system.manage_all_clinics',
  'system',
  true,
  '3466812f-6586-4186-87ef-72e8a3f36d54'::uuid,
  true,
  'منح صلاحيات كاملة لمدير النظام'
FROM public.profiles p
WHERE p.user_id = '3466812f-6586-4186-87ef-72e8a3f36d54';