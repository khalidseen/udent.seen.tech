-- ============================================================
-- UDent Dental System - Seed Data
-- Run after 03_rls_policies.sql
-- Initial data for a fresh clinic installation
-- ============================================================

-- ==================== SUBSCRIPTION PLANS ====================
INSERT INTO public.subscription_plans (name, name_ar, description, price, currency, billing_cycle, max_users, max_patients, max_monthly_appointments, max_storage_gb, features, is_active) VALUES
('Basic', 'أساسي', 'الخطة الأساسية للعيادات الصغيرة', 0, 'IQD', 'monthly', 5, 500, 200, 2, '{"basic_reports": true, "email_support": true}', true),
('Professional', 'احترافي', 'للعيادات المتوسطة', 50000, 'IQD', 'monthly', 15, 2000, 1000, 10, '{"advanced_reports": true, "priority_support": true, "api_access": true}', true),
('Enterprise', 'مؤسسي', 'للعيادات الكبيرة والمجمعات', 150000, 'IQD', 'monthly', 100, 10000, 5000, 50, '{"all_features": true, "dedicated_support": true, "custom_branding": true, "multi_branch": true}', true)
ON CONFLICT DO NOTHING;

-- ==================== USER ROLES ====================
INSERT INTO public.user_roles (role_name, role_name_ar, description, is_active) VALUES
('super_admin', 'مدير النظام', 'مدير النظام الرئيسي - صلاحيات كاملة', true),
('owner', 'مالك العيادة', 'مالك العيادة - تحكم كامل بالعيادة', true),
('clinic_manager', 'مدير العيادة', 'مدير العيادة - إدارة يومية', true),
('dentist', 'طبيب أسنان', 'طبيب أسنان - علاج المرضى', true),
('assistant', 'مساعد', 'مساعد طبيب - دعم العلاج', true),
('receptionist', 'موظف استقبال', 'إدارة المواعيد والاستقبال', true),
('accountant', 'محاسب', 'إدارة الفواتير والمالية', true),
('secretary', 'سكرتير', 'إدارة الملفات والمراسلات', true)
ON CONFLICT (role_name) DO NOTHING;

-- ==================== PERMISSIONS ====================
INSERT INTO public.permissions (permission_key, permission_name, permission_name_ar, category) VALUES
-- Patient permissions
('patients.view', 'View Patients', 'عرض المرضى', 'patients'),
('patients.create', 'Create Patients', 'إضافة مرضى', 'patients'),
('patients.edit', 'Edit Patients', 'تعديل المرضى', 'patients'),
('patients.delete', 'Delete Patients', 'حذف المرضى', 'patients'),
-- Appointment permissions
('appointments.view', 'View Appointments', 'عرض المواعيد', 'appointments'),
('appointments.create', 'Create Appointments', 'إنشاء مواعيد', 'appointments'),
('appointments.edit', 'Edit Appointments', 'تعديل المواعيد', 'appointments'),
('appointments.delete', 'Delete Appointments', 'حذف المواعيد', 'appointments'),
-- Financial permissions
('invoices.view', 'View Invoices', 'عرض الفواتير', 'financial'),
('invoices.create', 'Create Invoices', 'إنشاء فواتير', 'financial'),
('invoices.edit', 'Edit Invoices', 'تعديل الفواتير', 'financial'),
('payments.view', 'View Payments', 'عرض المدفوعات', 'financial'),
('payments.create', 'Create Payments', 'إنشاء مدفوعات', 'financial'),
-- Treatment permissions
('treatments.view', 'View Treatments', 'عرض العلاجات', 'treatments'),
('treatments.create', 'Create Treatments', 'إنشاء علاجات', 'treatments'),
('treatments.edit', 'Edit Treatments', 'تعديل العلاجات', 'treatments'),
-- Inventory permissions
('inventory.view', 'View Inventory', 'عرض المخزون', 'inventory'),
('inventory.manage', 'Manage Inventory', 'إدارة المخزون', 'inventory'),
-- Settings permissions
('settings.view', 'View Settings', 'عرض الإعدادات', 'settings'),
('settings.manage', 'Manage Settings', 'إدارة الإعدادات', 'settings'),
('manage_settings', 'Manage Clinic Settings', 'إدارة إعدادات العيادة', 'settings'),
-- User management
('users.view', 'View Users', 'عرض المستخدمين', 'users'),
('users.manage', 'Manage Users', 'إدارة المستخدمين', 'users'),
-- Reports
('reports.view', 'View Reports', 'عرض التقارير', 'reports'),
('reports.export', 'Export Reports', 'تصدير التقارير', 'reports')
ON CONFLICT (permission_key) DO NOTHING;

-- ==================== ROLE HIERARCHY ====================
INSERT INTO public.clinic_role_hierarchy (role_name, level, description, description_ar, permissions, can_manage) VALUES
('super_admin', 100, 'System Administrator', 'مدير النظام', 
  '{"manage_settings": true, "manage_users": true, "view_all": true, "delete_all": true}'::jsonb,
  ARRAY['owner', 'clinic_manager', 'dentist', 'assistant', 'accountant', 'receptionist', 'secretary']::user_role_type[]),
('owner', 90, 'Clinic Owner', 'مالك العيادة',
  '{"manage_settings": true, "manage_users": true, "view_all": true, "delete_all": true}'::jsonb,
  ARRAY['clinic_manager', 'dentist', 'assistant', 'accountant', 'receptionist', 'secretary']::user_role_type[]),
('clinic_manager', 80, 'Clinic Manager', 'مدير العيادة',
  '{"manage_settings": true, "manage_users": true, "view_all": true}'::jsonb,
  ARRAY['dentist', 'assistant', 'accountant', 'receptionist', 'secretary']::user_role_type[]),
('dentist', 60, 'Dentist', 'طبيب أسنان',
  '{"view_patients": true, "manage_treatments": true, "view_reports": true}'::jsonb,
  ARRAY['assistant']::user_role_type[]),
('accountant', 50, 'Accountant', 'محاسب',
  '{"view_financial": true, "manage_invoices": true, "view_reports": true}'::jsonb,
  ARRAY[]::user_role_type[]),
('receptionist', 40, 'Receptionist', 'موظف استقبال',
  '{"view_patients": true, "manage_appointments": true}'::jsonb,
  ARRAY[]::user_role_type[]),
('assistant', 30, 'Assistant', 'مساعد',
  '{"view_patients": true, "view_appointments": true}'::jsonb,
  ARRAY[]::user_role_type[]),
('secretary', 20, 'Secretary', 'سكرتير',
  '{"view_patients": true, "view_appointments": true}'::jsonb,
  ARRAY[]::user_role_type[])
ON CONFLICT DO NOTHING;

-- ==================== SAMPLE MEDICATIONS (Dental) ====================
-- These will be populated per clinic, but here are common dental medications as templates

DO $$ BEGIN RAISE NOTICE '✅ Seed data inserted successfully!'; END $$;
DO $$ BEGIN RAISE NOTICE ''; END $$;
DO $$ BEGIN RAISE NOTICE '📋 Next Steps:'; END $$;
DO $$ BEGIN RAISE NOTICE '  1. Create a user account via Supabase Auth'; END $$;
DO $$ BEGIN RAISE NOTICE '  2. Create a clinic using: SELECT create_clinic_with_owner(''My Clinic'')'; END $$;
DO $$ BEGIN RAISE NOTICE '  3. Deploy the frontend application'; END $$;
DO $$ BEGIN RAISE NOTICE '  4. Log in and start using the system!'; END $$;
