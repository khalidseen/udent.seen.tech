-- Fix function search path security warnings

-- Fix enhanced_audit_trigger_function
CREATE OR REPLACE FUNCTION public.enhanced_audit_trigger_function()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Fix detect_suspicious_activities function
CREATE OR REPLACE FUNCTION public.detect_suspicious_activities()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Fix get_audit_statistics function
CREATE OR REPLACE FUNCTION public.get_audit_statistics(days_back INTEGER DEFAULT 7)
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;