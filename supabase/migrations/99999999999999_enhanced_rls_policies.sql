-- ====================================================================
-- مراجعة وتحسين سياسات Row Level Security (RLS)
-- نظام UDent - إدارة العيادات
-- ====================================================================
-- 
-- هذا الملف يحتوي على جميع سياسات RLS المحسّنة للنظام
-- يضمن الأمان التام على مستوى الصفوف في قاعدة البيانات
--
-- ====================================================================

-- ====================================================================
-- الجزء 1: مسح السياسات القديمة وإعادة تفعيل RLS
-- ====================================================================

-- تعطيل السياسات القديمة للجداول الرئيسية
DROP POLICY IF EXISTS "Users can access their clinic data" ON patients;
DROP POLICY IF EXISTS "Users can insert their clinic data" ON patients;
DROP POLICY IF EXISTS "Users can update their clinic data" ON patients;
DROP POLICY IF EXISTS "Users can delete their clinic data" ON patients;

DROP POLICY IF EXISTS "Users can access their clinic data" ON appointments;
DROP POLICY IF EXISTS "Users can insert their clinic data" ON appointments;
DROP POLICY IF EXISTS "Users can update their clinic data" ON appointments;
DROP POLICY IF EXISTS "Users can delete their clinic data" ON appointments;

DROP POLICY IF EXISTS "Users can access their clinic data" ON invoices;
DROP POLICY IF EXISTS "Users can insert their clinic data" ON invoices;
DROP POLICY IF EXISTS "Users can update their clinic data" ON invoices;
DROP POLICY IF EXISTS "Users can delete their clinic data" ON invoices;

DROP POLICY IF EXISTS "Users can access their clinic data" ON treatments;
DROP POLICY IF EXISTS "Users can insert their clinic data" ON treatments;
DROP POLICY IF EXISTS "Users can update their clinic data" ON treatments;
DROP POLICY IF EXISTS "Users can delete their clinic data" ON treatments;

DROP POLICY IF EXISTS "Users can access their clinic data" ON payments;
DROP POLICY IF EXISTS "Users can insert their clinic data" ON payments;
DROP POLICY IF EXISTS "Users can update their clinic data" ON payments;
DROP POLICY IF EXISTS "Users can delete their clinic data" ON payments;

-- التأكد من تفعيل RLS على جميع الجداول
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dental_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- الجزء 2: دوال مساعدة للتحقق من الصلاحيات
-- ====================================================================

-- دالة للحصول على clinic_id للمستخدم الحالي
CREATE OR REPLACE FUNCTION get_user_clinic_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT clinic_id 
    FROM profiles 
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة للتحقق من دور المستخدم
CREATE OR REPLACE FUNCTION check_user_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة للتحقق من أن المستخدم صاحب أو مدير
CREATE OR REPLACE FUNCTION is_admin_or_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- الجزء 3: سياسات جدول Profiles
-- ====================================================================

-- المستخدمون يمكنهم رؤية ملفاتهم الشخصية فقط
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- المستخدمون يمكنهم رؤية زملائهم في نفس العيادة
CREATE POLICY "Users can view colleagues in same clinic"
  ON profiles
  FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

-- المستخدمون يمكنهم تحديث ملفاتهم فقط
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ====================================================================
-- الجزء 4: سياسات جدول Clinics
-- ====================================================================

