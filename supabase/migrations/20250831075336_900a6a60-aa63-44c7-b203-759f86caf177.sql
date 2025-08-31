-- Create clinics table
CREATE TABLE IF NOT EXISTS public.clinics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  license_number TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Saudi Arabia',
  logo_url TEXT,
  subscription_plan TEXT DEFAULT 'basic',
  subscription_status TEXT DEFAULT 'active',
  max_users INTEGER DEFAULT 10,
  max_patients INTEGER DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS on clinics
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- Create new enum type for roles
DO $$ BEGIN
    CREATE TYPE public.user_role_type AS ENUM (
      'super_admin',
      'clinic_manager', 
      'dentist',
      'assistant',
      'accountant'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create clinic memberships table for multi-clinic access
CREATE TABLE IF NOT EXISTS public.clinic_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  role user_role_type NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, clinic_id)
);

-- Enable RLS on clinic_memberships
ALTER TABLE public.clinic_memberships ENABLE ROW LEVEL SECURITY;

-- Add clinic_id to profiles if not exists
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN clinic_id UUID REFERENCES public.clinics(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create default clinic if no clinics exist
INSERT INTO public.clinics (name, license_number, phone, email)
SELECT 'العيادة الرئيسية', 'DEFAULT-001', '+966123456789', 'admin@clinic.com'
WHERE NOT EXISTS (SELECT 1 FROM public.clinics LIMIT 1);

-- Update existing profiles to reference the default clinic (only if they don't have one)
UPDATE public.profiles 
SET clinic_id = (SELECT id FROM public.clinics ORDER BY created_at LIMIT 1)
WHERE clinic_id IS NULL;

-- Add new permissions for multi-clinic system
INSERT INTO public.permissions (permission_key, permission_name, permission_name_ar, category) VALUES
('system.manage_all_clinics', 'Manage All Clinics', 'إدارة جميع العيادات', 'system'),
('clinic.create', 'Create Clinic', 'إنشاء عيادة', 'clinic'),
('clinic.manage', 'Manage Clinic', 'إدارة العيادة', 'clinic'),
('clinic.view_all', 'View All Clinics', 'عرض جميع العيادات', 'clinic'),
('users.manage_clinic_users', 'Manage Clinic Users', 'إدارة مستخدمي العيادة', 'users'),
('reports.view_system_wide', 'View System-wide Reports', 'عرض التقارير الشاملة', 'reports')
ON CONFLICT (permission_key) DO NOTHING;

-- Create/update user roles for the new system
INSERT INTO public.user_roles (role_name, role_name_ar, description, is_system_role, is_active) VALUES
('super_admin', 'مدير النظام', 'Full system access across all clinics', true, true),
('clinic_manager', 'مدير العيادة', 'Full access within assigned clinic', false, true),
('dentist', 'طبيب أسنان', 'Access to patients and treatments', false, true),
('assistant', 'مساعد طبيب', 'Limited access to assist doctors', false, true),
('accountant', 'محاسب', 'Access to financial data and reports', false, true)
ON CONFLICT (role_name) DO UPDATE SET
  role_name_ar = EXCLUDED.role_name_ar,
  description = EXCLUDED.description;

-- Create RLS policies for clinics
DROP POLICY IF EXISTS "Super admins can manage all clinics" ON public.clinics;
CREATE POLICY "Super admins can manage all clinics" ON public.clinics
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Users can view their clinic" ON public.clinics;
CREATE POLICY "Users can view their clinic" ON public.clinics
FOR SELECT USING (
  id IN (
    SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    UNION
    SELECT clinic_id FROM public.clinic_memberships WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Create RLS policies for clinic_memberships
DROP POLICY IF EXISTS "Users can view their memberships" ON public.clinic_memberships;
CREATE POLICY "Users can view their memberships" ON public.clinic_memberships
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage memberships" ON public.clinic_memberships;
CREATE POLICY "Admins can manage memberships" ON public.clinic_memberships
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create function to get user's current clinic context
CREATE OR REPLACE FUNCTION public.get_user_current_clinic()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Add triggers
DROP TRIGGER IF EXISTS update_clinics_updated_at ON public.clinics;
CREATE TRIGGER update_clinics_updated_at
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();