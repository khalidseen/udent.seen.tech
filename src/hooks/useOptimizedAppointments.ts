import { useOptimizedQuery } from "./useOptimizedQuery";
import { supabase } from "@/integrations/supabase/client";

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  treatment_type: string;
  patient_id: string;
  patients?: {
    full_name: string;
    phone?: string;
  };
}

export function useOptimizedTodayAppointments(clinicId: string | null) {
  return useOptimizedQuery<Appointment[]>(
    ['today-appointments', clinicId],
    async () => {
      if (!clinicId) return [];

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          treatment_type,
          patient_id,
          patients!inner(full_name, phone)
        `)
        .gte('appointment_date', `${today}T00:00:00`)
        .lt('appointment_date', `${today}T23:59:59`)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    {
      enabled: !!clinicId,
      staleTime: 1 * 60 * 1000, // 1 minute
      cacheTime: 3 * 60 * 1000,
      localCacheMinutes: 1
    }
  );
}

export function useOptimizedUpcomingAppointments(clinicId: string | null, hours = 24) {
  return useOptimizedQuery<Appointment[]>(
    ['upcoming-appointments', clinicId, String(hours)],
    async () => {
      if (!clinicId) return [];

      const now = new Date();
      const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          treatment_type,
          patient_id,
          patients!inner(full_name, phone)
        `)
        .gte('appointment_date', now.toISOString())
        .lte('appointment_date', futureTime.toISOString())
        .eq('status', 'scheduled')
        .order('appointment_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    {
      enabled: !!clinicId,
      staleTime: 2 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      localCacheMinutes: 2
    }
  );
}
