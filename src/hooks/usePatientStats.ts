import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PatientStats {
  records: number;
  appointments: number;
  treatments: number;
  invoices: number;
  images: number;
}

export const usePatientStats = (patientId: string) => {
  return useQuery({
    queryKey: ['patient-stats', patientId],
    queryFn: async (): Promise<PatientStats> => {
      const [
        { count: recordsCount },
        { count: appointmentsCount },
        { count: treatmentsCount },
        { count: invoicesCount },
        { count: imagesCount },
      ] = await Promise.all([
        supabase
          .from('medical_records')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', patientId),
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', patientId)
          .gte('appointment_date', new Date().toISOString()),
        supabase
          .from('dental_treatments')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', patientId),
        supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', patientId),
        supabase
          .from('medical_images')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', patientId),
      ]);

      return {
        records: recordsCount || 0,
        appointments: appointmentsCount || 0,
        treatments: treatmentsCount || 0,
        invoices: invoicesCount || 0,
        images: imagesCount || 0,
      };
    },
    enabled: !!patientId,
    staleTime: 60 * 1000, // 1 minute
  });
};
