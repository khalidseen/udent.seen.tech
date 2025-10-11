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
  notes?: string;
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
  financial_balance?: number;
  total_payments?: number;
  total_charges?: number;
  created_by_id?: string;
  created_by_name?: string;
  created_by_role?: string;
  last_modified_by_id?: string;
  last_modified_by_name?: string;
  last_modified_by_role?: string;
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
  
  console.log('🔍 Fetching patients with params:', { clinicId, search, limit, offset });
  
  if (!clinicId) {
    console.warn('⚠️ No clinic ID provided, trying to fetch all patients');
    // If no clinic_id, try to fetch patients without filter for testing
    try {
      const { data: allPatients, error, count } = await supabase
        .from('patients')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const enhancedPatients: Patient[] = (allPatients?.map(patient => ({
        ...patient,
        address: patient.address || '',
        medical_history: patient.medical_history || '',
        financial_status: (patient.financial_status as 'paid' | 'pending' | 'overdue' | 'partial') || 'pending',
        assigned_doctor: undefined
      })) || []) as Patient[];

      return { data: enhancedPatients, total: count || 0 };
    } catch (error) {
      console.error('Error fetching patients:', error);
      return { data: [], total: 0 };
    }
  }

  try {
    // Optimized query: Select only needed columns with clinic_id filter
    let query = supabase
      .from('patients')
      .select(`
        id, full_name, phone, email, date_of_birth, gender, 
        national_id, patient_status, financial_status, financial_balance,
        clinic_id, created_at, blood_type
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Add clinic_id filter if provided
    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }

    // Add search filter if provided
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data: patientsData, error, count } = await query;

    if (error) {
      console.error('❌ Supabase query error:', error);
      throw error;
    }

    console.log('✅ Successfully fetched patients:', { count: patientsData?.length, total: count });

    const enhancedPatients: Patient[] = (patientsData?.map(patient => ({
      ...patient,
      address: '',
      medical_history: '',
      financial_status: (patient.financial_status as 'paid' | 'pending' | 'overdue' | 'partial') || 'pending',
      assigned_doctor: undefined
    })) || []) as Patient[];

    return { data: enhancedPatients, total: count || 0 };

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
      enabled: params?.clinicId !== undefined, // فعّل الجلب فقط بعد توفر clinicId لضمان نتائج صحيحة مع RLS
      staleTime: 2 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      localCacheMinutes: 3
    }
  );
};

// Hook for getting current user's clinic ID (returns profile.id as clinic_id)
export const useClinicId = () => {
  return useQuery({
    queryKey: ['clinic-id'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('⚠️ No authenticated user');
        return undefined;
      }
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return undefined;
      }
      
      // استخدام profiles.id كـ clinic_id (لأن foreign keys تشير إلى profiles.id)
      const clinicId = profiles?.id;
      console.log('✅ Clinic ID (Profile ID):', clinicId);
      return clinicId;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
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
      globalCaches.patients.clear();
    }
  };
};