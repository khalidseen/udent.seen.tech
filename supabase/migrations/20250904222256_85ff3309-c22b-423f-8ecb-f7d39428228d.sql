-- Create advanced note templates table
CREATE TABLE public.advanced_note_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    title_template TEXT NOT NULL,
    content_template TEXT NOT NULL,
    default_note_type TEXT NOT NULL DEFAULT 'general',
    default_priority TEXT NOT NULL DEFAULT 'medium',
    default_status TEXT NOT NULL DEFAULT 'active',
    default_severity TEXT DEFAULT 'mild',
    default_color TEXT DEFAULT '#3b82f6',
    tags TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_global BOOLEAN NOT NULL DEFAULT false,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advanced_note_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their clinic templates and global templates" 
ON public.advanced_note_templates 
FOR SELECT 
USING (
    is_global = true OR 
    clinic_id = (SELECT get_current_user_profile().id)
);

CREATE POLICY "Users can create templates for their clinic" 
ON public.advanced_note_templates 
FOR INSERT 
WITH CHECK (
    clinic_id = (SELECT get_current_user_profile().id) OR
    (is_global = true AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ))
);

CREATE POLICY "Users can update their clinic templates" 
ON public.advanced_note_templates 
FOR UPDATE 
USING (
    clinic_id = (SELECT get_current_user_profile().id) OR
    (is_global = true AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ))
);

CREATE POLICY "Users can delete their clinic templates" 
ON public.advanced_note_templates 
FOR DELETE 
USING (
    clinic_id = (SELECT get_current_user_profile().id) OR
    (is_global = true AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ))
);

-- Create trigger for updated_at
CREATE TRIGGER update_advanced_note_templates_updated_at
    BEFORE UPDATE ON public.advanced_note_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default global templates
INSERT INTO public.advanced_note_templates (
    name, 
    description,
    category,
    title_template,
    content_template,
    default_note_type,
    default_priority,
    default_status,
    is_global,
    created_by
) VALUES 
(
    'فحص دوري عام',
    'قالب للفحص الدوري العام للأسنان',
    'general',
    'فحص دوري - السن {tooth_number}',
    'الفحص الإكلينيكي:\n- الحالة العامة: \n- وجود ألم: \n- الحساسية: \n- النزيف: \n\nالخطة العلاجية:\n- ',
    'general',
    'medium',
    'active',
    true,
    null
),
(
    'علاج عصب',
    'قالب لعلاج عصب الأسنان',
    'endodontic',
    'علاج عصب - السن {tooth_number}',
    'التشخيص: \nحالة العصب: \nعدد القنوات: \nطول القنوات: \n\nالجلسات:\nالجلسة الأولى: \nالجلسة الثانية: \nالجلسة الأخيرة: \n\nالحشو النهائي: ',
    'endodontic',
    'high',
    'under_treatment',
    true,
    null
),
(
    'خلع سن',
    'قالب لخلع الأسنان',
    'oral_surgery',
    'خلع السن {tooth_number}',
    'سبب الخلع: \nنوع الخلع: بسيط / جراحي\nالتخدير المستخدم: \n\nأثناء العملية:\n- المضاعفات: \n- الوقت المستغرق: \n\nتعليمات ما بعد الخلع:\n- ',
    'oral_surgery',
    'high',
    'completed',
    true,
    null
),
(
    'حشو أسنان',
    'قالب لحشو الأسنان العادي',
    'restorative',
    'حشو السن {tooth_number}',
    'نوع التسوس: \nعمق التسوس: سطحي / متوسط / عميق\nنوع الحشو: \nلون الحشو: \n\nخطوات العمل:\n1. إزالة التسوس\n2. تحضير التجويف\n3. وضع الحشو\n4. التشكيل النهائي\n\nحالة المريض بعد العلاج: ',
    'restorative',
    'medium',
    'completed',
    true,
    null
),
(
    'تنظيف أسنان',
    'قالب لتنظيف وتلميع الأسنان',
    'preventive',
    'تنظيف الأسنان - جلسة {date}',
    'حالة اللثة: \nكمية الجير: قليل / متوسط / كثير\nالنزيف: موجود / غير موجود\n\nالإجراءات المتبعة:\n- إزالة الجير فوق اللثوي\n- إزالة الجير تحت اللثوي\n- تلميع الأسنان\n- فلورايد\n\nالتعليمات:\n- ',
    'preventive',
    'low',
    'completed',
    true,
    null
);