-- Performance optimization indexes for multi-clinic management (corrected)

-- Indexes for clinics table
CREATE INDEX IF NOT EXISTS idx_clinics_active_subscription 
ON public.clinics (is_active, subscription_plan, subscription_status) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_clinics_created_at 
ON public.clinics (created_at DESC);

-- Indexes for profiles table (user management)
CREATE INDEX IF NOT EXISTS idx_profiles_clinic_role 
ON public.profiles (clinic_id, role) 
WHERE clinic_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_user_clinic 
ON public.profiles (user_id, clinic_id);

-- Indexes for patients table (per clinic performance)
CREATE INDEX IF NOT EXISTS idx_patients_clinic_created 
ON public.patients (clinic_id, created_at DESC);

-- Indexes for appointments table (per clinic performance)
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date 
ON public.appointments (clinic_id, appointment_date DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_clinic_status 
ON public.appointments (clinic_id, status, appointment_date);

-- Indexes for medical_records table
CREATE INDEX IF NOT EXISTS idx_medical_records_clinic_patient 
ON public.medical_records (clinic_id, patient_id, created_at DESC);

-- Indexes for medical_images table
CREATE INDEX IF NOT EXISTS idx_medical_images_clinic_patient 
ON public.medical_images (clinic_id, patient_id, created_at DESC);

-- Indexes for invoices table
CREATE INDEX IF NOT EXISTS idx_invoices_clinic_status 
ON public.invoices (clinic_id, status, created_at DESC);

-- Indexes for clinic_memberships table (for multi-clinic access)
CREATE INDEX IF NOT EXISTS idx_clinic_memberships_user_active 
ON public.clinic_memberships (user_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_clinic_memberships_clinic_role 
ON public.clinic_memberships (clinic_id, role, is_active);

-- Function to get clinic statistics efficiently
CREATE OR REPLACE FUNCTION public.get_clinic_stats_batch()
RETURNS TABLE(
    clinic_id uuid,
    clinic_name text,
    user_count bigint,
    patient_count bigint,
    appointment_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as clinic_id,
        c.name as clinic_name,
        COALESCE(p.user_count, 0) as user_count,
        COALESCE(pt.patient_count, 0) as patient_count,
        COALESCE(a.appointment_count, 0) as appointment_count
    FROM public.clinics c
    LEFT JOIN (
        SELECT clinic_id, COUNT(*) as user_count
        FROM public.profiles
        WHERE clinic_id IS NOT NULL
        GROUP BY clinic_id
    ) p ON c.id = p.clinic_id
    LEFT JOIN (
        SELECT clinic_id, COUNT(*) as patient_count
        FROM public.patients
        GROUP BY clinic_id
    ) pt ON c.id = pt.clinic_id
    LEFT JOIN (
        SELECT clinic_id, COUNT(*) as appointment_count
        FROM public.appointments
        WHERE appointment_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY clinic_id
    ) a ON c.id = a.clinic_id
    ORDER BY c.created_at DESC;
END;
$$;