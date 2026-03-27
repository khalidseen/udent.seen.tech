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
import { Plus, Edit, Trash2, UserCheck, Users, Stethoscope } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  doctor_id: string | null;
  status: string | null;
  hired_date: string | null;
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
    notes: "",
    doctor_id: "",
    status: "active",
    hired_date: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: profile } = useQuery({
    queryKey: ['current-profile'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_current_user_profile');
      return data;
    }
  });

  const clinicId = profile?.id;

  const { data: assistants, isLoading, refetch } = useQuery({
    queryKey: ['doctor-assistants', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctor_assistants')
        .select('*')
        .eq('clinic_id', clinicId!)
        .order('full_name', { ascending: true });
      if (error) throw error;
      return data as DoctorAssistant[];
    },
    enabled: !!clinicId
  });

  // Fetch active doctors for assignment
  const { data: activeDoctors } = useQuery({
    queryKey: ['doctors-for-assistants', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, full_name, specialization')
        .eq('clinic_id', clinicId!)
        .eq('status', 'active')
        .order('full_name');
      if (error) throw error;
      return data;
    },
    enabled: !!clinicId
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
      notes: "",
      doctor_id: "",
      status: "active",
      hired_date: new Date().toISOString().split('T')[0]
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
      notes: assistant.notes || "",
      doctor_id: assistant.doctor_id || "",
      status: assistant.status || "active",
      hired_date: assistant.hired_date || ""
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

    if (!clinicId) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على ملف المستخدم",
        variant: "destructive"
      });
      return;
    }

    try {
      const assistantData = {
        clinic_id: clinicId,
        full_name: formData.full_name,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        specialization: formData.specialization || null,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        notes: formData.notes || null,
        doctor_id: formData.doctor_id && formData.doctor_id !== 'none' ? formData.doctor_id : null,
        status: formData.status || 'active',
        hired_date: formData.hired_date || null
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
            <CardTitle className="text-sm font-medium">نشطين</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {assistants?.filter(a => !a.status || a.status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">لديهم تخصص</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
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
                Math.round(assistants.filter(a => a.experience_years).reduce((sum, a) => sum + (a.experience_years || 0), 0) / (assistants.filter(a => a.experience_years).length || 1))
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
                  <TableHead>الحالة</TableHead>
                  <TableHead>الطبيب المسؤول</TableHead>
                  <TableHead>التخصص</TableHead>
                  <TableHead>الخبرة</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssistants?.map((assistant) => (
                  <TableRow key={assistant.id}>
                    <TableCell className="font-medium">{assistant.full_name}</TableCell>
                    <TableCell>
                      {(() => {
                        switch (assistant.status) {
                          case 'active': return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
                          case 'inactive': return <Badge variant="secondary">غير نشط</Badge>;
                          case 'suspended': return <Badge variant="destructive">معلق</Badge>;
                          default: return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
                        }
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const doc = activeDoctors?.find(d => d.id === assistant.doctor_id);
                        return doc ? <Badge variant="outline">د. {doc.full_name}</Badge> : <span className="text-muted-foreground">-</span>;
                      })()}
                    </TableCell>
                    <TableCell>
                      {assistant.specialization ? (
                        <Badge variant="outline">{assistant.specialization}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {assistant.experience_years ? `${assistant.experience_years} سنة` : '-'}
                    </TableCell>
                    <TableCell>{assistant.phone || '-'}</TableCell>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAssistant ? "تعديل المساعد" : "إضافة مساعد جديد"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">الاسم الكامل</Label>
                <Input id="full_name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="أدخل الاسم الكامل" required />
              </div>
              <div>
                <Label>الطبيب المسؤول</Label>
                <Select value={formData.doctor_id} onValueChange={(value) => setFormData({ ...formData, doctor_id: value })}>
                  <SelectTrigger><SelectValue placeholder="اختر الطبيب" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون طبيب محدد</SelectItem>
                    {activeDoctors?.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        د. {doctor.full_name} {doctor.specialization ? `- ${doctor.specialization}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="specialization">التخصص</Label>
                <Input id="specialization" value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} placeholder="أدخل التخصص" />
              </div>
              <div>
                <Label>الحالة</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
                    <SelectItem value="suspended">معلق</SelectItem>
                  </SelectContent>
                </Select>
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

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="experience_years">سنوات الخبرة</Label>
                <Input
                  id="experience_years"
                  type="number"
                  min="0"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                  placeholder="سنوات الخبرة"
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
                  placeholder="الراتب"
                />
              </div>

              <div>
                <Label htmlFor="hired_date">تاريخ التعيين</Label>
                <Input
                  id="hired_date"
                  type="date"
                  value={formData.hired_date}
                  onChange={(e) => setFormData({ ...formData, hired_date: e.target.value })}
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