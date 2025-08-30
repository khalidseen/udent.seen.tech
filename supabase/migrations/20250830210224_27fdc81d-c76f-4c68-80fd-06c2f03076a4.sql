-- إنشاء جدول ربط الأدوار بالصلاحيات إذا لم يكن موجود
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES public.user_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id),
  UNIQUE(role_id, permission_id)
);

-- تفعيل RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Super admins can manage role permissions" 
ON public.role_permissions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_role_assignments ura
    JOIN user_roles ur ON ura.role_id = ur.id
    WHERE ura.user_id = auth.uid() 
    AND ur.role_name = 'super_admin'
    AND ura.is_active = true
  ) OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- إضافة الصلاحيات الأساسية للنظام
INSERT INTO public.permissions (permission_key, permission_name, permission_name_ar, category, description) VALUES
-- صلاحيات الملفات الشخصية
('profiles.view_own', 'View Own Profile', 'عرض الملف الشخصي', 'profile', 'عرض البيانات الشخصية للمستخدم'),
('profiles.edit_own', 'Edit Own Profile', 'تعديل الملف الشخصي', 'profile', 'تعديل البيانات الشخصية للمستخدم'),
('profiles.view_all', 'View All Profiles', 'عرض جميع الملفات الشخصية', 'profile', 'عرض ملفات جميع المستخدمين'),
('profiles.manage', 'Manage Profiles', 'إدارة الملفات الشخصية', 'profile', 'إدارة كاملة لملفات المستخدمين'),

-- صلاحيات المرضى
('patients.view', 'View Patients', 'عرض المرضى', 'medical', 'عرض قائمة وبيانات المرضى'),
('patients.create', 'Create Patients', 'إضافة مرضى', 'medical', 'إنشاء ملفات مرضى جدد'),
('patients.edit', 'Edit Patients', 'تعديل بيانات المرضى', 'medical', 'تعديل معلومات المرضى'),
('patients.delete', 'Delete Patients', 'حذف المرضى', 'medical', 'حذف ملفات المرضى'),

-- صلاحيات المواعيد
('appointments.view', 'View Appointments', 'عرض المواعيد', 'scheduling', 'عرض جدول المواعيد'),
('appointments.create', 'Create Appointments', 'إضافة مواعيد', 'scheduling', 'حجز مواعيد جديدة'),
('appointments.edit', 'Edit Appointments', 'تعديل المواعيد', 'scheduling', 'تعديل مواعيد موجودة'),
('appointments.cancel', 'Cancel Appointments', 'إلغاء المواعيد', 'scheduling', 'إلغاء أو حذف المواعيد'),

-- صلاحيات السجلات الطبية
('medical_records.view', 'View Medical Records', 'عرض السجلات الطبية', 'medical', 'الاطلاع على السجلات الطبية'),
('medical_records.create', 'Create Medical Records', 'إنشاء سجلات طبية', 'medical', 'إنشاء سجلات طبية جديدة'),
('medical_records.edit', 'Edit Medical Records', 'تعديل السجلات الطبية', 'medical', 'تعديل السجلات الطبية'),
('medical_records.delete', 'Delete Medical Records', 'حذف السجلات الطبية', 'medical', 'حذف السجلات الطبية'),

-- صلاحيات العلاجات
('treatments.view', 'View Treatments', 'عرض العلاجات', 'medical', 'عرض خطط وتاريخ العلاجات'),
('treatments.create', 'Create Treatments', 'إنشاء علاجات', 'medical', 'إنشاء خطط علاج جديدة'),
('treatments.edit', 'Edit Treatments', 'تعديل العلاجات', 'medical', 'تعديل خطط العلاج'),
('treatments.prescribe', 'Prescribe Medications', 'وصف الأدوية', 'medical', 'وصف وإدارة الأدوية'),

-- صلاحيات الفواتير والمدفوعات
('invoices.view', 'View Invoices', 'عرض الفواتير', 'financial', 'عرض الفواتير والمدفوعات'),
('invoices.create', 'Create Invoices', 'إنشاء فواتير', 'financial', 'إنشاء فواتير جديدة'),
('invoices.edit', 'Edit Invoices', 'تعديل الفواتير', 'financial', 'تعديل الفواتير'),
('invoices.delete', 'Delete Invoices', 'حذف الفواتير', 'financial', 'حذف الفواتير'),
('payments.record', 'Record Payments', 'تسجيل المدفوعات', 'financial', 'تسجيل المدفوعات'),

-- صلاحيات المخزون
('inventory.view', 'View Inventory', 'عرض المخزون', 'inventory', 'عرض مخزون المستلزمات'),
('inventory.manage', 'Manage Inventory', 'إدارة المخزون', 'inventory', 'إدارة المخزون والمستلزمات'),
('inventory.reports', 'Inventory Reports', 'تقارير المخزون', 'inventory', 'عرض تقارير المخزون'),

