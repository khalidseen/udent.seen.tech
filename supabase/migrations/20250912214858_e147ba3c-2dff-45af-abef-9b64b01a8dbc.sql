-- المرحلة الأولى: إعادة هيكلة قاعدة البيانات لنظام الصلاحيات المتقدم

-- تحديث جدول clinic_role_hierarchy ليكون أكثر تفصيلاً
UPDATE public.clinic_role_hierarchy SET 
  permissions = jsonb_build_object(
    'patients', jsonb_build_object(
      'view', true,
      'create', true,
      'edit', true,
      'delete', true,
      'export', true
    ),
    'appointments', jsonb_build_object(
      'view', true,
      'create', true,
      'edit', true,
      'delete', true,
      'manage_schedule', true
    ),
    'medical_records', jsonb_build_object(
      'view', true,
      'create', true,
      'edit', true,
      'delete', true,
      'view_sensitive', true
    ),
    'financial', jsonb_build_object(
      'view', true,
      'create_invoice', true,
      'edit_invoice', true,
      'delete_invoice', true,
      'view_reports', true,
      'manage_payments', true
    ),
    'inventory', jsonb_build_object(
      'view', true,
      'create', true,
      'edit', true,
      'delete', true,
      'manage_orders', true
    ),
    'staff', jsonb_build_object(
      'view', true,
      'create', true,
      'edit', true,
      'delete', true,
      'manage_roles', true
    ),
    'reports', jsonb_build_object(
      'view', true,
      'generate', true,
      'export', true,
      'financial_reports', true
    ),
    'settings', jsonb_build_object(
      'view', true,
      'edit_clinic', true,
      'manage_permissions', true,
      'system_settings', true
    )
  )
WHERE role_name = 'owner';

UPDATE public.clinic_role_hierarchy SET 
  permissions = jsonb_build_object(
    'patients', jsonb_build_object(
      'view', true,
      'create', true,
      'edit', true,
      'delete', false,
      'export', true
    ),
    'appointments', jsonb_build_object(
      'view', true,
      'create', true,
      'edit', true,
      'delete', false,
      'manage_schedule', true
    ),
    'medical_records', jsonb_build_object(
      'view', true,
      'create', true,
      'edit', true,
      'delete', false,
      'view_sensitive', true
    ),
    'financial', jsonb_build_object(
      'view', true,
      'create_invoice', true,
      'edit_invoice', true,
      'delete_invoice', false,
      'view_reports', true,
      'manage_payments', true
    ),
    'inventory', jsonb_build_object(
      'view', true,
      'create', true,
      'edit', true,
      'delete', false,
      'manage_orders', true
    ),
    'staff', jsonb_build_object(
      'view', true,
      'create', false,
      'edit', true,
      'delete', false,
      'manage_roles', false
    ),
    'reports', jsonb_build_object(
      'view', true,
      'generate', true,
      'export', true,
      'financial_reports', true
    ),
    'settings', jsonb_build_object(
      'view', true,
      'edit_clinic', false,
      'manage_permissions', false,
      'system_settings', false
    )
  )
WHERE role_name = 'clinic_manager';

UPDATE public.clinic_role_hierarchy SET 
  permissions = jsonb_build_object(
    'patients', jsonb_build_object(
      'view', true,
      'create', true,
      'edit', true,
      'delete', false,
      'export', false
    ),
    'appointments', jsonb_build_object(
      'view', true,
      'create', true,
      'edit', true,
      'delete', false,
      'manage_schedule', false
    ),
    'medical_records', jsonb_build_object(
      'view', true,
      'create', true,
      'edit', true,
      'delete', false,
      'view_sensitive', true
    ),
    'financial', jsonb_build_object(
      'view', false,
      'create_invoice', false,
      'edit_invoice', false,
      'delete_invoice', false,
      'view_reports', false,
      'manage_payments', false
    ),
    'inventory', jsonb_build_object(
      'view', true,
      'create', false,
      'edit', false,
      'delete', false,
      'manage_orders', false
    ),
    'staff', jsonb_build_object(
      'view', false,
      'create', false,
      'edit', false,
      'delete', false,
      'manage_roles', false
    ),
    'reports', jsonb_build_object(
      'view', true,
      'generate', false,
      'export', false,
      'financial_reports', false
    ),
    'settings', jsonb_build_object(
      'view', false,
      'edit_clinic', false,
      'manage_permissions', false,
      'system_settings', false
    )
  )
