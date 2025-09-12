-- Create advanced permissions system infrastructure

-- Create user_roles table for advanced roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_name TEXT NOT NULL UNIQUE,
  role_name_ar TEXT NOT NULL,
  description TEXT,
  is_system_role BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create permissions table for detailed permissions
CREATE TABLE public.permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  permission_key TEXT NOT NULL UNIQUE,
  permission_name TEXT NOT NULL,
  permission_name_ar TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES public.user_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id),
  UNIQUE(role_id, permission_id)
);

-- Create user_role_assignments for additional user roles
CREATE TABLE public.user_role_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.user_roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, role_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Insert initial roles
INSERT INTO public.user_roles (role_name, role_name_ar, description, is_system_role) VALUES
('super_admin', 'مدير النظام الرئيسي', 'Full system access with all permissions', true),
('clinic_owner', 'مالك العيادة', 'Clinic owner with administrative privileges', true),
('doctor', 'طبيب', 'Doctor with medical and patient management access', true),
('secretary', 'سكرتير', 'Administrative staff with limited access', false),
('assistant', 'مساعد', 'Assistant with basic operational access', false),
('viewer', 'مشاهد', 'Read-only access to allowed sections', false);

-- Insert detailed permissions by category
INSERT INTO public.permissions (permission_key, permission_name, permission_name_ar, description, category) VALUES
-- Dashboard permissions
('dashboard.view', 'View Dashboard', 'عرض لوحة التحكم', 'Access to main dashboard', 'dashboard'),
('dashboard.analytics', 'View Analytics', 'عرض التحليلات', 'Access to analytics and reports', 'dashboard'),

-- Patient permissions
('patients.view', 'View Patients', 'عرض المرضى', 'View patient list and profiles', 'patients'),
('patients.create', 'Add Patients', 'إضافة مرضى', 'Create new patient records', 'patients'),
('patients.edit', 'Edit Patients', 'تعديل المرضى', 'Edit patient information', 'patients'),
('patients.delete', 'Delete Patients', 'حذف المرضى', 'Delete patient records', 'patients'),
('patients.financial', 'Manage Patient Finances', 'إدارة المالية للمرضى', 'View and manage patient financial status', 'patients'),

-- Appointments permissions
('appointments.view', 'View Appointments', 'عرض المواعيد', 'View appointment calendar and list', 'appointments'),
('appointments.create', 'Create Appointments', 'إنشاء المواعيد', 'Schedule new appointments', 'appointments'),
('appointments.edit', 'Edit Appointments', 'تعديل المواعيد', 'Modify existing appointments', 'appointments'),
('appointments.delete', 'Delete Appointments', 'حذف المواعيد', 'Cancel appointments', 'appointments'),
('appointments.requests', 'Manage Appointment Requests', 'إدارة طلبات المواعيد', 'Handle public appointment requests', 'appointments'),

-- Medical Records permissions
('medical_records.view', 'View Medical Records', 'عرض السجلات الطبية', 'Access patient medical records', 'medical'),
('medical_records.create', 'Create Medical Records', 'إنشاء السجلات الطبية', 'Add new medical records', 'medical'),
('medical_records.edit', 'Edit Medical Records', 'تعديل السجلات الطبية', 'Modify medical records', 'medical'),
('medical_records.delete', 'Delete Medical Records', 'حذف السجلات الطبية', 'Remove medical records', 'medical'),

-- Prescriptions permissions
('prescriptions.view', 'View Prescriptions', 'عرض الوصفات', 'View prescription records', 'medical'),
('prescriptions.create', 'Create Prescriptions', 'إنشاء الوصفات', 'Write new prescriptions', 'medical'),
('prescriptions.edit', 'Edit Prescriptions', 'تعديل الوصفات', 'Modify prescriptions', 'medical'),

-- Dental Treatment permissions
('dental.view', 'View Dental Treatments', 'عرض العلاجات السنية', 'Access dental treatment records', 'dental'),
('dental.create', 'Create Dental Treatments', 'إنشاء العلاجات السنية', 'Add dental treatment plans', 'dental'),
('dental.edit', 'Edit Dental Treatments', 'تعديل العلاجات السنية', 'Modify dental treatments', 'dental'),

