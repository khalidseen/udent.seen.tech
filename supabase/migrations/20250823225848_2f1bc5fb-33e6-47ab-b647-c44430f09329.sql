-- إضافة صلاحيات مراقبة النظام والإشعارات
INSERT INTO permissions (permission_key, permission_name, permission_name_ar, category, description) VALUES
('system.monitor', 'System Monitoring', 'مراقبة النظام', 'system', 'Monitor system health and performance'),
('notifications.send', 'Send Notifications', 'إرسال الإشعارات', 'notifications', 'Send notifications to users')
ON CONFLICT (permission_key) DO NOTHING;

-- ربط الصلاحيات الجديدة بدور super_admin
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 
  ur.id, 
  p.id
FROM user_roles ur
CROSS JOIN permissions p
WHERE ur.role_name = 'super_admin' 
  AND p.permission_key IN ('system.monitor', 'notifications.send')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = ur.id AND rp.permission_id = p.id
  );