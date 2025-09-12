-- تنظيف وإعادة إنشاء الصلاحيات
DELETE FROM public.role_permissions;
DELETE FROM public.permissions;

-- إنشاء الأدوار الأساسية
INSERT INTO public.user_roles (role_name, role_name_ar, description, is_active) VALUES
('super_admin', 'مدير النظام', 'صلاحيات كاملة على النظام', true),
('clinic_owner', 'مالك العيادة', 'إدارة كاملة للعيادة', true),
('doctor', 'طبيب', 'صلاحيات طبية ومرضى ومواعيد', true),
('receptionist', 'موظف استقبال', 'مواعيد ومرضى (عرض فقط)', true),
('financial_manager', 'مدير مالي', 'الإدارة المالية والتقارير', true)
ON CONFLICT (role_name) DO NOTHING;

-- إدراج الصلاحيات الجديدة مستندة إلى الأقسام
INSERT INTO public.permissions (permission_key, permission_name, permission_name_ar, category, description) VALUES
-- القائمة الرئيسية
('dashboard.view', 'View Dashboard', 'عرض لوحة التحكم', 'main_menu', 'Access to main dashboard'),
('patients.view', 'View Patients', 'عرض المرضى', 'main_menu', 'View patient list'),
('patients.create', 'Create Patients', 'إضافة مرضى', 'main_menu', 'Add new patients'),
('patients.edit', 'Edit Patients', 'تعديل المرضى', 'main_menu', 'Edit patient information'),
('patients.delete', 'Delete Patients', 'حذف المرضى', 'main_menu', 'Delete patients'),
('appointments.view', 'View Appointments', 'عرض المواعيد', 'main_menu', 'View appointment list'),
('appointments.create', 'Create Appointments', 'إضافة مواعيد', 'main_menu', 'Schedule new appointments'),
('appointments.edit', 'Edit Appointments', 'تعديل المواعيد', 'main_menu', 'Edit appointments'),
('appointments.delete', 'Delete Appointments', 'حذف المواعيد', 'main_menu', 'Cancel appointments'),
('appointment_requests.view', 'View Appointment Requests', 'عرض طلبات المواعيد', 'main_menu', 'View appointment requests'),
('appointment_requests.manage', 'Manage Appointment Requests', 'إدارة طلبات المواعيد', 'main_menu', 'Approve/reject appointment requests'),
('dental_treatments.view', 'View Dental Treatments', 'عرض العلاجات السنية', 'main_menu', 'View dental treatments'),
('dental_treatments.create', 'Create Dental Treatments', 'إضافة علاجات سنية', 'main_menu', 'Add dental treatments'),
('dental_treatments.edit', 'Edit Dental Treatments', 'تعديل العلاجات السنية', 'main_menu', 'Edit dental treatments'),
('medical_records.view', 'View Medical Records', 'عرض السجلات الطبية', 'main_menu', 'View medical records'),
('medical_records.create', 'Create Medical Records', 'إضافة سجلات طبية', 'main_menu', 'Add medical records'),
('medical_records.edit', 'Edit Medical Records', 'تعديل السجلات الطبية', 'main_menu', 'Edit medical records'),

-- الذكاء الاصطناعي
('ai.smart_diagnosis', 'Smart Diagnosis', 'التشخيص الذكي', 'ai_features', 'Access AI diagnosis features'),
('ai.insights', 'AI Insights', 'رؤى الذكاء الاصطناعي', 'ai_features', 'View AI insights and analytics'),

