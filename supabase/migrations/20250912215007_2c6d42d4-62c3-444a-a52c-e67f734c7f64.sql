-- إضافة القيم الجديدة إلى enum user_role_type
ALTER TYPE public.user_role_type ADD VALUE IF NOT EXISTS 'receptionist';
ALTER TYPE public.user_role_type ADD VALUE IF NOT EXISTS 'secretary';

-- الآن يمكننا إضافة الأدوار الجديدة
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
), 'Secretary - administrative support', 'السكرتير - الدعم الإداري')
ON CONFLICT (role_name) DO NOTHING;