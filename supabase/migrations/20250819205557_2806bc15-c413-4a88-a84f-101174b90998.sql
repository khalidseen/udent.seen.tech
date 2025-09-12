-- First, let's add rate limiting and security measures to the appointment_requests table

-- Add IP tracking and timestamp columns for rate limiting
ALTER TABLE appointment_requests 
ADD COLUMN request_ip inet,
ADD COLUMN request_user_agent text,
ADD COLUMN verified boolean DEFAULT false;

-- Create an index for efficient IP-based queries
CREATE INDEX idx_appointment_requests_ip_created ON appointment_requests(request_ip, created_at);

-- Create a function to check rate limits (max 3 requests per IP per hour)
CREATE OR REPLACE FUNCTION check_appointment_request_rate_limit(ip_address inet)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_count integer;
BEGIN
  -- Count requests from this IP in the last hour
  SELECT COUNT(*)
  INTO request_count
  FROM appointment_requests
  WHERE request_ip = ip_address
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Allow up to 3 requests per hour per IP
  RETURN request_count < 3;
END;
$$;

-- Create a function to validate appointment request data
CREATE OR REPLACE FUNCTION validate_appointment_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger for validation
CREATE TRIGGER validate_appointment_request_trigger
  BEFORE INSERT ON appointment_requests
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment_request();

-- Update the RLS policy to include rate limiting and IP tracking
DROP POLICY IF EXISTS "Anyone can create appointment requests" ON appointment_requests;

CREATE POLICY "Rate limited public appointment requests"
ON appointment_requests
FOR INSERT
WITH CHECK (
  -- Check rate limit using the function
  check_appointment_request_rate_limit(request_ip) AND
  -- Ensure clinic_id is provided
  clinic_id IS NOT NULL
);

-- Create a function to log suspicious activity
CREATE OR REPLACE FUNCTION log_suspicious_appointment_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This could be extended to log to a separate security events table
  -- For now, we'll just ensure the data is properly tracked
  RETURN NEW;
END;
$$;

-- Add a trigger to track all insertion attempts
CREATE TRIGGER track_appointment_requests_trigger
  AFTER INSERT ON appointment_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_suspicious_appointment_activity();