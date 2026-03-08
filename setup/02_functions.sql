-- ============================================================
-- UDent Dental System - Core Functions
-- Run after 01_schema.sql
-- ============================================================

-- Get current user profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS profiles
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT * FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Get user's current clinic
CREATE OR REPLACE FUNCTION public.get_user_current_clinic()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Get user clinic role
CREATE OR REPLACE FUNCTION public.get_user_clinic_role(user_id_param uuid DEFAULT auth.uid())
RETURNS user_role_type
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    cm.role,
    p.current_clinic_role,
    'assistant'::user_role_type
  )
  FROM public.profiles p
  LEFT JOIN public.clinic_memberships cm ON cm.user_id = user_id_param 
    AND cm.clinic_id = p.clinic_id 
    AND cm.is_active = true
  WHERE p.user_id = user_id_param
  LIMIT 1;
$$;

-- Check user role
CREATE OR REPLACE FUNCTION public.check_user_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _user_id AND p.role = _role
    UNION
    SELECT 1
    FROM public.user_role_assignments ura
    JOIN public.user_roles ur ON ura.role_id = ur.id
    WHERE ura.user_id = _user_id
      AND ur.role_name = _role
      AND ura.is_active = true
      AND (ura.expires_at IS NULL OR ura.expires_at > now())
  );
$$;

