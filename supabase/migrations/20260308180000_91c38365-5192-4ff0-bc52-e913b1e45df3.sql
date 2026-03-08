
-- 1. جدول المختبرات السنية
CREATE TABLE public.dental_labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  contact_person TEXT,
  specialties TEXT[] DEFAULT '{}',
  rating NUMERIC(2,1) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. جدول طلبات المختبر
CREATE TABLE public.lab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  lab_id UUID REFERENCES public.dental_labs(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  order_type TEXT NOT NULL DEFAULT 'crown',
  tooth_number TEXT,
  shade TEXT,
  material TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  notes TEXT,
  special_instructions TEXT,
  estimated_delivery DATE,
  actual_delivery DATE,
  cost NUMERIC(10,2) DEFAULT 0,
  invoice_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. جدول سجل حالات طلبات المختبر
CREATE TABLE public.lab_order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.lab_orders(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  changed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. جدول جداول الأطباء (تقويم)
CREATE TABLE public.doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(doctor_id, day_of_week)
);

-- 5. جدول إجازات الأطباء
CREATE TABLE public.doctor_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
  leave_type TEXT DEFAULT 'vacation',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'approved',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. جدول رسائل التواصل
CREATE TABLE public.communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL DEFAULT 'sms',
  channel TEXT DEFAULT 'manual',
  recipient_phone TEXT,
  recipient_email TEXT,
  subject TEXT,
  message_body TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  related_type TEXT,
  related_id UUID,
  sent_by UUID,
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. جدول قوالب الرسائل
CREATE TABLE public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'appointment',
  message_type TEXT DEFAULT 'sms',
  subject TEXT,
  body_template TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- دالة إنشاء رقم طلب مختبر
CREATE OR REPLACE FUNCTION public.generate_lab_order_number(clinic_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_number INTEGER;
  year_suffix TEXT;
BEGIN
  year_suffix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  SELECT COALESCE(MAX(
    CASE WHEN order_number ~ '^LAB-[0-9]{4}-[0-9]+$'
    THEN (regexp_split_to_array(order_number, '-'))[3]::INTEGER
    ELSE 0 END
  ), 0) + 1
  INTO next_number
  FROM public.lab_orders
  WHERE clinic_id = clinic_id_param
  AND order_number LIKE 'LAB-' || year_suffix || '-%';
  RETURN 'LAB-' || year_suffix || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$;

-- تفعيل RLS
ALTER TABLE public.dental_labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their clinic dental labs" ON public.dental_labs FOR ALL TO authenticated USING (clinic_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "Users can manage their clinic lab orders" ON public.lab_orders FOR ALL TO authenticated USING (clinic_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "Users can view lab order history" ON public.lab_order_status_history FOR ALL TO authenticated USING (order_id IN (SELECT id FROM public.lab_orders WHERE clinic_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)));
CREATE POLICY "Users can manage their clinic schedules" ON public.doctor_schedules FOR ALL TO authenticated USING (clinic_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "Users can manage their clinic leaves" ON public.doctor_leaves FOR ALL TO authenticated USING (clinic_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "Users can manage their clinic communications" ON public.communication_logs FOR ALL TO authenticated USING (clinic_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "Users can manage their clinic message templates" ON public.message_templates FOR ALL TO authenticated USING (clinic_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1));
