import { useOptimizedQuery } from "./useOptimizedQuery";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  active_patients: number;
  today_appointments: number;
  total_debt: number;
  low_stock_items: number;
  pending_invoices: number;
  this_week_appointments: number;
  this_month_revenue: number;
}

export function useOptimizedDashboard(clinicId: string | null) {
  return useOptimizedQuery<DashboardStats>(
    ['dashboard-stats', clinicId],
    async () => {
      if (!clinicId) {
        throw new Error('Clinic ID is required');
      }

      const { data, error } = await supabase.rpc('get_dashboard_stats_optimized', {
        clinic_id_param: clinicId
      });

      if (error) throw error;
      return data as unknown as DashboardStats;
    },
    {
      enabled: !!clinicId,
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      localCacheMinutes: 2
    }
  );
}