-- Inventory permissions
('inventory.view', 'View Inventory', 'عرض المخزون', 'Access medical supplies inventory', 'inventory'),
('inventory.create', 'Add Supplies', 'إضافة المستلزمات', 'Add new medical supplies', 'inventory'),
('inventory.edit', 'Edit Supplies', 'تعديل المستلزمات', 'Modify supply information', 'inventory'),
('inventory.delete', 'Delete Supplies', 'حذف المستلزمات', 'Remove supplies from inventory', 'inventory'),
('inventory.orders', 'Manage Purchase Orders', 'إدارة أوامر الشراء', 'Create and manage purchase orders', 'inventory'),

-- Financial permissions
('invoices.view', 'View Invoices', 'عرض الفواتير', 'Access invoice records', 'financial'),
('invoices.create', 'Create Invoices', 'إنشاء الفواتير', 'Generate new invoices', 'financial'),
('invoices.edit', 'Edit Invoices', 'تعديل الفواتير', 'Modify invoice details', 'financial'),
('payments.view', 'View Payments', 'عرض المدفوعات', 'Access payment records', 'financial'),
('payments.create', 'Record Payments', 'تسجيل المدفوعات', 'Record new payments', 'financial'),

-- Staff Management permissions
('doctors.view', 'View Doctors', 'عرض الأطباء', 'Access doctor profiles', 'staff'),
('doctors.create', 'Add Doctors', 'إضافة أطباء', 'Add new doctors', 'staff'),
('doctors.edit', 'Edit Doctors', 'تعديل الأطباء', 'Modify doctor information', 'staff'),
('doctors.delete', 'Delete Doctors', 'حذف الأطباء', 'Remove doctors', 'staff'),
('assistants.view', 'View Assistants', 'عرض المساعدين', 'Access assistant profiles', 'staff'),
('assistants.manage', 'Manage Assistants', 'إدارة المساعدين', 'Add, edit, delete assistants', 'staff'),

-- AI & Analytics permissions
('ai.diagnosis', 'AI Diagnosis', 'التشخيص بالذكاء الاصطناعي', 'Use AI diagnostic features', 'ai'),
('ai.analysis', 'AI Analysis', 'التحليل بالذكاء الاصطناعي', 'Access AI analysis tools', 'ai'),
('reports.view', 'View Reports', 'عرض التقارير', 'Access clinic reports', 'reports'),
('reports.advanced', 'Advanced Reports', 'التقارير المتقدمة', 'Access advanced analytics', 'reports'),

-- Settings & Administration permissions
('settings.general', 'General Settings', 'الإعدادات العامة', 'Modify general clinic settings', 'settings'),
('settings.users', 'User Management', 'إدارة المستخدمين', 'Manage user accounts and roles', 'settings'),
('settings.permissions', 'Permission Management', 'إدارة الصلاحيات', 'Manage roles and permissions', 'settings'),
('notifications.manage', 'Manage Notifications', 'إدارة الإشعارات', 'Configure notifications and templates', 'notifications');

-- Assign permissions to roles
-- Super Admin gets all permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT ur.id, p.id 
FROM public.user_roles ur, public.permissions p 
WHERE ur.role_name = 'super_admin';

-- Clinic Owner gets most permissions except some system-level ones
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT ur.id, p.id 
FROM public.user_roles ur, public.permissions p 
WHERE ur.role_name = 'clinic_owner' 
AND p.permission_key NOT IN ('settings.permissions');

-- Doctor gets medical and patient-related permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT ur.id, p.id 
FROM public.user_roles ur, public.permissions p 
WHERE ur.role_name = 'doctor' 
AND p.category IN ('dashboard', 'patients', 'appointments', 'medical', 'dental', 'ai', 'reports')
AND p.permission_key NOT LIKE '%.delete';

-- Secretary gets administrative permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT ur.id, p.id 
FROM public.user_roles ur, public.permissions p 
WHERE ur.role_name = 'secretary' 
AND p.category IN ('dashboard', 'patients', 'appointments', 'financial', 'notifications')
AND p.permission_key NOT LIKE '%.delete';

-- Assistant gets basic operational permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT ur.id, p.id 
FROM public.user_roles ur, public.permissions p 
WHERE ur.role_name = 'assistant' 
AND p.category IN ('dashboard', 'patients', 'appointments', 'inventory')
AND p.permission_key LIKE '%.view' OR p.permission_key LIKE '%.create';

