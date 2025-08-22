import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Bell, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  title_template: string;
  message_template: string;
  default_priority: string;
  advance_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function NotificationTemplates() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    type: "general",
    title_template: "",
    message_template: "",
    default_priority: "medium",
    advance_days: 1,
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: templates, isLoading, refetch } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_templates' as any)
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return (data as any) as NotificationTemplate[];
    }
  });

  const notificationTypes = [
    { value: "general", label: "عام" },
    { value: "appointment", label: "مواعيد" },
    { value: "payment", label: "مدفوعات" },
    { value: "supply_alert", label: "تنبيه مخزون" },
    { value: "reminder", label: "تذكير" },
    { value: "follow_up", label: "متابعة" }
  ];

  const priorityTypes = [
    { value: "low", label: "منخفض" },
    { value: "medium", label: "متوسط" },
    { value: "high", label: "عالي" },
    { value: "urgent", label: "عاجل" }
  ];

  const getTypeLabel = (type: string) => {
    return notificationTypes.find(t => t.value === type)?.label || type;
  };

  const getPriorityLabel = (priority: string) => {
    return priorityTypes.find(p => p.value === priority)?.label || priority;
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

  const filteredTemplates = templates?.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: "",
      type: "general",
      title_template: "",
      message_template: "",
      default_priority: "medium",
      advance_days: 1,
      is_active: true
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      title_template: template.title_template,
      message_template: template.message_template,
      default_priority: template.default_priority,
      advance_days: template.advance_days,
      is_active: template.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القالب؟')) return;

    try {
      const { error } = await supabase
        .from('notification_templates' as any)
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      refetch();
      toast({
        title: "تم الحذف",
        description: "تم حذف قالب الإشعار بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حذف القالب",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.title_template || !formData.message_template) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user profile for clinic_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .single();

      if (!profile) throw new Error('لم يتم العثور على ملف المستخدم');

      const templateData = {
        clinic_id: profile.id,
        name: formData.name,
        type: formData.type,
        title_template: formData.title_template,
        message_template: formData.message_template,
        default_priority: formData.default_priority,
        advance_days: formData.advance_days,
        is_active: formData.is_active
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('notification_templates' as any)
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;

        toast({
          title: "تم التحديث",
          description: "تم تحديث قالب الإشعار بنجاح",
        });
      } else {
        const { error } = await supabase
          .from('notification_templates' as any)
          .insert(templateData);

        if (error) throw error;

        toast({
          title: "تم الإضافة",
          description: "تم إضافة قالب الإشعار بنجاح",
        });
      }

      setIsDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حفظ القالب",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        title="قوالب الإشعارات"
        description="إدارة قوالب الإشعارات والتنبيهات التلقائية"
        action={
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 ml-2" />
            قالب جديد
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي القوالب</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قوالب نشطة</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {templates?.filter(t => t.is_active).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قوالب عاجلة</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {templates?.filter(t => t.default_priority === 'urgent').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>قائمة قوالب الإشعارات</CardTitle>
            <div className="w-full sm:w-80">
              <Input
                placeholder="البحث عن قالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : filteredTemplates?.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد قوالب</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "لم يتم العثور على نتائج للبحث" : "لم يتم إضافة أي قالب بعد"}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreate}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة أول قالب
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم القالب</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>أيام الإشعار المسبق</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates?.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel(template.type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(template.default_priority)}>
                        {getPriorityLabel(template.default_priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>{template.advance_days}</TableCell>
                    <TableCell>
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "تعديل قالب الإشعار" : "إضافة قالب إشعار جديد"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">اسم القالب</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="أدخل اسم القالب"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">نوع الإشعار</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="title_template">عنوان الإشعار</Label>
              <Input
                id="title_template"
                value={formData.title_template}
                onChange={(e) => setFormData({ ...formData, title_template: e.target.value })}
                placeholder="أدخل عنوان الإشعار"
                required
              />
            </div>

            <div>
              <Label htmlFor="message_template">نص الإشعار</Label>
              <Textarea
                id="message_template"
                value={formData.message_template}
                onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                placeholder="أدخل نص الإشعار"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="default_priority">الأولوية الافتراضية</Label>
                <Select
                  value={formData.default_priority}
                  onValueChange={(value) => setFormData({ ...formData, default_priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityTypes.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="advance_days">أيام الإشعار المسبق</Label>
                <Input
                  id="advance_days"
                  type="number"
                  min="0"
                  max="365"
                  value={formData.advance_days}
                  onChange={(e) => setFormData({ ...formData, advance_days: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">قالب نشط</Label>
            </div>

            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "جاري الحفظ..." : editingTemplate ? "تحديث" : "إضافة"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}