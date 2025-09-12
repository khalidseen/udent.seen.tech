-- إنشاء فهارس لتحسين أداء قاعدة البيانات

-- فهارس جدول المرضى (patients)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_clinic_id_status ON public.patients(clinic_id, patient_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_full_name ON public.patients USING gin(to_tsvector('arabic', full_name));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_phone ON public.patients(phone) WHERE phone IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_created_at_desc ON public.patients(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_date_of_birth ON public.patients(date_of_birth) WHERE date_of_birth IS NOT NULL;

-- فهارس جدول المواعيد (appointments)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_clinic_patient_date ON public.appointments(clinic_id, patient_id, appointment_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_date_status ON public.appointments(appointment_date DESC, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_status_date ON public.appointments(status, appointment_date) WHERE status IN ('scheduled', 'confirmed');
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_upcoming ON public.appointments(clinic_id, appointment_date) WHERE appointment_date >= CURRENT_DATE AND status IN ('scheduled', 'confirmed');

-- فهارس جدول السجلات الطبية (medical_records)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medical_records_patient_clinic ON public.medical_records(patient_id, clinic_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medical_records_created_at_desc ON public.medical_records(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medical_records_type ON public.medical_records(record_type) WHERE record_type IS NOT NULL;

-- فهارس جدول الصور الطبية (medical_images)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medical_images_patient_clinic ON public.medical_images(patient_id, clinic_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medical_images_record_id ON public.medical_images(medical_record_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medical_images_uploaded_at_desc ON public.medical_images(uploaded_at DESC);

-- فهارس جدول الفواتير (invoices)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_clinic_status ON public.invoices(clinic_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_patient_clinic ON public.invoices(patient_id, clinic_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_issue_date_desc ON public.invoices(issue_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date) WHERE status != 'paid';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_balance_due ON public.invoices(balance_due) WHERE balance_due > 0;

-- فهارس جدول المدفوعات (payments)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_invoice_clinic ON public.payments(invoice_id, clinic_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_date_status ON public.payments(payment_date DESC, status);

-- فهارس جدول الإمدادات الطبية (medical_supplies)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_supplies_clinic_active ON public.medical_supplies(clinic_id, is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_supplies_low_stock ON public.medical_supplies(clinic_id) WHERE current_stock <= minimum_stock AND is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_supplies_expiry_alert ON public.medical_supplies(clinic_id, expiry_date) WHERE expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_supplies_category ON public.medical_supplies(category, clinic_id) WHERE is_active = true;

-- فهارس جدول الأطباء المساعدين (doctor_assistants)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_doctor_assistants_clinic ON public.doctor_assistants(clinic_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_doctor_assistants_name ON public.doctor_assistants USING gin(to_tsvector('arabic', full_name));

-- فهارس جدول الوصفات الطبية (prescriptions)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prescriptions_patient_clinic ON public.prescriptions(patient_id, clinic_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prescriptions_date_desc ON public.prescriptions(prescription_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prescriptions_status ON public.prescriptions(status, clinic_id);

-- فهارس جدول الإشعارات (notifications)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_clinic_unread ON public.notifications(clinic_id, is_read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_scheduled ON public.notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_priority_type ON public.notifications(priority, type, clinic_id);

-- فهارس جدول ملاحظات الأسنان (tooth_notes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tooth_notes_patient_tooth ON public.tooth_notes(patient_id, tooth_number);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tooth_notes_clinic_date ON public.tooth_notes(clinic_id, examination_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tooth_notes_status_priority ON public.tooth_notes(status, priority);

-- فهارس جدول الأحداث الأمنية (security_events)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_user_date ON public.security_events(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_risk_score ON public.security_events(risk_score DESC) WHERE risk_score >= 50;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_category ON public.security_events(event_category, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_unprocessed ON public.security_events(processed_for_alerts, created_at) WHERE processed_for_alerts = false;

-- فهارس جدول التنبيهات الأمنية (security_alerts)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_alerts_clinic_status ON public.security_alerts(clinic_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_alerts_severity_date ON public.security_alerts(severity, created_at DESC);

-- فهارس جدول أوامر الشراء (purchase_orders)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchase_orders_clinic_status ON public.purchase_orders(clinic_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchase_orders_date_desc ON public.purchase_orders(order_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchase_orders_supplier ON public.purchase_orders(supplier, clinic_id);

-- فهارس جدول حركة المخزون (stock_movements)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_movements_supply_date ON public.stock_movements(supply_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_movements_clinic_type ON public.stock_movements(clinic_id, movement_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_movements_reference ON public.stock_movements(reference_type, reference_id) WHERE reference_id IS NOT NULL;

-- فهارس الجداول المساعدة
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_clinic ON public.profiles(user_id, clinic_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role_status ON public.profiles(role, status);

-- فهارس للبحث النصي
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_search ON public.patients USING gin((
  setweight(to_tsvector('arabic', COALESCE(full_name, '')), 'A') ||
  setweight(to_tsvector('arabic', COALESCE(phone, '')), 'B') ||
  setweight(to_tsvector('arabic', COALESCE(national_id, '')), 'C')
));

-- تحديث إحصائيات الجداول
ANALYZE public.patients;
ANALYZE public.appointments;
ANALYZE public.medical_records;
ANALYZE public.invoices;
ANALYZE public.medical_supplies;
ANALYZE public.notifications;