-- ===== إصلاح المشاكل الأمنية الحرجة =====

-- 1. حل مشكلة RLS المتكررة في user_role_assignments
-- إزالة جميع policies الحالية للجدول
DROP POLICY IF EXISTS "Users can manage their own role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_role_assignments;
DROP POLICY IF EXISTS "Admins can manage all role assignments" ON user_role_assignments;

-- إنشاء Security Definer function لتجنب التكرار
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- إنشاء function للتحقق من كون المستخدم admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
$$;

-- إنشاء policies جديدة وآمنة لـ user_role_assignments
CREATE POLICY "Admins can manage role assignments" 
ON user_role_assignments FOR ALL 
USING (public.is_admin_user());

CREATE POLICY "Users can view their own role assignments" 
ON user_role_assignments FOR SELECT 
USING (user_id = auth.uid());

-- 2. تأمين جدول appointment_requests (مشكلة حرجة)
-- إزالة أي policies عامة خاطئة
DROP POLICY IF EXISTS "Public can create appointment requests" ON appointment_requests;
DROP POLICY IF EXISTS "Anyone can create appointment requests" ON appointment_requests;

-- إنشاء policies آمنة لـ appointment_requests
CREATE POLICY "Clinic owners can view their appointment requests" 
ON appointment_requests FOR SELECT 
USING (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Clinic owners can update their appointment requests" 
ON appointment_requests FOR UPDATE 
USING (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Rate limited public appointment requests" 
ON appointment_requests FOR INSERT 
WITH CHECK (
  check_appointment_request_rate_limit(request_ip) 
  AND clinic_id IS NOT NULL
);

-- 3. تأمين جدول doctor_applications (مشكلة حرجة)
-- إزالة أي policies عامة خاطئة
DROP POLICY IF EXISTS "Public can create doctor applications" ON doctor_applications;
DROP POLICY IF EXISTS "Anyone can create doctor applications" ON doctor_applications;

-- إنشاء policies آمنة لـ doctor_applications
CREATE POLICY "Admins can view all doctor applications" 
ON doctor_applications FOR SELECT 
USING (public.is_admin_user());

CREATE POLICY "Admins can update doctor applications" 
ON doctor_applications FOR UPDATE 
USING (public.is_admin_user());

CREATE POLICY "Rate limited doctor applications" 
ON doctor_applications FOR INSERT 
WITH CHECK (
  check_doctor_application_rate_limit(request_ip) 
  AND full_name IS NOT NULL 
  AND email IS NOT NULL
);

-- 4. تحسين نظام الأمان العام
-- إنشاء function للتحقق من صلاحيات محددة
CREATE OR REPLACE FUNCTION public.has_clinic_permission(target_clinic_id UUID)
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT CASE 
    WHEN public.is_admin_user() THEN TRUE
    WHEN target_clinic_id = (SELECT id FROM get_current_user_profile()) THEN TRUE
    ELSE FALSE
  END;
$$;

-- 5. إضافة تدقيق أمني للعمليات الحساسة
CREATE OR REPLACE FUNCTION public.log_sensitive_operation()
RETURNS TRIGGER AS $$
BEGIN
  -- تسجيل العمليات الحساسة
  INSERT INTO audit_log (
    table_name, 
    operation, 
    old_data, 
    new_data, 
    user_id,
    ip_address
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid(),
    inet_client_addr()
  );
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إضافة triggers للجداول الحساسة
DROP TRIGGER IF EXISTS sensitive_appointment_requests_audit ON appointment_requests;
CREATE TRIGGER sensitive_appointment_requests_audit
  AFTER INSERT OR UPDATE OR DELETE ON appointment_requests
  FOR EACH ROW EXECUTE FUNCTION log_sensitive_operation();

DROP TRIGGER IF EXISTS sensitive_doctor_applications_audit ON doctor_applications;
CREATE TRIGGER sensitive_doctor_applications_audit
  AFTER INSERT OR UPDATE OR DELETE ON doctor_applications
  FOR EACH ROW EXECUTE FUNCTION log_sensitive_operation();

-- 6. تحسين عمليات البحث والفهرسة للأمان
CREATE INDEX IF NOT EXISTS idx_appointment_requests_clinic_security 
ON appointment_requests(clinic_id, created_at) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_doctor_applications_security 
ON doctor_applications(status, created_at) 
WHERE status = 'pending';

-- 7. إضافة قيود إضافية للأمان
-- تحديد حد أقصى لطلبات المواعيد لكل IP
CREATE OR REPLACE FUNCTION public.enhanced_appointment_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- التحقق من عدد الطلبات في الساعة الواحدة
  IF (SELECT COUNT(*) FROM appointment_requests 
      WHERE request_ip = NEW.request_ip 
      AND created_at > NOW() - INTERVAL '1 hour') > 3 THEN
    RAISE EXCEPTION 'تم تجاوز الحد المسموح من طلبات المواعيد لهذا العنوان';
  END IF;
  
  -- التحقق من عدم وجود طلب مكرر لنفس المريض
  IF (SELECT COUNT(*) FROM appointment_requests 
      WHERE patient_email = NEW.patient_email 
      AND clinic_id = NEW.clinic_id
      AND status = 'pending'
      AND created_at > NOW() - INTERVAL '24 hours') > 0 THEN
    RAISE EXCEPTION 'يوجد طلب موعد معلق بالفعل لهذا المريض';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS appointment_requests_rate_limit ON appointment_requests;
CREATE TRIGGER appointment_requests_rate_limit
  BEFORE INSERT ON appointment_requests
  FOR EACH ROW EXECUTE FUNCTION enhanced_appointment_rate_limit();