-- Viewer gets read-only permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT ur.id, p.id 
FROM public.user_roles ur, public.permissions p 
WHERE ur.role_name = 'viewer' 
AND p.permission_key LIKE '%.view';

-- Create RLS policies for the new tables
CREATE POLICY "Super admins can manage all roles" ON public.user_roles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_role_assignments ura
    JOIN public.user_roles ur ON ura.role_id = ur.id
    WHERE ura.user_id = auth.uid() AND ur.role_name = 'super_admin' AND ura.is_active = true
  ) OR 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Users can view active roles" ON public.user_roles
FOR SELECT USING (is_active = true);

CREATE POLICY "Super admins can manage all permissions" ON public.permissions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_role_assignments ura
    JOIN public.user_roles ur ON ura.role_id = ur.id
    WHERE ura.user_id = auth.uid() AND ur.role_name = 'super_admin' AND ura.is_active = true
  ) OR 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Users can view active permissions" ON public.permissions
FOR SELECT USING (is_active = true);

CREATE POLICY "Authorized users can manage role permissions" ON public.role_permissions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_role_assignments ura
    JOIN public.user_roles ur ON ura.role_id = ur.id
    WHERE ura.user_id = auth.uid() AND ur.role_name IN ('super_admin', 'clinic_owner') AND ura.is_active = true
  ) OR 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'doctor')
  )
);

CREATE POLICY "Authorized users can manage user role assignments" ON public.user_role_assignments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_role_assignments ura
    JOIN public.user_roles ur ON ura.role_id = ur.id
    WHERE ura.user_id = auth.uid() AND ur.role_name IN ('super_admin', 'clinic_owner') AND ura.is_active = true
  ) OR 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'doctor')
  )
);

-- Create function to get user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id_param UUID DEFAULT auth.uid())
RETURNS TABLE(permission_key TEXT, permission_name TEXT, permission_name_ar TEXT, category TEXT)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Get permissions from profile role (backward compatibility)
  SELECT DISTINCT p.permission_key, p.permission_name, p.permission_name_ar, p.category
  FROM permissions p
  JOIN role_permissions rp ON p.id = rp.permission_id
  JOIN user_roles ur ON rp.role_id = ur.id
  JOIN profiles prof ON prof.user_id = user_id_param
  WHERE ur.role_name = prof.role AND ur.is_active = true AND p.is_active = true
  
  UNION
  
  -- Get permissions from additional role assignments
  SELECT DISTINCT p.permission_key, p.permission_name, p.permission_name_ar, p.category
  FROM permissions p
  JOIN role_permissions rp ON p.id = rp.permission_id
  JOIN user_roles ur ON rp.role_id = ur.id
  JOIN user_role_assignments ura ON ur.id = ura.role_id
  WHERE ura.user_id = user_id_param 
    AND ura.is_active = true 
    AND (ura.expires_at IS NULL OR ura.expires_at > now())
    AND ur.is_active = true 
    AND p.is_active = true;
$$;

-- Create function to check user permission
CREATE OR REPLACE FUNCTION public.has_permission(permission_key_param TEXT, user_id_param UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.get_user_permissions(user_id_param) 
    WHERE permission_key = permission_key_param
  );
$$;

-- Create function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(user_id_param UUID DEFAULT auth.uid())
RETURNS TABLE(role_name TEXT, role_name_ar TEXT, is_primary BOOLEAN)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Get primary role from profile
  SELECT ur.role_name, ur.role_name_ar, true as is_primary
  FROM user_roles ur
  JOIN profiles p ON p.user_id = user_id_param
  WHERE ur.role_name = p.role AND ur.is_active = true
  
  UNION
  
  -- Get additional roles from assignments
  SELECT ur.role_name, ur.role_name_ar, false as is_primary
  FROM user_roles ur
  JOIN user_role_assignments ura ON ur.id = ura.role_id
  WHERE ura.user_id = user_id_param 
    AND ura.is_active = true 
    AND (ura.expires_at IS NULL OR ura.expires_at > now())
    AND ur.is_active = true;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing users to new system based on their current profile role
INSERT INTO public.user_role_assignments (user_id, role_id, assigned_at)
SELECT p.user_id, ur.id, now()
FROM public.profiles p
JOIN public.user_roles ur ON ur.role_name = p.role
WHERE ur.is_active = true
ON CONFLICT (user_id, role_id) DO NOTHING;