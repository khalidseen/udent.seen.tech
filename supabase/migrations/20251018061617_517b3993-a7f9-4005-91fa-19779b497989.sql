-- ============================================
-- المرحلة 1 (نهائية): تحسين قاعدة البيانات والأداء
-- ============================================

-- 1. إنشاء دالة أمنة للتحقق من الأدوار
CREATE OR REPLACE FUNCTION public.check_user_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _user_id AND p.role = _role
    UNION
    SELECT 1
    FROM public.user_role_assignments ura
    JOIN public.user_roles ur ON ura.role_id = ur.id
    WHERE ura.user_id = _user_id
      AND ur.role_name = _role
      AND ura.is_active = true
      AND (ura.expires_at IS NULL OR ura.expires_at > now())
  );
$$;

-- 2. دالة موحدة للحصول على الأذونات والأدوار
CREATE OR REPLACE FUNCTION public.get_user_complete_permissions(user_id_param uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  user_profile RECORD;
BEGIN
  SELECT * INTO user_profile FROM public.profiles WHERE user_id = user_id_param LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'profile', NULL,
      'permissions', '[]'::jsonb,
      'roles', '[]'::jsonb,
      'effective_permissions', '[]'::jsonb
    );
  END IF;

  SELECT jsonb_build_object(
    'profile', to_jsonb(user_profile),
    'permissions', COALESCE(
      (SELECT jsonb_agg(DISTINCT to_jsonb(p.*))
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN user_roles ur ON rp.role_id = ur.id
       WHERE (ur.role_name = user_profile.role AND ur.is_active = true AND p.is_active = true)
       OR (EXISTS (
         SELECT 1 FROM user_role_assignments ura
         WHERE ura.user_id = user_id_param
           AND ura.role_id = ur.id
           AND ura.is_active = true
           AND (ura.expires_at IS NULL OR ura.expires_at > now())
       ))
      ), '[]'::jsonb
    ),
    'roles', COALESCE(
      (SELECT jsonb_agg(DISTINCT jsonb_build_object(
        'role_name', ur.role_name,
        'role_name_ar', ur.role_name_ar,
        'is_primary', ur.role_name = user_profile.role
      ))
       FROM user_roles ur
       WHERE (ur.role_name = user_profile.role AND ur.is_active = true)
       OR EXISTS (
         SELECT 1 FROM user_role_assignments ura
         WHERE ura.user_id = user_id_param
           AND ura.role_id = ur.id
           AND ura.is_active = true
           AND (ura.expires_at IS NULL OR ura.expires_at > now())
       )
      ), '[]'::jsonb
    ),
    'effective_permissions', COALESCE(
      (SELECT jsonb_agg(DISTINCT p.permission_key)
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN user_roles ur ON rp.role_id = ur.id
       WHERE ((ur.role_name = user_profile.role AND ur.is_active = true)
         OR EXISTS (
           SELECT 1 FROM user_role_assignments ura
           WHERE ura.user_id = user_id_param
             AND ura.role_id = ur.id
             AND ura.is_active = true
             AND (ura.expires_at IS NULL OR ura.expires_at > now())
         ))
         AND p.is_active = true
       UNION
       SELECT tp.permission_key
       FROM temporary_permissions tp
       WHERE tp.user_id = user_id_param
         AND tp.is_active = true
         AND tp.expires_at > now()
      ), '[]'::jsonb
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- 3. دالة محسنة لإحصائيات Dashboard
CREATE OR REPLACE FUNCTION public.get_dashboard_stats_optimized(clinic_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'active_patients', (
      SELECT COUNT(*) 
      FROM patients 
      WHERE clinic_id = clinic_id_param 
        AND patient_status = 'active'
    ),
    'today_appointments', (
      SELECT COUNT(*) 
      FROM appointments 
      WHERE clinic_id = clinic_id_param 
        AND appointment_date::date = CURRENT_DATE
        AND status IN ('scheduled', 'confirmed')
    ),
    'total_debt', (
      SELECT COALESCE(SUM(balance_due), 0)::numeric 
      FROM invoices 
      WHERE clinic_id = clinic_id_param 
        AND status != 'paid' 
        AND balance_due > 0
    ),
    'low_stock_items', (
      SELECT COUNT(*) 
      FROM medical_supplies 
      WHERE clinic_id = clinic_id_param 
        AND current_stock <= minimum_stock
        AND is_active = true
    ),
    'pending_invoices', (
      SELECT COUNT(*) 
      FROM invoices 
      WHERE clinic_id = clinic_id_param 
        AND status = 'pending'
    ),
    'this_week_appointments', (
      SELECT COUNT(*) 
      FROM appointments 
      WHERE clinic_id = clinic_id_param 
        AND appointment_date >= date_trunc('week', CURRENT_DATE)
        AND appointment_date < date_trunc('week', CURRENT_DATE) + INTERVAL '1 week'
    ),
    'this_month_revenue', (
      SELECT COALESCE(SUM(paid_amount), 0)::numeric
      FROM invoices 
      WHERE clinic_id = clinic_id_param 
        AND DATE_TRUNC('month', issue_date) = DATE_TRUNC('month', CURRENT_DATE)
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 4. إنشاء Indexes محسنة (بدون دوال غير ثابتة في predicates)
-- Patients
CREATE INDEX IF NOT EXISTS idx_patients_clinic_status 
ON patients(clinic_id, patient_status) 
WHERE patient_status = 'active';

CREATE INDEX IF NOT EXISTS idx_patients_clinic_created 
ON patients(clinic_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patients_search_name 
ON patients USING gin(to_tsvector('simple', full_name));

-- Appointments - الأكثر استخداماً
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date 
ON appointments(clinic_id, appointment_date DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_clinic_status 
ON appointments(clinic_id, status, appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointments_patient 
ON appointments(patient_id, appointment_date DESC);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_clinic_status 
ON invoices(clinic_id, status) 
WHERE status != 'paid';

CREATE INDEX IF NOT EXISTS idx_invoices_clinic_balance 
ON invoices(clinic_id, balance_due) 
WHERE balance_due > 0;

CREATE INDEX IF NOT EXISTS idx_invoices_clinic_date 
ON invoices(clinic_id, issue_date DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_patient 
ON invoices(patient_id, issue_date DESC);

-- Medical Supplies
CREATE INDEX IF NOT EXISTS idx_supplies_clinic_active 
ON medical_supplies(clinic_id, current_stock, minimum_stock) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_supplies_clinic_expiry 
ON medical_supplies(clinic_id, expiry_date) 
WHERE is_active = true AND expiry_date IS NOT NULL;

-- Medical Images
CREATE INDEX IF NOT EXISTS idx_medical_images_patient_date 
ON medical_images(patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_medical_images_clinic 
ON medical_images(clinic_id, created_at DESC);

-- Security Events
CREATE INDEX IF NOT EXISTS idx_security_events_date 
ON security_events(created_at DESC, event_category);

CREATE INDEX IF NOT EXISTS idx_security_events_user 
ON security_events(user_id, created_at DESC);

-- Medical Records
CREATE INDEX IF NOT EXISTS idx_medical_records_patient 
ON medical_records(patient_id, treatment_date DESC);

CREATE INDEX IF NOT EXISTS idx_medical_records_clinic 
ON medical_records(clinic_id, created_at DESC);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_invoice 
ON payments(invoice_id, payment_date DESC);

-- 5. تعليقات للدوال
COMMENT ON FUNCTION public.check_user_role IS 'دالة أمنة للتحقق من دور المستخدم بدون infinite recursion';
COMMENT ON FUNCTION public.get_user_complete_permissions IS 'دالة موحدة للحصول على جميع الأذونات والأدوار في استدعاء واحد - تقلل من 3 استدعاءات إلى 1';
COMMENT ON FUNCTION public.get_dashboard_stats_optimized IS 'دالة محسنة للحصول على إحصائيات Dashboard في استدعاء واحد - تقلل من 7 استدعاءات إلى 1';