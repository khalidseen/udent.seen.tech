-- Add today_completed and today_cancelled to dashboard stats RPC
CREATE OR REPLACE FUNCTION public.get_dashboard_stats_optimized(clinic_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'active_patients', (
      SELECT COUNT(*) 
      FROM patients 
      WHERE clinic_id = clinic_id_param 
        AND patient_status = 'active'
    ),
    'today_appointments', (
      SELECT COUNT(*) 
      FROM appointments 
      WHERE clinic_id = clinic_id_param 
        AND appointment_date::date = CURRENT_DATE
        AND status IN ('scheduled', 'confirmed')
    ),
    'today_completed', (
      SELECT COUNT(*) 
      FROM appointments 
      WHERE clinic_id = clinic_id_param 
        AND appointment_date::date = CURRENT_DATE
        AND status = 'completed'
    ),
    'today_cancelled', (
      SELECT COUNT(*) 
      FROM appointments 
      WHERE clinic_id = clinic_id_param 
        AND appointment_date::date = CURRENT_DATE
        AND status = 'cancelled'
    ),
    'total_debt', (
      SELECT COALESCE(SUM(balance_due), 0)::numeric 
      FROM invoices 
      WHERE clinic_id = clinic_id_param 
        AND status != 'paid' 
        AND balance_due > 0
    ),
    'low_stock_items', (
      SELECT COUNT(*) 
      FROM medical_supplies 
      WHERE clinic_id = clinic_id_param 
        AND current_stock <= minimum_stock
        AND is_active = true
    ),
    'pending_invoices', (
      SELECT COUNT(*) 
      FROM invoices 
      WHERE clinic_id = clinic_id_param 
        AND status = 'pending'
    ),
    'this_week_appointments', (
      SELECT COUNT(*) 
      FROM appointments 
      WHERE clinic_id = clinic_id_param 
        AND appointment_date >= date_trunc('week', CURRENT_DATE)
        AND appointment_date < date_trunc('week', CURRENT_DATE) + INTERVAL '1 week'
    ),
    'this_month_revenue', (
      SELECT COALESCE(SUM(paid_amount), 0)::numeric
      FROM invoices 
      WHERE clinic_id = clinic_id_param 
        AND DATE_TRUNC('month', issue_date) = DATE_TRUNC('month', CURRENT_DATE)
    )
  ) INTO result;
  
  RETURN result;
END;
$$;
