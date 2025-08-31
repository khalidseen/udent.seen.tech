-- إصلاح RLS policies لجدول العيادات لتمكين Super Admin من الوصول
DROP POLICY IF EXISTS "Super admins can manage all clinics" ON public.clinics;
DROP POLICY IF EXISTS "Users can view their clinic" ON public.clinics;

-- سياسة محسّنة لـ Super Admin للوصول لجميع العيادات
CREATE POLICY "Super admins have full access to all clinics" 
ON public.clinics 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  ) 
  OR 
  EXISTS (
    SELECT 1 FROM public.user_role_assignments ura
    JOIN public.user_roles ur ON ura.role_id = ur.id
    WHERE ura.user_id = auth.uid() 
    AND ur.role_name = 'super_admin'
    AND ura.is_active = true
  )
);

-- سياسة للمستخدمين العاديين لرؤية عياداتهم
CREATE POLICY "Users can view accessible clinics" 
ON public.clinics 
FOR SELECT 
USING (
  id IN (
    SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    UNION
    SELECT clinic_id FROM public.clinic_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- إضافة العضويات المفقودة للمستخدمين الموجودين
INSERT INTO public.clinic_memberships (user_id, clinic_id, role, is_active, joined_at)
SELECT 
  p.user_id,
  p.clinic_id,
  CASE 
    WHEN p.role = 'admin' THEN 'owner'::user_role_type
    WHEN p.role = 'secretary' THEN 'secretary'::user_role_type
    WHEN p.role = 'clinic_manager' THEN 'clinic_manager'::user_role_type
    ELSE 'assistant'::user_role_type
  END as role,
  true,
  p.created_at
FROM public.profiles p
WHERE p.clinic_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.clinic_memberships cm 
  WHERE cm.user_id = p.user_id AND cm.clinic_id = p.clinic_id
)
ON CONFLICT (user_id, clinic_id) DO NOTHING;

-- تحديث RLS policy لـ clinic_memberships لتمكين Super Admin
DROP POLICY IF EXISTS "Users can manage clinic members based on hierarchy" ON public.clinic_memberships;
DROP POLICY IF EXISTS "Users can view clinic memberships" ON public.clinic_memberships;

-- سياسة محسّنة لإدارة أعضاء العيادة
CREATE POLICY "Enhanced clinic membership management" 
ON public.clinic_memberships 
FOR ALL 
USING (
  -- Super Admin access
  (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )) 
  OR
  (EXISTS (
    SELECT 1 FROM public.user_role_assignments ura
    JOIN public.user_roles ur ON ura.role_id = ur.id
    WHERE ura.user_id = auth.uid() 
    AND ur.role_name = 'super_admin'
    AND ura.is_active = true
  ))
  OR
  -- Regular access for clinic members
  (clinic_id IN (
    SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    UNION
    SELECT clinic_id FROM public.clinic_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  ) AND (
    get_user_clinic_role() = 'owner'::user_role_type 
    OR can_manage_role(get_user_clinic_role(), role)
  ))
);