-- المستخدمون يمكنهم رؤية عياداتهم فقط
CREATE POLICY "Users can view their clinic"
  ON clinics
  FOR SELECT
  USING (
    id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

-- فقط الملاك يمكنهم تعديل بيانات العيادة
CREATE POLICY "Only owners can update clinic"
  ON clinics
  FOR UPDATE
  USING (
    id IN (
      SELECT clinic_id FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  )
  WITH CHECK (
    id IN (
      SELECT clinic_id FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- منع حذف العيادات (يجب أن يتم عبر إجراء خاص)
CREATE POLICY "Prevent clinic deletion"
  ON clinics
  FOR DELETE
  USING (false);

-- ====================================================================
-- الجزء 5: سياسات جدول Patients
-- ====================================================================

-- المستخدمون يمكنهم رؤية مرضى عيادتهم فقط
CREATE POLICY "Users can view their clinic patients"
  ON patients
  FOR SELECT
  USING (
    clinic_id = get_user_clinic_id()
  );

-- المستخدمون يمكنهم إضافة مرضى لعيادتهم
CREATE POLICY "Users can add patients to their clinic"
  ON patients
  FOR INSERT
  WITH CHECK (
    clinic_id = get_user_clinic_id()
  );

-- المستخدمون يمكنهم تحديث بيانات مرضى عيادتهم
CREATE POLICY "Users can update their clinic patients"
  ON patients
  FOR UPDATE
  USING (
    clinic_id = get_user_clinic_id()
  )
  WITH CHECK (
    clinic_id = get_user_clinic_id()
  );

-- فقط المدراء والملاك يمكنهم حذف المرضى
CREATE POLICY "Only admins can delete patients"
  ON patients
  FOR DELETE
  USING (
    clinic_id = get_user_clinic_id() AND
    is_admin_or_owner()
  );

-- ====================================================================
-- الجزء 6: سياسات جدول Doctors
-- ====================================================================

-- المستخدمون يمكنهم رؤية أطباء عيادتهم
CREATE POLICY "Users can view their clinic doctors"
  ON doctors
  FOR SELECT
  USING (
    clinic_id = get_user_clinic_id()
  );

-- فقط المدراء والملاك يمكنهم إضافة أطباء
CREATE POLICY "Only admins can add doctors"
  ON doctors
  FOR INSERT
  WITH CHECK (
    clinic_id = get_user_clinic_id() AND
    is_admin_or_owner()
  );

-- فقط المدراء والملاك يمكنهم تحديث بيانات الأطباء
CREATE POLICY "Only admins can update doctors"
  ON doctors
  FOR UPDATE
  USING (
    clinic_id = get_user_clinic_id() AND
    is_admin_or_owner()
  )
  WITH CHECK (
    clinic_id = get_user_clinic_id() AND
    is_admin_or_owner()
  );

-- فقط الملاك يمكنهم حذف الأطباء
CREATE POLICY "Only owners can delete doctors"
  ON doctors
  FOR DELETE
  USING (
    clinic_id = get_user_clinic_id() AND
    check_user_role('owner')
  );

-- ====================================================================
-- الجزء 7: سياسات جدول Appointments
-- ====================================================================

-- المستخدمون يمكنهم رؤية مواعيد عيادتهم
CREATE POLICY "Users can view their clinic appointments"
  ON appointments
  FOR SELECT
  USING (
    clinic_id = get_user_clinic_id()
  );

-- المستخدمون يمكنهم إضافة مواعيد لعيادتهم
CREATE POLICY "Users can add appointments to their clinic"
  ON appointments
  FOR INSERT
  WITH CHECK (
    clinic_id = get_user_clinic_id() AND
    patient_id IN (
      SELECT id FROM patients WHERE clinic_id = get_user_clinic_id()
    )
  );

-- المستخدمون يمكنهم تحديث مواعيد عيادتهم
CREATE POLICY "Users can update their clinic appointments"
  ON appointments
  FOR UPDATE
  USING (
    clinic_id = get_user_clinic_id()
  )
  WITH CHECK (
    clinic_id = get_user_clinic_id()
  );

-- المستخدمون يمكنهم إلغاء المواعيد (تغيير الحالة فقط)
-- الحذف الكامل محظور
CREATE POLICY "Users can cancel appointments"
  ON appointments
  FOR DELETE
  USING (
    clinic_id = get_user_clinic_id() AND
    status IN ('scheduled', 'confirmed')
  );

-- ====================================================================
-- الجزء 8: سياسات جدول Treatments
-- ====================================================================

-- المستخدمون يمكنهم رؤية علاجات مرضى عيادتهم
CREATE POLICY "Users can view their clinic treatments"
  ON treatments
  FOR SELECT
  USING (
    clinic_id = get_user_clinic_id()
  );

-- المستخدمون يمكنهم إضافة علاجات لمرضى عيادتهم
CREATE POLICY "Users can add treatments"
  ON treatments
  FOR INSERT
  WITH CHECK (
    clinic_id = get_user_clinic_id() AND
    patient_id IN (
      SELECT id FROM patients WHERE clinic_id = get_user_clinic_id()
    )
  );

-- المستخدمون يمكنهم تحديث علاجات عيادتهم
CREATE POLICY "Users can update treatments"
  ON treatments
  FOR UPDATE
  USING (
    clinic_id = get_user_clinic_id()
  )
  WITH CHECK (
    clinic_id = get_user_clinic_id()
  );

-- فقط المدراء يمكنهم حذف العلاجات
CREATE POLICY "Only admins can delete treatments"
  ON treatments
  FOR DELETE
  USING (
    clinic_id = get_user_clinic_id() AND
    is_admin_or_owner()
  );

-- ====================================================================
-- الجزء 9: سياسات جدول Invoices
-- ====================================================================

-- المستخدمون يمكنهم رؤية فواتير عيادتهم
CREATE POLICY "Users can view their clinic invoices"
  ON invoices
  FOR SELECT
  USING (
    clinic_id = get_user_clinic_id()
  );

-- المستخدمون يمكنهم إنشاء فواتير لمرضى عيادتهم
CREATE POLICY "Users can create invoices"
  ON invoices
  FOR INSERT
  WITH CHECK (
    clinic_id = get_user_clinic_id() AND
    patient_id IN (
      SELECT id FROM patients WHERE clinic_id = get_user_clinic_id()
    )
  );

-- المستخدمون يمكنهم تحديث الفواتير غير المدفوعة فقط
CREATE POLICY "Users can update unpaid invoices"
  ON invoices
  FOR UPDATE
  USING (
    clinic_id = get_user_clinic_id() AND
    status != 'paid'
  )
  WITH CHECK (
    clinic_id = get_user_clinic_id()
  );

-- منع حذف الفواتير المدفوعة
CREATE POLICY "Prevent deletion of paid invoices"
  ON invoices
  FOR DELETE
  USING (
    clinic_id = get_user_clinic_id() AND
    status != 'paid' AND
    is_admin_or_owner()
  );

-- ====================================================================
-- الجزء 10: سياسات جدول Payments
-- ====================================================================

-- المستخدمون يمكنهم رؤية دفعات عيادتهم
CREATE POLICY "Users can view their clinic payments"
  ON payments
  FOR SELECT
  USING (
    clinic_id = get_user_clinic_id()
  );

-- المستخدمون يمكنهم إضافة دفعات
CREATE POLICY "Users can add payments"
  ON payments
  FOR INSERT
  WITH CHECK (
    clinic_id = get_user_clinic_id() AND
    invoice_id IN (
      SELECT id FROM invoices WHERE clinic_id = get_user_clinic_id()
    )
  );

-- فقط المدراء يمكنهم تعديل الدفعات
CREATE POLICY "Only admins can update payments"
  ON payments
  FOR UPDATE
  USING (
    clinic_id = get_user_clinic_id() AND
    is_admin_or_owner()
  )
  WITH CHECK (
    clinic_id = get_user_clinic_id() AND
    is_admin_or_owner()
  );

-- منع حذف الدفعات المكتملة
CREATE POLICY "Prevent deletion of completed payments"
  ON payments
  FOR DELETE
  USING (
    clinic_id = get_user_clinic_id() AND
    status != 'completed' AND
    is_admin_or_owner()
  );

-- ====================================================================
-- الجزء 11: سياسات جدول Dental Charts
-- ====================================================================

-- المستخدمون يمكنهم رؤية الرسوم السنية لمرضى عيادتهم
CREATE POLICY "Users can view their clinic dental charts"
  ON dental_charts
  FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE clinic_id = get_user_clinic_id()
    )
  );

-- المستخدمون يمكنهم إضافة رسوم سنية
CREATE POLICY "Users can add dental charts"
  ON dental_charts
  FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE clinic_id = get_user_clinic_id()
    )
  );

