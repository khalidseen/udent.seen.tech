import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { CreateNotificationDialog } from "@/components/notifications/CreateNotificationDialog";
import { useOfflineData } from "@/hooks/useOfflineData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Clock, AlertTriangle, CheckCircle2, X } from "lucide-react";
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

export default function Notifications() {
  const { toast } = useToast();
  
  const { data: notifications, loading, refresh } = useOfflineData<Notification>({
    table: 'notifications',
    order: { column: 'scheduled_for', ascending: false },
    autoRefresh: true
  });

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-primary" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
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

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const todayCount = notifications.filter(n => {
    const today = new Date().toDateString();
    return new Date(n.scheduled_for).toDateString() === today;
  }).length;

  return (
    <PageContainer>
      <PageHeader
        title="الإشعارات"
        description="إدارة وعرض الإشعارات الخاصة بالعيادة"
        action={<CreateNotificationDialog />}
      />
      
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي التنبيهات</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">غير مقروءة</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{unreadCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تنبيهات اليوم</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{todayCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>جميع التنبيهات</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                جاري التحميل...
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد تنبيهات
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <Card key={notification.id} className={`${notification.status === 'unread' ? 'border-primary' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 space-x-reverse">
                          <div className="flex flex-col items-center space-y-1">
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
                              <Badge variant="outline" className="text-xs">
                                {notification.type === 'appointment' ? 'موعد' :
                                 notification.type === 'supply_alert' ? 'مخزون' :
                                 notification.type === 'followup' ? 'متابعة' :
                                 notification.type === 'medication' ? 'دواء' : 'عام'}
                              </Badge>
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}