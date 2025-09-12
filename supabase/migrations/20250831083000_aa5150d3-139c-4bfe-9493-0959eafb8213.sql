-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SAR',
  duration_months INTEGER NOT NULL DEFAULT 1,
  max_users INTEGER NOT NULL DEFAULT 5,
  max_patients INTEGER NOT NULL DEFAULT 500,
  max_monthly_appointments INTEGER NOT NULL DEFAULT 1000,
  max_storage_gb INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_customizable BOOLEAN NOT NULL DEFAULT false,
  is_trial BOOLEAN NOT NULL DEFAULT false,
  trial_duration_days INTEGER DEFAULT 30,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscription features table
CREATE TABLE public.subscription_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key TEXT NOT NULL UNIQUE,
  feature_name TEXT NOT NULL,
  feature_name_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plan features junction table
CREATE TABLE public.plan_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  custom_limit INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_id, feature_key)
);

-- Create plan permissions table
CREATE TABLE public.plan_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_id, permission_key)
);

-- Create usage tracking table
CREATE TABLE public.usage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'users', 'patients', 'appointments', 'storage'
  current_count INTEGER NOT NULL DEFAULT 0,
  max_count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, metric_type)
);

-- Update clinics table with subscription fields
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES public.subscription_plans(id);
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS custom_plan_config JSONB DEFAULT '{}';
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS usage_metrics JSONB DEFAULT '{}';
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS subscription_notes TEXT;

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, name_ar, description, description_ar, price, max_users, max_patients, max_monthly_appointments, max_storage_gb, display_order) VALUES
('Basic', 'الأساسية', 'Essential features for small clinics', 'الميزات الأساسية للعيادات الصغيرة', 299, 5, 500, 1000, 10, 1),
('Professional', 'الاحترافية', 'Advanced features with AI analysis', 'ميزات متقدمة مع تحليل ذكي', 599, 15, 2000, 5000, 50, 2),
('Advanced', 'المتقدمة', 'Complete solution for large clinics', 'حل متكامل للعيادات الكبيرة', 999, 50, 10000, 20000, 200, 3),
('Custom', 'مخصصة', 'Customizable plan for enterprise', 'خطة قابلة للتخصيص للمؤسسات', 0, 100, 50000, 100000, 1000, 4);

-- Insert default features
INSERT INTO public.subscription_features (feature_key, feature_name, feature_name_ar, description, description_ar, category) VALUES
('ai_analysis', 'AI Medical Analysis', 'التحليل الطبي الذكي', 'AI-powered medical image analysis', 'تحليل الصور الطبية بالذكاء الاصطناعي', 'ai'),
('3d_dental', '3D Dental Charts', 'الرسوم البيانية الثلاثية الأبعاد', 'Interactive 3D dental visualizations', 'تصورات الأسنان التفاعلية ثلاثية الأبعاد', 'dental'),
('advanced_reports', 'Advanced Reports', 'التقارير المتقدمة', 'Comprehensive analytics and reports', 'تحليلات وتقارير شاملة', 'reports'),
('inventory_management', 'Inventory Management', 'إدارة المخزون', 'Medical supplies and inventory tracking', 'تتبع المستلزمات الطبية والمخزون', 'management'),
('multi_clinic', 'Multi-Clinic Support', 'دعم متعدد العيادات', 'Manage multiple clinic locations', 'إدارة مواقع متعددة للعيادات', 'management'),
('api_access', 'API Access', 'الوصول لواجهة البرمجة', 'Third-party integrations via API', 'التكامل مع الطرف الثالث عبر API', 'integration'),
('custom_branding', 'Custom Branding', 'العلامة التجارية المخصصة', 'Customize interface with clinic branding', 'تخصيص الواجهة بعلامة العيادة التجارية', 'customization'),
('priority_support', 'Priority Support', 'الدعم المميز', '24/7 priority customer support', 'دعم عملاء مميز على مدار الساعة', 'support');

-- Setup default plan features
INSERT INTO public.plan_features (plan_id, feature_key, is_enabled) 
SELECT p.id, f.feature_key, 
  CASE 
    WHEN p.name = 'Basic' AND f.feature_key IN ('inventory_management') THEN true
    WHEN p.name = 'Professional' AND f.feature_key IN ('ai_analysis', '3d_dental', 'advanced_reports', 'inventory_management') THEN true
    WHEN p.name = 'Advanced' AND f.feature_key NOT IN ('custom_branding', 'priority_support') THEN true
    WHEN p.name = 'Custom' THEN true
    ELSE false
  END
FROM public.subscription_plans p
CROSS JOIN public.subscription_features f
WHERE p.name IN ('Basic', 'Professional', 'Advanced', 'Custom');

