-- إضافة صلاحيات إضافية للمميزات المتقدمة
INSERT INTO permissions (permission_key, permission_name, permission_name_ar, category, description) VALUES
('dental.3d', 'Advanced 3D Dental Access', 'الوصول لطب الأسنان ثلاثي الأبعاد', 'dental', 'Access to advanced 3D dental features'),
('inventory.movements', 'Inventory Movement Access', 'الوصول لحركات المخزون', 'inventory', 'Access to inventory movement tracking'),
('settings.permissions', 'Permission Management', 'إدارة الصلاحيات', 'settings', 'Manage user roles and permissions'),
('ai.access', 'AI Features Access', 'الوصول لميزات الذكاء الاصطناعي', 'ai', 'Access to AI-powered features')
ON CONFLICT (permission_key) DO NOTHING;

-- ربط الصلاحيات الجديدة بدور super_admin
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 
  ur.id, 
  p.id
FROM user_roles ur
CROSS JOIN permissions p
WHERE ur.role_name = 'super_admin' 
  AND p.permission_key IN ('dental.3d', 'inventory.movements', 'settings.permissions', 'ai.access')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = ur.id AND rp.permission_id = p.id
  );