-- Create an RPC function to safely update dashboard_link_validation_dismissed
CREATE OR REPLACE FUNCTION public.set_dashboard_dismissed(p_profile_id uuid, p_value boolean)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles SET dashboard_link_validation_dismissed = p_value WHERE id = p_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create an RPC function to safely read dashboard_link_validation_dismissed
CREATE OR REPLACE FUNCTION public.get_dashboard_dismissed(p_profile_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN (SELECT dashboard_link_validation_dismissed FROM public.profiles WHERE id = p_profile_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