-- Setup default plan permissions
INSERT INTO public.plan_permissions (plan_id, permission_key, is_enabled)
SELECT p.id, perm.permission_key, 
  CASE 
    WHEN p.name = 'Basic' AND perm.category IN ('patients', 'appointments', 'basic_reports') THEN true
    WHEN p.name = 'Professional' AND perm.category NOT IN ('system', 'super_admin') THEN true
    WHEN p.name IN ('Advanced', 'Custom') THEN true
    ELSE false
  END
FROM public.subscription_plans p
CROSS JOIN public.permissions perm
WHERE p.name IN ('Basic', 'Professional', 'Advanced', 'Custom');

-- Create function to check plan permission
CREATE OR REPLACE FUNCTION public.has_plan_permission(permission_key_param TEXT, user_id_param UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles prof
    JOIN clinics c ON prof.clinic_id = c.id
    JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
    JOIN plan_permissions pp ON sp.id = pp.plan_id
    WHERE prof.user_id = user_id_param
      AND pp.permission_key = permission_key_param
      AND pp.is_enabled = true
      AND sp.is_active = true
      AND (c.subscription_end_date IS NULL OR c.subscription_end_date > now())
  );
$$;

-- Create function to check plan feature
CREATE OR REPLACE FUNCTION public.has_plan_feature(feature_key_param TEXT, clinic_id_param UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM clinics c
    JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
    JOIN plan_features pf ON sp.id = pf.plan_id
    WHERE c.id = COALESCE(clinic_id_param, (SELECT clinic_id FROM profiles WHERE user_id = auth.uid() LIMIT 1))
      AND pf.feature_key = feature_key_param
      AND pf.is_enabled = true
      AND sp.is_active = true
      AND (c.subscription_end_date IS NULL OR c.subscription_end_date > now())
  );
$$;

-- Create function to check usage limits
CREATE OR REPLACE FUNCTION public.check_usage_limit(metric_type_param TEXT, clinic_id_param UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT ut.current_count < ut.max_count
     FROM usage_tracking ut
     WHERE ut.clinic_id = COALESCE(clinic_id_param, (SELECT clinic_id FROM profiles WHERE user_id = auth.uid() LIMIT 1))
       AND ut.metric_type = metric_type_param
     LIMIT 1),
    true
  );
$$;

-- Create function to update usage metrics
CREATE OR REPLACE FUNCTION public.update_usage_metric(clinic_id_param UUID, metric_type_param TEXT, new_count INTEGER)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  plan_limit INTEGER;
BEGIN
  -- Get the limit from the subscription plan
  SELECT 
    CASE metric_type_param
      WHEN 'users' THEN sp.max_users
      WHEN 'patients' THEN sp.max_patients
      WHEN 'appointments' THEN sp.max_monthly_appointments
      WHEN 'storage' THEN sp.max_storage_gb
      ELSE 999999
    END INTO plan_limit
  FROM clinics c
  JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
  WHERE c.id = clinic_id_param;
  
  -- Update or insert usage tracking
  INSERT INTO usage_tracking (clinic_id, metric_type, current_count, max_count)
  VALUES (clinic_id_param, metric_type_param, new_count, COALESCE(plan_limit, 999999))
  ON CONFLICT (clinic_id, metric_type)
  DO UPDATE SET 
    current_count = new_count,
    max_count = COALESCE(plan_limit, 999999),
    last_updated = now();
END;
$$;

-- Enable RLS on new tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
CREATE POLICY "Everyone can view active plans" ON public.subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Super admins can manage all plans" ON public.subscription_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for subscription_features
CREATE POLICY "Everyone can view active features" ON public.subscription_features FOR SELECT USING (is_active = true);
CREATE POLICY "Super admins can manage features" ON public.subscription_features FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for plan_features
CREATE POLICY "Everyone can view plan features" ON public.plan_features FOR SELECT USING (true);
CREATE POLICY "Super admins can manage plan features" ON public.plan_features FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for plan_permissions
CREATE POLICY "Everyone can view plan permissions" ON public.plan_permissions FOR SELECT USING (true);
CREATE POLICY "Super admins can manage plan permissions" ON public.plan_permissions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for usage_tracking
CREATE POLICY "Users can view their clinic usage" ON public.usage_tracking FOR SELECT USING (
  clinic_id = (SELECT clinic_id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
);
CREATE POLICY "Super admins can view all usage" ON public.usage_tracking FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System can manage usage tracking" ON public.usage_tracking FOR ALL USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Set default plan for existing clinics (Basic plan)
UPDATE public.clinics 
SET subscription_plan_id = (SELECT id FROM public.subscription_plans WHERE name = 'Basic' LIMIT 1),
    subscription_start_date = now(),
    subscription_end_date = now() + INTERVAL '30 days'
WHERE subscription_plan_id IS NULL;