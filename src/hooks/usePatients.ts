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
<<<<<<< HEAD
  notes?: string;
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
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
<<<<<<< HEAD
  financial_balance?: number;
  total_payments?: number;
  total_charges?: number;
  created_by_id?: string;
  created_by_name?: string;
  created_by_role?: 'doctor' | 'assistant' | 'secretary' | 'admin' | 'super_admin';
  last_modified_by_id?: string;
  last_modified_by_name?: string;
  last_modified_by_role?: 'doctor' | 'assistant' | 'secretary' | 'admin' | 'super_admin';
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
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
  
<<<<<<< HEAD
  console.log('🔍 Fetching patients with params:', { clinicId, search, limit, offset });
  
  if (!clinicId) {
    console.warn('⚠️ No clinic ID provided, returning empty data');
=======
  if (!clinicId) {
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
    return { data: [], total: 0 };
  }

  try {
<<<<<<< HEAD
    // Use direct supabase query for now to bypass optimized queries
    const { data: patientsData, error, count } = await supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Supabase query error:', error);
      throw error;
    }

    console.log('✅ Successfully fetched patients:', { count: patientsData?.length, total: count });

    const enhancedPatients: Patient[] = patientsData?.map(patient => ({
=======
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
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
      ...patient,
      address: patient.address || '',
      medical_history: patient.medical_history || '',
      financial_status: (patient.financial_status as 'paid' | 'pending' | 'overdue' | 'partial') || 'pending',
      assigned_doctor: undefined
    })) || [];

<<<<<<< HEAD
    return { data: enhancedPatients, total: count || 0 };
=======
    return { data: enhancedPatients, total: result.count || 0 };
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a

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
<<<<<<< HEAD
      if (!user) return 'default-clinic-id'; // حل مؤقت للاختبار
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('clinic_id, id')
        .eq('user_id', user.id)
        .single();
      
      return profiles?.clinic_id || profiles?.id || 'default-clinic-id';
=======
      if (!user) return null;
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      return profiles?.id || null;
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
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
<<<<<<< HEAD
      globalCaches.patients.clear();
=======
      const cache = globalCaches.patients;
      const keys = Array.from((cache as any).cache?.keys() || []);
      keys.forEach((key: string) => {
        if (key.includes(`patients_${clinicId}`)) {
          cache.clear();
        }
      });
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
    }
  };
};