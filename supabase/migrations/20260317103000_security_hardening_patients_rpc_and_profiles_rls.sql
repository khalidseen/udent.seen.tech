-- Security hardening:
-- 1) Replace vulnerable dynamic SQL in get_patients_optimized with validated ordering.
-- 2) Fix profiles RLS policies to use profiles.user_id = auth.uid().
-- 3) Fix helper function get_user_clinic_id to map through user_id.

CREATE OR REPLACE FUNCTION public.get_patients_optimized(
  p_clinic_id UUID,
  p_search TEXT DEFAULT '',
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_order_by TEXT DEFAULT 'created_at',
  p_ascending BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  medical_history TEXT,
  created_at TIMESTAMPTZ,
  national_id TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  patient_status TEXT,
  insurance_info TEXT,
  blood_type TEXT,
  occupation TEXT,
  marital_status TEXT,
  assigned_doctor_id UUID,
  medical_condition TEXT,
  financial_status TEXT,
  assigned_doctor_name TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  safe_order_by TEXT;
  order_direction TEXT;
  search_pattern TEXT;
  total_patients BIGINT;
  query_text TEXT;
BEGIN
  safe_order_by := CASE p_order_by
    WHEN 'created_at' THEN 'created_at'
    WHEN 'full_name' THEN 'full_name'
    WHEN 'phone' THEN 'phone'
    WHEN 'email' THEN 'email'
    WHEN 'date_of_birth' THEN 'date_of_birth'
    ELSE 'created_at'
  END;

  order_direction := CASE WHEN p_ascending THEN 'ASC' ELSE 'DESC' END;
  search_pattern := '%' || COALESCE(p_search, '') || '%';

  SELECT COUNT(*)
  INTO total_patients
  FROM public.patients p
  WHERE p.clinic_id = p_clinic_id
    AND (
      COALESCE(p_search, '') = ''
      OR p.full_name ILIKE search_pattern
      OR p.phone ILIKE search_pattern
      OR p.email ILIKE search_pattern
      OR p.national_id ILIKE search_pattern
    );

  query_text := format(
    'SELECT
      p.id,
      p.full_name,
      p.phone,
      p.email,
      p.date_of_birth,
      p.gender,
      p.address,
      p.medical_history,
      p.created_at,
      p.national_id,
      p.emergency_contact,
      p.emergency_phone,
      p.patient_status,
      p.insurance_info,
      p.blood_type,
      p.occupation,
      p.marital_status,
      p.assigned_doctor_id,
      p.medical_condition,
      p.financial_status,
      d.full_name AS assigned_doctor_name,
      $4::BIGINT AS total_count
    FROM public.patients p
    LEFT JOIN public.doctors d ON p.assigned_doctor_id = d.id
    WHERE p.clinic_id = $1
      AND (
        $2 = ''''
        OR p.full_name ILIKE $3
        OR p.phone ILIKE $3
        OR p.email ILIKE $3
        OR p.national_id ILIKE $3
      )
    ORDER BY p.%I %s
    LIMIT $5 OFFSET $6',
    safe_order_by,
    order_direction
  );

  RETURN QUERY EXECUTE query_text
    USING p_clinic_id, COALESCE(p_search, ''), search_pattern, total_patients, p_limit, p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_clinic_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT clinic_id
    FROM public.profiles
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