-- إدارة الموظفين
('doctors.view', 'View Doctors', 'عرض الأطباء', 'staff_management', 'View doctors list'),
('doctors.create', 'Create Doctors', 'إضافة أطباء', 'staff_management', 'Add new doctors'),
('doctors.edit', 'Edit Doctors', 'تعديل الأطباء', 'staff_management', 'Edit doctor information'),
('doctors.delete', 'Delete Doctors', 'حذف الأطباء', 'staff_management', 'Remove doctors'),
('doctor_applications.view', 'View Doctor Applications', 'عرض طلبات الأطباء', 'staff_management', 'View doctor applications'),
('doctor_applications.manage', 'Manage Doctor Applications', 'إدارة طلبات الأطباء', 'staff_management', 'Approve/reject doctor applications'),
('assistants.view', 'View Doctor Assistants', 'عرض مساعدي الأطباء', 'staff_management', 'View doctor assistants'),
('assistants.create', 'Create Doctor Assistants', 'إضافة مساعدي أطباء', 'staff_management', 'Add doctor assistants'),
('assistants.edit', 'Edit Doctor Assistants', 'تعديل مساعدي الأطباء', 'staff_management', 'Edit assistant information'),
('secretaries.view', 'View Secretaries', 'عرض السكرتارية', 'staff_management', 'View secretaries'),
('secretaries.manage', 'Manage Secretaries', 'إدارة السكرتارية', 'staff_management', 'Manage secretary accounts'),

-- الإدارة المالية
('invoices.view', 'View Invoices', 'عرض الفواتير', 'financial_management', 'View invoice list'),
('invoices.create', 'Create Invoices', 'إنشاء فواتير', 'financial_management', 'Create new invoices'),
('invoices.edit', 'Edit Invoices', 'تعديل الفواتير', 'financial_management', 'Edit invoices'),
('invoices.delete', 'Delete Invoices', 'حذف الفواتير', 'financial_management', 'Delete invoices'),
('payments.view', 'View Payments', 'عرض المدفوعات', 'financial_management', 'View payment records'),
('payments.create', 'Record Payments', 'تسجيل مدفوعات', 'financial_management', 'Record new payments'),
('payments.edit', 'Edit Payments', 'تعديل المدفوعات', 'financial_management', 'Edit payment records'),

-- إدارة المخزون
('inventory.view', 'View Inventory', 'عرض المخزون', 'inventory_management', 'View inventory items'),
('inventory.create', 'Create Inventory Items', 'إضافة مواد للمخزون', 'inventory_management', 'Add inventory items'),
('inventory.edit', 'Edit Inventory', 'تعديل المخزون', 'inventory_management', 'Edit inventory items'),
('medications.view', 'View Medications', 'عرض الأدوية', 'inventory_management', 'View medication list'),
('medications.create', 'Create Medications', 'إضافة أدوية', 'inventory_management', 'Add new medications'),
('medications.edit', 'Edit Medications', 'تعديل الأدوية', 'inventory_management', 'Edit medications'),
('prescriptions.view', 'View Prescriptions', 'عرض الوصفات الطبية', 'inventory_management', 'View prescriptions'),
('prescriptions.create', 'Create Prescriptions', 'إنشاء وصفات طبية', 'inventory_management', 'Create prescriptions'),
('stock_movements.view', 'View Stock Movements', 'عرض حركة المخزون', 'inventory_management', 'View stock movement reports'),
('purchase_orders.view', 'View Purchase Orders', 'عرض أوامر الشراء', 'inventory_management', 'View purchase orders'),
('purchase_orders.create', 'Create Purchase Orders', 'إنشاء أوامر شراء', 'inventory_management', 'Create purchase orders'),

-- إدارة النظام
('notifications.view', 'View Notifications', 'عرض الإشعارات', 'system_management', 'View notifications'),
('notifications.create', 'Create Notifications', 'إنشاء إشعارات', 'system_management', 'Create notifications'),
('notification_templates.view', 'View Notification Templates', 'عرض قوالب الإشعارات', 'system_management', 'View notification templates'),
('notification_templates.manage', 'Manage Notification Templates', 'إدارة قوالب الإشعارات', 'system_management', 'Manage notification templates'),
('reports.view', 'View Reports', 'عرض التقارير', 'system_management', 'View system reports'),
('reports.create', 'Generate Reports', 'إنشاء تقارير', 'system_management', 'Generate custom reports'),
('permissions.view', 'View Permissions', 'عرض الصلاحيات', 'system_management', 'View permission system'),
('permissions.manage', 'Manage Permissions', 'إدارة الصلاحيات', 'system_management', 'Manage user permissions and roles'),
('users.view_all', 'View All Users', 'عرض جميع المستخدمين', 'system_management', 'View all system users'),
('users.create', 'Create Users', 'إنشاء مستخدمين', 'system_management', 'Create new user accounts'),
('users.edit', 'Edit Users', 'تعديل المستخدمين', 'system_management', 'Edit user information'),
('audit.view', 'View Security Audit', 'عرض التدقيق الأمني', 'system_management', 'View security audit logs'),
('settings.view', 'View Settings', 'عرض الإعدادات', 'system_management', 'View system settings'),
('settings.edit', 'Edit Settings', 'تعديل الإعدادات', 'system_management', 'Modify system settings'),

