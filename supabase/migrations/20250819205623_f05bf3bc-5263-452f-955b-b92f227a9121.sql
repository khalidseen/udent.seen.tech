-- Fix the search_path security warnings by adding SET search_path TO '' to functions
CREATE OR REPLACE FUNCTION check_appointment_request_rate_limit(ip_address inet)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  request_count integer;
BEGIN
  -- Count requests from this IP in the last hour
  SELECT COUNT(*)
  INTO request_count
  FROM public.appointment_requests
  WHERE request_ip = ip_address
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Allow up to 3 requests per hour per IP
  RETURN request_count < 3;
END;
$$;

CREATE OR REPLACE FUNCTION validate_appointment_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Basic validation
  IF LENGTH(NEW.patient_name) < 2 OR LENGTH(NEW.patient_name) > 100 THEN
    RAISE EXCEPTION 'Patient name must be between 2 and 100 characters';
  END IF;
  
  IF NEW.patient_phone IS NOT NULL AND LENGTH(NEW.patient_phone) < 8 THEN
    RAISE EXCEPTION 'Phone number must be at least 8 characters';
  END IF;
  
  IF NEW.patient_email IS NOT NULL AND NEW.patient_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  IF LENGTH(NEW.condition_description) < 10 OR LENGTH(NEW.condition_description) > 1000 THEN
    RAISE EXCEPTION 'Condition description must be between 10 and 1000 characters';
  END IF;
  
  -- Check preferred date is not in the past and not too far in the future
  IF NEW.preferred_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Preferred date cannot be in the past';
  END IF;
  
  IF NEW.preferred_date > CURRENT_DATE + INTERVAL '90 days' THEN
    RAISE EXCEPTION 'Preferred date cannot be more than 90 days in the future';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION log_suspicious_appointment_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- This could be extended to log to a separate security events table
  -- For now, we'll just ensure the data is properly tracked
  RETURN NEW;
END;
$$;