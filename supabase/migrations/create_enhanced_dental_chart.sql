-- 🦷 Enhanced Dental Chart Database Schema
-- جدول قاعدة البيانات لنظام مخطط الأسنان المحسن

-- جدول سجلات الأسنان الرئيسي
CREATE TABLE IF NOT EXISTS tooth_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tooth_number VARCHAR(3) NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    
    -- تبويب التشخيص
    primary_condition VARCHAR(50) NOT NULL DEFAULT 'sound',
    priority_level VARCHAR(20) NOT NULL DEFAULT 'low',
    icd10_code VARCHAR(10),
    diagnosis_notes TEXT,
    image_url TEXT,
    image_data TEXT, -- Base64 للصور المضغوطة
    
    -- تبويب الأسطح
    surface_mesial VARCHAR(20) DEFAULT 'sound',
    surface_distal VARCHAR(20) DEFAULT 'sound',
    surface_buccal VARCHAR(20) DEFAULT 'sound',
    surface_lingual VARCHAR(20) DEFAULT 'sound',
    surface_occlusal VARCHAR(20) DEFAULT 'sound',
    surface_incisal VARCHAR(20) DEFAULT 'sound',
    
    -- تبويب القياسات السريرية
    mobility_degree INTEGER DEFAULT 0 CHECK (mobility_degree >= 0 AND mobility_degree <= 3),
    pocket_depth_mesial_buccal INTEGER DEFAULT 2,
    pocket_depth_mid_buccal INTEGER DEFAULT 2,
    pocket_depth_distal_buccal INTEGER DEFAULT 2,
    pocket_depth_mesial_lingual INTEGER DEFAULT 2,
    pocket_depth_mid_lingual INTEGER DEFAULT 2,
    pocket_depth_distal_lingual INTEGER DEFAULT 2,
    bleeding_on_probing BOOLEAN DEFAULT FALSE,
    gingival_recession_buccal INTEGER DEFAULT 0,
    gingival_recession_lingual INTEGER DEFAULT 0,
    plaque_index INTEGER DEFAULT 0 CHECK (plaque_index >= 0 AND plaque_index <= 3),
    
    -- تبويب الجذور
    number_of_roots INTEGER DEFAULT 1 CHECK (number_of_roots >= 1 AND number_of_roots <= 4),
    root_canal_completed BOOLEAN DEFAULT FALSE,
    root_canal_date DATE,
    root_canal_notes TEXT,
    
    -- تبويب الملاحظات
    clinical_notes TEXT,
    treatment_plan TEXT,
    additional_comments TEXT,
    follow_up_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- فهارس مركبة للأداء
    UNIQUE(patient_id, tooth_number)
);

-- جدول حالات الجذور التفصيلية
CREATE TABLE IF NOT EXISTS tooth_root_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tooth_record_id UUID NOT NULL REFERENCES tooth_records(id) ON DELETE CASCADE,
    root_number INTEGER NOT NULL CHECK (root_number >= 1 AND root_number <= 4),
    condition VARCHAR(20) NOT NULL DEFAULT 'healthy',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tooth_record_id, root_number)
);

-- جدول تاريخ العلاجات للسن
CREATE TABLE IF NOT EXISTS tooth_treatment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tooth_record_id UUID NOT NULL REFERENCES tooth_records(id) ON DELETE CASCADE,
    treatment_type VARCHAR(50) NOT NULL,
    treatment_date DATE NOT NULL,
    dentist_id UUID REFERENCES profiles(id),
    notes TEXT,
    cost DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول صور الأسنان (منفصل للتحسين)
CREATE TABLE IF NOT EXISTS tooth_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tooth_record_id UUID NOT NULL REFERENCES tooth_records(id) ON DELETE CASCADE,
    image_type VARCHAR(20) DEFAULT 'clinical', -- clinical, xray, intraoral, etc.
    image_url TEXT,
    image_data TEXT, -- Base64 للصور الصغيرة
    thumbnail_data TEXT, -- صورة مصغرة
    file_size INTEGER,
    mime_type VARCHAR(50),
    width INTEGER,
    height INTEGER,
    description TEXT,
    captured_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول قوالب التشخيص الجاهزة
CREATE TABLE IF NOT EXISTS diagnosis_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    template_name VARCHAR(100) NOT NULL,
    condition_type VARCHAR(50) NOT NULL,
    priority_level VARCHAR(20) NOT NULL,
    icd10_code VARCHAR(10),
    default_notes TEXT,
    treatment_plan_template TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_tooth_records_patient_id ON tooth_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_tooth_records_clinic_id ON tooth_records(clinic_id);
CREATE INDEX IF NOT EXISTS idx_tooth_records_condition ON tooth_records(primary_condition);
CREATE INDEX IF NOT EXISTS idx_tooth_records_priority ON tooth_records(priority_level);
CREATE INDEX IF NOT EXISTS idx_tooth_records_updated_at ON tooth_records(updated_at);
CREATE INDEX IF NOT EXISTS idx_tooth_images_tooth_record_id ON tooth_images(tooth_record_id);
CREATE INDEX IF NOT EXISTS idx_tooth_treatment_history_tooth_record_id ON tooth_treatment_history(tooth_record_id);
CREATE INDEX IF NOT EXISTS idx_tooth_root_conditions_tooth_record_id ON tooth_root_conditions(tooth_record_id);

