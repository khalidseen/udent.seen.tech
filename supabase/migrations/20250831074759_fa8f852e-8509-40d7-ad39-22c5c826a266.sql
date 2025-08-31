-- Create clinics table
CREATE TABLE public.clinics (
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

-- Add clinic_id to profiles (nullable for now)
ALTER TABLE public.profiles ADD COLUMN clinic_id UUID REFERENCES public.clinics(id);

-- Create default clinic first
INSERT INTO public.clinics (name, license_number)
VALUES ('العيادة الرئيسية', 'DEFAULT-001');

-- Update existing profiles to reference the default clinic
UPDATE public.profiles 
SET clinic_id = (SELECT id FROM public.clinics LIMIT 1)
WHERE clinic_id IS NULL;

-- Now make clinic_id required
ALTER TABLE public.profiles ALTER COLUMN clinic_id SET NOT NULL;

-- Drop policies that depend on role column before changing its type
DROP POLICY IF EXISTS "Admins can view all applications" ON public.doctor_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.doctor_applications;
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "System admins can view audit logs" ON public.audit_log;

-- Update existing role values to match new enum values
UPDATE public.profiles SET role = 'super_admin' WHERE role = 'admin';
UPDATE public.profiles SET role = 'clinic_manager' WHERE role = 'manager';
UPDATE public.profiles SET role = 'dentist' WHERE role = 'doctor';

-- Create new enum type
CREATE TYPE public.user_role_type AS ENUM (
  'super_admin',
  'clinic_manager', 
  'dentist',
  'assistant',
  'accountant'
);

-- Remove default from role column temporarily
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;

-- Change the column type
ALTER TABLE public.profiles ALTER COLUMN role TYPE user_role_type USING role::user_role_type;

-- Set new default
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'dentist'::user_role_type;

-- Recreate the dropped policies with updated role references
CREATE POLICY "Admins can view all applications" ON public.doctor_applications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Admins can update applications" ON public.doctor_applications
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Admins view all profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p2
    WHERE p2.user_id = auth.uid() AND p2.role = 'super_admin'
  )
);

CREATE POLICY "System admins can view audit logs" ON public.audit_log
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Create clinic memberships table
CREATE TABLE public.clinic_memberships (
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

-- Add new permissions for multi-clinic system
INSERT INTO public.permissions (permission_key, permission_name, permission_name_ar, category) VALUES
('system.manage_all_clinics', 'Manage All Clinics', 'إدارة جميع العيادات', 'system'),
('clinic.create', 'Create Clinic', 'إنشاء عيادة', 'clinic'),
('clinic.manage', 'Manage Clinic', 'إدارة العيادة', 'clinic'),
('clinic.view_all', 'View All Clinics', 'عرض جميع العيادات', 'clinic'),
('users.manage_clinic_users', 'Manage Clinic Users', 'إدارة مستخدمي العيادة', 'users'),
('reports.view_system_wide', 'View System-wide Reports', 'عرض التقارير الشاملة', 'reports')
ON CONFLICT (permission_key) DO NOTHING;

-- Create/update user roles
INSERT INTO public.user_roles (role_name, role_name_ar, description, is_system_role, is_active) VALUES
('super_admin', 'مدير النظام', 'Full system access across all clinics', true, true),
('clinic_manager', 'مدير العيادة', 'Full access within assigned clinic', false, true),
('dentist', 'طبيب أسنان', 'Access to patients and treatments', false, true),
('assistant', 'مساعد طبيب', 'Limited access to assist doctors', false, true),
('accountant', 'محاسب', 'Access to financial data and reports', false, true)
ON CONFLICT (role_name) DO UPDATE SET
  role_name_ar = EXCLUDED.role_name_ar,
  description = EXCLUDED.description,
  is_system_role = EXCLUDED.is_system_role,
  is_active = EXCLUDED.is_active;

-- Create RLS policies for clinics
CREATE POLICY "Super admins can manage all clinics" ON public.clinics
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Users can view their clinic" ON public.clinics
FOR SELECT USING (
  id IN (
    SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    UNION
    SELECT clinic_id FROM public.clinic_memberships WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Create RLS policies for clinic_memberships
CREATE POLICY "Users can view their memberships" ON public.clinic_memberships
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Clinic managers can manage memberships" ON public.clinic_memberships
FOR ALL USING (
  clinic_id IN (
    SELECT clinic_id FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'clinic_manager')
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
CREATE TRIGGER update_clinics_updated_at
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();