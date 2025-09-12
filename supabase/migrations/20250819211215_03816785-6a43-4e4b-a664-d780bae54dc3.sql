-- Add password validation and role protection triggers
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log role changes in security events
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.security_events (
      event_type, 
      user_id, 
      details,
      ip_address
    ) VALUES (
      'role_change',
      NEW.user_id,
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'changed_by', auth.uid()
      ),
      inet_client_addr()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role change auditing
DROP TRIGGER IF EXISTS audit_profile_role_changes ON public.profiles;
CREATE TRIGGER audit_profile_role_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_role_changes();

-- Prevent users from changing their own role (only admins can change roles)
DROP POLICY IF EXISTS "Users cannot change their own role" ON public.profiles;
CREATE POLICY "Users cannot change their own role"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = user_id AND 
  (OLD.role IS NOT DISTINCT FROM NEW.role OR 
   EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'))
);