-- Fix critical security issues identified in the security scan

-- 1. Add RLS policies for secretaries table
ALTER TABLE public.secretaries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for secretaries (assuming they belong to clinics)
-- Note: secretaries table needs clinic_id column for proper RLS
ALTER TABLE public.secretaries ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.profiles(id);

CREATE POLICY "Users can view their clinic secretaries" 
ON public.secretaries 
FOR SELECT 
USING (clinic_id = (SELECT get_current_user_profile.id FROM get_current_user_profile()));

CREATE POLICY "Users can create secretaries for their clinic" 
ON public.secretaries 
FOR INSERT 
WITH CHECK (clinic_id = (SELECT get_current_user_profile.id FROM get_current_user_profile()));

CREATE POLICY "Users can update their clinic secretaries" 
ON public.secretaries 
FOR UPDATE 
USING (clinic_id = (SELECT get_current_user_profile.id FROM get_current_user_profile()));

CREATE POLICY "Users can delete their clinic secretaries" 
ON public.secretaries 
FOR DELETE 
USING (clinic_id = (SELECT get_current_user_profile.id FROM get_current_user_profile()));

-- 2. Update function search paths for security
CREATE OR REPLACE FUNCTION public.update_doctor_assistants_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$function$;

-- 3. Add audit logging for sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES auth.users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ip_address INET,
    user_agent TEXT
);

-- Enable RLS on audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow reading audit logs for system admins
CREATE POLICY "System admins can view audit logs"
ON public.audit_log
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.audit_log
FOR INSERT
WITH CHECK (true);

-- 4. Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    -- Log sensitive data changes
    INSERT INTO public.audit_log (
        table_name, 
        operation, 
        old_data, 
        new_data, 
        user_id,
        ip_address
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
        auth.uid(),
        inet_client_addr()
    );
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$function$;

-- 5. Add audit triggers to sensitive tables
CREATE TRIGGER audit_appointment_requests
    AFTER INSERT OR UPDATE OR DELETE ON public.appointment_requests
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_doctor_applications
    AFTER INSERT OR UPDATE OR DELETE ON public.doctor_applications
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_patients
    AFTER INSERT OR UPDATE OR DELETE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- 6. Add additional rate limiting and validation for public endpoints
CREATE OR REPLACE FUNCTION public.enhanced_rate_limit_check(
    table_name TEXT,
    ip_address INET,
    max_requests INTEGER DEFAULT 3,
    time_window INTERVAL DEFAULT '1 hour'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    request_count INTEGER;
BEGIN
    -- Count recent requests from this IP for this table
    EXECUTE format(
        'SELECT COUNT(*) FROM public.%I WHERE request_ip = $1 AND created_at > NOW() - $2',
        table_name
    ) USING ip_address, time_window INTO request_count;
    
    RETURN request_count < max_requests;
END;
$function$;