-- المرحلة الأولى: تحديث قاعدة البيانات لنظام الأدوار المتدرج

-- 1. إضافة دور owner إلى enum الموجود (إذا لم يكن موجوداً)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role_type' AND e.enumlabel = 'owner') THEN
        ALTER TYPE user_role_type ADD VALUE 'owner';
    END IF;
END $$;

-- 2. إنشاء جدول التسلسل الهرمي للأدوار في العيادات
CREATE TABLE IF NOT EXISTS public.clinic_role_hierarchy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name user_role_type NOT NULL UNIQUE,
  level integer NOT NULL, -- المستوى الهرمي (1 = أعلى)
  can_manage user_role_type[] NOT NULL DEFAULT '{}', -- الأدوار التي يمكن إدارتها
  permissions jsonb DEFAULT '{}', -- الصلاحيات المحددة لكل دور
  description text,
  description_ar text,
  created_at timestamptz DEFAULT now()
);

-- 3. إدراج البيانات الأساسية للتسلسل الهرمي
INSERT INTO public.clinic_role_hierarchy (role_name, level, can_manage, permissions, description, description_ar) VALUES
('owner', 1, ARRAY['clinic_manager', 'dentist', 'accountant', 'assistant']::user_role_type[], 
 '{"clinic_management": true, "user_management": true, "financial_management": true, "medical_management": true, "settings_management": true, "reports_access": true}',
 'Clinic Owner', 'مالك العيادة'),

('clinic_manager', 2, ARRAY['dentist', 'accountant', 'assistant']::user_role_type[],
 '{"clinic_management": true, "user_management": "limited", "financial_management": true, "medical_management": true, "settings_management": "limited", "reports_access": true}',
 'Clinic Manager', 'مدير العيادة'),

('dentist', 3, ARRAY['assistant']::user_role_type[],
 '{"medical_management": true, "patient_management": true, "appointment_management": true, "treatment_management": true, "prescription_management": true}',
 'Dentist', 'طبيب أسنان'),

('accountant', 3, ARRAY['assistant']::user_role_type[],
 '{"financial_management": true, "invoice_management": true, "payment_management": true, "inventory_management": true, "reports_access": "financial"}',
 'Accountant', 'محاسب'),

('assistant', 4, ARRAY[]::user_role_type[],
 '{"data_entry": true, "appointment_scheduling": true, "basic_patient_info": true}',
 'Assistant', 'مساعد')
ON CONFLICT (role_name) DO UPDATE SET
  level = EXCLUDED.level,
  can_manage = EXCLUDED.can_manage,
  permissions = EXCLUDED.permissions,
  description = EXCLUDED.description,
  description_ar = EXCLUDED.description_ar;

-- 4. إضافة عمود لتتبع دور المستخدم الحالي في العيادة (إذا لم يكن موجوداً)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'current_clinic_role') THEN
        ALTER TABLE public.profiles ADD COLUMN current_clinic_role user_role_type DEFAULT 'assistant';
    END IF;
END $$;

-- 5. دالة للتحقق من صلاحيات إدارة الأدوار
CREATE OR REPLACE FUNCTION public.can_manage_role(
  manager_role user_role_type,
  target_role user_role_type
) RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN target_role = ANY(
    SELECT unnest(can_manage) 
    FROM public.clinic_role_hierarchy 
    WHERE role_name = manager_role
  );
END;
$$;

-- 6. دالة للحصول على دور المستخدم في العيادة
CREATE OR REPLACE FUNCTION public.get_user_clinic_role(user_id_param uuid DEFAULT auth.uid())
RETURNS user_role_type
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    cm.role,
    p.current_clinic_role,
    'assistant'::user_role_type
  )
  FROM public.profiles p
  LEFT JOIN public.clinic_memberships cm ON cm.user_id = user_id_param 
    AND cm.clinic_id = p.clinic_id 
    AND cm.is_active = true
  WHERE p.user_id = user_id_param
  LIMIT 1;
$$;

-- 7. دالة للتحقق من صلاحيات العيادة
CREATE OR REPLACE FUNCTION public.has_clinic_permission(
  permission_key text,
  user_id_param uuid DEFAULT auth.uid()
) RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role user_role_type;
  role_permissions jsonb;
BEGIN
  -- الحصول على دور المستخدم
  SELECT public.get_user_clinic_role(user_id_param) INTO user_role;
  
  -- الحصول على صلاحيات الدور
  SELECT permissions INTO role_permissions
  FROM public.clinic_role_hierarchy
  WHERE role_name = user_role;
  
  -- التحقق من الصلاحية
  RETURN COALESCE(
    (role_permissions ->> permission_key)::boolean,
    (role_permissions ->> permission_key) = 'true',
    false
  );
END;
$$;

-- 8. تحديث RLS policies لضمان الفصل بين العيادات
-- تحديث policy في clinic_memberships لضمان عدم رؤية أعضاء العيادات الأخرى
DROP POLICY IF EXISTS "Users can view their memberships" ON public.clinic_memberships;
CREATE POLICY "Users can view clinic memberships" ON public.clinic_memberships
FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    UNION
    SELECT clinic_id FROM public.clinic_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 9. إضافة policy لإدارة أعضاء العيادة حسب التسلسل الهرمي
CREATE POLICY "Users can manage clinic members based on hierarchy" ON public.clinic_memberships
FOR ALL USING (
  clinic_id IN (
    SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    UNION
    SELECT clinic_id FROM public.clinic_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
  AND (
    -- المالك يستطيع إدارة الجميع
    public.get_user_clinic_role() = 'owner'
    OR
    -- التحقق من التسلسل الهرمي للأدوار الأخرى
    public.can_manage_role(public.get_user_clinic_role(), role)
  )
);

-- 10. إضافة RLS على جدول clinic_role_hierarchy
ALTER TABLE public.clinic_role_hierarchy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view role hierarchy" ON public.clinic_role_hierarchy
FOR SELECT USING (true);

-- 11. إضافة constraint لضمان وجود مالك واحد على الأقل لكل عيادة
-- (سيتم تنفيذه عبر منطق التطبيق لتجنب تعقيدات المعاملات)

-- 12. إضافة أفضل ممارسات الأمان
-- منع حذف آخر مالك في العيادة
CREATE OR REPLACE FUNCTION public.prevent_last_owner_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  owner_count integer;
BEGIN
  -- فقط في حالة الحذف أو إلغاء التفعيل لمالك
  IF (TG_OP = 'DELETE' AND OLD.role = 'owner') OR 
     (TG_OP = 'UPDATE' AND OLD.role = 'owner' AND (NEW.role != 'owner' OR NEW.is_active = false)) THEN
    
    -- عد عدد المالكين النشطين المتبقين
    SELECT COUNT(*) INTO owner_count
    FROM public.clinic_memberships
    WHERE clinic_id = COALESCE(OLD.clinic_id, NEW.clinic_id)
      AND role = 'owner'
      AND is_active = true
      AND id != OLD.id;
    
    -- منع الحذف إذا كان آخر مالك
    IF owner_count = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last owner of the clinic';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- تطبيق trigger لمنع حذف آخر مالك
DROP TRIGGER IF EXISTS prevent_last_owner_deletion_trigger ON public.clinic_memberships;
CREATE TRIGGER prevent_last_owner_deletion_trigger
  BEFORE UPDATE OR DELETE ON public.clinic_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_last_owner_deletion();