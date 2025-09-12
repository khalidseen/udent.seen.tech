-- إنشاء فهارس أساسية للجداول الموجودة فقط

-- فهارس جدول المرضى (patients)
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id_status ON public.patients(clinic_id, patient_status);
CREATE INDEX IF NOT EXISTS idx_patients_created_at_desc ON public.patients(created_at DESC);

-- فهارس جدول المواعيد (appointments)
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_patient_date ON public.appointments(clinic_id, patient_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_date_desc ON public.appointments(appointment_date DESC);

-- فهارس جدول الفواتير (invoices)
CREATE INDEX IF NOT EXISTS idx_invoices_clinic_status ON public.invoices(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_clinic ON public.invoices(patient_id, clinic_id);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date_desc ON public.invoices(issue_date DESC);

-- فهارس جدول الإمدادات الطبية (medical_supplies)
CREATE INDEX IF NOT EXISTS idx_supplies_clinic_active ON public.medical_supplies(clinic_id, is_active);

-- فهارس جدول الأطباء المساعدين (doctor_assistants)
CREATE INDEX IF NOT EXISTS idx_doctor_assistants_clinic ON public.doctor_assistants(clinic_id);

-- فهارس جدول الوصفات الطبية (prescriptions)
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_clinic ON public.prescriptions(patient_id, clinic_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_date_desc ON public.prescriptions(prescription_date DESC);

-- فهارس جدول ملاحظات الأسنان (tooth_notes)
CREATE INDEX IF NOT EXISTS idx_tooth_notes_patient_tooth ON public.tooth_notes(patient_id, tooth_number);
CREATE INDEX IF NOT EXISTS idx_tooth_notes_clinic_date ON public.tooth_notes(clinic_id, examination_date DESC);

-- فهارس جدول الأحداث الأمنية (security_events)
CREATE INDEX IF NOT EXISTS idx_security_events_user_date ON public.security_events(user_id, created_at DESC);

-- فهارس جدول التنبيهات الأمنية (security_alerts)
CREATE INDEX IF NOT EXISTS idx_security_alerts_clinic_status ON public.security_alerts(clinic_id, status);

-- فهارس جدول أوامر الشراء (purchase_orders)
CREATE INDEX IF NOT EXISTS idx_purchase_orders_clinic_status ON public.purchase_orders(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date_desc ON public.purchase_orders(order_date DESC);

-- فهارس جدول حركة المخزون (stock_movements)
CREATE INDEX IF NOT EXISTS idx_stock_movements_supply_date ON public.stock_movements(supply_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_clinic_type ON public.stock_movements(clinic_id, movement_type);

-- فهارس الجداول المساعدة
CREATE INDEX IF NOT EXISTS idx_profiles_user_clinic ON public.profiles(user_id, clinic_id);