-- المستخدمون يمكنهم تحديث الرسوم السنية
CREATE POLICY "Users can update dental charts"
  ON dental_charts
  FOR UPDATE
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE clinic_id = get_user_clinic_id()
    )
  )
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE clinic_id = get_user_clinic_id()
    )
  );

-- منع حذف الرسوم السنية (للسجل التاريخي)
CREATE POLICY "Prevent deletion of dental charts"
  ON dental_charts
  FOR DELETE
  USING (false);

-- ====================================================================
-- الجزء 12: سياسات جدول Medical Records
-- ====================================================================

-- المستخدمون يمكنهم رؤية السجلات الطبية لمرضى عيادتهم
CREATE POLICY "Users can view medical records"
  ON medical_records
  FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE clinic_id = get_user_clinic_id()
    )
  );

-- المستخدمون يمكنهم إضافة سجلات طبية
CREATE POLICY "Users can add medical records"
  ON medical_records
  FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE clinic_id = get_user_clinic_id()
    )
  );

-- فقط منشئ السجل يمكنه تعديله خلال 24 ساعة
CREATE POLICY "Users can update their own recent records"
  ON medical_records
  FOR UPDATE
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE clinic_id = get_user_clinic_id()
    ) AND
    created_by = auth.uid() AND
    created_at > NOW() - INTERVAL '24 hours'
  )
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE clinic_id = get_user_clinic_id()
    )
  );

-- منع حذف السجلات الطبية (للامتثال القانوني)
CREATE POLICY "Prevent deletion of medical records"
  ON medical_records
  FOR DELETE
  USING (false);

-- ====================================================================
-- الجزء 13: سياسات جدول User Roles
-- ====================================================================

-- المستخدمون يمكنهم رؤية أدوار زملائهم
CREATE POLICY "Users can view roles in their clinic"
  ON user_roles
  FOR SELECT
  USING (
    clinic_id = get_user_clinic_id()
  );

-- فقط الملاك يمكنهم إضافة أو تعديل الأدوار
CREATE POLICY "Only owners can manage roles"
  ON user_roles
  FOR ALL
  USING (
    clinic_id = get_user_clinic_id() AND
    check_user_role('owner')
  )
  WITH CHECK (
    clinic_id = get_user_clinic_id() AND
    check_user_role('owner')
  );

-- ====================================================================
-- الجزء 14: إنشاء Indexes لتحسين الأداء
-- ====================================================================

-- Indexes على clinic_id في جميع الجداول
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doctors_clinic_id ON doctors(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatments_clinic_id ON treatments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_invoices_clinic_id ON invoices(clinic_id);
CREATE INDEX IF NOT EXISTS idx_payments_clinic_id ON payments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_clinic_id ON user_roles(clinic_id);

-- Indexes على العلاقات
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_treatments_patient_id ON treatments(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);

-- Indexes على التواريخ للبحث السريع
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_treatments_date ON treatments(treatment_date);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- ====================================================================
-- الجزء 15: تقرير تدقيق الأمان
-- ====================================================================

-- عرض جميع الجداول التي لديها RLS مفعّل
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- عرض جميع السياسات المفعّلة
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ====================================================================
-- نهاية ملف سياسات RLS
-- ====================================================================
