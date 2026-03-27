import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_ROLES = ['super_admin', 'owner', 'admin', 'manager', 'clinic_owner'];

export function useMaintenanceMode() {
  const { data, isLoading } = useQuery({
    queryKey: ['maintenance-mode'],
    queryFn: async () => {
      const { data: profile } = await supabase.rpc('get_current_user_profile');
      if (!profile?.id) return { isMaintenanceMode: false, isAdmin: false };

      const { data: settings } = await supabase
        .from('clinic_settings')
        .select('custom_preferences')
        .eq('clinic_id', profile.id)
        .maybeSingle();

      const prefs = (settings?.custom_preferences ?? {}) as Record<string, any>;
      const isMaintenanceMode = !!prefs?.system?.maintenanceMode;
      const isAdmin = ADMIN_ROLES.includes(profile.role || '');

      return { isMaintenanceMode, isAdmin };
    },
    staleTime: 30_000,
  });

  return {
    isMaintenanceMode: data?.isMaintenanceMode ?? false,
    isAdmin: data?.isAdmin ?? false,
    isLoading,
  };
}
