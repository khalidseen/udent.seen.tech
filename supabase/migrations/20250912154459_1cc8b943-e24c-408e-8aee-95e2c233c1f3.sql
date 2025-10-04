-- إضافة indexes محسنة للأداء  
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id_name ON public.patients(clinic_id, full_name);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON public.patients(created_at);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_email ON public.patients(email) WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_date_patient ON public.appointments(appointment_date, patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date ON public.appointments(clinic_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient_date ON public.medical_records(patient_id, created_at);
CREATE INDEX IF NOT EXISTS idx_medical_records_clinic ON public.medical_records(clinic_id);

-- تحسين استعلامات البحث
CREATE INDEX IF NOT EXISTS idx_patients_search ON public.patients 
USING gin(to_tsvector('arabic', coalesce(full_name, '') || ' ' || coalesce(phone, '') || ' ' || coalesce(email, '')));

-- تحسين RLS policies للأداء
DROP POLICY IF EXISTS "Users can view patients from their clinic" ON public.patients;
CREATE POLICY "Users can view patients from their clinic" ON public.patients
  FOR SELECT USING (
    clinic_id IN (
      SELECT cm.clinic_id 
      FROM public.clinic_members cm 
      WHERE cm.user_id = auth.uid()
    )
    OR is_super_admin()
  );

-- تحسين policy للمواعيد
DROP POLICY IF EXISTS "Users can view appointments from their clinic" ON public.appointments;
CREATE POLICY "Users can view appointments from their clinic" ON public.appointments
  FOR SELECT USING (
    clinic_id IN (
      SELECT p.clinic_id
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
    OR is_super_admin()
  );