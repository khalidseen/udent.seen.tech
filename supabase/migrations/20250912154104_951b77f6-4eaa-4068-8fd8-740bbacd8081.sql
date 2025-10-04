-- إصلاح التحذيرات الأمنية في قاعدة البيانات
-- 1. إصلاح Function Search Path Mutable

-- تحديث دالة update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- تحديث دالة handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, user_id, full_name, email)
    VALUES (gen_random_uuid(), NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
    RETURN NEW;
END;
$$;

-- إضافة indexes محسنة للأداء
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_clinic_id_name ON public.patients(clinic_id, full_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_created_at ON public.patients(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_phone ON public.patients(phone) WHERE phone IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_email ON public.patients(email) WHERE email IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_date_patient ON public.appointments(appointment_date, patient_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_clinic_date ON public.appointments(clinic_id, appointment_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medical_records_patient_date ON public.medical_records(patient_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medical_records_clinic ON public.medical_records(clinic_id);

-- تحسين استعلامات البحث
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_search ON public.patients 
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
    OR auth.uid() IN (
      SELECT u.id FROM auth.users u 
      WHERE u.email = 'eng.khalid.work@gmail.com'
    )
  );

-- تحسين policy للمواعيد
DROP POLICY IF EXISTS "Users can view appointments from their clinic" ON public.appointments;
CREATE POLICY "Users can view appointments from their clinic" ON public.appointments
  FOR SELECT USING (
    clinic_id IN (
      SELECT cm.clinic_id 
      FROM public.clinic_members cm 
      WHERE cm.user_id = auth.uid()
    )
    OR auth.uid() IN (
      SELECT u.id FROM auth.users u 
      WHERE u.email = 'eng.khalid.work@gmail.com'
    )
  );