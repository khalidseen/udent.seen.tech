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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, UserCheck, Users, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DoctorAssistant {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  specialization: string | null;
  experience_years: number | null;
  salary: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const DoctorAssistants = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<DoctorAssistant | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    specialization: "",
    experience_years: "",
    salary: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: assistants, isLoading, refetch } = useQuery({
    queryKey: ['doctor-assistants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctor_assistants')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data as DoctorAssistant[];
    }
  });

  const filteredAssistants = assistants?.filter(assistant =>
    assistant.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assistant.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setEditingAssistant(null);
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      address: "",
      specialization: "",
      experience_years: "",
      salary: "",
      notes: ""
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (assistant: DoctorAssistant) => {
    setEditingAssistant(assistant);
    setFormData({
      full_name: assistant.full_name,
      email: assistant.email || "",
      phone: assistant.phone || "",
      address: assistant.address || "",
      specialization: assistant.specialization || "",
      experience_years: assistant.experience_years?.toString() || "",
      salary: assistant.salary?.toString() || "",
      notes: assistant.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (assistantId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المساعد؟')) return;

    try {
      const { error } = await supabase
        .from('doctor_assistants')
        .delete()
        .eq('id', assistantId);

      if (error) throw error;

      refetch();
      toast({
        title: "تم الحذف",
        description: "تم حذف المساعد بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حذف المساعد",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name) {
      toast({
        title: "خطأ",
        description: "يرجى ملء الاسم الكامل",
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

      const assistantData = {
        clinic_id: profile.id,
        full_name: formData.full_name,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        specialization: formData.specialization || null,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        notes: formData.notes || null
      };

      if (editingAssistant) {
        const { error } = await supabase
          .from('doctor_assistants')
          .update(assistantData)
          .eq('id', editingAssistant.id);

        if (error) throw error;

        toast({
          title: "تم التحديث",
          description: "تم تحديث بيانات المساعد بنجاح",
        });
      } else {
        const { error } = await supabase
          .from('doctor_assistants')
          .insert(assistantData);

        if (error) throw error;

        toast({
          title: "تم الإضافة",
          description: "تم إضافة المساعد بنجاح",
        });
      }

      setIsDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        title="مساعدو الأطباء"
        description="إدارة مساعدي الأطباء والموظفين المساعدين"
        action={
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 ml-2" />
            إضافة مساعد جديد
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المساعدين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assistants?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">لديهم تخصص</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {assistants?.filter(a => a.specialization).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط الخبرة</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">
              {assistants?.length ? 
                Math.round(assistants.filter(a => a.experience_years).reduce((sum, a) => sum + (a.experience_years || 0), 0) / assistants.filter(a => a.experience_years).length) || 0
                : 0} سنة
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>قائمة مساعدي الأطباء</CardTitle>
            <div className="w-full sm:w-80">
              <Input
                placeholder="البحث عن مساعد..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : filteredAssistants?.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">لا يوجد مساعدين</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "لم يتم العثور على نتائج للبحث" : "لم يتم إضافة أي مساعد بعد"}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreate}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة أول مساعد
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم الكامل</TableHead>
                  <TableHead>التخصص</TableHead>
                  <TableHead>الخبرة</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>الإيميل</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssistants?.map((assistant) => (
                  <TableRow key={assistant.id}>
                    <TableCell className="font-medium">{assistant.full_name}</TableCell>
                    <TableCell>
                      {assistant.specialization ? (
                        <Badge variant="outline">{assistant.specialization}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {assistant.experience_years ? `${assistant.experience_years} سنة` : '-'}
                    </TableCell>
                    <TableCell>{assistant.phone || '-'}</TableCell>
                    <TableCell>{assistant.email || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(assistant)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(assistant.id)}
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
              {editingAssistant ? "تعديل المساعد" : "إضافة مساعد جديد"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">الاسم الكامل</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="أدخل الاسم الكامل"
                  required
                />
              </div>

              <div>
                <Label htmlFor="specialization">التخصص</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="أدخل التخصص"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="أدخل البريد الإلكتروني"
                />
              </div>

              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="أدخل رقم الهاتف"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="أدخل العنوان"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience_years">سنوات الخبرة</Label>
                <Input
                  id="experience_years"
                  type="number"
                  min="0"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                  placeholder="أدخل سنوات الخبرة"
                />
              </div>

              <div>
                <Label htmlFor="salary">الراتب</Label>
                <Input
                  id="salary"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="أدخل الراتب"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="أدخل أي ملاحظات إضافية"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "جاري الحفظ..." : editingAssistant ? "تحديث" : "إضافة"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default DoctorAssistants;