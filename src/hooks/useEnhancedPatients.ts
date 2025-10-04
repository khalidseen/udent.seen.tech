import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { enhancedOfflineSyncService } from '@/lib/enhanced-offline-sync';
import { Patient, PatientsQueryParams } from './usePatients';

// Enhanced fetch function with better error handling and sync
const fetchPatientsEnhanced = async (params: PatientsQueryParams): Promise<{ data: Patient[]; total: number }> => {
  const { clinicId, search = '', limit = 50, offset = 0 } = params;
  
  console.log('🚀 Enhanced fetch patients with params:', { clinicId, search, limit, offset });
  
  try {
    // Check if user is super admin
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

    console.log('🔐 Enhanced: User is super admin:', isSuperAdmin);

    // Build fresh query
    let query = supabase
      .from('patients')
      .select('*', { count: 'exact' });

    // Apply clinic filter for non-super-admin users
    if (!isSuperAdmin && clinicId) {
      query = query.eq('clinic_id', clinicId);
    } else if (!isSuperAdmin && !clinicId) {
      console.warn('⚠️ No clinic ID for regular user');
      return { data: [], total: 0 };
    }

    // Apply search filter
    if (search && search.trim().length > 0) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Execute query with ordering and pagination
    const { data: patientsData, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Enhanced query error:', error);
      throw error;
    }

    console.log('✅ Enhanced fetch successful:', { 
      fetched: patientsData?.length || 0, 
      total: count || 0 
    });

    // Process and deduplicate data
    const processedPatients: Patient[] = (patientsData || []).map((patient: any) => ({
      ...patient,
      address: patient.address || '',
      medical_history: patient.medical_history || '',
      financial_status: (patient.financial_status as 'paid' | 'pending' | 'overdue' | 'partial') || 'pending'
    }));

    // Remove any duplicates based on ID
    const uniquePatients = processedPatients.filter((patient, index, self) => 
      index === self.findIndex(p => p.id === patient.id)
    );

    console.log('🔍 Unique patients after deduplication:', uniquePatients.length);

    return { 
      data: uniquePatients, 
      total: count || uniquePatients.length 
    };

  } catch (error) {
    console.error('❌ Enhanced fetch failed:', error);
    
    // Force sync and try again once
    try {
      console.log('🔄 Attempting force sync...');
      await enhancedOfflineSyncService.forceSync();
      
      // Retry the query once after sync
      let retryQuery = supabase.from('patients').select('*', { count: 'exact' });
      
      if (clinicId) {
        retryQuery = retryQuery.eq('clinic_id', clinicId);
      }
      
      const { data: retryData, count: retryCount } = await retryQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      const retryPatients: Patient[] = (retryData || []).map((patient: any) => ({
        ...patient,
        address: patient.address || '',
        medical_history: patient.medical_history || '',
        financial_status: (patient.financial_status as 'paid' | 'pending' | 'overdue' | 'partial') || 'pending'
      }));
      
      return { data: retryPatients, total: retryCount || 0 };
      
    } catch (retryError) {
      console.error('❌ Retry after sync failed:', retryError);
      return { data: [], total: 0 };
    }
  }
};

// Enhanced patients hook with better caching
export const useEnhancedPatients = (params: PatientsQueryParams) => {
  const queryKey = ['enhanced-patients', JSON.stringify(params)];
  
  return useQuery({
    queryKey,
    queryFn: () => fetchPatientsEnhanced(params),
    staleTime: 30 * 1000, // 30 seconds - shorter for real-time updates
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: false, // Only manual refresh
    enabled: true
  });
};

// Enhanced invalidation hook
export const useEnhancedInvalidatePatients = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => {
      // Remove all cached queries
      queryClient.removeQueries({ queryKey: ['enhanced-patients'] });
      queryClient.removeQueries({ queryKey: ['patients'] });
      // Force refetch
      queryClient.invalidateQueries({ queryKey: ['enhanced-patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
    forceSync: async () => {
      await enhancedOfflineSyncService.forceSync();
      queryClient.removeQueries({ queryKey: ['enhanced-patients'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-patients'] });
    }
  };
};