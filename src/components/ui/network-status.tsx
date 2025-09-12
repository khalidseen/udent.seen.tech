import { WifiOff, Wifi, RefreshCw, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { offlineSyncService } from '@/lib/offline-sync';
import { offlineDB } from '@/lib/offline-db';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
export function NetworkStatusIndicator() {
  const {
    isOnline,
    isOffline
  } = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    updatePendingCount();

    // Update pending count periodically
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, []);
  const updatePendingCount = async () => {
    try {
      const queue = await offlineDB.getQueue();
      setPendingCount(queue.length);
    } catch (error) {
      console.error('Error getting pending count:', error);
    }
  };
  const handleSync = async () => {
    if (!isOnline) {
      toast.error('لا يوجد اتصال بالإنترنت');
      return;
    }
    setLoading(true);
    toast.info('جاري مزامنة البيانات...');
    try {
      await offlineSyncService.forcSync();
      await updatePendingCount();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setLoading(false);
    }
  };
  if (isOnline) {
    return <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          
          
        </div>
        
        {pendingCount > 0 && <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            <Database className="h-3 w-3 ml-1" />
            {pendingCount} عملية منتظرة
          </Badge>}
        
        
      </div>;
  }
  return <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
        <WifiOff className="h-4 w-4" />
        <span>غير متصل</span>
      </div>
      
      <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
        وضع offline
      </Badge>
      
      {pendingCount > 0 && <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          <Database className="h-3 w-3 ml-1" />
          {pendingCount} محفوظ محلياً
        </Badge>}
    </div>;
}