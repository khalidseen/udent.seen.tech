import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Doctor {
  id: string;
  full_name: string;
  specialization: string | null;
  status: string;
  email: string | null;
  phone: string | null;
  experience_years: number | null;
  consultation_fee: number | null;
  working_hours: string | null;
  license_number: string | null;
}

export const useDoctors = (clinicId: string | undefined) => {
  return useQuery({
    queryKey: ['doctors-active', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, full_name, specialization, status, email, phone, experience_years, consultation_fee, working_hours, license_number')
        .eq('clinic_id', clinicId!)
        .eq('status', 'active')
        .order('full_name');
      if (error) throw error;
      return data as Doctor[];
    },
    enabled: !!clinicId
  });
};
