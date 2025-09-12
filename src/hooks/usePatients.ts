import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { offlineSupabase } from '@/lib/offline-supabase';
import { offlineDB } from '@/lib/offline-db';
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
  created_by_role?: 'doctor' | 'assistant' | 'secretary' | 'admin' | 'super_admin';
  last_modified_by_id?: string;
  last_modified_by_name?: string;
  last_modified_by_role?: 'doctor' | 'assistant' | 'secretary' | 'admin' | 'super_admin';
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
  
  // Clear any stale offline data first
  try {
    if (!search || search.trim().length === 0) {
      const staleOfflineData = await offlineSupabase.select('patients', {});
      console.log('🗑️ Found stale offline data:', staleOfflineData.data?.length || 0);
    }
  } catch (e) {
    console.warn('Could not check offline data:', e);
  }
  
  try {
    // Determine if current user is super admin to control clinic filtering
    const { data: { user } } = await supabase.auth.getUser();
    let isSuperAdmin = false;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      isSuperAdmin = profile?.role === 'super_admin';
    }

    console.log('🔍 User is super admin:', isSuperAdmin);

    // Build query with conditional search to avoid empty-search issues
    let query = supabase
      .from('patients')
      .select('*', { count: 'exact' });

    // Apply clinic filter only for non-super-admin users
    if (!isSuperAdmin) {
      if (!clinicId) {
        console.warn('⚠️ No clinic ID for non-super-admin user, returning empty data');
        return { data: [], total: 0 };
      }
      query = query.eq('clinic_id', clinicId);
    } else {
      console.log('🔐 Super admin detected - querying ALL patients across ALL clinics');
    }

    if (search && search.trim().length > 0) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: patientsData, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Supabase query error:', error);
      throw error;
    }

    console.log('✅ Successfully fetched patients:', { count: patientsData?.length, total: count });

    // تخزين البيانات الحديثة في الـ offline cache
    if (patientsData && patientsData.length > 0) {
      try {
        // مسح البيانات القديمة أولاً
        await offlineDB.clear('patients');
        // إضافة البيانات الجديدة
        for (const patient of patientsData) {
          await offlineDB.put('patients', patient);
        }
      } catch (e) {
        console.warn('⚠️ Failed to update offline cache:', e);
      }
    }

  const enhancedPatients = ((patientsData?.map((patient: any) => ({
    ...patient,
    address: patient.address || '',
    medical_history: patient.medical_history || '',
    financial_status: (patient.financial_status as 'paid' | 'pending' | 'overdue' | 'partial') || 'pending'
  })) || []) as unknown) as Patient[];

  // Remove duplicates based on patient ID
  const uniquePatients = enhancedPatients.filter((patient, index, self) => 
    index === self.findIndex(p => p.id === patient.id)
  );

  return { data: uniquePatients, total: count || 0 };

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

    // Remove duplicates from fallback data too
    const uniqueFallbackPatients = fallbackPatients.filter((patient, index, self) => 
      index === self.findIndex(p => p.id === patient.id)
    );

    return { data: uniqueFallbackPatients, total: uniqueFallbackPatients.length };
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
      enabled: true, // Always enabled - super admins don't need clinic_id
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
      if (!user) return 'default-clinic-id'; // حل مؤقت للاختبار
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      return profile?.clinic_id || 'default-clinic-id';
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
      queryClient.removeQueries({ queryKey: ['patients'] });
      globalCaches.patients.clear();
    },
    invalidateSpecific: (clinicId: string) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.removeQueries({ queryKey: ['patients'] });
      globalCaches.patients.clear();
    },
    forceRefresh: () => {
      queryClient.removeQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      globalCaches.patients.clear();
    }
  };
};