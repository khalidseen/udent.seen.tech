import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, X, CheckCircle, AlertTriangle, Info, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

interface SmartNotification {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'supply_alert' | 'general' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_for: string;
  status: 'unread' | 'read' | 'dismissed';
  auto_generated: boolean;
  patient_id?: string;
  related_id?: string;
  related_type?: string;
  created_at: string;
}

export const SmartNotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  useEffect(() => {
    if (hasPermission('notifications.manage')) {
      fetchNotifications();
      // إعداد الاستعلام المباشر للإشعارات الجديدة
      setupRealtimeSubscription();
    }
  }, [hasPermission]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('status', 'unread')
        .lte('scheduled_for', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      // تحويل البيانات إلى النوع المطلوب
      const formattedNotifications: SmartNotification[] = (data || []).map(notification => ({
        ...notification,
        type: notification.type as 'appointment' | 'supply_alert' | 'general' | 'system',
        priority: notification.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: notification.status as 'unread' | 'read' | 'dismissed'
      }));
      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'خطأ في جلب الإشعارات',
        description: 'حدث خطأ أثناء جلب الإشعارات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          status: 'dismissed',
          dismissed_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );

      toast({
        title: 'تم إلغاء الإشعار',
        description: 'تم إلغاء الإشعار بنجاح',
      });
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment': return Calendar;
      case 'supply_alert': return AlertTriangle;
      case 'system': return Info;
      default: return Bell;
    }
  };

  if (!hasPermission('notifications.manage')) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            الإشعارات الذكية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          الإشعارات الذكية
          {notifications.length > 0 && (
            <Badge variant="destructive">{notifications.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          إشعارات تلقائية لتذكيرك بالمواعيد والمهام المهمة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد إشعارات جديدة</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = getTypeIcon(notification.type);
            return (
              <div
                key={notification.id}
                className="flex items-start gap-3 p-4 border rounded-lg bg-card hover:bg-accent transition-colors"
              >
                <Icon className="w-5 h-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                      {notification.priority === 'urgent' && 'عاجل'}
                      {notification.priority === 'high' && 'عالي'}
                      {notification.priority === 'medium' && 'متوسط'}
                      {notification.priority === 'low' && 'منخفض'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {new Date(notification.scheduled_for).toLocaleDateString('ar-SA', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="h-8 px-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissNotification(notification.id)}
                        className="h-8 px-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};