import { useOptimizedQuery } from "./useOptimizedQuery";
import { supabase } from "@/integrations/supabase/client";

interface PatientListItem {
  id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  patient_status: string;
  created_at: string;
  date_of_birth?: string | null;
  gender: string;
  financial_status?: string | null;
}

interface PatientsResponse {
  data: PatientListItem[];
  total: number;
}

export function useOptimizedPatientsList(
  clinicId: string | null,
  options: {
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { search, status = 'all', limit = 20, offset = 0 } = options;

  return useOptimizedQuery<PatientsResponse>(
    ['patients-list', clinicId, search, status, String(limit), String(offset)],
    async () => {
      if (!clinicId) {
        return { data: [], total: 0 };
      }

      // بناء الاستعلام مع الحقول المطلوبة فقط
      let query = supabase
        .from('patients')
        .select(`
          id,
          full_name,
          phone,
          email,
          patient_status,
          created_at,
          date_of_birth,
          gender,
          financial_status
        `, { count: 'exact' })
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // تطبيق فلتر البحث
      if (search && search.trim()) {
        query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // تطبيق فلتر الحالة
      if (status !== 'all') {
        query = query.eq('patient_status', status);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0
      };
    },
    {
      enabled: !!clinicId,
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000,
      localCacheMinutes: 2
    }
  );
}

export function useOptimizedPatientStats(clinicId: string | null) {
  return useOptimizedQuery<{
    total: number;
    active: number;
    inactive: number;
    archived: number;
  }>(
    ['patient-stats', clinicId],
    async () => {
      if (!clinicId) {
        return { total: 0, active: 0, inactive: 0, archived: 0 };
      }

      // جلب الإحصائيات بالتوازي
      const [totalResult, activeResult, inactiveResult, archivedResult] = await Promise.all([
        supabase
          .from('patients')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId),
        
        supabase
          .from('patients')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId)
          .eq('patient_status', 'active'),
        
        supabase
          .from('patients')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId)
          .eq('patient_status', 'inactive'),
        
        supabase
          .from('patients')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId)
          .eq('patient_status', 'archived')
      ]);

      return {
        total: totalResult.count || 0,
        active: activeResult.count || 0,
        inactive: inactiveResult.count || 0,
        archived: archivedResult.count || 0
      };
    },
    {
      enabled: !!clinicId,
      staleTime: 3 * 60 * 1000, // 3 minutes
      cacheTime: 10 * 60 * 1000,
      localCacheMinutes: 3
    }
  );
}
