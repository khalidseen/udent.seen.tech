-- إضافة Indexes لتحسين الأداء بشكل كبير (نسخة مصححة)

-- Index للمرضى (البحث والفلترة الأكثر استخداماً)
CREATE INDEX IF NOT EXISTS idx_patients_clinic_name 
ON patients(clinic_id, full_name);

CREATE INDEX IF NOT EXISTS idx_patients_clinic_phone 
ON patients(clinic_id, phone);

CREATE INDEX IF NOT EXISTS idx_patients_clinic_status 
ON patients(clinic_id, patient_status);

CREATE INDEX IF NOT EXISTS idx_patients_clinic_financial 
ON patients(clinic_id, financial_status);

-- Index للمواعيد (الاستعلامات الأكثر تكراراً)
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date 
ON appointments(clinic_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointments_clinic_status 
ON appointments(clinic_id, status);

CREATE INDEX IF NOT EXISTS idx_appointments_patient 
ON appointments(patient_id, appointment_date);

-- Index للفواتير (التقارير المالية)
CREATE INDEX IF NOT EXISTS idx_invoices_clinic_status 
ON invoices(clinic_id, status);

CREATE INDEX IF NOT EXISTS idx_invoices_clinic_balance 
ON invoices(clinic_id, balance_due) WHERE balance_due > 0;

CREATE INDEX IF NOT EXISTS idx_invoices_patient 
ON invoices(patient_id, issue_date);

-- Index للمدفوعات
CREATE INDEX IF NOT EXISTS idx_payments_invoice 
ON payments(invoice_id, payment_date);

CREATE INDEX IF NOT EXISTS idx_payments_clinic 
ON payments(clinic_id, payment_date);

-- Index للصور الطبية
CREATE INDEX IF NOT EXISTS idx_medical_images_patient 
ON medical_images(patient_id, image_date);

-- Index للعلاجات
CREATE INDEX IF NOT EXISTS idx_dental_treatments_patient 
ON dental_treatments(patient_id, treatment_date);

-- Index للوصفات الطبية
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_date
ON prescriptions(patient_id, prescription_date);

-- Index للسجلات السنية
CREATE INDEX IF NOT EXISTS idx_tooth_records_patient
ON tooth_records(patient_id, clinic_id);

-- تحليل الجداول لتحديث إحصائيات المخطط
ANALYZE patients;
ANALYZE appointments;
ANALYZE invoices;
ANALYZE payments;