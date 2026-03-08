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
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Plus, Edit, Copy, Trash2, FileText, Bell } from "lucide-react";
import { toast } from "sonner";

const CustomNotificationTemplates = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile-templates'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_current_user_profile');
      return data;
    }
  });
  const clinicId = profile?.id;

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['notification-templates', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('clinic_id', clinicId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!clinicId
  });

  const [form, setForm] = useState({
    name: '', type: 'appointment', title_template: '', message_template: '',
    default_priority: 'medium', advance_days: 1, is_active: true
  });

  const resetForm = () => setForm({ name: '', type: 'appointment', title_template: '', message_template: '', default_priority: 'medium', advance_days: 1, is_active: true });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('notification_templates').insert({
        clinic_id: clinicId!, name: form.name, type: form.type,
        title_template: form.title_template, message_template: form.message_template,
        default_priority: form.default_priority, advance_days: form.advance_days,
        is_active: form.is_active
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success('تم إنشاء القالب');
      setShowCreate(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const { error } = await supabase.from('notification_templates').update({
        name: form.name, type: form.type, title_template: form.title_template,
        message_template: form.message_template, default_priority: form.default_priority,
        advance_days: form.advance_days, is_active: form.is_active
      }).eq('id', editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success('تم تحديث القالب');
      setEditingId(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notification_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success('تم حذف القالب');
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('notification_templates').update({ is_active: active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification-templates'] })
  });

  const duplicateTemplate = (template: any) => {
    setForm({
      name: template.name + ' (نسخة)', type: template.type,
      title_template: template.title_template, message_template: template.message_template,
      default_priority: template.default_priority, advance_days: template.advance_days, is_active: true
    });
    setShowCreate(true);
  };

  const startEdit = (template: any) => {
    setForm({
      name: template.name, type: template.type, title_template: template.title_template,
      message_template: template.message_template, default_priority: template.default_priority,
      advance_days: template.advance_days, is_active: template.is_active
    });
    setEditingId(template.id);
  };

  const typeLabels: Record<string, string> = {
    appointment: 'مواعيد', supply_alert: 'مخزون', payment: 'مدفوعات',
    system: 'نظام', general: 'عام', followup: 'متابعة'
  };

  const stats = {
    total: templates.length,
    active: templates.filter((t: any) => t.is_active).length,
    inactive: templates.filter((t: any) => !t.is_active).length,
  };

  const isFormOpen = showCreate || editingId !== null;

  return (
    <PageContainer>
      <PageHeader title="قوالب الإشعارات" description="إنشاء وإدارة قوالب الإشعارات التلقائية" />

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <Badge variant="outline" className="px-3 py-1">الإجمالي: {stats.total}</Badge>
            <Badge variant="default" className="px-3 py-1">نشطة: {stats.active}</Badge>
            {stats.inactive > 0 && <Badge variant="secondary" className="px-3 py-1">معطلة: {stats.inactive}</Badge>}
          </div>
          <Button onClick={() => { resetForm(); setShowCreate(true); }}>
            <Plus className="h-4 w-4 ml-2" />قالب جديد
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
        ) : templates.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد قوالب. أنشئ قالبك الأول!</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 ml-2" />إنشاء قالب
            </Button>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template: any) => (
              <Card key={template.id} className={!template.is_active ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bell className="h-4 w-4 text-primary" />
                      {template.name}
                    </CardTitle>
                    <Switch
                      checked={template.is_active}
                      onCheckedChange={active => toggleActiveMutation.mutate({ id: template.id, active })}
                    />
                  </div>
                  <div className="flex gap-1 mt-1">
                    <Badge variant="outline">{typeLabels[template.type] || template.type}</Badge>
                    <Badge variant="secondary">{template.default_priority}</Badge>
                    {template.advance_days > 0 && <Badge variant="outline">قبل {template.advance_days} يوم</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-xs font-medium mb-1">العنوان:</p>
                      <p className="text-sm">{template.title_template}</p>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-xs font-medium mb-1">الرسالة:</p>
                      <p className="text-sm text-muted-foreground line-clamp-3">{template.message_template}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(template)}>
                        <Edit className="h-3 w-3 ml-1" />تعديل
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => duplicateTemplate(template)}>
                        <Copy className="h-3 w-3 ml-1" />نسخ
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(template.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* حوار الإنشاء/التعديل */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) { setShowCreate(false); setEditingId(null); resetForm(); } }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'تعديل القالب' : 'إنشاء قالب جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>اسم القالب *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="مثال: تذكير بالموعد" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>النوع</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appointment">مواعيد</SelectItem>
                    <SelectItem value="supply_alert">مخزون</SelectItem>
                    <SelectItem value="payment">مدفوعات</SelectItem>
                    <SelectItem value="followup">متابعة</SelectItem>
                    <SelectItem value="general">عام</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الأولوية</Label>
                <Select value={form.default_priority} onValueChange={v => setForm(p => ({ ...p, default_priority: v }))}>
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
              <Label>عدد أيام الإرسال المسبق</Label>
              <Input type="number" min={0} value={form.advance_days} onChange={e => setForm(p => ({ ...p, advance_days: parseInt(e.target.value) || 0 }))} />
            </div>
            <div><Label>قالب العنوان *</Label><Input value={form.title_template} onChange={e => setForm(p => ({ ...p, title_template: e.target.value }))} placeholder="تذكير بموعدك غداً" /></div>
            <div><Label>قالب الرسالة *</Label><Textarea value={form.message_template} onChange={e => setForm(p => ({ ...p, message_template: e.target.value }))} rows={4} placeholder="مرحباً، نذكرك بموعدك في العيادة..." /></div>
            <Button className="w-full" onClick={() => editingId ? updateMutation.mutate() : createMutation.mutate()} disabled={!form.name || !form.title_template || !form.message_template}>
              {editingId ? 'حفظ التعديلات' : 'إنشاء القالب'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default CustomNotificationTemplates;
