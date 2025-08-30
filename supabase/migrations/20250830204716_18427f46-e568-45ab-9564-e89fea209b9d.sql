-- Enhanced audit trail system - modify existing structure

-- Create enum for operation sensitivity levels if not exists
DO $$ BEGIN
    CREATE TYPE public.operation_sensitivity AS ENUM ('normal', 'sensitive', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for event categories if not exists
DO $$ BEGIN
    CREATE TYPE public.event_category AS ENUM ('authentication', 'data_access', 'data_modification', 'permission_change', 'system_admin', 'financial', 'medical_record');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to existing security_events table
ALTER TABLE public.security_events 
ADD COLUMN IF NOT EXISTS event_category public.event_category DEFAULT 'data_access',
ADD COLUMN IF NOT EXISTS sensitivity_level public.operation_sensitivity DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS table_name TEXT,
ADD COLUMN IF NOT EXISTS record_id UUID,
ADD COLUMN IF NOT EXISTS operation TEXT,
ADD COLUMN IF NOT EXISTS old_data JSONB,
ADD COLUMN IF NOT EXISTS new_data JSONB,
ADD COLUMN IF NOT EXISTS context_data JSONB,
ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS processed_for_alerts BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS geolocation JSONB;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_events_sensitivity ON public.security_events(sensitivity_level);
CREATE INDEX IF NOT EXISTS idx_security_events_risk_score ON public.security_events(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_unprocessed ON public.security_events(processed_for_alerts) WHERE processed_for_alerts = false;
CREATE INDEX IF NOT EXISTS idx_security_events_category ON public.security_events(event_category);

-- Security alerts table
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  triggered_by_event_id UUID REFERENCES public.security_events(id),
  user_id UUID,
  metadata JSONB,
  status TEXT NOT NULL DEFAULT 'open',
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on security alerts if not already enabled
DO $$ BEGIN
    ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can manage their clinic security alerts" ON public.security_alerts;
CREATE POLICY "Users can manage their clinic security alerts"
ON public.security_alerts FOR ALL
USING (clinic_id = (SELECT get_current_user_profile()).id);

-- Create indexes for alerts
CREATE INDEX IF NOT EXISTS idx_security_alerts_clinic_id ON public.security_alerts(clinic_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON public.security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON public.security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON public.security_alerts(created_at DESC);

-- Enhanced audit function
CREATE OR REPLACE FUNCTION public.enhanced_audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    clinic_id_val UUID;
    sensitivity_level public.operation_sensitivity;
    event_category public.event_category;
    risk_score INTEGER := 0;
BEGIN
    -- Determine clinic_id
    clinic_id_val := COALESCE(
        CASE WHEN TG_OP = 'DELETE' THEN OLD.clinic_id ELSE NEW.clinic_id END,
        (SELECT get_current_user_profile()).id
    );
    
    -- Determine sensitivity and category based on table
    CASE TG_TABLE_NAME
        WHEN 'patients' THEN 
            sensitivity_level := 'sensitive';
            event_category := 'medical_record';
        WHEN 'medical_records', 'medical_images', 'dental_treatments' THEN 
            sensitivity_level := 'critical';
            event_category := 'medical_record';
        WHEN 'invoices', 'payments' THEN 
            sensitivity_level := 'sensitive';
            event_category := 'financial';
        WHEN 'user_role_assignments', 'temporary_permissions' THEN 
            sensitivity_level := 'critical';
            event_category := 'permission_change';
            risk_score := 30;
        WHEN 'profiles' THEN 
            sensitivity_level := 'sensitive';
            event_category := 'system_admin';
        ELSE 
            sensitivity_level := 'normal';
            event_category := 'data_access';
    END CASE;
    
    -- Increase risk score for deletions and critical operations
    IF TG_OP = 'DELETE' THEN
        risk_score := risk_score + 20;
    END IF;
    
    -- Insert detailed audit record
    INSERT INTO public.security_events (
        event_type,
        event_category,
        sensitivity_level,
        user_id,
        details,
        table_name,
        record_id,
        operation,
        old_data,
        new_data,
        context_data,
        ip_address,
        user_agent,
        risk_score
    ) VALUES (
        TG_TABLE_NAME || '_' || TG_OP,
        event_category,
        sensitivity_level,
        auth.uid(),
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'risk_score', risk_score
        ),
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
        jsonb_build_object(
            'timestamp', now(),
            'table', TG_TABLE_NAME,
            'operation', TG_OP
        ),
        inet_client_addr(),
        current_setting('request.headers', true)::jsonb->>'user-agent',
        risk_score
    );
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply enhanced audit triggers to sensitive tables
DROP TRIGGER IF EXISTS enhanced_audit_patients ON public.patients;
CREATE TRIGGER enhanced_audit_patients
    AFTER INSERT OR UPDATE OR DELETE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.enhanced_audit_trigger_function();

DROP TRIGGER IF EXISTS enhanced_audit_medical_records ON public.medical_records;
CREATE TRIGGER enhanced_audit_medical_records
    AFTER INSERT OR UPDATE OR DELETE ON public.medical_records
    FOR EACH ROW EXECUTE FUNCTION public.enhanced_audit_trigger_function();

DROP TRIGGER IF EXISTS enhanced_audit_medical_images ON public.medical_images;
CREATE TRIGGER enhanced_audit_medical_images
    AFTER INSERT OR UPDATE OR DELETE ON public.medical_images
    FOR EACH ROW EXECUTE FUNCTION public.enhanced_audit_trigger_function();

DROP TRIGGER IF EXISTS enhanced_audit_dental_treatments ON public.dental_treatments;
CREATE TRIGGER enhanced_audit_dental_treatments
    AFTER INSERT OR UPDATE OR DELETE ON public.dental_treatments
    FOR EACH ROW EXECUTE FUNCTION public.enhanced_audit_trigger_function();

DROP TRIGGER IF EXISTS enhanced_audit_invoices ON public.invoices;
CREATE TRIGGER enhanced_audit_invoices
    AFTER INSERT OR UPDATE OR DELETE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.enhanced_audit_trigger_function();

DROP TRIGGER IF EXISTS enhanced_audit_payments ON public.payments;
CREATE TRIGGER enhanced_audit_payments
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.enhanced_audit_trigger_function();

-- Function to detect suspicious activities
CREATE OR REPLACE FUNCTION public.detect_suspicious_activities()
RETURNS void AS $$
DECLARE
    event_rec RECORD;
    alert_count INTEGER;
BEGIN
    -- Check for multiple failed login attempts
    FOR event_rec IN
        SELECT user_id, ip_address, COUNT(*) as attempt_count
        FROM public.security_events
        WHERE event_type = 'authentication_failed'
        AND created_at > now() - INTERVAL '1 hour'
        AND processed_for_alerts = false
        GROUP BY user_id, ip_address
        HAVING COUNT(*) >= 5
    LOOP
        INSERT INTO public.security_alerts (
            clinic_id, alert_type, severity, title, description, user_id, metadata
        ) VALUES (
            COALESCE((SELECT id FROM profiles WHERE user_id = event_rec.user_id), '00000000-0000-0000-0000-000000000000'::uuid),
            'suspicious_login',
            'high',
            'محاولات دخول مشبوهة',
            'تم رصد ' || event_rec.attempt_count || ' محاولة دخول فاشلة من نفس IP في الساعة الماضية',
            event_rec.user_id,
            jsonb_build_object('ip_address', event_rec.ip_address, 'attempt_count', event_rec.attempt_count)
        );
    END LOOP;
    
    -- Check for bulk data access
    FOR event_rec IN
        SELECT user_id, COUNT(*) as access_count, 
               COALESCE((SELECT id FROM profiles WHERE user_id = security_events.user_id LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid) as clinic_id
        FROM public.security_events
        WHERE event_category = 'data_access'
        AND created_at > now() - INTERVAL '30 minutes'
        AND processed_for_alerts = false
        GROUP BY user_id
        HAVING COUNT(*) >= 50
    LOOP
        INSERT INTO public.security_alerts (
            clinic_id, alert_type, severity, title, description, user_id, metadata
        ) VALUES (
            event_rec.clinic_id,
            'bulk_data_access',
            'medium',
            'وصول مكثف للبيانات',
            'تم رصد ' || event_rec.access_count || ' عملية وصول للبيانات في 30 دقيقة',
            event_rec.user_id,
            jsonb_build_object('access_count', event_rec.access_count)
        );
    END LOOP;
    
    -- Check for high-risk operations
    FOR event_rec IN
        SELECT *, COALESCE((SELECT id FROM profiles WHERE user_id = security_events.user_id LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid) as clinic_id_resolved
        FROM public.security_events
        WHERE risk_score >= 50
        AND processed_for_alerts = false
        AND created_at > now() - INTERVAL '24 hours'
    LOOP
        INSERT INTO public.security_alerts (
            clinic_id, alert_type, severity, title, description, user_id, triggered_by_event_id, metadata
        ) VALUES (
            event_rec.clinic_id_resolved,
            'high_risk_operation',
            CASE 
                WHEN event_rec.risk_score >= 80 THEN 'critical'
                WHEN event_rec.risk_score >= 60 THEN 'high'
                ELSE 'medium'
            END,
            'عملية عالية المخاطر',
            'تم رصد عملية ' || event_rec.operation || ' على ' || event_rec.table_name,
            event_rec.user_id,
            event_rec.id,
            jsonb_build_object('risk_score', event_rec.risk_score, 'operation', event_rec.operation)
        );
    END LOOP;
    
    -- Mark events as processed
    UPDATE public.security_events
    SET processed_for_alerts = true
    WHERE processed_for_alerts = false
    AND created_at < now() - INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get audit trail statistics
CREATE OR REPLACE FUNCTION public.get_audit_statistics(days_back INTEGER DEFAULT 7)
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
    clinic_id_val UUID;
BEGIN
    clinic_id_val := (SELECT get_current_user_profile()).id;
    
    SELECT jsonb_build_object(
        'total_events', (
            SELECT COUNT(*) FROM public.security_events 
            WHERE created_at > now() - (days_back || ' days')::INTERVAL
            AND (user_id = auth.uid() OR user_id IN (SELECT user_id FROM profiles WHERE id = clinic_id_val))
        ),
        'events_by_category', COALESCE((
            SELECT jsonb_object_agg(COALESCE(event_category::text, 'unknown'), count)
            FROM (
                SELECT event_category, COUNT(*) as count
                FROM public.security_events
                WHERE created_at > now() - (days_back || ' days')::INTERVAL
                AND (user_id = auth.uid() OR user_id IN (SELECT user_id FROM profiles WHERE id = clinic_id_val))
                GROUP BY event_category
            ) t
        ), '{}'::jsonb),
        'events_by_sensitivity', COALESCE((
            SELECT jsonb_object_agg(COALESCE(sensitivity_level::text, 'normal'), count)
            FROM (
                SELECT sensitivity_level, COUNT(*) as count
                FROM public.security_events
                WHERE created_at > now() - (days_back || ' days')::INTERVAL
                AND (user_id = auth.uid() OR user_id IN (SELECT user_id FROM profiles WHERE id = clinic_id_val))
                GROUP BY sensitivity_level
            ) t
        ), '{}'::jsonb),
        'high_risk_events', (
            SELECT COUNT(*) FROM public.security_events 
            WHERE created_at > now() - (days_back || ' days')::INTERVAL
            AND (user_id = auth.uid() OR user_id IN (SELECT user_id FROM profiles WHERE id = clinic_id_val))
            AND COALESCE(risk_score, 0) >= 50
        ),
        'active_alerts', (
            SELECT COUNT(*) FROM public.security_alerts 
            WHERE clinic_id = clinic_id_val
            AND status = 'open'
        )
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;