-- دالة تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- تريجر لتحديث updated_at
CREATE TRIGGER update_tooth_records_updated_at 
    BEFORE UPDATE ON tooth_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- دالة للحصول على إحصائيات مخطط الأسنان
CREATE OR REPLACE FUNCTION get_dental_chart_statistics(patient_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_teeth', 32,
        'recorded_teeth', COUNT(*),
        'healthy_teeth', COUNT(*) FILTER (WHERE primary_condition = 'sound'),
        'decay_teeth', COUNT(*) FILTER (WHERE primary_condition = 'decay'),
        'filled_teeth', COUNT(*) FILTER (WHERE primary_condition = 'filled'),
        'missing_teeth', COUNT(*) FILTER (WHERE primary_condition = 'missing'),
        'urgent_cases', COUNT(*) FILTER (WHERE priority_level IN ('urgent', 'emergency')),
        'with_images', COUNT(*) FILTER (WHERE image_data IS NOT NULL OR image_url IS NOT NULL),
        'last_updated', MAX(updated_at)
    ) INTO result
    FROM tooth_records
    WHERE patient_id = patient_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- دالة للبحث في سجلات الأسنان
CREATE OR REPLACE FUNCTION search_tooth_records(
    clinic_uuid UUID,
    search_condition VARCHAR DEFAULT NULL,
    search_priority VARCHAR DEFAULT NULL,
    has_images BOOLEAN DEFAULT NULL,
    date_from DATE DEFAULT NULL,
    date_to DATE DEFAULT NULL
)
RETURNS TABLE (
    tooth_record_id UUID,
    patient_id UUID,
    patient_name VARCHAR,
    tooth_number VARCHAR,
    condition VARCHAR,
    priority VARCHAR,
    has_image BOOLEAN,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tr.id as tooth_record_id,
        tr.patient_id,
        p.first_name || ' ' || p.last_name as patient_name,
        tr.tooth_number,
        tr.primary_condition as condition,
        tr.priority_level as priority,
        (tr.image_data IS NOT NULL OR tr.image_url IS NOT NULL) as has_image,
        tr.updated_at
    FROM tooth_records tr
    JOIN patients pat ON tr.patient_id = pat.id
    JOIN profiles p ON pat.patient_id = p.id
    WHERE tr.clinic_id = clinic_uuid
    AND (search_condition IS NULL OR tr.primary_condition = search_condition)
    AND (search_priority IS NULL OR tr.priority_level = search_priority)
    AND (has_images IS NULL OR 
         (has_images = TRUE AND (tr.image_data IS NOT NULL OR tr.image_url IS NOT NULL)) OR
         (has_images = FALSE AND tr.image_data IS NULL AND tr.image_url IS NULL))
    AND (date_from IS NULL OR tr.updated_at::date >= date_from)
    AND (date_to IS NULL OR tr.updated_at::date <= date_to)
    ORDER BY tr.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- إدراج بيانات تجريبية
INSERT INTO diagnosis_templates (clinic_id, template_name, condition_type, priority_level, icd10_code, default_notes, treatment_plan_template) VALUES
((SELECT id FROM clinics LIMIT 1), 'تسوس بسيط', 'decay', 'medium', 'K02.1', 'تسوس في المينا فقط', 'حشو تجميلي'),
((SELECT id FROM clinics LIMIT 1), 'تسوس عميق', 'decay', 'high', 'K02.2', 'تسوس وصل للعاج', 'حشو عميق أو علاج عصب'),
((SELECT id FROM clinics LIMIT 1), 'كسر بسيط', 'fractured', 'medium', 'S02.5', 'كسر في حافة السن', 'ترميم تجميلي'),
((SELECT id FROM clinics LIMIT 1), 'سن مفقود', 'missing', 'low', 'K08.1', 'سن مقلوع أو مفقود', 'زراعة أو جسر'),
((SELECT id FROM clinics LIMIT 1), 'حالة طارئة', 'decay', 'emergency', 'K02.3', 'ألم شديد وتورم', 'علاج فوري');

-- منح صلاحيات الوصول
ALTER TABLE tooth_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE tooth_root_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tooth_treatment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tooth_images ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Users can view tooth records from their clinic" ON tooth_records
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM clinic_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert tooth records to their clinic" ON tooth_records
    FOR INSERT WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM clinic_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update tooth records in their clinic" ON tooth_records
    FOR UPDATE USING (
        clinic_id IN (
            SELECT clinic_id FROM clinic_members 
            WHERE user_id = auth.uid()
        )
    );

-- تعليقات لتوثيق الجداول
COMMENT ON TABLE tooth_records IS 'جدول سجلات الأسنان الشامل مع 5 تبويبات';
COMMENT ON TABLE tooth_root_conditions IS 'تفاصيل حالة جذور كل سن';
COMMENT ON TABLE tooth_treatment_history IS 'تاريخ العلاجات لكل سن';
COMMENT ON TABLE tooth_images IS 'صور الأسنان مع البيانات الوصفية';
COMMENT ON TABLE diagnosis_templates IS 'قوالب التشخيص الجاهزة للعيادات';
