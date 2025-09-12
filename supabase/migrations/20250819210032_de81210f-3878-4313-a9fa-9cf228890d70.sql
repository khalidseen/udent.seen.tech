-- Add security columns to doctor_applications table
ALTER TABLE public.doctor_applications 
ADD COLUMN request_ip inet,
ADD COLUMN request_user_agent text;

-- Create rate limiting function for doctor applications
CREATE OR REPLACE FUNCTION public.check_doctor_application_rate_limit(ip_address inet)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  request_count integer;
BEGIN
  -- Count applications from this IP in the last 24 hours
  SELECT COUNT(*)
  INTO request_count
  FROM public.doctor_applications
  WHERE request_ip = ip_address
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Allow up to 2 applications per 24 hours per IP
  RETURN request_count < 2;
END;
$function$

-- Create validation function for doctor applications
CREATE OR REPLACE FUNCTION public.validate_doctor_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Basic validation
  IF LENGTH(NEW.full_name) < 2 OR LENGTH(NEW.full_name) > 100 THEN
    RAISE EXCEPTION 'Full name must be between 2 and 100 characters';
  END IF;
  
  IF NEW.email IS NULL OR NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Valid email is required';
  END IF;
  
  IF NEW.phone IS NOT NULL AND LENGTH(NEW.phone) < 8 THEN
    RAISE EXCEPTION 'Phone number must be at least 8 characters';
  END IF;
  
  IF NEW.clinic_name IS NOT NULL AND LENGTH(NEW.clinic_name) < 2 THEN
    RAISE EXCEPTION 'Clinic name must be at least 2 characters';
  END IF;
  
  IF NEW.license_number IS NOT NULL AND LENGTH(NEW.license_number) < 3 THEN
    RAISE EXCEPTION 'License number must be at least 3 characters';
  END IF;
  
  -- Check for duplicate email applications in the last 30 days
  IF EXISTS (
    SELECT 1 FROM public.doctor_applications 
    WHERE email = NEW.email 
    AND created_at > NOW() - INTERVAL '30 days'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'An application with this email already exists within the last 30 days';
  END IF;
  
  RETURN NEW;
END;
$function$

-- Create logging function for doctor applications
CREATE OR REPLACE FUNCTION public.log_doctor_application_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Log suspicious activity patterns here if needed
  -- For now, just ensure proper tracking
  RETURN NEW;
END;
$function$

-- Create triggers for validation and logging
CREATE TRIGGER validate_doctor_application_trigger
  BEFORE INSERT OR UPDATE ON public.doctor_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_doctor_application();

CREATE TRIGGER log_doctor_application_activity_trigger
  AFTER INSERT ON public.doctor_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.log_doctor_application_activity();

-- Update RLS policy to include rate limiting
DROP POLICY IF EXISTS "Anyone can create applications" ON public.doctor_applications;

CREATE POLICY "Rate limited public doctor applications"
ON public.doctor_applications
FOR INSERT
WITH CHECK (
  check_doctor_application_rate_limit(request_ip)
  AND request_ip IS NOT NULL
);