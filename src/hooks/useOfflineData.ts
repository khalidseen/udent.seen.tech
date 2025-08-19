import { useState, useEffect } from 'react';
import { offlineDB } from '@/lib/offline-db';
import { offlineSupabase } from '@/lib/offline-supabase';

type TableName = 'patients' | 'appointments' | 'dental_treatments' | 'appointment_requests' | 'medical_records' | 'medical_images' | 'invoices' | 'invoice_items' | 'payments' | 'medical_supplies' | 'service_prices' | 'purchase_orders' | 'purchase_order_items' | 'stock_movements' | 'profiles';

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

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await offlineSupabase.select(table, { filter, order });
      
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
  };

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      // Refresh data every 30 seconds when online
      const interval = setInterval(() => {
        if (navigator.onLine) {
          fetchData();
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [table, JSON.stringify(filter), JSON.stringify(order), autoRefresh]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (autoRefresh) {
        fetchData();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoRefresh]);

  const add = async (newData: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const result = await offlineSupabase.insert(table, newData);
      if (result.error) {
        throw new Error(result.error.message);
      }
      await fetchData(); // Refresh data
      return result.data;
    } catch (err) {
      throw err;
    }
  };

  const update = async (id: string, updates: Partial<T>) => {
    try {
      const result = await offlineSupabase.update(table, updates, { column: 'id', value: id });
      if (result.error) {
        throw new Error(result.error.message);
      }
      await fetchData(); // Refresh data
      return result.data;
    } catch (err) {
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      const result = await offlineSupabase.delete(table, { column: 'id', value: id });
      if (result.error) {
        throw new Error(result.error.message);
      }
      await fetchData(); // Refresh data
      return result.data;
    } catch (err) {
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    isOffline,
    refresh: fetchData,
    add,
    update,
    remove
  };
}