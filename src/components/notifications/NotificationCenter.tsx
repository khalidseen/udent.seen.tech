import { useState, useEffect } from "react";
import { Bell, X, Clock, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOfflineData } from "@/hooks/useOfflineData";
import { offlineSupabase } from "@/lib/offline-supabase";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'medication' | 'followup' | 'supply_alert' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'dismissed';
  scheduled_for: string;
  patient_id?: string;
  related_id?: string;
  related_type?: string;
  auto_generated: boolean;
  created_at: string;
  dismissed_at?: string;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: notifications, loading, refresh } = useOfflineData<Notification>({
    table: 'notifications',
    order: { column: 'scheduled_for', ascending: false },
    autoRefresh: true
  });

  const unreadNotifications = notifications.filter(n => n.status === 'unread');
  const todayNotifications = notifications.filter(n => {
    const today = new Date().toDateString();
    return new Date(n.scheduled_for).toDateString() === today;
  });

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'medium':
        return <Info className="h-4 w-4 text-primary" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Clock className="h-4 w-4" />;
      case 'supply_alert':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'warning';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await offlineSupabase.update('notifications', 
        { status: 'read' }, 
        { column: 'id', value: notificationId }
      );
      refresh();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث التنبيه",
        variant: "destructive",
      });
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      await offlineSupabase.update('notifications', 
        { 
          status: 'dismissed',
          dismissed_at: new Date().toISOString()
        }, 
        { column: 'id', value: notificationId }
      );
      refresh();
      toast({
        title: "تم الإلغاء",
        description: "تم إلغاء التنبيه بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إلغاء التنبيه",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      for (const notification of unreadNotifications) {
        await offlineSupabase.update('notifications', 
          { status: 'read' }, 
          { column: 'id', value: notification.id }
        );
      }
      refresh();
      toast({
        title: "تم التحديث",
        description: "تم تعليم جميع التنبيهات كمقروءة",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث التنبيهات",
        variant: "destructive",
      });
    }
  };

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <Card className={`mb-2 ${notification.status === 'unread' ? 'border-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 space-x-reverse">
            <div className="flex flex-col items-center space-y-1">
              {getTypeIcon(notification.type)}
              {getPriorityIcon(notification.priority)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 space-x-reverse mb-1">
                <h4 className="text-sm font-medium">{notification.title}</h4>
                <Badge variant={getPriorityColor(notification.priority) as any} className="text-xs">
                  {notification.priority === 'urgent' ? 'عاجل' : 
                   notification.priority === 'high' ? 'مهم' : 
                   notification.priority === 'medium' ? 'متوسط' : 'منخفض'}
                </Badge>
                {notification.auto_generated && (
                  <Badge variant="outline" className="text-xs">تلقائي</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
              <div className="text-xs text-muted-foreground">
                {format(new Date(notification.scheduled_for), "PPP p", { locale: ar })}
              </div>
            </div>
          </div>
          <div className="flex space-x-1 space-x-reverse">
            {notification.status === 'unread' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAsRead(notification.id)}
                className="h-8 w-8 p-0"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissNotification(notification.id)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadNotifications.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -left-2 h-5 w-5 rounded-full p-0 text-xs"
            >
              {unreadNotifications.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">التنبيهات</CardTitle>
              {unreadNotifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  تعليم الكل كمقروء
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mx-4 mb-4">
                <TabsTrigger value="all">الكل ({notifications.length})</TabsTrigger>
                <TabsTrigger value="unread">غير مقروء ({unreadNotifications.length})</TabsTrigger>
                <TabsTrigger value="today">اليوم ({todayNotifications.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-0 px-4 pb-4">
                <ScrollArea className="h-80">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      جاري التحميل...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد تنبيهات
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <NotificationItem key={notification.id} notification={notification} />
                    ))
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="unread" className="mt-0 px-4 pb-4">
                <ScrollArea className="h-80">
                  {unreadNotifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد تنبيهات غير مقروءة
                    </div>
                  ) : (
                    unreadNotifications.map((notification) => (
                      <NotificationItem key={notification.id} notification={notification} />
                    ))
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="today" className="mt-0 px-4 pb-4">
                <ScrollArea className="h-80">
                  {todayNotifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد تنبيهات اليوم
                    </div>
                  ) : (
                    todayNotifications.map((notification) => (
                      <NotificationItem key={notification.id} notification={notification} />
                    ))
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}