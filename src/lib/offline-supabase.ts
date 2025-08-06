import { supabase } from '@/integrations/supabase/client';
import { offlineDB } from '@/lib/offline-db';
import { toast } from 'sonner';

type DatabaseTable = 'patients' | 'appointments' | 'dental_treatments' | 'appointment_requests';

class OfflineSupabaseClient {
  private isOnline(): boolean {
    return navigator.onLine;
  }

  async select(table: DatabaseTable, query?: any) {
    if (this.isOnline()) {
      try {
        const result = await supabase.from(table).select(query?.select || '*');
        
        if (result.data && Array.isArray(result.data)) {
          await offlineDB.clear(table);
          for (const item of result.data) {
            await offlineDB.put(table, item);
          }
        }
        
        return result;
      } catch (error) {
        console.error('Online query failed, falling back to offline:', error);
      }
    }

    const data = await offlineDB.getAll(table);
    return { data, error: null };
  }

  async insert(table: DatabaseTable, data: any) {
    const id = data.id || crypto.randomUUID();
    const now = new Date().toISOString();
    
    const insertData = Object.assign({}, data, {
      id,
      created_at: now,
      updated_at: now,
    });

    if (this.isOnline()) {
      try {
        const result = await supabase.from(table).insert(insertData);
        await offlineDB.put(table, insertData);
        return result;
      } catch (error) {
        console.error('Online insert failed, saving offline:', error);
        toast.info('تم حفظ البيانات محلياً - ستتم المزامنة عند عودة الإنترنت');
      }
    }

    const offlineData = Object.assign({}, insertData, {
      _offline_action: 'create',
      _pending_sync: true,
    });

    await offlineDB.put(table, offlineData);
    await offlineDB.addToQueue(table, 'create', insertData);
    
    return { data: [insertData], error: null };
  }

  async update(table: DatabaseTable, data: any, condition: { column: string; value: string }) {
    const updateData = Object.assign({}, data, {
      updated_at: new Date().toISOString(),
    });

    if (this.isOnline()) {
      try {
        const result = await supabase.from(table).update(updateData).eq(condition.column, condition.value);
        
        const existingItem = await offlineDB.get(table, condition.value);
        if (existingItem) {
          await offlineDB.put(table, Object.assign({}, existingItem, updateData));
        }
        
        return result;
      } catch (error) {
        console.error('Online update failed, saving offline:', error);
        toast.info('تم حفظ التعديلات محلياً - ستتم المزامنة عند عودة الإنترنت');
      }
    }

    const existingItem = await offlineDB.get(table, condition.value);
    if (existingItem) {
      const updatedItem = Object.assign({}, existingItem, updateData, {
        _offline_action: 'update',
        _pending_sync: true,
      });
      
      await offlineDB.put(table, updatedItem);
      await offlineDB.addToQueue(table, 'update', updatedItem);
    }
    
    return { data: null, error: null };
  }

  async delete(table: DatabaseTable, condition: { column: string; value: string }) {
    if (this.isOnline()) {
      try {
        const result = await supabase.from(table).delete().eq(condition.column, condition.value);
        await offlineDB.delete(table, condition.value);
        return result;
      } catch (error) {
        console.error('Online delete failed, marking for deletion:', error);
        toast.info('تم وضع علامة حذف - ستتم المزامنة عند عودة الإنترنت');
      }
    }

    const existingItem = await offlineDB.get(table, condition.value);
    if (existingItem) {
      const deleteItem = Object.assign({}, existingItem, {
        _offline_action: 'delete',
        _pending_sync: true,
      });
      
      await offlineDB.put(table, deleteItem);
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