-- إنشاء فهارس أساسية لتحسين الأداء

-- فهارس جدول المرضى (patients)
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id_status ON public.patients(clinic_id, patient_status);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_created_at_desc ON public.patients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patients_date_of_birth ON public.patients(date_of_birth) WHERE date_of_birth IS NOT NULL;

-- فهارس جدول المواعيد (appointments)
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_patient_date ON public.appointments(clinic_id, patient_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON public.appointments(appointment_date DESC, status);
CREATE INDEX IF NOT EXISTS idx_appointments_status_scheduled ON public.appointments(status, appointment_date) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_appointments_status_confirmed ON public.appointments(status, appointment_date) WHERE status = 'confirmed';

-- فهارس جدول السجلات الطبية (medical_records)
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_clinic ON public.medical_records(patient_id, clinic_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_created_at_desc ON public.medical_records(created_at DESC);

-- فهارس جدول الصور الطبية (medical_images)
CREATE INDEX IF NOT EXISTS idx_medical_images_patient_clinic ON public.medical_images(patient_id, clinic_id);
CREATE INDEX IF NOT EXISTS idx_medical_images_uploaded_at_desc ON public.medical_images(uploaded_at DESC);

-- فهارس جدول الفواتير (invoices)
CREATE INDEX IF NOT EXISTS idx_invoices_clinic_status ON public.invoices(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_clinic ON public.invoices(patient_id, clinic_id);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date_desc ON public.invoices(issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date_unpaid ON public.invoices(due_date) WHERE status != 'paid';
CREATE INDEX IF NOT EXISTS idx_invoices_balance_due_positive ON public.invoices(balance_due) WHERE balance_due > 0;

-- فهارس جدول المدفوعات (payments)
CREATE INDEX IF NOT EXISTS idx_payments_date_status ON public.payments(payment_date DESC, status);

-- فهارس جدول الإمدادات الطبية (medical_supplies)
CREATE INDEX IF NOT EXISTS idx_supplies_clinic_active ON public.medical_supplies(clinic_id, is_active);
CREATE INDEX IF NOT EXISTS idx_supplies_low_stock ON public.medical_supplies(clinic_id, current_stock, minimum_stock) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_supplies_category_active ON public.medical_supplies(category, clinic_id) WHERE is_active = true;

-- فهارس جدول الأطباء المساعدين (doctor_assistants)
CREATE INDEX IF NOT EXISTS idx_doctor_assistants_clinic ON public.doctor_assistants(clinic_id);

-- فهارس جدول الوصفات الطبية (prescriptions)
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_clinic ON public.prescriptions(patient_id, clinic_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_date_desc ON public.prescriptions(prescription_date DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status_clinic ON public.prescriptions(status, clinic_id);

-- فهارس جدول الإشعارات (notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_clinic_unread ON public.notifications(clinic_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON public.notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_priority_type ON public.notifications(priority, type, clinic_id);

-- فهارس جدول ملاحظات الأسنان (tooth_notes)
CREATE INDEX IF NOT EXISTS idx_tooth_notes_patient_tooth ON public.tooth_notes(patient_id, tooth_number);
CREATE INDEX IF NOT EXISTS idx_tooth_notes_clinic_date ON public.tooth_notes(clinic_id, examination_date DESC);
CREATE INDEX IF NOT EXISTS idx_tooth_notes_status_priority ON public.tooth_notes(status, priority);

-- فهارس جدول الأحداث الأمنية (security_events)
CREATE INDEX IF NOT EXISTS idx_security_events_user_date ON public.security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_high_risk ON public.security_events(risk_score DESC) WHERE risk_score >= 50;
CREATE INDEX IF NOT EXISTS idx_security_events_category_date ON public.security_events(event_category, created_at DESC);

-- فهارس جدول التنبيهات الأمنية (security_alerts)
CREATE INDEX IF NOT EXISTS idx_security_alerts_clinic_status ON public.security_alerts(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity_date ON public.security_alerts(severity, created_at DESC);

-- فهارس جدول أوامر الشراء (purchase_orders)
CREATE INDEX IF NOT EXISTS idx_purchase_orders_clinic_status ON public.purchase_orders(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date_desc ON public.purchase_orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_clinic ON public.purchase_orders(supplier, clinic_id);

-- فهارس جدول حركة المخزون (stock_movements)
CREATE INDEX IF NOT EXISTS idx_stock_movements_supply_date ON public.stock_movements(supply_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_clinic_type ON public.stock_movements(clinic_id, movement_type);

-- فهارس الجداول المساعدة
CREATE INDEX IF NOT EXISTS idx_profiles_user_clinic ON public.profiles(user_id, clinic_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_status ON public.profiles(role, status);