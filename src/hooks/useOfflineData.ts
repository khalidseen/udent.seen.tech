import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { offlineDB } from '@/lib/offline-db';
import { offlineSupabase } from '@/lib/offline-supabase';

type TableName = 'patients' | 'appointments' | 'dental_treatments' | 'appointment_requests' | 'medical_records' | 'medical_images' | 'invoices' | 'invoice_items' | 'payments' | 'medical_supplies' | 'service_prices' | 'purchase_orders' | 'purchase_order_items' | 'stock_movements' | 'profiles' | 'notifications' | 'notification_templates';

interface UseOfflineDataOptions {
  table: TableName;
  filter?: Record<string, any>;
  order?: { column: string; ascending: boolean };
  autoRefresh?: boolean;
}

export function useOfflineData<T = any>({ table, filter, order, autoRefresh = true }: UseOfflineDataOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);

  // Memoize filter and order to prevent unnecessary re-renders
  const memoizedFilter = useMemo(() => filter, [filter]);
  const memoizedOrder = useMemo(() => order, [order]);

  const fetchData = useCallback(async (force = false) => {
    const now = Date.now();
    // Prevent frequent fetches (min 10 seconds between calls unless forced)
    if (!force && now - lastFetchRef.current < 10000) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      lastFetchRef.current = now;
      
      const result = await offlineSupabase.select(table, { 
        filter: memoizedFilter, 
        order: memoizedOrder 
      });
      
      if (result.error) {
        setError(result.error.message || 'خطأ في جلب البيانات');
      } else {
        setData(result.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ غير معروف');
    } finally {
      setLoading(false);
    }
  }, [table, memoizedFilter, memoizedOrder]);

  useEffect(() => {
    fetchData(true);

    if (autoRefresh) {
      // Clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      
      // Refresh data every 5 minutes when online (reduced from 30 seconds)
      refreshIntervalRef.current = setInterval(() => {
        if (navigator.onLine && document.visibilityState === 'visible') {
          fetchData();
        }
      }, 300000); // 5 minutes

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [fetchData, autoRefresh]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (autoRefresh) {
        fetchData(true);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine && autoRefresh) {
        fetchData();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData, autoRefresh]);

  const add = useCallback(async (newData: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const result = await offlineSupabase.insert(table, newData);
      if (result.error) {
        throw new Error(result.error.message);
      }
      await fetchData(true); // Force refresh after add
      return result.data;
    } catch (err) {
      throw err;
    }
  }, [table, fetchData]);

  const update = useCallback(async (id: string, updates: Partial<T>) => {
    try {
      const result = await offlineSupabase.update(table, updates, { column: 'id', value: id });
      if (result.error) {
        throw new Error(result.error.message);
      }
      await fetchData(true); // Force refresh after update
      return result.data;
    } catch (err) {
      throw err;
    }
  }, [table, fetchData]);

  const remove = useCallback(async (id: string) => {
    try {
      const result = await offlineSupabase.delete(table, { column: 'id', value: id });
      if (result.error) {
        throw new Error(result.error.message);
      }
      await fetchData(true); // Force refresh after delete
      return result.data;
    } catch (err) {
      throw err;
    }
  }, [table, fetchData]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  return {
    data,
    loading,
    error,
    isOffline,
    refresh,
    add,
    update,
    remove
  };
}