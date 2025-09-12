-- Add indexes for better query performance on patients table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_clinic_id_created_at 
ON patients (clinic_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_search_fields 
ON patients USING gin(to_tsvector('arabic', full_name || ' ' || COALESCE(phone, '') || ' ' || COALESCE(email, '') || ' ' || COALESCE(national_id, '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_full_name 
ON patients (full_name);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_phone 
ON patients (phone);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_email 
ON patients (email);

-- Create an optimized RPC function for fetching patients
CREATE OR REPLACE FUNCTION get_patients_optimized(
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
  search_query TEXT;
  order_clause TEXT;
  query_text TEXT;
  total_patients BIGINT;
BEGIN
  -- Build search query
  search_query := '';
  IF p_search IS NOT NULL AND p_search != '' THEN
    search_query := ' AND (
      p.full_name ILIKE ''%' || p_search || '%'' OR
      p.phone ILIKE ''%' || p_search || '%'' OR
      p.email ILIKE ''%' || p_search || '%'' OR
      p.national_id ILIKE ''%' || p_search || '%''
    )';
  END IF;

  -- Build order clause
  IF p_ascending THEN
    order_clause := 'ORDER BY p.' || p_order_by || ' ASC';
  ELSE
    order_clause := 'ORDER BY p.' || p_order_by || ' DESC';
  END IF;

  -- Get total count first
  query_text := 'SELECT COUNT(*) FROM patients p WHERE p.clinic_id = $1' || search_query;
  EXECUTE query_text INTO total_patients USING p_clinic_id;

  -- Build and execute main query
  query_text := '
    SELECT 
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
      d.full_name as assigned_doctor_name,
      $4::BIGINT as total_count
    FROM patients p
    LEFT JOIN doctors d ON p.assigned_doctor_id = d.id
    WHERE p.clinic_id = $1' || search_query || '
    ' || order_clause || '
    LIMIT $2 OFFSET $3';

  RETURN QUERY EXECUTE query_text 
    USING p_clinic_id, p_limit, p_offset, total_patients;
END;
$$;