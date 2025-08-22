import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Trash2, Database } from 'lucide-react';
import { toast } from 'sonner';
import { offlineDB } from '@/lib/offline-db';
import { offlineSyncService } from '@/lib/offline-sync';

export function CacheManager() {
  const clearAllCaches = async () => {
    try {
      // Clear browser caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Clear offline database
      const tables = ['patients', 'appointments', 'dental_treatments', 'appointment_requests', 
                    'medical_records', 'medical_images', 'invoices', 'invoice_items', 'payments', 
                    'medical_supplies', 'service_prices', 'purchase_orders', 'purchase_order_items', 
                    'stock_movements', 'profiles', 'notifications', 'notification_templates'];
      
      for (const table of tables) {
        await offlineDB.clear(table as any);
      }
      
      await offlineDB.clearQueue();
      
      toast.success('تم مسح جميع البيانات المخزنة مؤقتاً');
      
      // Reload the page
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error('خطأ في مسح البيانات المخزنة');
      console.error('Cache clear error:', error);
    }
  };

  const forceSync = async () => {
    try {
      await offlineSyncService.forcSync();
      toast.success('تمت المزامنة بنجاح');
    } catch (error) {
      toast.error('خطأ في المزامنة');
      console.error('Sync error:', error);
    }
  };

  const reloadApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          إدارة البيانات المخزنة
        </CardTitle>
        <CardDescription>
          إدارة البيانات المخزنة محلياً ومزامنة البيانات
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={forceSync}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            مزامنة البيانات
          </Button>
          
          <Button 
            onClick={reloadApp}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            إعادة تحميل التطبيق
          </Button>
          
          <Button 
            onClick={clearAllCaches}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            مسح جميع البيانات
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p>• <strong>مزامنة البيانات:</strong> مزامنة البيانات المحلية مع الخادم</p>
          <p>• <strong>إعادة تحميل التطبيق:</strong> إعادة تشغيل التطبيق مع أحدث إصدار</p>
          <p>• <strong>مسح جميع البيانات:</strong> حذف جميع البيانات المخزنة محلياً (استخدم بحذر)</p>
        </div>
      </CardContent>
    </Card>
  );
}