import { supabase } from '@/integrations/supabase/client';
import { offlineDB } from '@/lib/offline-db';
import { toast } from 'sonner';

class OfflineSyncService {
  private issyncing = false;

  constructor() {
    // Listen for network restoration
    window.addEventListener('network-restored', this.syncAll.bind(this));
  }

  async syncAll(): Promise<void> {
    if (this.issyncing) return;
    
    this.issyncing = true;
    toast.info('بدء مزامنة البيانات...', { id: 'sync-start' });

    try {
      // Sync each table
      await this.syncTable('patients');
      await this.syncTable('appointments');
      await this.syncTable('dental_treatments');
      await this.syncTable('appointment_requests');

      // Process offline queue
      await this.processOfflineQueue();

      toast.success('تم مزامنة البيانات بنجاح', { id: 'sync-start' });
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('فشل في مزامنة البيانات', { id: 'sync-start' });
    } finally {
      this.issyncing = false;
    }
  }

  private async syncTable(tableName: 'patients' | 'appointments' | 'dental_treatments' | 'appointment_requests'): Promise<void> {
    try {
      // Get fresh data from server
      const { data: remoteData } = await supabase
        .from(tableName)
        .select('*');

      if (remoteData) {
        // Clear local table and update with remote data
        await offlineDB.clear(tableName);
        
        for (const item of remoteData) {
          await offlineDB.put(tableName, item);
        }
      }

      // Sync local changes to remote
      const pendingItems = await offlineDB.getPendingSync(tableName);
      
      for (const item of pendingItems) {
        await this.syncItemToRemote(tableName, item);
      }

    } catch (error) {
      console.error(`Failed to sync table ${tableName}:`, error);
      throw error;
    }
  }

  private async syncItemToRemote(tableName: 'patients' | 'appointments' | 'dental_treatments' | 'appointment_requests', item: any): Promise<void> {
    try {
      const { _offline_action, _pending_sync, ...cleanItem } = item;
      
      switch (_offline_action) {
        case 'create':
          await supabase.from(tableName).insert(cleanItem);
          break;
        case 'update':
          await supabase.from(tableName).update(cleanItem).eq('id', item.id);
          break;
        case 'delete':
          await supabase.from(tableName).delete().eq('id', item.id);
          await offlineDB.delete(tableName, item.id);
          return; // Don't clear sync flags for deleted items
      }

      // Clear sync flags after successful sync
      await offlineDB.clearSyncFlags(tableName, item.id);
      
    } catch (error) {
      console.error(`Failed to sync item ${item.id} to remote:`, error);
      throw error;
    }
  }

  private async processOfflineQueue(): Promise<void> {
    const queue = await offlineDB.getQueue();
    
    for (const queueItem of queue) {
      try {
        const tableName = queueItem.table as 'patients' | 'appointments' | 'dental_treatments' | 'appointment_requests';
        await this.syncItemToRemote(tableName, queueItem.data);
        await offlineDB.removeFromQueue(queueItem.id);
      } catch (error) {
        console.error('Failed to process queue item:', error);
        // Keep item in queue for retry
      }
    }
  }

  // Manual sync trigger
  async forcSync(): Promise<void> {
    if (!navigator.onLine) {
      toast.error('لا يوجد اتصال بالإنترنت');
      return;
    }
    
    await this.syncAll();
  }
}

export const offlineSyncService = new OfflineSyncService();
