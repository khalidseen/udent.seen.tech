-- إعطاء صلاحيات كاملة للمستخدم eng.khalid.work@gmail.com

-- البحث عن المستخدم وإعطائه دور super_admin
DO $$
DECLARE
    target_user_id UUID;
    target_profile_id UUID;
    super_admin_role_id UUID;
BEGIN
    -- البحث عن المستخدم بالإيميل
    SELECT id INTO target_user_id
    FROM auth.users 
    WHERE email = 'eng.khalid.work@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        -- البحث عن البروفايل
        SELECT id INTO target_profile_id
        FROM public.profiles 
        WHERE user_id = target_user_id;
        
        -- تحديث دور البروفايل إلى admin
        UPDATE public.profiles 
        SET role = 'admin', status = 'approved'
        WHERE user_id = target_user_id;
        
        -- البحث عن دور super_admin أو إنشاؤه
        SELECT id INTO super_admin_role_id
        FROM public.user_roles 
        WHERE role_name = 'super_admin';
        
        IF super_admin_role_id IS NULL THEN
            -- إنشاء دور super_admin
            INSERT INTO public.user_roles (role_name, role_name_ar, description, is_system, is_active)
            VALUES ('super_admin', 'مدير عام', 'صلاحيات كاملة لإدارة النظام', true, true)
            RETURNING id INTO super_admin_role_id;
        END IF;
        
        -- إضافة جميع الصلاحيات لدور super_admin
        INSERT INTO public.role_permissions (role_id, permission_id)
        SELECT super_admin_role_id, p.id
        FROM public.permissions p
        WHERE NOT EXISTS (
            SELECT 1 FROM public.role_permissions rp 
            WHERE rp.role_id = super_admin_role_id AND rp.permission_id = p.id
        );
        
        -- إسناد دور super_admin للمستخدم
        INSERT INTO public.user_role_assignments (user_id, role_id, assigned_by, is_active)
        VALUES (target_user_id, super_admin_role_id, target_user_id, true)
        ON CONFLICT (user_id, role_id) DO UPDATE SET
            is_active = true,
            assigned_at = now();
            
        RAISE NOTICE 'تم إعطاء صلاحيات كاملة للمستخدم eng.khalid.work@gmail.com';
    ELSE
        RAISE NOTICE 'لم يتم العثور على المستخدم eng.khalid.work@gmail.com';
    END IF;
END $$;

-- إنشاء صلاحيات إضافية للإدارة الكاملة إذا لم تكن موجودة
INSERT INTO public.permissions (permission_key, permission_name, permission_name_ar, description, category, is_active)
VALUES 
    ('system.full_access', 'Full System Access', 'وصول كامل للنظام', 'Full unrestricted access to all system features', 'system', true),
    ('permissions.manage', 'Manage Permissions', 'إدارة الصلاحيات', 'Create, edit, and assign permissions and roles', 'system', true),
    ('users.manage_all', 'Manage All Users', 'إدارة جميع المستخدمين', 'Full access to manage all users in the system', 'user_management', true),
    ('system.override', 'System Override', 'تجاوز النظام', 'Override any system restrictions or limitations', 'system', true)
ON CONFLICT (permission_key) DO NOTHING;

-- التأكد من إسناد الصلاحيات الجديدة لدور super_admin
DO $$
DECLARE
    super_admin_role_id UUID;
BEGIN
    SELECT id INTO super_admin_role_id
    FROM public.user_roles 
    WHERE role_name = 'super_admin';
    
    IF super_admin_role_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        SELECT super_admin_role_id, p.id
        FROM public.permissions p
        WHERE NOT EXISTS (
            SELECT 1 FROM public.role_permissions rp 
            WHERE rp.role_id = super_admin_role_id AND rp.permission_id = p.id
        );
    END IF;
END $$;