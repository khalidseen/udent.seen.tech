-- Fix function search_path security issue for all functions
-- This improves security by setting a stable search_path

-- Fix get_user_effective_permissions function
CREATE OR REPLACE FUNCTION public.get_user_effective_permissions(user_id_param UUID DEFAULT auth.uid())
RETURNS TABLE (
    permission_key text,
    permission_name text,
    permission_name_ar text,
    category text,
    source text
) 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
    -- Direct role permissions
    SELECT DISTINCT 
        p.permission_key,
        p.permission_name,
        p.permission_name_ar,
        p.category,
        'role' as source
    FROM permissions p
    INNER JOIN role_permissions rp ON p.permission_key = rp.permission_key
    INNER JOIN user_role_assignments ura ON rp.role_id = ura.role_id
    WHERE ura.user_id = COALESCE(user_id_param, auth.uid())
        AND ura.is_active = true
        AND p.is_active = true
        AND rp.is_enabled = true
    
    UNION
    
    -- Temporary permissions
    SELECT DISTINCT 
        p.permission_key,
        p.permission_name,
        p.permission_name_ar,
        p.category,
        'temporary' as source
    FROM permissions p
    INNER JOIN temporary_permissions tp ON p.permission_key = tp.permission_key
    WHERE tp.user_id = COALESCE(user_id_param, auth.uid())
        AND tp.is_active = true
        AND tp.expires_at > now()
        AND p.is_active = true;
$$;

-- Fix get_user_roles function
CREATE OR REPLACE FUNCTION public.get_user_roles(user_id_param UUID DEFAULT auth.uid())
RETURNS TABLE (
    role_name text,
    role_name_ar text,
    is_primary boolean
) 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
    SELECT 
        ur.role_name::text,
        ur.role_name_ar,
        ura.is_primary
    FROM user_roles ur
    INNER JOIN user_role_assignments ura ON ur.id = ura.role_id
    WHERE ura.user_id = COALESCE(user_id_param, auth.uid())
        AND ura.is_active = true;
$$;

-- Fix get_current_user_profile function
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE (
    id uuid,
    user_id uuid,
    full_name text,
    role text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    status text
) 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
    SELECT 
        p.id,
        p.user_id,
        p.full_name,
        p.role,
        p.created_at,
        p.updated_at,
        p.status
    FROM profiles p
    WHERE p.user_id = auth.uid();
$$;

-- Fix has_plan_feature function if it exists
CREATE OR REPLACE FUNCTION public.has_plan_feature(feature_key_param text)
RETURNS boolean 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM clinics c
        INNER JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
        INNER JOIN plan_features pf ON sp.id = pf.plan_id
        WHERE c.id = (SELECT clinic_id FROM profiles WHERE user_id = auth.uid())
            AND pf.feature_key = feature_key_param
            AND pf.is_enabled = true
            AND c.is_active = true
    );
$$;