import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Clock, CheckCircle, AlertTriangle, Info, X, Send, Settings, Users, Package, Calendar, DollarSign, MessageSquare } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Notification {
  id: string;
  type: 'appointment' | 'payment' | 'stock' | 'system' | 'patient';
  title: string;
  message: string;
  time: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'appointment',
      title: 'موعد جديد',
      message: 'تم حجز موعد جديد مع المريض أحمد محمد غداً الساعة 2:00 م',
      time: new Date(Date.now() - 1000 * 60 * 30),
      read: false,
      priority: 'high'
    },
    {
      id: '2',
      type: 'stock',
      title: 'نقص في المخزون',
      message: 'مخزون مادة الحشو الأبيض وصل إلى 5 قطع فقط',
      time: new Date(Date.now() - 1000 * 60 * 60 * 2),
      read: false,
      priority: 'medium'
    },
    {
      id: '3',
      type: 'payment',
      title: 'دفعة مستلمة',
      message: 'تم استلام دفعة بقيمة 1,500 ر.س من المريض سارة أحمد',
      time: new Date(Date.now() - 1000 * 60 * 60 * 4),
      read: true,
      priority: 'low'
    },
    {
      id: '4',
      type: 'patient',
      title: 'مريض جديد',
      message: 'تم تسجيل مريض جديد: محمد عبدالله - رقم الهاتف: 0501234567',
      time: new Date(Date.now() - 1000 * 60 * 60 * 6),
      read: true,
      priority: 'medium'
    },
    {
      id: '5',
      type: 'system',
      title: 'تحديث النظام',
      message: 'تم تحديث النظام بنجاح. الميزات الجديدة متاحة الآن',
      time: new Date(Date.now() - 1000 * 60 * 60 * 24),
      read: true,
      priority: 'low'
    }
  ]);

  const [notificationSettings, setNotificationSettings] = useState({
    appointments: true,
    payments: true,
    stock: true,
    patients: true,
    system: false,
    sound: true,
    desktop: true,
    email: true,
    sms: false
  });

  const [customMessage, setCustomMessage] = useState({
    type: 'all',
    title: '',
    message: '',
    urgent: false
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'payment':
        return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'stock':
        return <Package className="w-5 h-5 text-orange-500" />;
      case 'patient':
        return <Users className="w-5 h-5 text-purple-500" />;
      case 'system':
        return <Info className="w-5 h-5 text-gray-500" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const sendCustomMessage = () => {
    if (!customMessage.title || !customMessage.message) return;
    
    const newNotification: Notification = {
      id: Date.now().toString(),
      type: 'system',
      title: customMessage.title,
      message: customMessage.message,
      time: new Date(),
      read: false,
      priority: customMessage.urgent ? 'high' : 'medium'
    };

    setNotifications(prev => [newNotification, ...prev]);
    setCustomMessage({ type: 'all', title: '', message: '', urgent: false });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <PageContainer>
      <PageHeader
        title="الإشعارات"
        description="إدارة الإشعارات والتنبيهات النظام"
        action={
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-sm">
              {unreadCount} غير مقروء
            </Badge>
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCircle className="w-4 h-4 mr-2" />
              وضع علامة قراءة للكل
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="inbox" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            صندوق الوارد
            {unreadCount > 0 && (
              <Badge variant="destructive" className="w-5 h-5 text-xs p-0 flex items-center justify-center">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            إرسال إشعار
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            الإعدادات
          </TabsTrigger>
        </TabsList>

        {/* صندوق الوارد */}
        <TabsContent value="inbox">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                الإشعارات الواردة
              </CardTitle>
              <CardDescription>
                جميع الإشعارات والتنبيهات الخاصة بالعيادة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد إشعارات حالياً</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border rounded-lg transition-all hover:shadow-sm ${
                          !notification.read 
                            ? 'bg-muted/30 border-primary/20' 
                            : 'bg-background border-border'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className={`font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                                  {notification.title}
                                </h4>
                                <Badge variant={getPriorityColor(notification.priority) as any} className="text-xs">
                                  {notification.priority === 'high' ? 'عاجل' : 
                                   notification.priority === 'medium' ? 'متوسط' : 'عادي'}
                                </Badge>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {format(notification.time, 'PPp', { locale: ar })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* إرسال إشعار */}
        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                إرسال إشعار مخصص
              </CardTitle>
              <CardDescription>
                إرسال إشعارات مخصصة للموظفين أو النظام
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="notification-type">نوع الإشعار</Label>
                  <Select 
                    value={customMessage.type} 
                    onValueChange={(value) => setCustomMessage({...customMessage, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">للجميع</SelectItem>
                      <SelectItem value="doctors">للأطباء</SelectItem>
                      <SelectItem value="staff">للموظفين</SelectItem>
                      <SelectItem value="system">نظام</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urgent-toggle">إشعار عاجل</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="urgent-toggle"
                      checked={customMessage.urgent}
                      onCheckedChange={(checked) => setCustomMessage({...customMessage, urgent: checked})}
                    />
                    <Label htmlFor="urgent-toggle" className="text-sm text-muted-foreground">
                      إشعار ذو أولوية عالية
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-title">عنوان الإشعار</Label>
                <Input
                  id="notification-title"
                  placeholder="أدخل عنوان الإشعار..."
                  value={customMessage.title}
                  onChange={(e) => setCustomMessage({...customMessage, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-message">محتوى الإشعار</Label>
                <Textarea
                  id="notification-message"
                  placeholder="أدخل محتوى الإشعار..."
                  rows={4}
                  value={customMessage.message}
                  onChange={(e) => setCustomMessage({...customMessage, message: e.target.value})}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={sendCustomMessage}
                  disabled={!customMessage.title || !customMessage.message}
                >
                  <Send className="w-4 h-4 mr-2" />
                  إرسال الإشعار
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* إحصائيات الإشعارات */}
          <Card>
            <CardHeader>
              <CardTitle>إحصائيات الإشعارات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">45</div>
                  <div className="text-sm text-muted-foreground">إشعارات المواعيد</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">23</div>
                  <div className="text-sm text-muted-foreground">إشعارات الدفع</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">12</div>
                  <div className="text-sm text-muted-foreground">تنبيهات المخزون</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">8</div>
                  <div className="text-sm text-muted-foreground">إشعارات النظام</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* إعدادات الإشعارات */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                إعدادات الإشعارات
              </CardTitle>
              <CardDescription>
                تخصيص أنواع الإشعارات وطرق التنبيه
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">أنواع الإشعارات</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>إشعارات المواعيد</Label>
                      <p className="text-sm text-muted-foreground">
                        تنبيهات حجز وإلغاء المواعيد
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.appointments}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({...notificationSettings, appointments: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>إشعارات المدفوعات</Label>
                      <p className="text-sm text-muted-foreground">
                        تنبيهات استلام وتأخير المدفوعات
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.payments}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({...notificationSettings, payments: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>تنبيهات المخزون</Label>
                      <p className="text-sm text-muted-foreground">
                        تنبيهات نقص المخزون وانتهاء الصلاحية
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.stock}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({...notificationSettings, stock: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>إشعارات المرضى</Label>
                      <p className="text-sm text-muted-foreground">
                        تنبيهات تسجيل مرضى جدد وتحديث البيانات
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.patients}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({...notificationSettings, patients: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>إشعارات النظام</Label>
                      <p className="text-sm text-muted-foreground">
                        تحديثات النظام والصيانة
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.system}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({...notificationSettings, system: checked})
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">طرق التنبيه</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>الصوت</Label>
                      <p className="text-sm text-muted-foreground">
                        تشغيل صوت عند وصول إشعار جديد
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.sound}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({...notificationSettings, sound: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>إشعارات سطح المكتب</Label>
                      <p className="text-sm text-muted-foreground">
                        عرض إشعارات المتصفح
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.desktop}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({...notificationSettings, desktop: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>البريد الإلكتروني</Label>
                      <p className="text-sm text-muted-foreground">
                        إرسال الإشعارات عبر البريد الإلكتروني
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.email}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({...notificationSettings, email: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>الرسائل النصية</Label>
                      <p className="text-sm text-muted-foreground">
                        إرسال الإشعارات عبر الرسائل النصية
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.sms}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({...notificationSettings, sms: checked})
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button>
                  حفظ الإعدادات
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}