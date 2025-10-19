import { useOptimizedQuery } from "./useOptimizedQuery";
import { supabase } from "@/integrations/supabase/client";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  expiry_date?: string | null;
  supplier?: string | null;
}

export function useOptimizedLowStockItems(clinicId: string | null) {
  return useOptimizedQuery<InventoryItem[]>(
    ['low-stock-items', clinicId],
    async () => {
      if (!clinicId) return [];

      const { data, error } = await supabase
        .from('medical_supplies')
        .select(`
          id,
          name,
          category,
          current_stock,
          minimum_stock,
          expiry_date,
          supplier
        `)
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .filter('current_stock', 'lte', 'minimum_stock')
        .order('current_stock', { ascending: true })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    {
      enabled: !!clinicId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000,
      localCacheMinutes: 5
    }
  );
}

export function useOptimizedExpiringItems(clinicId: string | null, daysAhead = 30) {
  return useOptimizedQuery<InventoryItem[]>(
    ['expiring-items', clinicId, String(daysAhead)],
    async () => {
      if (!clinicId) return [];

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const { data, error } = await supabase
        .from('medical_supplies')
        .select(`
          id,
          name,
          category,
          current_stock,
          minimum_stock,
          expiry_date,
          supplier
        `)
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .not('expiry_date', 'is', null)
        .lte('expiry_date', futureDate.toISOString())
        .order('expiry_date', { ascending: true })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    {
      enabled: !!clinicId,
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 20 * 60 * 1000,
      localCacheMinutes: 10
    }
  );
}

export function useOptimizedInventoryStats(clinicId: string | null) {
  return useOptimizedQuery<{
    totalItems: number;
    lowStockCount: number;
    expiringCount: number;
    totalValue: number;
  }>(
    ['inventory-stats', clinicId],
    async () => {
      if (!clinicId) {
        return {
          totalItems: 0,
          lowStockCount: 0,
          expiringCount: 0,
          totalValue: 0
        };
      }

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      // جلب الإحصائيات بالتوازي
      const [totalResult, lowStockResult, expiringResult, allItemsResult] = await Promise.all([
        supabase
          .from('medical_supplies')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId)
          .eq('is_active', true),
        
        supabase
          .from('medical_supplies')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId)
          .eq('is_active', true)
          .filter('current_stock', 'lte', 'minimum_stock'),
        
        supabase
          .from('medical_supplies')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId)
          .eq('is_active', true)
          .not('expiry_date', 'is', null)
          .lte('expiry_date', futureDate.toISOString()),
        
        supabase
          .from('medical_supplies')
          .select('current_stock')
          .eq('clinic_id', clinicId)
          .eq('is_active', true)
      ]);

      // حساب عدد المواد فقط (بدون القيمة)
      const totalValue = 0;

      return {
        totalItems: totalResult.count || 0,
        lowStockCount: lowStockResult.count || 0,
        expiringCount: expiringResult.count || 0,
        totalValue
      };
    },
    {
      enabled: !!clinicId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000,
      localCacheMinutes: 5
    }
  );
}
