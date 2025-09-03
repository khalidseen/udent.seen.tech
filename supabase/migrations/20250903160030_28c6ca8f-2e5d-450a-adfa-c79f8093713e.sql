-- Add indexes for better query performance on patients table (without CONCURRENTLY)
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id_created_at 
ON patients (clinic_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patients_full_name 
ON patients (full_name);

CREATE INDEX IF NOT EXISTS idx_patients_phone 
ON patients (phone);

CREATE INDEX IF NOT EXISTS idx_patients_email 
ON patients (email);