-- صلاحيات الإدارة
('users.view', 'View Users', 'عرض المستخدمين', 'administration', 'عرض قائمة المستخدمين'),
('users.manage', 'Manage Users', 'إدارة المستخدمين', 'administration', 'إدارة حسابات المستخدمين'),
('roles.assign', 'Assign Roles', 'تعيين الأدوار', 'administration', 'تعيين الأدوار للمستخدمين'),
('settings.manage', 'Manage Settings', 'إدارة الإعدادات', 'administration', 'إدارة إعدادات النظام'),

-- صلاحيات التقارير
('reports.view', 'View Reports', 'عرض التقارير', 'reports', 'الاطلاع على التقارير'),
('reports.export', 'Export Reports', 'تصدير التقارير', 'reports', 'تصدير التقارير'),
('reports.financial', 'Financial Reports', 'التقارير المالية', 'reports', 'عرض التقارير المالية'),

-- صلاحيات النظام المتقدمة
('system.backup', 'System Backup', 'نسخ احتياطي', 'system', 'إنشاء نسخ احتياطية'),
('system.maintenance', 'System Maintenance', 'صيانة النظام', 'system', 'إجراء صيانة النظام'),
('audit.view', 'View Audit Logs', 'عرض سجلات التدقيق', 'security', 'عرض سجلات تدقيق النظام')
ON CONFLICT (permission_key) DO NOTHING;

-- ربط الصلاحيات بالأدوار
-- أولاً: Super Admin - كل الصلاحيات
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT ur.id, p.id
FROM public.user_roles ur
CROSS JOIN public.permissions p
WHERE ur.role_name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ثانياً: Clinic Owner - كل شي عدا النظام
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT ur.id, p.id
FROM public.user_roles ur
CROSS JOIN public.permissions p
WHERE ur.role_name = 'clinic_owner'
AND p.category != 'system'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ثالثاً: Doctor - الصلاحيات الطبية
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT ur.id, p.id
FROM public.user_roles ur
CROSS JOIN public.permissions p
WHERE ur.role_name = 'doctor'
AND p.category IN ('medical', 'profile')
AND p.permission_key NOT LIKE '%.delete'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- رابعاً: Receptionist - المواعيد والمرضى (عرض فقط)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT ur.id, p.id
FROM public.user_roles ur
CROSS JOIN public.permissions p
WHERE ur.role_name = 'receptionist'
AND (
  p.permission_key IN ('patients.view', 'patients.create', 'appointments.view', 'appointments.create', 'appointments.edit', 'profiles.view_own', 'profiles.edit_own')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- خامساً: Financial Manager - المالية والفواتير
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT ur.id, p.id
FROM public.user_roles ur
CROSS JOIN public.permissions p
WHERE ur.role_name = 'financial_manager'
AND (
  p.category IN ('financial', 'reports', 'profile')
  OR p.permission_key IN ('patients.view', 'appointments.view')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- إنشاء فانكشن لتحديث صلاحيات المستخدم
CREATE OR REPLACE FUNCTION public.get_user_effective_permissions(user_id_param UUID DEFAULT auth.uid())
RETURNS TABLE(permission_key TEXT, permission_name TEXT, permission_name_ar TEXT, category TEXT, source TEXT)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- صلاحيات من الدور الأساسي
  SELECT DISTINCT p.permission_key, p.permission_name, p.permission_name_ar, p.category, 'primary_role' as source
  FROM permissions p
  JOIN role_permissions rp ON p.id = rp.permission_id
  JOIN user_roles ur ON rp.role_id = ur.id
  JOIN profiles prof ON prof.user_id = user_id_param
  WHERE ur.role_name = prof.role AND ur.is_active = true AND p.is_active = true
  
  UNION
  
  -- صلاحيات من الأدوار الإضافية
  SELECT DISTINCT p.permission_key, p.permission_name, p.permission_name_ar, p.category, 'additional_role' as source
  FROM permissions p
  JOIN role_permissions rp ON p.id = rp.permission_id
  JOIN user_roles ur ON rp.role_id = ur.id
  JOIN user_role_assignments ura ON ur.id = ura.role_id
  WHERE ura.user_id = user_id_param 
    AND ura.is_active = true 
    AND (ura.expires_at IS NULL OR ura.expires_at > now())
    AND ur.is_active = true 
    AND p.is_active = true
    
  UNION
  
  -- الصلاحيات المؤقتة
  SELECT DISTINCT p.permission_key, p.permission_name, p.permission_name_ar, p.category, 'temporary' as source
  FROM permissions p
  JOIN temporary_permissions tp ON p.permission_key = tp.permission_key
  WHERE tp.user_id = user_id_param
    AND tp.is_active = true
    AND tp.expires_at > now()
    AND p.is_active = true;
$$;