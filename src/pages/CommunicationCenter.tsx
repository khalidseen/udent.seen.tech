import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { MessageSquare, Send, Phone, Mail, Clock, Users, FileText, Plus, Search, CheckCircle, AlertCircle } from "lucide-react";

export default function CommunicationCenter() {
  const [tab, setTab] = useState("logs");
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile-comm'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_current_user_profile');
      return data;
    }
  });
  const clinicId = profile?.id;

  const { data: logs = [] } = useQuery({
    queryKey: ['comm-logs', clinicId],
    queryFn: async () => {
      const { data } = await supabase
        .from('communication_logs')
        .select('*, patients(full_name, phone)')
        .eq('clinic_id', clinicId!)
        .order('created_at', { ascending: false })
        .limit(200);
      return data || [];
    },
    enabled: !!clinicId
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['msg-templates', clinicId],
    queryFn: async () => {
      const { data } = await supabase.from('message_templates').select('*').eq('clinic_id', clinicId!).eq('is_active', true);
      return data || [];
    },
    enabled: !!clinicId
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients-comm', clinicId],
    queryFn: async () => {
      const { data } = await supabase.from('patients').select('id, full_name, phone, email').eq('clinic_id', clinicId!).eq('patient_status', 'active').order('full_name');
      return data || [];
    },
    enabled: !!clinicId
  });

  const { data: upcomingAppointments = [] } = useQuery({
    queryKey: ['upcoming-apps-comm', clinicId],
    queryFn: async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      const { data } = await supabase
        .from('appointments')
        .select('*, patients(full_name, phone)')
        .eq('clinic_id', clinicId!)
        .gte('appointment_date', tomorrow.toISOString().split('T')[0])
        .lte('appointment_date', dayAfter.toISOString().split('T')[0] + 'T23:59:59')
        .eq('status', 'scheduled');
      return data || [];
    },
    enabled: !!clinicId
  });

  // Send message form
  const [sendForm, setSendForm] = useState({
    patient_id: '', message_type: 'sms', message_body: '', subject: '', template_id: ''
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const patient = patients.find((p: any) => p.id === sendForm.patient_id);
      const { error } = await supabase.from('communication_logs').insert({
        clinic_id: clinicId!, patient_id: sendForm.patient_id,
        message_type: sendForm.message_type, message_body: sendForm.message_body,
        subject: sendForm.subject || null,
        recipient_phone: patient?.phone || null,
        recipient_email: patient?.email || null,
        status: 'sent', channel: 'manual',
        sent_by: (await supabase.auth.getUser()).data.user?.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comm-logs'] });
      toast.success('تم إرسال الرسالة وتسجيلها');
      setShowSendDialog(false);
      setSendForm({ patient_id: '', message_type: 'sms', message_body: '', subject: '', template_id: '' });
    }
  });

  // Template form
  const [templateForm, setTemplateForm] = useState({
    name: '', category: 'appointment', body_template: '', message_type: 'sms', subject: ''
  });

  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('message_templates').insert({
        clinic_id: clinicId!, name: templateForm.name, category: templateForm.category,
        body_template: templateForm.body_template, message_type: templateForm.message_type,
        subject: templateForm.subject || null,
        variables: templateForm.body_template.match(/\{(\w+)\}/g)?.map(v => v.replace(/[{}]/g, '')) || []
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['msg-templates'] });
      toast.success('تم إنشاء القالب');
      setShowTemplateDialog(false);
    }
  });

  // Bulk reminder
  const sendBulkReminderMutation = useMutation({
    mutationFn: async () => {
      const records = upcomingAppointments.map((a: any) => ({
        clinic_id: clinicId!, patient_id: a.patient_id,
        message_type: 'sms', channel: 'auto_reminder',
        message_body: `تذكير: لديك موعد في العيادة بتاريخ ${format(new Date(a.appointment_date), 'dd/MM/yyyy الساعة HH:mm', { locale: ar })}`,
        recipient_phone: a.patients?.phone || null,
        status: 'sent',
        related_type: 'appointment', related_id: a.id,
        sent_by: (await supabase.auth.getUser()).data.user?.id
      }));
      if (records.length === 0) { toast.info('لا توجد مواعيد للتذكير'); return; }
      const { error } = await supabase.from('communication_logs').insert(records);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comm-logs'] });
      toast.success(`تم إرسال ${upcomingAppointments.length} تذكير`);
    }
  });

  const applyTemplate = (templateId: string) => {
    const tmpl = templates.find((t: any) => t.id === templateId);
    if (tmpl) {
      setSendForm(p => ({
        ...p, message_body: tmpl.body_template, subject: tmpl.subject || '',
        message_type: tmpl.message_type, template_id: templateId
      }));
    }
  };

  const filteredLogs = logs.filter((l: any) =>
    !search || l.patients?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.message_body?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: logs.length,
    today: logs.filter((l: any) => new Date(l.created_at).toDateString() === new Date().toDateString()).length,
    sms: logs.filter((l: any) => l.message_type === 'sms').length,
    email: logs.filter((l: any) => l.message_type === 'email').length,
    pendingReminders: upcomingAppointments.length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-primary" />
            مركز التواصل والتذكير
          </h1>
          <p className="text-muted-foreground">إرسال رسائل وتذكيرات للمرضى وتتبع الاتصالات</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
            <FileText className="w-4 h-4 ml-2" />قالب جديد
          </Button>
          <Button onClick={() => setShowSendDialog(true)}>
            <Send className="w-4 h-4 ml-2" />إرسال رسالة
          </Button>
        </div>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">إجمالي الرسائل</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{stats.today}</p>
          <p className="text-xs text-muted-foreground">رسائل اليوم</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Phone className="w-5 h-5 mx-auto mb-1 text-green-500" />
          <p className="text-2xl font-bold">{stats.sms}</p>
          <p className="text-xs text-muted-foreground">SMS</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Mail className="w-5 h-5 mx-auto mb-1 text-blue-500" />
          <p className="text-2xl font-bold">{stats.email}</p>
          <p className="text-xs text-muted-foreground">بريد إلكتروني</p>
        </CardContent></Card>
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold text-amber-600">{stats.pendingReminders}</p>
            <p className="text-xs text-muted-foreground">بحاجة تذكير (غداً)</p>
          </CardContent>
        </Card>
      </div>

      {/* تذكير جماعي */}
      {upcomingAppointments.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">🔔 {upcomingAppointments.length} مريض لديهم مواعيد غداً</p>
              <p className="text-sm text-muted-foreground">أرسل تذكيرات جماعية بنقرة واحدة</p>
            </div>
            <Button onClick={() => sendBulkReminderMutation.mutate()} disabled={sendBulkReminderMutation.isPending}>
              <Send className="w-4 h-4 ml-2" />
              إرسال تذكيرات ({upcomingAppointments.length})
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="logs">سجل الرسائل</TabsTrigger>
          <TabsTrigger value="templates">القوالب ({templates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
          </div>
          {filteredLogs.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">لا توجد رسائل مسجلة</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log: any) => (
                <Card key={log.id}>
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className={`p-2 rounded-full ${log.message_type === 'sms' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                      {log.message_type === 'sms' ? <Phone className="w-4 h-4 text-green-600" /> : <Mail className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{log.patients?.full_name || 'مريض محذوف'}</span>
                        <Badge variant={log.status === 'sent' ? 'default' : log.status === 'delivered' ? 'secondary' : 'destructive'} className="text-[10px]">
                          {log.status === 'sent' ? 'مرسلة' : log.status === 'delivered' ? 'مستلمة' : log.status}
                        </Badge>
                        {log.channel === 'auto_reminder' && <Badge variant="outline" className="text-[10px]">تذكير تلقائي</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{log.message_body}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                        {log.recipient_phone && ` • ${log.recipient_phone}`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {templates.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              لا توجد قوالب. أنشئ قالبك الأول!
            </CardContent></Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {templates.map((t: any) => (
                <Card key={t.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{t.name}</span>
                      <div className="flex gap-1">
                        <Badge variant="outline">{t.message_type}</Badge>
                        <Badge variant="secondary">{t.category === 'appointment' ? 'مواعيد' : t.category === 'followup' ? 'متابعة' : t.category === 'marketing' ? 'تسويق' : t.category}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded p-2">{t.body_template}</p>
                    {t.variables?.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {t.variables.map((v: string) => <Badge key={v} variant="outline" className="text-[10px]">{`{${v}}`}</Badge>)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* حوار إرسال رسالة */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>إرسال رسالة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>المريض</Label>
              <Select value={sendForm.patient_id} onValueChange={v => setSendForm(p => ({ ...p, patient_id: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر المريض" /></SelectTrigger>
                <SelectContent>{patients.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.full_name} {p.phone ? `(${p.phone})` : ''}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>نوع الرسالة</Label>
                <Select value={sendForm.message_type} onValueChange={v => setSendForm(p => ({ ...p, message_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">بريد إلكتروني</SelectItem>
                    <SelectItem value="call">اتصال هاتفي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>قالب (اختياري)</Label>
                <Select value={sendForm.template_id} onValueChange={applyTemplate}>
                  <SelectTrigger><SelectValue placeholder="اختر قالب" /></SelectTrigger>
                  <SelectContent>{templates.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {sendForm.message_type === 'email' && (
              <div><Label>الموضوع</Label><Input value={sendForm.subject} onChange={e => setSendForm(p => ({ ...p, subject: e.target.value }))} /></div>
            )}
            <div>
              <Label>نص الرسالة</Label>
              <Textarea value={sendForm.message_body} onChange={e => setSendForm(p => ({ ...p, message_body: e.target.value }))} rows={4} placeholder="اكتب رسالتك هنا..." />
            </div>
            <Button className="w-full" onClick={() => sendMutation.mutate()} disabled={!sendForm.patient_id || !sendForm.message_body || sendMutation.isPending}>
              <Send className="w-4 h-4 ml-2" />إرسال وتسجيل
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* حوار إنشاء قالب */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>إنشاء قالب رسالة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>اسم القالب</Label><Input value={templateForm.name} onChange={e => setTemplateForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>الفئة</Label>
                <Select value={templateForm.category} onValueChange={v => setTemplateForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appointment">تذكير موعد</SelectItem>
                    <SelectItem value="followup">متابعة علاج</SelectItem>
                    <SelectItem value="marketing">تسويقي</SelectItem>
                    <SelectItem value="general">عام</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>نوع</Label>
                <Select value={templateForm.message_type} onValueChange={v => setTemplateForm(p => ({ ...p, message_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">بريد إلكتروني</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>نص القالب</Label>
              <Textarea value={templateForm.body_template} onChange={e => setTemplateForm(p => ({ ...p, body_template: e.target.value }))} rows={4}
                placeholder="مثال: مرحباً {patient_name}، نذكرك بموعدك يوم {date} الساعة {time}" />
              <p className="text-[10px] text-muted-foreground mt-1">استخدم {'{اسم_المتغير}'} للمتغيرات الديناميكية</p>
            </div>
            <Button className="w-full" onClick={() => createTemplateMutation.mutate()} disabled={!templateForm.name || !templateForm.body_template}>
              إنشاء القالب
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
