-- إنشاء جدول لحفظ تخصيصات مربعات لوحة التحكم
CREATE TABLE IF NOT EXISTS dashboard_cards (
    id VARCHAR(20) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    route VARCHAR(255) NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- إدراج البيانات الافتراضية
INSERT INTO dashboard_cards (id, title, description, route, order_index) VALUES
('1', 'إضافة مريض جديد', 'تسجيل بيانات مريض جديد في النظام', '/patients', 1),
('2', 'حجز موعد', 'حجز موعد جديد للمريض', '/appointments/new', 2),
('3', 'السجلات الطبية', 'إدارة السجلات الطبية للمرضى', '/medical-records', 3),
('4', 'الفواتير', 'إدارة الفواتير والمدفوعات', '/invoices', 4),
('5', 'المخزون', 'إدارة المخزون والإمدادات', '/inventory', 5),
('6', 'العلاجات', 'إدارة العلاجات والإجراءات', '/treatments', 6),
('7', 'الذكاء الاصطناعي', 'تحليل ذكي وتشخيص متقدم', '/ai-insights', 7),
('8', 'الإعدادات', 'إعدادات النظام والأداء', '/settings', 8),
('9', 'التقارير', 'تقارير شاملة وإحصائيات', '/reports', 9),
('10', 'الإشعارات', 'إدارة الإشعارات والتنبيهات', '/notifications', 10),
('11', 'مراقبة النظام', 'مراقبة صحة النظام والأداء', '/settings', 11)
ON CONFLICT (id) DO NOTHING;

-- إنشاء فهرس للترتيب
CREATE INDEX IF NOT EXISTS idx_dashboard_cards_order ON dashboard_cards(order_index);

-- إنشاء دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء محفز لتحديث updated_at
CREATE TRIGGER update_dashboard_cards_updated_at 
    BEFORE UPDATE ON dashboard_cards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

