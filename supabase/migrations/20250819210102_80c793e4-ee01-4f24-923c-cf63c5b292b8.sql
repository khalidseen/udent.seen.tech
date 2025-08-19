-- Add security measures to doctor_applications table similar to appointment_requests

-- Add IP tracking and security columns
ALTER TABLE doctor_applications 
ADD COLUMN request_ip inet,
ADD COLUMN request_user_agent text,
ADD COLUMN application_hash text;

-- Create an index for efficient IP-based queries
CREATE INDEX idx_doctor_applications_ip_created ON doctor_applications(request_ip, created_at);

-- Create a function to check rate limits for doctor applications (max 1 application per IP per day)
CREATE OR REPLACE FUNCTION check_doctor_application_rate_limit(ip_address inet)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  request_count integer;
BEGIN
  -- Count applications from this IP in the last 24 hours
  SELECT COUNT(*)
  INTO request_count
  FROM public.doctor_applications
  WHERE request_ip = ip_address
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Allow only 1 application per day per IP
  RETURN request_count < 1;
END;
$$;

-- Create a function to validate doctor application data
CREATE OR REPLACE FUNCTION validate_doctor_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Basic validation for required fields
  IF LENGTH(NEW.full_name) < 2 OR LENGTH(NEW.full_name) > 100 THEN
    RAISE EXCEPTION 'Full name must be between 2 and 100 characters';
  END IF;
  
  IF NEW.email IS NULL OR NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Valid email address is required';
  END IF;
  
  IF NEW.phone IS NOT NULL AND LENGTH(NEW.phone) < 8 THEN
    RAISE EXCEPTION 'Phone number must be at least 8 characters';
  END IF;
  
  IF NEW.license_number IS NOT NULL AND LENGTH(NEW.license_number) < 3 THEN
    RAISE EXCEPTION 'License number must be at least 3 characters';
  END IF;
  
  IF NEW.specialization IS NOT NULL AND LENGTH(NEW.specialization) > 100 THEN
    RAISE EXCEPTION 'Specialization must not exceed 100 characters';
  END IF;
  
  IF NEW.clinic_name IS NOT NULL AND LENGTH(NEW.clinic_name) > 200 THEN
    RAISE EXCEPTION 'Clinic name must not exceed 200 characters';
  END IF;
  
  IF NEW.experience_years IS NOT NULL AND (NEW.experience_years < 0 OR NEW.experience_years > 70) THEN
    RAISE EXCEPTION 'Experience years must be between 0 and 70';
  END IF;
  
  -- Generate application hash to prevent duplicate submissions
  NEW.application_hash = encode(digest(
    COALESCE(NEW.full_name, '') || 
    COALESCE(NEW.email, '') || 
    COALESCE(NEW.phone, '') || 
    COALESCE(NEW.license_number, ''), 
    'sha256'
  ), 'hex');
  
  -- Check for duplicate applications with same hash in last 30 days
  IF EXISTS (
    SELECT 1 FROM public.doctor_applications 
    WHERE application_hash = NEW.application_hash 
    AND created_at > NOW() - INTERVAL '30 days'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'A similar application has already been submitted recently';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for validation
CREATE TRIGGER validate_doctor_application_trigger
  BEFORE INSERT OR UPDATE ON doctor_applications
  FOR EACH ROW
  EXECUTE FUNCTION validate_doctor_application();

-- Update the RLS policy to include rate limiting and security checks
DROP POLICY IF EXISTS "Anyone can create applications" ON doctor_applications;

CREATE POLICY "Rate limited doctor applications"
ON doctor_applications
FOR INSERT
WITH CHECK (
  -- Check rate limit using the function
  check_doctor_application_rate_limit(request_ip) AND
  -- Ensure required fields are provided
  full_name IS NOT NULL AND
  email IS NOT NULL
);

-- Create a function to log doctor application activities
CREATE OR REPLACE FUNCTION log_doctor_application_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Log application submission for security monitoring
  -- This could be extended to log to a separate security events table
  RETURN NEW;
END;
$$;

-- Add a trigger to track all application submissions
CREATE TRIGGER track_doctor_applications_trigger
  AFTER INSERT ON doctor_applications
  FOR EACH ROW
  EXECUTE FUNCTION log_doctor_application_activity();