WHERE role_name = 'dentist';

UPDATE public.clinic_role_hierarchy SET 
  permissions = jsonb_build_object(
    'patients', jsonb_build_object(
      'view', false,
      'create', false,
      'edit', false,
      'delete', false,
      'export', false
    ),
    'appointments', jsonb_build_object(
      'view', false,
      'create', false,
      'edit', false,
      'delete', false,
      'manage_schedule', false
    ),
    'medical_records', jsonb_build_object(
      'view', false,
      'create', false,
      'edit', false,
      'delete', false,
      'view_sensitive', false
    ),
    'financial', jsonb_build_object(
      'view', true,
      'create_invoice', true,
      'edit_invoice', true,
      'delete_invoice', false,
      'view_reports', true,
      'manage_payments', true
    ),
    'inventory', jsonb_build_object(
      'view', false,
      'create', false,
      'edit', false,
      'delete', false,
      'manage_orders', false
    ),
    'staff', jsonb_build_object(
      'view', false,
      'create', false,
      'edit', false,
      'delete', false,
      'manage_roles', false
    ),
    'reports', jsonb_build_object(
      'view', true,
      'generate', true,
      'export', true,
      'financial_reports', true
    ),
    'settings', jsonb_build_object(
      'view', false,
      'edit_clinic', false,
      'manage_permissions', false,
      'system_settings', false
    )
  )
WHERE role_name = 'accountant';

UPDATE public.clinic_role_hierarchy SET 
  permissions = jsonb_build_object(
    'patients', jsonb_build_object(
      'view', true,
      'create', false,
      'edit', false,
      'delete', false,
      'export', false
    ),
    'appointments', jsonb_build_object(
      'view', true,
      'create', true,
      'edit', true,
      'delete', false,
      'manage_schedule', true
    ),
    'medical_records', jsonb_build_object(
      'view', false,
      'create', false,
      'edit', false,
      'delete', false,
      'view_sensitive', false
    ),
    'financial', jsonb_build_object(
      'view', false,
      'create_invoice', false,
      'edit_invoice', false,
      'delete_invoice', false,
      'view_reports', false,
      'manage_payments', false
    ),
    'inventory', jsonb_build_object(
      'view', false,
      'create', false,
      'edit', false,
      'delete', false,
      'manage_orders', false
    ),
    'staff', jsonb_build_object(
      'view', false,
      'create', false,
      'edit', false,
      'delete', false,
      'manage_roles', false
    ),
    'reports', jsonb_build_object(
      'view', false,
      'generate', false,
      'export', false,
      'financial_reports', false
    ),
    'settings', jsonb_build_object(
      'view', false,
      'edit_clinic', false,
      'manage_permissions', false,
      'system_settings', false
    )
  )
WHERE role_name = 'assistant';

