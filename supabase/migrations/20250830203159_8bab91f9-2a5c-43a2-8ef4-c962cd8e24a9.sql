-- إعادة هيكلة نظام الأدوار والصلاحيات - المرحلة الأولى
-- Phase 1: Restructuring Roles and Permissions System

-- 1. إضافة الأدوار الوظيفية الجديدة
INSERT INTO user_roles (role_name, role_name_ar, description, is_active, is_system_role) VALUES
('clinic_manager', 'مدير العيادة', 'Daily comprehensive clinic management with administrative authority over staff and operations', true, false),
('financial_manager', 'مدير مالي', 'Specialized in financial management, billing, payments, and financial reporting', true, false),
('receptionist', 'موظف استقبال', 'Specialized in appointment management, patient reception, and customer service', true, false),
('medical_assistant', 'مساعد طبيب', 'Medical assistant with access to patient records and support for medical procedures', true, false),
('system_administrator', 'مدير نظام', 'Technical system administration, security monitoring, and system configuration', true, false);

-- 2. إضافة صلاحيات تفصيلية جديدة

-- صلاحيات إدارة الموظفين
INSERT INTO permissions (permission_key, permission_name, permission_name_ar, category, description, is_active) VALUES
('staff.create', 'Create Staff', 'إنشاء موظف', 'staff', 'Add new staff members to the clinic', true),
('staff.edit', 'Edit Staff', 'تعديل موظف', 'staff', 'Modify staff information and roles', true),
('staff.delete', 'Delete Staff', 'حذف موظف', 'staff', 'Remove staff members from the clinic', true),
('staff.view', 'View Staff', 'عرض الموظفين', 'staff', 'View staff list and information', true),
('staff.permissions', 'Manage Staff Permissions', 'إدارة صلاحيات الموظفين', 'staff', 'Assign and modify staff permissions and roles', true);

-- صلاحيات البيانات الحساسة
INSERT INTO permissions (permission_key, permission_name, permission_name_ar, category, description, is_active) VALUES
('sensitive.medical_history', 'Access Medical History', 'الوصول للتاريخ الطبي', 'sensitive', 'Full access to patient medical history and sensitive medical data', true),
('sensitive.financial_data', 'Access Financial Data', 'الوصول للبيانات المالية', 'sensitive', 'Access to financial records, payments, and billing information', true),
('sensitive.personal_data', 'Access Personal Data', 'الوصول للبيانات الشخصية', 'sensitive', 'Access to patient personal information and contact details', true),
('sensitive.export_data', 'Export Sensitive Data', 'تصدير البيانات الحساسة', 'sensitive', 'Export and download sensitive patient and financial data', true);

-- صلاحيات الطوارئ والحالات الخاصة
INSERT INTO permissions (permission_key, permission_name, permission_name_ar, category, description, is_active) VALUES
('emergency.access', 'Emergency Access', 'وصول الطوارئ', 'emergency', 'Emergency access to patient records during critical situations', true),
('emergency.override', 'Emergency Override', 'تجاوز الطوارئ', 'emergency', 'Override system restrictions during emergency situations', true),
('audit.view', 'View Audit Logs', 'عرض سجلات التدقيق', 'audit', 'Access to system audit trails and activity logs', true),
('audit.export', 'Export Audit Logs', 'تصدير سجلات التدقيق', 'audit', 'Export audit logs and system activity reports', true);

-- صلاحيات إدارة النظام المتقدمة
INSERT INTO permissions (permission_key, permission_name, permission_name_ar, category, description, is_active) VALUES
('system.backup', 'System Backup', 'نسخ احتياطي للنظام', 'system', 'Create and manage system backups', true),
('system.security', 'Security Management', 'إدارة الأمان', 'system', 'Manage security settings and user access controls', true),
('system.monitoring', 'System Monitoring', 'مراقبة النظام', 'system', 'Monitor system performance and user activity', true),
('system.maintenance', 'System Maintenance', 'صيانة النظام', 'system', 'Perform system maintenance and updates', true);

-- صلاحيات التقارير المتقدمة
INSERT INTO permissions (permission_key, permission_name, permission_name_ar, category, description, is_active) VALUES
('reports.financial', 'Financial Reports', 'التقارير المالية', 'reports', 'Generate comprehensive financial reports and analytics', true),
('reports.medical', 'Medical Reports', 'التقارير الطبية', 'reports', 'Generate medical statistics and treatment reports', true),
('reports.operational', 'Operational Reports', 'التقارير التشغيلية', 'reports', 'Generate operational and performance reports', true),
('reports.audit', 'Audit Reports', 'تقارير التدقيق', 'reports', 'Generate audit and compliance reports', true);

-- 3. تعيين الصلاحيات للأدوار الجديدة بناءً على مبدأ أقل الصلاحيات

-- صلاحيات مدير العيادة (clinic_manager)
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT 
    (SELECT id FROM user_roles WHERE role_name = 'clinic_manager'),
    p.id,
    NULL
