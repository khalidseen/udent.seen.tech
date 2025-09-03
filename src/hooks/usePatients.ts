import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { offlineSupabase } from '@/lib/offline-supabase';
import { globalCaches } from '@/lib/performance-optimizations';

export interface Patient {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  date_of_birth: string;
  gender: string;
  address: string;
  medical_history: string;
  created_at: string;
  national_id?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  patient_status: string;
  insurance_info?: string;
  blood_type?: string;
  occupation?: string;
  marital_status?: string;
  assigned_doctor_id?: string;
  medical_condition?: string;
  financial_status: 'paid' | 'pending' | 'overdue' | 'partial';
  assigned_doctor?: {
    full_name: string;
  };
}

export interface PatientsQueryParams {
  clinicId?: string;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
}

// Enhanced fetch function with better performance
const fetchPatients = async (params: PatientsQueryParams): Promise<{ data: Patient[]; total: number }> => {
  const { clinicId, search = '', limit = 50, offset = 0, orderBy = 'created_at', ascending = false } = params;
  
  if (!clinicId) {
    return { data: [], total: 0 };
  }

  // Check cache first
  const cacheKey = `patients_${clinicId}_${search}_${limit}_${offset}_${orderBy}_${ascending}`;
  const cached = globalCaches.patients.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    let query = supabase
      .from('patients')
      .select(`
        *,
        assigned_doctor:doctors(full_name)
      `, { count: 'exact' })
      .eq('clinic_id', clinicId);

    // Add search filter if provided
    if (search) {
      query = query.or(`
        full_name.ilike.%${search}%,
        phone.ilike.%${search}%,
        email.ilike.%${search}%,
        national_id.ilike.%${search}%
      `);
    }

    // Add pagination and ordering
    query = query
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    const { data: patientsData, error, count } = await query;

    if (error) throw error;

    const enhancedPatients: Patient[] = patientsData?.map(patient => ({
      ...patient,
      financial_status: patient.financial_status as 'paid' | 'pending' | 'overdue' | 'partial' || 'pending',
      assigned_doctor: patient.assigned_doctor ? {
        full_name: patient.assigned_doctor.full_name
      } : undefined
    })) || [];

    const result = { data: enhancedPatients, total: count || 0 };
    
    // Cache the result
    globalCaches.patients.set(cacheKey, result, 5 * 60 * 1000); // 5 minutes
    
    return result;

  } catch (error) {
    console.error('Error fetching patients:', error);
    
    // Fallback to offline data
    try {
      const patientsResult = await offlineSupabase.select('patients', {
        filter: { clinic_id: clinicId },
        order: { column: orderBy, ascending }
      });

      const fallbackPatients: Patient[] = patientsResult.data?.map(patient => ({
        ...patient,
        financial_status: patient.financial_status as 'paid' | 'pending' | 'overdue' | 'partial' || 'pending',
        assigned_doctor: undefined
      })) || [];

      return { data: fallbackPatients, total: fallbackPatients.length };
    } catch (offlineError) {
      console.error('Offline fallback failed:', offlineError);
      return { data: [], total: 0 };
    }
  }
};

// Hook for fetching patients with React Query
export const usePatients = (params: PatientsQueryParams) => {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: () => fetchPatients(params),
    enabled: !!params.clinicId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry if it's a permission error
      if (error?.message?.includes('permission')) return false;
      return failureCount < 2;
    }
  });
};

// Hook for getting current user's clinic ID
export const useClinicId = () => {
  return useQuery({
    queryKey: ['clinic-id'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      return profiles?.id || null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Hook for invalidating patients cache
export const useInvalidatePatients = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      globalCaches.patients.clear();
    },
    invalidateSpecific: (clinicId: string) => {
      queryClient.invalidateQueries({ queryKey: ['patients', { clinicId }] });
      // Clear specific cache entries
      const cache = globalCaches.patients;
      const keys = Array.from((cache as any).cache?.keys() || []);
      keys.forEach((key: string) => {
        if (key.includes(`patients_${clinicId}`)) {
          cache.clear();
        }
      });
    }
  };
};