-- إضافة أدوار جديدة
INSERT INTO public.clinic_role_hierarchy (role_name, level, can_manage, permissions, description, description_ar) VALUES
('receptionist', 6, '{}', jsonb_build_object(
  'patients', jsonb_build_object(
    'view', true,
    'create', true,
    'edit', true,
    'delete', false,
    'export', false
  ),
  'appointments', jsonb_build_object(
    'view', true,
    'create', true,
    'edit', true,
    'delete', false,
    'manage_schedule', true
  ),
  'medical_records', jsonb_build_object(
    'view', false,
    'create', false,
    'edit', false,
    'delete', false,
    'view_sensitive', false
  ),
  'financial', jsonb_build_object(
    'view', false,
    'create_invoice', false,
    'edit_invoice', false,
    'delete_invoice', false,
    'view_reports', false,
    'manage_payments', false
  ),
  'inventory', jsonb_build_object(
    'view', false,
    'create', false,
    'edit', false,
    'delete', false,
    'manage_orders', false
  ),
  'staff', jsonb_build_object(
    'view', false,
    'create', false,
    'edit', false,
    'delete', false,
    'manage_roles', false
  ),
  'reports', jsonb_build_object(
    'view', false,
    'generate', false,
    'export', false,
    'financial_reports', false
  ),
  'settings', jsonb_build_object(
    'view', false,
    'edit_clinic', false,
    'manage_permissions', false,
    'system_settings', false
  )
), 'Receptionist - handles patient registration and appointments', 'موظف الاستقبال - يتعامل مع تسجيل المرضى والمواعيد'),

('secretary', 7, '{}', jsonb_build_object(
  'patients', jsonb_build_object(
    'view', true,
    'create', false,
    'edit', false,
    'delete', false,
    'export', false
  ),
  'appointments', jsonb_build_object(
    'view', true,
    'create', false,
    'edit', false,
    'delete', false,
    'manage_schedule', false
  ),
  'medical_records', jsonb_build_object(
    'view', false,
    'create', false,
    'edit', false,
    'delete', false,
    'view_sensitive', false
  ),
  'financial', jsonb_build_object(
    'view', false,
    'create_invoice', false,
    'edit_invoice', false,
    'delete_invoice', false,
    'view_reports', false,
    'manage_payments', false
  ),
  'inventory', jsonb_build_object(
    'view', false,
    'create', false,
    'edit', false,
    'delete', false,
    'manage_orders', false
  ),
  'staff', jsonb_build_object(
    'view', false,
    'create', false,
    'edit', false,
    'delete', false,
    'manage_roles', false
  ),
  'reports', jsonb_build_object(
    'view', false,
    'generate', false,
    'export', false,
    'financial_reports', false
  ),
  'settings', jsonb_build_object(
    'view', false,
    'edit_clinic', false,
    'manage_permissions', false,
    'system_settings', false
  )
), 'Secretary - administrative support', 'السكرتير - الدعم الإداري');

-- تحديث can_manage للأدوار الموجودة
UPDATE public.clinic_role_hierarchy SET can_manage = '{clinic_manager,dentist,accountant,assistant,receptionist,secretary}' WHERE role_name = 'owner';
UPDATE public.clinic_role_hierarchy SET can_manage = '{dentist,accountant,assistant,receptionist,secretary}' WHERE role_name = 'clinic_manager';
UPDATE public.clinic_role_hierarchy SET can_manage = '{assistant}' WHERE role_name = 'dentist';
UPDATE public.clinic_role_hierarchy SET can_manage = '{}' WHERE role_name = 'accountant';
UPDATE public.clinic_role_hierarchy SET can_manage = '{}' WHERE role_name = 'assistant';
UPDATE public.clinic_role_hierarchy SET can_manage = '{}' WHERE role_name = 'receptionist';
UPDATE public.clinic_role_hierarchy SET can_manage = '{}' WHERE role_name = 'secretary';

-- إنشاء جدول صلاحيات مخصصة لكل عيادة
CREATE TABLE IF NOT EXISTS public.clinic_specific_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  user_id UUID NOT NULL,
  permission_category TEXT NOT NULL,
  permission_key TEXT NOT NULL,
  is_granted BOOLEAN NOT NULL DEFAULT false,
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(clinic_id, user_id, permission_category, permission_key)
);

