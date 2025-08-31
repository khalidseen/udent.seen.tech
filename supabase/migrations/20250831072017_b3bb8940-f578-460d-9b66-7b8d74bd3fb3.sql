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

-- Update profiles to reference clinics table
ALTER TABLE public.profiles ADD COLUMN clinic_id UUID REFERENCES public.clinics(id);

-- Create updated roles enum with hierarchy
CREATE TYPE public.user_role_type AS ENUM (
  'super_admin',
  'clinic_manager', 
  'dentist',
  'assistant',
  'accountant'
);

-- Update profiles role column
ALTER TABLE public.profiles ALTER COLUMN role TYPE user_role_type USING role::user_role_type;

-- Create clinic memberships table for users who can access multiple clinics
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

-- Add updated permissions for multi-clinic system
INSERT INTO public.permissions (permission_key, permission_name, permission_name_ar, category) VALUES
('system.manage_all_clinics', 'Manage All Clinics', 'إدارة جميع العيادات', 'system'),
('clinic.create', 'Create Clinic', 'إنشاء عيادة', 'clinic'),
('clinic.manage', 'Manage Clinic', 'إدارة العيادة', 'clinic'),
('clinic.view_all', 'View All Clinics', 'عرض جميع العيادات', 'clinic'),
('users.manage_clinic_users', 'Manage Clinic Users', 'إدارة مستخدمي العيادة', 'users'),
('reports.view_system_wide', 'View System-wide Reports', 'عرض التقارير الشاملة', 'reports');

-- Create updated user roles
INSERT INTO public.user_roles (role_name, role_name_ar, description, is_system_role, is_active) VALUES
('super_admin', 'مدير النظام', 'Full system access across all clinics', true, true),
('clinic_manager', 'مدير العيادة', 'Full access within assigned clinic', false, true),
('dentist', 'طبيب أسنان', 'Access to patients and treatments', false, true),
('assistant', 'مساعد طبيب', 'Limited access to assist doctors', false, true),
('accountant', 'محاسب', 'Access to financial data and reports', false, true);

-- Get the role IDs for permission assignments
DO $$
DECLARE
  super_admin_id UUID;
  clinic_manager_id UUID;
  dentist_id UUID;
  assistant_id UUID;
  accountant_id UUID;
BEGIN
  SELECT id INTO super_admin_id FROM public.user_roles WHERE role_name = 'super_admin';
  SELECT id INTO clinic_manager_id FROM public.user_roles WHERE role_name = 'clinic_manager';
  SELECT id INTO dentist_id FROM public.user_roles WHERE role_name = 'dentist';
  SELECT id INTO assistant_id FROM public.user_roles WHERE role_name = 'assistant';
  SELECT id INTO accountant_id FROM public.user_roles WHERE role_name = 'accountant';

  -- Assign permissions to super_admin (all permissions)
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT super_admin_id, id FROM public.permissions WHERE is_active = true;

  -- Assign permissions to clinic_manager (clinic-level permissions)
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT clinic_manager_id, id FROM public.permissions 
  WHERE permission_key IN (
    'patients.create', 'patients.view', 'patients.update', 'patients.delete',
    'appointments.create', 'appointments.view', 'appointments.update', 'appointments.delete',
    'treatments.create', 'treatments.view', 'treatments.update', 'treatments.delete',
    'invoices.create', 'invoices.view', 'invoices.update', 'invoices.delete',
    'users.manage_clinic_users', 'clinic.manage',
    'reports.view', 'inventory.manage'
  );

  -- Assign permissions to dentist
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT dentist_id, id FROM public.permissions 
  WHERE permission_key IN (
    'patients.create', 'patients.view', 'patients.update',
    'appointments.view', 'appointments.update',
    'treatments.create', 'treatments.view', 'treatments.update',
    'medical_records.create', 'medical_records.view', 'medical_records.update'
  );

  -- Assign permissions to assistant
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT assistant_id, id FROM public.permissions 
  WHERE permission_key IN (
    'patients.view', 'patients.update',
    'appointments.view', 'appointments.create', 'appointments.update',
    'treatments.view'
  );

  -- Assign permissions to accountant
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT accountant_id, id FROM public.permissions 
  WHERE permission_key IN (
    'invoices.create', 'invoices.view', 'invoices.update',
    'payments.create', 'payments.view', 'payments.update',
    'reports.view'
  );
END $$;

-- Create updated RLS policies for clinics
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

CREATE POLICY "Clinic managers can manage memberships in their clinic" ON public.clinic_memberships
FOR ALL USING (
  clinic_id IN (
    SELECT clinic_id FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'clinic_manager')
    UNION
    SELECT clinic_id FROM public.clinic_memberships 
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'clinic_manager') AND is_active = true
  )
);

-- Update existing data: Create a default clinic for existing profiles
INSERT INTO public.clinics (name, license_number)
SELECT 'العيادة الرئيسية', 'DEFAULT-001'
WHERE NOT EXISTS (SELECT 1 FROM public.clinics LIMIT 1);

-- Update existing profiles to reference the default clinic
UPDATE public.profiles 
SET clinic_id = (SELECT id FROM public.clinics LIMIT 1)
WHERE clinic_id IS NULL;

-- Make clinic_id required after data migration
ALTER TABLE public.profiles ALTER COLUMN clinic_id SET NOT NULL;

-- Create function to get user's current clinic context
CREATE OR REPLACE FUNCTION public.get_user_current_clinic()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Update triggers
CREATE TRIGGER update_clinics_updated_at
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinic_memberships_updated_at
  BEFORE UPDATE ON public.clinic_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();