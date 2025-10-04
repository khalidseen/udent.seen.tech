import { supabase } from '@/integrations/supabase/client';
import { offlineDB } from '@/lib/offline-db';
import { toast } from 'sonner';

class EnhancedOfflineSyncService {
  private issyncing = false;

  constructor() {
    // Listen for network restoration
    window.addEventListener('network-restored', this.syncAll.bind(this));
  }

  async syncAll(): Promise<void> {
    if (this.issyncing) return;
    
    this.issyncing = true;
    console.log('🔄 Starting enhanced sync...');

    try {
      // Sync patients with proper deduplication
      await this.syncPatientsTable();
      
      console.log('✅ Enhanced sync completed');
    } catch (error) {
      console.error('❌ Enhanced sync failed:', error);
    } finally {
      this.issyncing = false;
    }
  }

  private async syncPatientsTable(): Promise<void> {
    try {
      console.log('🔄 Syncing patients table...');
      
      // Get all patients from server
      const { data: serverPatients, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (!serverPatients) {
        console.warn('⚠️ No server patients data received');
        return;
      }

      console.log(`📥 Found ${serverPatients.length} patients on server`);

      // Clear local cache completely
      await offlineDB.clear('patients');
      console.log('🗑️ Cleared local patients cache');

      // Add all server patients to local cache
      for (const patient of serverPatients) {
        await offlineDB.put('patients', patient);
      }

      console.log(`✅ Synced ${serverPatients.length} patients to local cache`);

    } catch (error) {
      console.error('❌ Failed to sync patients table:', error);
      throw error;
    }
  }

  // Manual sync trigger
  async forceSync(): Promise<void> {
    if (!navigator.onLine) {
      toast.error('لا يوجد اتصال بالإنترنت');
      return;
    }
    
    toast.info('جاري المزامنة...', { id: 'sync-patients' });
    
    try {
      await this.syncAll();
      toast.success('تم تحديث البيانات بنجاح', { id: 'sync-patients' });
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('فشل في تحديث البيانات', { id: 'sync-patients' });
    }
  }
}

export const enhancedOfflineSyncService = new EnhancedOfflineSyncService();