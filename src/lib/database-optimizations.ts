import { supabase } from "@/integrations/supabase/client";

/**
 * Batch multiple queries into a single request
 */
export async function batchQueries<T extends Record<string, any>>(
  queries: Array<() => Promise<any>>
): Promise<T> {
  const results = await Promise.all(queries.map((q) => q()));
  return results.reduce((acc, result, index) => {
    acc[`query_${index}`] = result;
    return acc;
  }, {} as T);
}

/**
 * Count records efficiently
 */
export async function countRecords(
  table: string,
  filters?: Record<string, any>
): Promise<number> {
  try {
    // Using type assertion to avoid TypeScript issues
    const response: any = await (supabase.from as any)(table).select("*", { count: "exact", head: true });
    
    if (response.error) throw response.error;
    return response.count || 0;
  } catch (error) {
    console.error("Count records error:", error);
    return 0;
  }
}

/**
 * Parallel data fetching for dashboard
 */
export async function fetchDashboardData(
  clinicId: string
): Promise<{
  patients: number;
  appointments: number;
  revenue: number;
  pending: number;
}> {
  try {
    const [patientsCount, appointmentsCount, revenueData, pendingCount] =
      await Promise.all([
        supabase
          .from("patients")
          .select("*", { count: "exact", head: true })
          .eq("clinic_id", clinicId),
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("clinic_id", clinicId),
        supabase
          .from("payments")
          .select("amount")
          .eq("clinic_id", clinicId),
        supabase
          .from("invoices")
          .select("*", { count: "exact", head: true })
          .eq("clinic_id", clinicId)
          .eq("status", "pending"),
      ]);

    const revenue =
      revenueData.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    return {
      patients: patientsCount.count || 0,
      appointments: appointmentsCount.count || 0,
      revenue,
      pending: pendingCount.count || 0,
    };
  } catch (error) {
    console.error("Fetch dashboard data error:", error);
    return { patients: 0, appointments: 0, revenue: 0, pending: 0 };
  }
}

/**
 * Prefetch query data
 */
export async function prefetchData<T>(
  queryFn: () => Promise<{ data: T[] | null; error: any }>
): Promise<T[]> {
  try {
    const { data, error } = await queryFn();
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Prefetch error:", error);
    return [];
  }
}
