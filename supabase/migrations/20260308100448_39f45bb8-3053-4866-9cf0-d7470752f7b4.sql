
-- Create clinic_settings table
CREATE TABLE public.clinic_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL UNIQUE,
  currency TEXT DEFAULT 'IQD',
  language TEXT DEFAULT 'ar',
  time_format TEXT DEFAULT '24',
  timezone TEXT DEFAULT 'Asia/Baghdad',
  custom_preferences JSONB DEFAULT '{}',
  remote_access_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

-- RLS: Owners and admins can read clinic settings for their accessible clinics
CREATE POLICY "Users can view settings of accessible clinics"
ON public.clinic_settings
FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT ac.clinic_id FROM public.get_user_accessible_clinics() ac
  )
);

-- RLS: Only owners/admins can update clinic settings
CREATE POLICY "Admins can update clinic settings"
ON public.clinic_settings
FOR UPDATE
TO authenticated
USING (
  clinic_id IN (
    SELECT ac.clinic_id FROM public.get_user_accessible_clinics() ac
  )
  AND public.has_clinic_permission('manage_settings')
)
WITH CHECK (
  clinic_id IN (
    SELECT ac.clinic_id FROM public.get_user_accessible_clinics() ac
  )
  AND public.has_clinic_permission('manage_settings')
);

-- RLS: Admins can insert clinic settings
CREATE POLICY "Admins can insert clinic settings"
ON public.clinic_settings
FOR INSERT
TO authenticated
WITH CHECK (
  clinic_id IN (
    SELECT ac.clinic_id FROM public.get_user_accessible_clinics() ac
  )
  AND public.has_clinic_permission('manage_settings')
);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_clinic_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_clinic_settings_timestamp
  BEFORE UPDATE ON public.clinic_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clinic_settings_updated_at();

-- Function to get aggregated analytics for all accessible clinics
CREATE OR REPLACE FUNCTION public.get_all_clinics_analytics()
RETURNS TABLE(
  clinic_id UUID,
  clinic_name TEXT,
  is_active BOOLEAN,
  subscription_plan TEXT,
  patient_count BIGINT,
  appointment_count BIGINT,
  completed_appointments BIGINT,
  total_revenue NUMERIC,
  this_month_revenue NUMERIC,
  user_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as clinic_id,
    c.name as clinic_name,
    c.is_active,
    c.subscription_plan,
    COALESCE(pt.cnt, 0) as patient_count,
    COALESCE(ap.cnt, 0) as appointment_count,
    COALESCE(ap.completed, 0) as completed_appointments,
    COALESCE(inv.total_rev, 0)::NUMERIC as total_revenue,
    COALESCE(inv.month_rev, 0)::NUMERIC as this_month_revenue,
    COALESCE(u.cnt, 0) as user_count
  FROM public.clinics c
  INNER JOIN public.get_user_accessible_clinics() ac ON c.id = ac.clinic_id
  LEFT JOIN (
    SELECT p.clinic_id, COUNT(*) as cnt
    FROM public.patients p
    GROUP BY p.clinic_id
  ) pt ON c.id = pt.clinic_id
  LEFT JOIN (
    SELECT a.clinic_id, COUNT(*) as cnt,
           COUNT(*) FILTER (WHERE a.status = 'completed') as completed
    FROM public.appointments a
    WHERE a.appointment_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY a.clinic_id
  ) ap ON c.id = ap.clinic_id
  LEFT JOIN (
    SELECT i.clinic_id,
           SUM(i.paid_amount) as total_rev,
           SUM(i.paid_amount) FILTER (WHERE DATE_TRUNC('month', i.issue_date) = DATE_TRUNC('month', CURRENT_DATE)) as month_rev
    FROM public.invoices i
    GROUP BY i.clinic_id
  ) inv ON c.id = inv.clinic_id
  LEFT JOIN (
    SELECT pr.clinic_id, COUNT(*) as cnt
    FROM public.profiles pr
    WHERE pr.clinic_id IS NOT NULL
    GROUP BY pr.clinic_id
  ) u ON c.id = u.clinic_id
  ORDER BY c.name;
END;
$$;
