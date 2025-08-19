import { supabase } from '@/integrations/supabase/client';
import { offlineDB } from '@/lib/offline-db';
import { toast } from 'sonner';

type DatabaseTable = 'patients' | 'appointments' | 'dental_treatments' | 'appointment_requests' | 'medical_records' | 'medical_images' | 'invoices' | 'invoice_items' | 'payments' | 'medical_supplies' | 'service_prices' | 'purchase_orders' | 'purchase_order_items' | 'stock_movements' | 'profiles';

class OfflineSupabaseClient {
  private isOnline(): boolean {
    return navigator.onLine;
  }

  async select(table: DatabaseTable, query?: any) {
    if (this.isOnline()) {
      try {
        let supabaseQuery = supabase.from(table).select(query?.select || '*');
        
        // Apply filters if provided
        if (query?.filter) {
          Object.entries(query.filter).forEach(([key, value]) => {
            supabaseQuery = supabaseQuery.eq(key, value);
          });
        }
        
        // Apply ordering if provided
        if (query?.order) {
          supabaseQuery = supabaseQuery.order(query.order.column, { ascending: query.order.ascending });
        }
        
        const result = await supabaseQuery;
        
        if (result.data && Array.isArray(result.data)) {
          // Store fresh data locally
          const existingData = await offlineDB.getAll(table);
          
          // If we're filtering, don't clear all data, just update/add relevant items
          if (query?.filter) {
            for (const item of result.data) {
              await offlineDB.put(table, item);
            }
          } else {
            // If no filter, replace all data
            await offlineDB.clear(table);
            for (const item of result.data) {
              await offlineDB.put(table, item);
            }
          }
        }
        
        return result;
      } catch (error) {
        console.error('Online query failed, falling back to offline:', error);
        toast.info('استخدام البيانات المحلية - لا يوجد اتصال بالإنترنت');
      }
    }

    // Offline fallback
    let data = await offlineDB.getAll(table);
    
    // Apply filters locally
    if (query?.filter) {
      data = data.filter(item => {
        return Object.entries(query.filter).every(([key, value]) => item[key] === value);
      });
    }
    
    // Apply ordering locally
    if (query?.order) {
      data = data.sort((a, b) => {
        const aVal = a[query.order.column];
        const bVal = b[query.order.column];
        if (query.order.ascending) {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }
    
    return { data, error: null };
  }

  async insert(table: DatabaseTable, data: any) {
    const id = data.id || crypto.randomUUID();
    const now = new Date().toISOString();
    
    const insertData = Object.assign({}, data);
    insertData.id = id;
    insertData.created_at = now;
    insertData.updated_at = now;

    if (this.isOnline()) {
      try {
        // Type assertion to bypass complex type checking
        const result = await (supabase.from(table) as any).insert(insertData);
        await offlineDB.put(table, insertData);
        return result;
      } catch (error) {
        console.error('Online insert failed, saving offline:', error);
        toast.info('تم حفظ البيانات محلياً - ستتم المزامنة عند عودة الإنترنت');
      }
    }

    insertData._offline_action = 'create';
    insertData._pending_sync = true;

    await offlineDB.put(table, insertData);
    await offlineDB.addToQueue(table, 'create', insertData);
    
    return { data: [insertData], error: null };
  }

  async update(table: DatabaseTable, data: any, condition: { column: string; value: string }) {
    const updateData = Object.assign({}, data);
    updateData.updated_at = new Date().toISOString();

    if (this.isOnline()) {
      try {
        // Type assertion to bypass complex type checking
        const result = await (supabase.from(table) as any).update(updateData).eq(condition.column, condition.value);
        
        const existingItem = await offlineDB.get(table, condition.value);
        if (existingItem) {
          const mergedItem = Object.assign({}, existingItem, updateData);
          await offlineDB.put(table, mergedItem);
        }
        
        return result;
      } catch (error) {
        console.error('Online update failed, saving offline:', error);
        toast.info('تم حفظ التعديلات محلياً - ستتم المزامنة عند عودة الإنترنت');
      }
    }

    const existingItem = await offlineDB.get(table, condition.value);
    if (existingItem) {
      const updatedItem = Object.assign({}, existingItem, updateData);
      updatedItem._offline_action = 'update';
      updatedItem._pending_sync = true;
      
      await offlineDB.put(table, updatedItem);
      await offlineDB.addToQueue(table, 'update', updatedItem);
    }
    
    return { data: null, error: null };
  }

  async delete(table: DatabaseTable, condition: { column: string; value: string }) {
    if (this.isOnline()) {
      try {
        const result = await (supabase.from(table) as any).delete().eq(condition.column, condition.value);
        await offlineDB.delete(table, condition.value);
        return result;
      } catch (error) {
        console.error('Online delete failed, marking for deletion:', error);
        toast.info('تم وضع علامة حذف - ستتم المزامنة عند عودة الإنترنت');
      }
    }

    const existingItem = await offlineDB.get(table, condition.value);
    if (existingItem) {
      existingItem._offline_action = 'delete';
      existingItem._pending_sync = true;
      
      await offlineDB.put(table, existingItem);
      await offlineDB.addToQueue(table, 'delete', existingItem);
    }
    
    return { data: null, error: null };
  }

  get auth() {
    return supabase.auth;
  }

  async sync() {
    const { offlineSyncService } = await import('@/lib/offline-sync');
    await offlineSyncService.forcSync();
  }
}

export const offlineSupabase = new OfflineSupabaseClient();
offlineDB.init();