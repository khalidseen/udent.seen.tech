import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Plus, Send, Search, CheckCircle, Clock, AlertTriangle, Eye, EyeOff, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const PRIORITY_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  urgent: { label: "عاجل", variant: "destructive" },
  high: { label: "مرتفع", variant: "destructive" },
  medium: { label: "متوسط", variant: "default" },
  low: { label: "منخفض", variant: "secondary" },
};

const TYPE_MAP: Record<string, string> = {
  appointment: "موعد",
  supply_alert: "تنبيه مخزون",
  payment: "دفع",
  system: "نظام",
  general: "عام",
};

const AdvancedNotificationManagement = () => {
  const [tab, setTab] = useState("active");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_user_profile');
      if (error) throw error;
      return data;
    }
  });
  const clinicId = profile?.id;

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications-mgmt', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, patients(full_name)')
        .eq('clinic_id', clinicId!)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
    enabled: !!clinicId
  });

  // Create notification
  const [createForm, setCreateForm] = useState({
    title: '', message: '', type: 'general', priority: 'medium', patient_id: '', scheduled_for: ''
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients-notif', clinicId],
    queryFn: async () => {
      const { data } = await supabase.from('patients').select('id, full_name').eq('clinic_id', clinicId!).eq('patient_status', 'active').order('full_name');
      return data || [];
    },
    enabled: !!clinicId
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('notifications').insert({
        clinic_id: clinicId!, title: createForm.title, message: createForm.message,
        type: createForm.type, priority: createForm.priority,
        patient_id: createForm.patient_id || null,
        scheduled_for: createForm.scheduled_for || new Date().toISOString(),
        status: 'active', auto_generated: false
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-mgmt'] });
      toast.success('تم إنشاء الإشعار');
      setShowCreate(false);
      setCreateForm({ title: '', message: '', type: 'general', priority: 'medium', patient_id: '', scheduled_for: '' });
    }
  });

  const dismissMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').update({ status: 'dismissed', dismissed_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-mgmt'] });
      toast.success('تم تجاهل الإشعار');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-mgmt'] });
      toast.success('تم حذف الإشعار');
    }
  });

  const generateAutoMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('generate_automatic_notifications');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-mgmt'] });
      toast.success('تم توليد الإشعارات التلقائية');
    }
  });

  const activeNotifs = notifications.filter((n: any) => n.status === 'active');
  const dismissedNotifs = notifications.filter((n: any) => n.status === 'dismissed');

  const filtered = (tab === 'active' ? activeNotifs : dismissedNotifs).filter((n: any) => {
    const matchSearch = !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.message?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || n.type === typeFilter;
    return matchSearch && matchType;
  });

  const stats = {
    total: notifications.length,
    active: activeNotifs.length,
    dismissed: dismissedNotifs.length,
    urgent: notifications.filter((n: any) => n.priority === 'urgent' && n.status === 'active').length,
    autoGenerated: notifications.filter((n: any) => n.auto_generated).length,
    today: notifications.filter((n: any) => new Date(n.created_at).toDateString() === new Date().toDateString()).length,
  };

  return (
    <PageContainer>
      <PageHeader title="إدارة الإشعارات المتقدمة" description="نظام شامل لإدارة الإشعارات الحقيقية للمرضى والنظام" />

      <div className="space-y-6">
        <div className="flex gap-4">
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 ml-2" />إشعار جديد
          </Button>
          <Button variant="outline" onClick={() => generateAutoMutation.mutate()} disabled={generateAutoMutation.isPending}>
            <RefreshCw className={`h-4 w-4 ml-2 ${generateAutoMutation.isPending ? 'animate-spin' : ''}`} />
            توليد تذكيرات تلقائية
          </Button>
        </div>

        {/* إحصائيات حقيقية */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">إجمالي الإشعارات</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Bell className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-primary">{stats.active}</p>
            <p className="text-xs text-muted-foreground">نشطة</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <CheckCircle className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{stats.dismissed}</p>
            <p className="text-xs text-muted-foreground">مقروءة</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-destructive" />
            <p className="text-2xl font-bold text-destructive">{stats.urgent}</p>
            <p className="text-xs text-muted-foreground">عاجلة</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <RefreshCw className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold">{stats.autoGenerated}</p>
            <p className="text-xs text-muted-foreground">تلقائية</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold">{stats.today}</p>
            <p className="text-xs text-muted-foreground">اليوم</p>
          </CardContent></Card>
        </div>

        {/* فلاتر */}
        <div className="flex gap-4 items-end">
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
            </div>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="النوع" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="appointment">مواعيد</SelectItem>
              <SelectItem value="supply_alert">مخزون</SelectItem>
              <SelectItem value="payment">مدفوعات</SelectItem>
              <SelectItem value="system">نظام</SelectItem>
              <SelectItem value="general">عام</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="active">النشطة ({stats.active})</TabsTrigger>
            <TabsTrigger value="dismissed">المقروءة ({stats.dismissed})</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {isLoading ? (
              <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
            ) : filtered.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                لا توجد إشعارات
              </CardContent></Card>
            ) : (
              <div className="space-y-2">
                {filtered.map((n: any) => {
                  const priority = PRIORITY_MAP[n.priority] || { label: n.priority, variant: "outline" as const };
                  return (
                    <Card key={n.id} className={n.priority === 'urgent' ? 'border-destructive/30' : ''}>
                      <CardContent className="p-4 flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{n.title}</span>
                            <Badge variant={priority.variant}>{priority.label}</Badge>
                            <Badge variant="outline">{TYPE_MAP[n.type] || n.type}</Badge>
                            {n.auto_generated && <Badge variant="secondary" className="text-[10px]">تلقائي</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{n.message}</p>
                          <div className="flex gap-3 text-[10px] text-muted-foreground mt-1">
                            {n.patients?.full_name && <span>المريض: {n.patients.full_name}</span>}
                            <span>{format(new Date(n.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}</span>
                            {n.reminded_count > 0 && <span>تذكير: {n.reminded_count}/{n.max_reminders}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {n.status === 'active' && (
                            <Button variant="ghost" size="icon" onClick={() => dismissMutation.mutate(n.id)} title="تجاهل">
                              <EyeOff className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(n.id)} title="حذف">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* حوار إنشاء إشعار */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>إنشاء إشعار جديد</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>العنوان *</Label><Input value={createForm.title} onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div><Label>الرسالة *</Label><Textarea value={createForm.message} onChange={e => setCreateForm(p => ({ ...p, message: e.target.value }))} rows={3} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>النوع</Label>
                <Select value={createForm.type} onValueChange={v => setCreateForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">عام</SelectItem>
                    <SelectItem value="appointment">موعد</SelectItem>
                    <SelectItem value="payment">دفع</SelectItem>
                    <SelectItem value="system">نظام</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الأولوية</Label>
                <Select value={createForm.priority} onValueChange={v => setCreateForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفض</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="high">مرتفع</SelectItem>
                    <SelectItem value="urgent">عاجل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>المريض (اختياري)</Label>
              <Select value={createForm.patient_id} onValueChange={v => setCreateForm(p => ({ ...p, patient_id: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر المريض" /></SelectTrigger>
                <SelectContent>{patients.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => createMutation.mutate()} disabled={!createForm.title || !createForm.message}>
              إنشاء الإشعار
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default AdvancedNotificationManagement;