-- تفعيل RLS للجدول الجديد
ALTER TABLE public.clinic_specific_permissions ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لصلاحيات العيادة المخصصة
CREATE POLICY "Users can view their clinic specific permissions"
ON public.clinic_specific_permissions
FOR SELECT
USING (
  clinic_id = (SELECT clinic_id FROM profiles WHERE user_id = auth.uid())
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Clinic owners can manage specific permissions"
ON public.clinic_specific_permissions
FOR ALL
USING (
  clinic_id = (SELECT clinic_id FROM profiles WHERE user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM clinic_memberships cm
    WHERE cm.user_id = auth.uid() 
    AND cm.clinic_id = clinic_specific_permissions.clinic_id
    AND cm.role IN ('owner', 'clinic_manager')
    AND cm.is_active = true
  )
);

-- إنشاء جدول ميزات خطط الاشتراك
CREATE TABLE IF NOT EXISTS public.subscription_plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL,
  feature_key TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  feature_name_ar TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  feature_limit INTEGER,
  feature_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(plan_id, feature_key)
);

-- تفعيل RLS للجدول الجديد
ALTER TABLE public.subscription_plan_features ENABLE ROW LEVEL SECURITY;

-- سياسة RLS لميزات خطط الاشتراك
CREATE POLICY "Everyone can view subscription plan features"
ON public.subscription_plan_features
FOR SELECT
USING (true);

CREATE POLICY "Super admins can manage subscription plan features"
ON public.subscription_plan_features
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- إنشاء جدول استخدام العيادات
CREATE TABLE IF NOT EXISTS public.clinic_subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  metric_type TEXT NOT NULL,
  current_count INTEGER NOT NULL DEFAULT 0,
  max_count INTEGER NOT NULL,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(clinic_id, metric_type)
);

