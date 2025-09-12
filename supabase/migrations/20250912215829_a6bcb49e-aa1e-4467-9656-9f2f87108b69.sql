-- إكمال المرحلة الأولى: إضافة الجداول والدوال الجديدة

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

-- إضافة triggers لتحديث updated_at
CREATE OR REPLACE TRIGGER update_clinic_specific_permissions_updated_at
BEFORE UPDATE ON public.clinic_specific_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_clinic_subscription_usage_updated_at
BEFORE UPDATE ON public.clinic_subscription_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();