FROM permissions p
WHERE p.permission_key IN (
    'dashboard.view', 'dashboard.analytics',
    'patients.view', 'patients.create', 'patients.edit',
    'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.requests',
    'staff.view', 'staff.create', 'staff.edit', 'staff.permissions',
    'dental.view', 'dental.create', 'dental.edit',
    'medical_records.view', 'medical_records.create',
    'sensitive.personal_data',
    'reports.operational', 'reports.medical',
    'inventory.view', 'medications.view',
    'notifications.view', 'notifications.create'
);

-- صلاحيات المدير المالي (financial_manager)
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT 
    (SELECT id FROM user_roles WHERE role_name = 'financial_manager'),
    p.id,
    NULL
FROM permissions p
WHERE p.permission_key IN (
    'dashboard.view', 'dashboard.analytics',
    'patients.view',
    'invoices.view', 'invoices.create', 'invoices.edit',
    'payments.view', 'payments.create',
    'sensitive.financial_data',
    'reports.financial',
    'notifications.view'
);

-- صلاحيات موظف الاستقبال (receptionist)  
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT 
    (SELECT id FROM user_roles WHERE role_name = 'receptionist'),
    p.id,
    NULL
FROM permissions p
WHERE p.permission_key IN (
    'dashboard.view',
    'patients.view', 'patients.create', 'patients.edit',
    'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.requests',
    'sensitive.personal_data',
    'notifications.view'
);

-- صلاحيات مساعد الطبيب (medical_assistant)
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT 
    (SELECT id FROM user_roles WHERE role_name = 'medical_assistant'),
    p.id,
    NULL
FROM permissions p
WHERE p.permission_key IN (
    'dashboard.view',
    'patients.view', 'patients.edit',
    'appointments.view',
    'dental.view', 'dental.create',
    'medical_records.view', 'medical_records.create',
    'sensitive.medical_history', 'sensitive.personal_data',
    'inventory.view', 'medications.view',
    'prescriptions.view',
    'emergency.access'
);

-- صلاحيات مدير النظام (system_administrator)
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT 
    (SELECT id FROM user_roles WHERE role_name = 'system_administrator'),
    p.id,
    NULL
FROM permissions p
WHERE p.permission_key IN (
    'dashboard.view', 'dashboard.analytics',
    'staff.view', 'staff.permissions',
    'system.backup', 'system.security', 'system.monitoring', 'system.maintenance',
    'audit.view', 'audit.export',
    'reports.audit', 'reports.operational',
    'emergency.override',
    'notifications.view', 'notifications.create'
);

-- 4. تحديث صلاحيات الأدوار الموجودة لتطبيق مبدأ أقل الصلاحيات

-- تحديث صلاحيات السكرتير (محدودة أكثر)
DELETE FROM role_permissions WHERE role_id = (SELECT id FROM user_roles WHERE role_name = 'secretary');
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT 
    (SELECT id FROM user_roles WHERE role_name = 'secretary'),
    p.id,
    NULL
FROM permissions p
WHERE p.permission_key IN (
    'dashboard.view',
    'patients.view', 'patients.create',
    'appointments.view', 'appointments.create', 'appointments.edit',
    'notifications.view'
);

-- تحديث صلاحيات المساعد العام (أساسية فقط)
DELETE FROM role_permissions WHERE role_id = (SELECT id FROM user_roles WHERE role_name = 'assistant');
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT 
    (SELECT id FROM user_roles WHERE role_name = 'assistant'),
    p.id,
    NULL
FROM permissions p
WHERE p.permission_key IN (
    'dashboard.view',
    'patients.view',
    'appointments.view',
    'inventory.view',
    'notifications.view'
);

-- 5. إضافة قيود زمنية للصلاحيات الحساسة (سيتم تطبيقها لاحقاً في الكود)
-- إنشاء جدول لتتبع الصلاحيات المؤقتة
CREATE TABLE IF NOT EXISTS temporary_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    permission_key TEXT NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    granted_by UUID,
    reason TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تفعيل RLS على جدول الصلاحيات المؤقتة
ALTER TABLE temporary_permissions ENABLE ROW LEVEL SECURITY;

-- سياسة للمديرين فقط
CREATE POLICY "System admins can manage temporary permissions" 
ON temporary_permissions 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.role IN ('admin', 'system_administrator')
    )
);

-- 6. إنشاء دالة للتحقق من الصلاحيات المؤقتة
CREATE OR REPLACE FUNCTION public.has_temporary_permission(user_id_param UUID, permission_key_param TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM temporary_permissions tp
        WHERE tp.user_id = user_id_param
        AND tp.permission_key = permission_key_param
        AND tp.is_active = true
        AND tp.expires_at > NOW()
    );
$$;

-- 7. تحديث دالة التحقق من الصلاحيات لتشمل الصلاحيات المؤقتة
CREATE OR REPLACE FUNCTION public.has_permission(permission_key_param TEXT, user_id_param UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT (
        -- الصلاحيات العادية
        EXISTS (
            SELECT 1 FROM public.get_user_permissions(user_id_param) 
            WHERE permission_key = permission_key_param
        )
        OR
        -- الصلاحيات المؤقتة
        public.has_temporary_permission(user_id_param, permission_key_param)
    );
$$;