-- تفعيل RLS للجدول الجديد
ALTER TABLE public.clinic_subscription_usage ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لاستخدام العيادات
CREATE POLICY "Users can view their clinic usage"
ON public.clinic_subscription_usage
FOR SELECT
USING (
  clinic_id = (SELECT clinic_id FROM profiles WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "System can update clinic usage"
ON public.clinic_subscription_usage
FOR ALL
USING (true);

-- دالة لفحص الصلاحيات المخصصة للعيادة
CREATE OR REPLACE FUNCTION public.has_clinic_specific_permission(
  permission_category_param TEXT,
  permission_key_param TEXT,
  user_id_param UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clinic_id_val UUID;
BEGIN
  -- الحصول على معرف العيادة
  SELECT clinic_id INTO clinic_id_val
  FROM profiles
  WHERE user_id = user_id_param;
  
  -- التحقق من الصلاحيات المخصصة
  RETURN EXISTS (
    SELECT 1
    FROM clinic_specific_permissions csp
    WHERE csp.clinic_id = clinic_id_val
    AND csp.user_id = user_id_param
    AND csp.permission_category = permission_category_param
    AND csp.permission_key = permission_key_param
    AND csp.is_granted = true
    AND csp.is_active = true
    AND (csp.expires_at IS NULL OR csp.expires_at > now())
  );
END;
$$;

-- دالة محسنة للتحقق من صلاحيات العيادة
CREATE OR REPLACE FUNCTION public.has_enhanced_clinic_permission(
  permission_category_param TEXT,
  permission_key_param TEXT,
  user_id_param UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role user_role_type;
  role_permissions jsonb;
  clinic_id_val UUID;
BEGIN
  -- التحقق من صلاحيات مدير النظام
  IF EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = user_id_param AND p.role = 'admin'
  ) THEN
    RETURN true;
  END IF;
  
  -- الحصول على دور المستخدم ومعرف العيادة
  SELECT p.clinic_id, public.get_user_clinic_role(user_id_param)
  INTO clinic_id_val, user_role
  FROM profiles p
  WHERE p.user_id = user_id_param;
  
  -- التحقق من الصلاحيات المخصصة أولاً
  IF has_clinic_specific_permission(permission_category_param, permission_key_param, user_id_param) THEN
    RETURN true;
  END IF;
  
  -- الحصول على صلاحيات الدور
  SELECT permissions INTO role_permissions
  FROM public.clinic_role_hierarchy
  WHERE role_name = user_role;
  
  -- التحقق من الصلاحية
  RETURN COALESCE(
    (role_permissions -> permission_category_param ->> permission_key_param)::boolean,
    false
  );
END;
$$;

-- دالة لتحديث استخدام العيادة
CREATE OR REPLACE FUNCTION public.update_clinic_usage(
  clinic_id_param UUID,
  metric_type_param TEXT,
  increment_amount INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_usage INTEGER;
  max_allowed INTEGER;
BEGIN
  -- الحصول على الاستخدام الحالي والحد الأقصى
  SELECT current_count, max_count
  INTO current_usage, max_allowed
  FROM clinic_subscription_usage
  WHERE clinic_id = clinic_id_param AND metric_type = metric_type_param;
  
  -- التحقق من وجود السجل
  IF NOT FOUND THEN
    -- إنشاء سجل جديد
    INSERT INTO clinic_subscription_usage (clinic_id, metric_type, current_count, max_count)
    SELECT clinic_id_param, metric_type_param, increment_amount, 
           CASE metric_type_param
             WHEN 'users' THEN COALESCE(sp.max_users, 999999)
             WHEN 'patients' THEN COALESCE(sp.max_patients, 999999)
             WHEN 'appointments' THEN COALESCE(sp.max_monthly_appointments, 999999)
             WHEN 'storage' THEN COALESCE(sp.max_storage_gb, 999999)
             ELSE 999999
           END
    FROM clinics c
    LEFT JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
    WHERE c.id = clinic_id_param;
    
    RETURN true;
  END IF;
  
  -- التحقق من عدم تجاوز الحد الأقصى
  IF current_usage + increment_amount > max_allowed THEN
    RETURN false;
  END IF;
  
  -- تحديث الاستخدام
  UPDATE clinic_subscription_usage
  SET current_count = current_count + increment_amount,
      updated_at = now()
  WHERE clinic_id = clinic_id_param AND metric_type = metric_type_param;
  
  RETURN true;
END;
$$;

-- إضافة بيانات أولية لميزات خطط الاشتراك
INSERT INTO public.subscription_plan_features (plan_id, feature_key, feature_name, feature_name_ar, is_enabled, feature_limit)
SELECT sp.id, 'multi_location', 'Multi-location Support', 'دعم المواقع المتعددة', 
       CASE WHEN sp.name = 'Premium' THEN true ELSE false END, 
       CASE WHEN sp.name = 'Premium' THEN 10 ELSE 1 END
FROM subscription_plans sp
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plan_features spf 
  WHERE spf.plan_id = sp.id AND spf.feature_key = 'multi_location'
);

INSERT INTO public.subscription_plan_features (plan_id, feature_key, feature_name, feature_name_ar, is_enabled, feature_limit)
SELECT sp.id, 'advanced_reports', 'Advanced Reporting', 'التقارير المتقدمة', 
       CASE WHEN sp.name IN ('Professional', 'Premium') THEN true ELSE false END, 
       NULL
FROM subscription_plans sp
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plan_features spf 
  WHERE spf.plan_id = sp.id AND spf.feature_key = 'advanced_reports'
);

INSERT INTO public.subscription_plan_features (plan_id, feature_key, feature_name, feature_name_ar, is_enabled, feature_limit)
SELECT sp.id, 'ai_analysis', 'AI Medical Analysis', 'التحليل الطبي بالذكاء الاصطناعي', 
       CASE WHEN sp.name = 'Premium' THEN true ELSE false END, 
       CASE WHEN sp.name = 'Premium' THEN 1000 ELSE 0 END
FROM subscription_plans sp
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plan_features spf 
  WHERE spf.plan_id = sp.id AND spf.feature_key = 'ai_analysis'
);

-- إضافة triggers لتحديث updated_at
CREATE OR REPLACE TRIGGER update_clinic_specific_permissions_updated_at
BEFORE UPDATE ON public.clinic_specific_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_clinic_subscription_usage_updated_at
BEFORE UPDATE ON public.clinic_subscription_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();