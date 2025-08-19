-- Create a simple security logging function
CREATE OR REPLACE FUNCTION public.log_security_event(event_type text, details jsonb)
RETURNS void AS $$
BEGIN
  INSERT INTO public.security_events (event_type, user_id, details, ip_address)
  VALUES (event_type, auth.uid(), details, inet_client_addr());
EXCEPTION
  WHEN OTHERS THEN
    -- Continue execution even if logging fails
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;