-- Check clinic permission
CREATE OR REPLACE FUNCTION public.has_clinic_permission(permission_key text, user_id_param uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role user_role_type;
  role_permissions jsonb;
BEGIN
  SELECT public.get_user_clinic_role(user_id_param) INTO user_role;
  SELECT permissions INTO role_permissions
  FROM public.clinic_role_hierarchy
  WHERE role_name = user_role;
  RETURN COALESCE(
    (role_permissions ->> permission_key)::boolean,
    false
  );
END;
$$;

-- Can manage role
CREATE OR REPLACE FUNCTION public.can_manage_role(manager_role user_role_type, target_role user_role_type)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN target_role = ANY(
    SELECT unnest(can_manage) 
    FROM public.clinic_role_hierarchy 
    WHERE role_name = manager_role
  );
END;
$$;

-- Get user accessible clinics
CREATE OR REPLACE FUNCTION public.get_user_accessible_clinics()
RETURNS TABLE(clinic_id uuid, clinic_name text, is_current boolean, access_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_profile RECORD;
BEGIN
  SELECT * INTO user_profile FROM profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN RETURN; END IF;
  
  IF user_profile.role = 'admin' AND EXISTS (
    SELECT 1 FROM user_role_assignments ura
    JOIN user_roles ur ON ura.role_id = ur.id
    WHERE ura.user_id = auth.uid() AND ur.role_name = 'super_admin' AND ura.is_active = true
  ) THEN
    RETURN QUERY SELECT c.id, c.name, (c.id = user_profile.clinic_id), 'super_admin'::TEXT
    FROM clinics c WHERE c.is_active = true ORDER BY c.name;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT c.id, c.name, true, 'primary'::TEXT
  FROM clinics c WHERE c.id = user_profile.clinic_id AND c.is_active = true;
  
  RETURN QUERY SELECT c.id, c.name, false, cm.role::TEXT
  FROM clinics c JOIN clinic_memberships cm ON c.id = cm.clinic_id
  WHERE cm.user_id = auth.uid() AND cm.is_active = true AND c.is_active = true
    AND c.id != user_profile.clinic_id
  ORDER BY c.name;
END;
$$;

-- Switch user clinic
CREATE OR REPLACE FUNCTION public.switch_user_clinic(new_clinic_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE user_profile RECORD;
BEGIN
  SELECT * INTO user_profile FROM profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN RETURN FALSE; END IF;
  
  IF user_profile.role = 'admin' OR EXISTS (
    SELECT 1 FROM clinic_memberships WHERE user_id = auth.uid() AND clinic_id = new_clinic_id AND is_active = true
  ) THEN
    UPDATE profiles SET clinic_id = new_clinic_id, updated_at = now() WHERE user_id = auth.uid();
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$;

-- Create clinic with owner
CREATE OR REPLACE FUNCTION public.create_clinic_with_owner(
  clinic_name text,
  license_number text DEFAULT NULL,
  phone text DEFAULT NULL,
  email text DEFAULT NULL,
  address text DEFAULT NULL,
  city text DEFAULT NULL,
  subscription_plan_name text DEFAULT 'basic',
  max_users integer DEFAULT 10,
  max_patients integer DEFAULT 1000
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_id UUID;
  clinic_data RECORD;
  plan_id UUID;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'User not authenticated'; END IF;

  SELECT id INTO plan_id FROM public.subscription_plans 
  WHERE (name = subscription_plan_name OR name_ar = subscription_plan_name) AND is_active = true LIMIT 1;
  
  IF plan_id IS NULL THEN
    SELECT id INTO plan_id FROM public.subscription_plans WHERE name = 'Basic' AND is_active = true LIMIT 1;
  END IF;

  INSERT INTO public.clinics (name, license_number, phone, email, address, city, 
    subscription_plan_id, subscription_plan, max_users, max_patients, is_active,
    subscription_status, subscription_start_date, subscription_end_date)
  VALUES (clinic_name, license_number, phone, email, address, city, 
    plan_id, subscription_plan_name, max_users, max_patients, true,
    'active', now(), now() + INTERVAL '1 month')
  RETURNING * INTO clinic_data;

  INSERT INTO public.clinic_memberships (clinic_id, user_id, role, is_active)
  VALUES (clinic_data.id, current_user_id, 'owner'::user_role_type, true);

  UPDATE public.profiles SET clinic_id = clinic_data.id, current_clinic_role = 'owner'::user_role_type, updated_at = now()
  WHERE user_id = current_user_id;

  -- Create default settings
  INSERT INTO public.clinic_settings (clinic_id) VALUES (clinic_data.id);

  RETURN jsonb_build_object('success', true, 'clinic_id', clinic_data.id, 'clinic_name', clinic_data.name);
EXCEPTION WHEN OTHERS THEN
  IF clinic_data.id IS NOT NULL THEN DELETE FROM public.clinics WHERE id = clinic_data.id; END IF;
  RAISE EXCEPTION 'Failed to create clinic: %', SQLERRM;
END;
$$;

-- Generate API key
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN 'udent_live_' || REPLACE(gen_random_uuid()::TEXT, '-', '');
END;
$$;

-- Validate API key
CREATE OR REPLACE FUNCTION public.validate_api_key(key text)
RETURNS TABLE(is_valid boolean, clinic_id uuid, api_key_id uuid, permissions jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE key_record RECORD;
BEGIN
  SELECT ak.id, ak.clinic_id, ak.permissions, ak.is_active, ak.expires_at
  INTO key_record FROM public.api_keys ak WHERE ak.api_key = key;

  IF NOT FOUND OR NOT key_record.is_active THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::JSONB; RETURN;
  END IF;
  IF key_record.expires_at IS NOT NULL AND key_record.expires_at < now() THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::JSONB; RETURN;
  END IF;

  UPDATE public.api_keys SET last_used_at = now() WHERE id = key_record.id;
  RETURN QUERY SELECT true, key_record.clinic_id, key_record.id, key_record.permissions;
END;
$$;

-- Generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number(clinic_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE next_number INTEGER; year_suffix TEXT;
BEGIN
  year_suffix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  SELECT COALESCE(MAX(CASE WHEN invoice_number ~ '^INV-[0-9]{4}-[0-9]+$' 
    THEN (regexp_split_to_array(invoice_number, '-'))[3]::INTEGER ELSE 0 END), 0) + 1
  INTO next_number FROM public.invoices 
  WHERE clinic_id = clinic_id_param AND invoice_number LIKE 'INV-' || year_suffix || '-%';
  RETURN 'INV-' || year_suffix || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$;

-- Get all clinics analytics
CREATE OR REPLACE FUNCTION public.get_all_clinics_analytics()
RETURNS TABLE(
  clinic_id UUID, clinic_name TEXT, is_active BOOLEAN, subscription_plan TEXT,
  patient_count BIGINT, appointment_count BIGINT, completed_appointments BIGINT,
  total_revenue NUMERIC, this_month_revenue NUMERIC, user_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.is_active, c.subscription_plan,
    COALESCE(pt.cnt, 0), COALESCE(ap.cnt, 0), COALESCE(ap.completed, 0),
    COALESCE(inv.total_rev, 0)::NUMERIC, COALESCE(inv.month_rev, 0)::NUMERIC, COALESCE(u.cnt, 0)
  FROM public.clinics c
  INNER JOIN public.get_user_accessible_clinics() ac ON c.id = ac.clinic_id
  LEFT JOIN (SELECT p.clinic_id, COUNT(*) as cnt FROM public.patients p GROUP BY p.clinic_id) pt ON c.id = pt.clinic_id
  LEFT JOIN (SELECT a.clinic_id, COUNT(*) as cnt, COUNT(*) FILTER (WHERE a.status = 'completed') as completed
    FROM public.appointments a WHERE a.appointment_date >= CURRENT_DATE - INTERVAL '30 days' GROUP BY a.clinic_id) ap ON c.id = ap.clinic_id
  LEFT JOIN (SELECT i.clinic_id, SUM(i.paid_amount) as total_rev,
    SUM(i.paid_amount) FILTER (WHERE DATE_TRUNC('month', i.issue_date) = DATE_TRUNC('month', CURRENT_DATE)) as month_rev
    FROM public.invoices i GROUP BY i.clinic_id) inv ON c.id = inv.clinic_id
  LEFT JOIN (SELECT pr.clinic_id, COUNT(*) as cnt FROM public.profiles pr WHERE pr.clinic_id IS NOT NULL GROUP BY pr.clinic_id) u ON c.id = u.clinic_id
  ORDER BY c.name;
END;
$$;

-- Dashboard stats optimized
CREATE OR REPLACE FUNCTION public.get_dashboard_stats_optimized(clinic_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'active_patients', (SELECT COUNT(*) FROM patients WHERE clinic_id = clinic_id_param AND patient_status = 'active'),
    'today_appointments', (SELECT COUNT(*) FROM appointments WHERE clinic_id = clinic_id_param AND appointment_date::date = CURRENT_DATE AND status IN ('scheduled', 'confirmed')),
    'total_debt', (SELECT COALESCE(SUM(balance_due), 0)::numeric FROM invoices WHERE clinic_id = clinic_id_param AND status != 'paid' AND balance_due > 0),
    'low_stock_items', (SELECT COUNT(*) FROM medical_supplies WHERE clinic_id = clinic_id_param AND current_stock <= minimum_stock AND is_active = true),
    'this_month_revenue', (SELECT COALESCE(SUM(paid_amount), 0)::numeric FROM invoices WHERE clinic_id = clinic_id_param AND DATE_TRUNC('month', issue_date) = DATE_TRUNC('month', CURRENT_DATE))
  ) INTO result;
  RETURN result;
END;
$$;

-- Prevent last owner deletion
CREATE OR REPLACE FUNCTION public.prevent_last_owner_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE owner_count integer;
BEGIN
  IF (TG_OP = 'DELETE' AND OLD.role = 'owner') OR 
     (TG_OP = 'UPDATE' AND OLD.role = 'owner' AND (NEW.role != 'owner' OR NEW.is_active = false)) THEN
    SELECT COUNT(*) INTO owner_count FROM public.clinic_memberships
    WHERE clinic_id = COALESCE(OLD.clinic_id, NEW.clinic_id) AND role = 'owner' AND is_active = true AND id != OLD.id;
    IF owner_count = 0 THEN RAISE EXCEPTION 'Cannot remove the last owner of the clinic'; END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER prevent_last_owner
  BEFORE UPDATE OR DELETE ON public.clinic_memberships
  FOR EACH ROW EXECUTE FUNCTION public.prevent_last_owner_deletion();

-- Patient creator tracking
CREATE OR REPLACE FUNCTION public.set_patient_creator_info()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE current_profile RECORD;
BEGIN
  SELECT * INTO current_profile FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
  IF TG_OP = 'INSERT' THEN
    NEW.created_by_id = auth.uid();
    NEW.created_by_name = COALESCE(current_profile.full_name, 'Unknown');
    NEW.created_by_role = COALESCE(current_profile.role, 'user');
  END IF;
  IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
    NEW.last_modified_by_id = auth.uid();
    NEW.last_modified_by_name = COALESCE(current_profile.full_name, 'Unknown');
    NEW.last_modified_by_role = COALESCE(current_profile.role, 'user');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_patient_creator
  BEFORE INSERT OR UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.set_patient_creator_info();

-- Invoice payment triggers
CREATE OR REPLACE FUNCTION public.update_invoice_payments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.invoices SET
    paid_amount = (SELECT COALESCE(SUM(amount), 0) FROM public.payments
      WHERE invoice_id = CASE WHEN TG_OP = 'DELETE' THEN OLD.invoice_id ELSE NEW.invoice_id END AND status = 'completed'),
    updated_at = now()
  WHERE id = CASE WHEN TG_OP = 'DELETE' THEN OLD.invoice_id ELSE NEW.invoice_id END;

  UPDATE public.invoices SET
    balance_due = total_amount - paid_amount,
    status = CASE WHEN paid_amount >= total_amount THEN 'paid' WHEN paid_amount > 0 THEN 'pending' ELSE status END,
    updated_at = now()
  WHERE id = CASE WHEN TG_OP = 'DELETE' THEN OLD.invoice_id ELSE NEW.invoice_id END;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER update_invoice_on_payment
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_invoice_payments();

-- Clinic settings updated_at
CREATE OR REPLACE FUNCTION public.update_clinic_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER update_clinic_settings_timestamp
  BEFORE UPDATE ON public.clinic_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_clinic_settings_updated_at();

DO $$ BEGIN RAISE NOTICE '✅ Functions and triggers created successfully!'; END $$;
