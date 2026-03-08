import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell, CheckCircle, X, AlertTriangle, Calendar, Info,
  Building2, Filter, RefreshCw, BellRing
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CentralNotification {
  id: string;
  clinic_id: string;
  clinic_name?: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  status: string;
  scheduled_for: string;
  created_at: string;
  auto_generated: boolean;
  patient_id?: string;
  related_id?: string;
  related_type?: string;
}

interface ClinicOption {
  id: string;
  name: string;
}

export function CentralizedNotifications() {
  const [notifications, setNotifications] = useState<CentralNotification[]>([]);
  const [clinics, setClinics] = useState<ClinicOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClinic, setSelectedClinic] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchClinics();
    fetchNotifications();
    const cleanup = setupRealtime();
    return () => { cleanup(); };
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [selectedClinic, selectedPriority, selectedType]);

  const fetchClinics = async () => {
    const { data } = await supabase.from('clinics').select('id, name').eq('is_active', true).order('name');
    if (data) setClinics(data);
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (selectedClinic !== 'all') {
        query = query.eq('clinic_id', selectedClinic);
      }
      if (selectedPriority !== 'all') {
        query = query.eq('priority', selectedPriority);
      }
      if (selectedType !== 'all') {
        query = query.eq('type', selectedType);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Enrich with clinic names
      const enriched: CentralNotification[] = (data || []).map(n => ({
        ...n,
        clinic_name: clinics.find(c => c.id === n.clinic_id)?.name || 'عيادة غير معروفة',
      }));

      setNotifications(enriched);
    } catch (error) {
      console.error('Error fetching centralized notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    const channel = supabase
      .channel('admin_notifications_all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from('notifications').update({ status: 'read' }).eq('id', id);
    if (!error) setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
  };

  const dismissNotification = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast({ title: 'تم إلغاء الإشعار' });
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => n.status === 'unread').map(n => n.id);
    if (unreadIds.length === 0) return;
    const { error } = await supabase.from('notifications').update({ status: 'read' }).in('id', unreadIds);
    if (!error) {
      setNotifications(prev => prev.map(n => n.status === 'unread' ? { ...n, status: 'read' } : n));
      toast({ title: `تم تعليم ${unreadIds.length} إشعار كمقروء` });
    }
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { label: string; variant: 'destructive' | 'default' | 'secondary' | 'outline' }> = {
      urgent: { label: 'عاجل', variant: 'destructive' },
      high: { label: 'عالي', variant: 'destructive' },
      medium: { label: 'متوسط', variant: 'default' },
      low: { label: 'منخفض', variant: 'secondary' },
    };
    const c = config[priority] || config.medium;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'supply_alert': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'followup': return <BellRing className="w-4 h-4 text-green-500" />;
      case 'system': return <Info className="w-4 h-4 text-muted-foreground" />;
      default: return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const clinicStats = clinics.map(c => ({
    ...c,
    unread: notifications.filter(n => n.clinic_id === c.id && n.status === 'unread').length,
  })).filter(c => c.unread > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إشعارات غير مقروءة</p>
                <p className="text-3xl font-bold">{unreadCount}</p>
              </div>
              <Bell className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">عاجل</p>
                <p className="text-3xl font-bold text-destructive">
                  {notifications.filter(n => n.priority === 'urgent' && n.status === 'unread').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">عيادات بإشعارات</p>
                <p className="text-3xl font-bold">{clinicStats.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإشعارات</p>
                <p className="text-3xl font-bold">{notifications.length}</p>
              </div>
              <BellRing className="h-8 w-8 text-muted-foreground opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-clinic breakdown */}
      {clinicStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              إشعارات غير مقروءة حسب العيادة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {clinicStats.map(c => (
                <Badge
                  key={c.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent px-3 py-1.5"
                  onClick={() => setSelectedClinic(c.id)}
                >
                  {c.name}: <span className="font-bold mr-1">{c.unread}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters & Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              جميع الإشعارات المركزية
              {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="كل العيادات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل العيادات</SelectItem>
                  {clinics.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="urgent">عاجل</SelectItem>
                  <SelectItem value="high">عالي</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="low">منخفض</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="appointment">مواعيد</SelectItem>
                  <SelectItem value="supply_alert">مخزون</SelectItem>
                  <SelectItem value="followup">متابعة</SelectItem>
                  <SelectItem value="system">نظام</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => fetchNotifications()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              {unreadCount > 0 && (
                <Button variant="secondary" size="sm" onClick={markAllAsRead}>
                  <CheckCircle className="w-4 h-4 ml-1" />
                  تعليم الكل كمقروء
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>لا توجد إشعارات</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-4 border rounded-lg transition-colors ${
                      n.status === 'unread' ? 'bg-primary/5 border-primary/20' : 'bg-card'
                    }`}
                  >
                    <div className="mt-0.5">{getTypeIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className={`text-sm ${n.status === 'unread' ? 'font-bold' : 'font-medium'}`}>
                          {n.title}
                        </h4>
                        {getPriorityBadge(n.priority)}
                        <Badge variant="outline" className="text-xs">
                          <Building2 className="w-3 h-3 ml-1" />
                          {n.clinic_name}
                        </Badge>
                        {n.status === 'unread' && (
                          <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{n.message}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(n.created_at).toLocaleDateString('ar', {
                          weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {n.status === 'unread' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => markAsRead(n.id)}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => dismissNotification(n.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