-- الميزات المتقدمة
('treatments.view', 'View Treatments', 'عرض العلاجات', 'advanced_features', 'View treatment catalog'),
('treatments.manage', 'Manage Treatments', 'إدارة العلاجات', 'advanced_features', 'Manage treatment options'),
('service_prices.view', 'View Service Prices', 'عرض أسعار الخدمات', 'advanced_features', 'View service pricing'),
('service_prices.edit', 'Edit Service Prices', 'تعديل أسعار الخدمات', 'advanced_features', 'Edit service prices'),
('dental_3d.view', '3D Dental View', 'عرض الأسنان ثلاثي الأبعاد', 'advanced_features', 'Access 3D dental features');

-- ربط الصلاحيات بالأدوار

-- مدير النظام: كل الصلاحيات
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    ur.id as role_id,
    p.id as permission_id
FROM public.user_roles ur
CROSS JOIN public.permissions p
WHERE ur.role_name = 'super_admin' AND ur.is_active = true AND p.is_active = true;

-- مالك العيادة: إدارة كاملة عدا النظام
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    ur.id as role_id,
    p.id as permission_id
FROM public.user_roles ur
CROSS JOIN public.permissions p
WHERE ur.role_name = 'clinic_owner' 
AND ur.is_active = true 
AND p.is_active = true
AND p.category IN ('main_menu', 'ai_features', 'staff_management', 'financial_management', 'inventory_management', 'advanced_features')
AND p.permission_key NOT IN ('users.create', 'users.edit', 'permissions.manage', 'audit.view');

-- طبيب: طبية + مرضى + مواعيد
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    ur.id as role_id,
    p.id as permission_id
FROM public.user_roles ur
CROSS JOIN public.permissions p
WHERE ur.role_name = 'doctor' 
AND ur.is_active = true 
AND p.is_active = true
AND p.permission_key IN (
    'dashboard.view',
    'patients.view', 'patients.create', 'patients.edit',
    'appointments.view', 'appointments.create', 'appointments.edit',
    'appointment_requests.view',
    'dental_treatments.view', 'dental_treatments.create', 'dental_treatments.edit',
    'medical_records.view', 'medical_records.create', 'medical_records.edit',
    'ai.smart_diagnosis', 'ai.insights',
    'prescriptions.view', 'prescriptions.create',
    'medications.view',
    'dental_3d.view',
    'treatments.view'
);

-- موظف استقبال: مواعيد + مرضى (عرض فقط)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    ur.id as role_id,
    p.id as permission_id
FROM public.user_roles ur
CROSS JOIN public.permissions p
WHERE ur.role_name = 'receptionist' 
AND ur.is_active = true 
AND p.is_active = true
AND p.permission_key IN (
    'dashboard.view',
    'patients.view',
    'appointments.view', 'appointments.create', 'appointments.edit',
    'appointment_requests.view', 'appointment_requests.manage',
    'notifications.view'
);

-- مدير مالي: الإدارة المالية + عرض المرضى والمواعيد
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    ur.id as role_id,
    p.id as permission_id
FROM public.user_roles ur
CROSS JOIN public.permissions p
WHERE ur.role_name = 'financial_manager' 
AND ur.is_active = true 
AND p.is_active = true
AND (
    p.category = 'financial_management' 
    OR p.permission_key IN (
        'dashboard.view',
        'patients.view',
        'appointments.view',
        'reports.view', 'reports.create'
    )
);