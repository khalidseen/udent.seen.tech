-- Create a simple security function for role validation
CREATE OR REPLACE FUNCTION public.log_security_event(event_type text, details jsonb)
RETURNS void AS $$
BEGIN
  INSERT INTO public.security_events (event_type, user_id, details, ip_address)
  VALUES (event_type, auth.uid(), details, inet_client_addr());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update profiles RLS to prevent self-role changes except by admins
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = user_id AND
  (
    -- Can update profile if not changing role
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = NEW.role
    OR
    -- Or if user is an admin
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  )
);