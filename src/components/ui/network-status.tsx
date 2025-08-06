import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { offlineSyncService } from '@/lib/offline-sync';
import { toast } from 'sonner';

export function NetworkStatusIndicator() {
  const { isOnline, isOffline } = useNetworkStatus();

  const handleSync = async () => {
    if (!isOnline) {
      toast.error('لا يوجد اتصال بالإنترنت');
      return;
    }
    
    toast.info('جاري مزامنة البيانات...');
    await offlineSyncService.forcSync();
  };

  if (isOnline) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <Wifi className="h-4 w-4" />
        <span>متصل</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSync}
          className="h-6 px-2"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
      <WifiOff className="h-4 w-4" />
      <span>غير متصل</span>
      <span className="text-xs bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded">
        وضع offline
      </span>
    </div>
  );
}