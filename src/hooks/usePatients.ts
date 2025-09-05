import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { offlineSupabase } from '@/lib/offline-supabase';
import { globalCaches } from '@/lib/performance-optimizations';
import { optimizedPatientQueries } from '@/lib/optimized-queries';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';

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

// Enhanced fetch function using optimized queries
const fetchPatients = async (params: PatientsQueryParams): Promise<{ data: Patient[]; total: number }> => {
  const { clinicId, search = '', limit = 50, offset = 0 } = params;
  
  if (!clinicId) {
    return { data: [], total: 0 };
  }

  try {
    // Use optimized query with pagination
    const page = Math.floor(offset / limit) + 1;
    const result = await optimizedPatientQueries.getPatients(
      clinicId, 
      page, 
      limit, 
      search
    );

    if (result.error) throw result.error;

    const enhancedPatients: Patient[] = result.data?.map(patient => ({
      ...patient,
      address: patient.address || '',
      medical_history: patient.medical_history || '',
      financial_status: (patient.financial_status as 'paid' | 'pending' | 'overdue' | 'partial') || 'pending',
      assigned_doctor: undefined
    })) || [];

    return { data: enhancedPatients, total: result.count || 0 };

  } catch (error) {
    console.error('Error fetching patients:', error);
    
    // Fallback to offline data
    try {
      const patientsResult = await offlineSupabase.select('patients', {
        filter: { clinic_id: clinicId },
        order: { column: 'created_at', ascending: false }
      });

      const fallbackPatients: Patient[] = patientsResult.data?.map(patient => ({
        ...patient,
        address: patient.address || '',
        medical_history: patient.medical_history || '',
        financial_status: (patient.financial_status as 'paid' | 'pending' | 'overdue' | 'partial') || 'pending',
        assigned_doctor: undefined
      })) || [];

      return { data: fallbackPatients, total: fallbackPatients.length };
    } catch (offlineError) {
      console.error('Offline fallback failed:', offlineError);
      return { data: [], total: 0 };
    }
  }
};

// Hook for fetching patients with optimized query
export const usePatients = (params: PatientsQueryParams) => {
  const queryKey = ['patients', JSON.stringify(params)];
  
  return useOptimizedQuery(
    queryKey,
    () => fetchPatients(params),
    {
      enabled: !!params.clinicId,
      staleTime: 2 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      localCacheMinutes: 3
    }
  );
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