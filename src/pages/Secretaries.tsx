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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, User, UserCheck, CalendarPlus, CalendarDays, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Secretary {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  salary: number | null;
  hired_date: string | null;
  notes: string | null;
  status: string | null;
  working_hours: string | null;
  clinic_id: string | null;
  created_at: string;
  updated_at: string | null;
}

export default function Secretaries() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSecretary, setEditingSecretary] = useState<Secretary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    salary: "",
    hired_date: new Date().toISOString().split('T')[0],
    notes: "",
    status: "active",
    working_hours: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ['current-profile'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_current_user_profile');
      return data;
    }
  });

  const clinicId = profile?.id;

  const { data: secretaries, isLoading, refetch } = useQuery({
    queryKey: ['secretaries', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('secretaries')
        .select('*')
        .eq('clinic_id', clinicId!)
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data as Secretary[];
    },
    enabled: !!clinicId
  });

  const filteredSecretaries = secretaries?.filter(secretary =>
    secretary.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    secretary.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setEditingSecretary(null);
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      address: "",
      salary: "",
      hired_date: new Date().toISOString().split('T')[0],
      notes: "",
      status: "active",
      working_hours: ""
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (secretary: Secretary) => {
    setEditingSecretary(secretary);
    setFormData({
      full_name: secretary.full_name,
      email: secretary.email,
      phone: secretary.phone || "",
      address: secretary.address || "",
      salary: secretary.salary?.toString() || "",
      hired_date: secretary.hired_date || "",
      notes: secretary.notes || "",
      status: secretary.status || "active",
      working_hours: secretary.working_hours || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (secretaryId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا السكرتير؟')) return;

    try {
      const { error } = await supabase
        .from('secretaries')
        .delete()
        .eq('id', secretaryId);

      if (error) throw error;

      refetch();
      toast({
        title: "تم الحذف",
        description: "تم حذف السكرتير بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حذف السكرتير",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const secretaryData = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        hired_date: formData.hired_date || null,
        notes: formData.notes || null,
        status: formData.status || 'active',
        working_hours: formData.working_hours || null,
        ...(editingSecretary ? {} : { clinic_id: clinicId })
      };

      if (editingSecretary) {
        const { error } = await supabase
          .from('secretaries')
          .update(secretaryData)
          .eq('id', editingSecretary.id);

        if (error) throw error;

        toast({
          title: "تم التحديث",
          description: "تم تحديث بيانات السكرتير بنجاح",
        });
      } else {
        const { error } = await supabase
          .from('secretaries')
          .insert(secretaryData);

        if (error) throw error;

        toast({
          title: "تم الإضافة",
          description: "تم إضافة السكرتير بنجاح",
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
        title="إدارة السكرتيرات"
        description="إدارة السكرتيرات والموظفين الإداريين"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/appointments')}>
              <CalendarDays className="w-4 h-4 ml-2" />
              جدول المواعيد
            </Button>
            <Button variant="outline" onClick={() => navigate('/appointments/new')}>
              <CalendarPlus className="w-4 h-4 ml-2" />
              حجز موعد
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة سكرتير جديد
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي السكرتيرات</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{secretaries?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نشطين</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {secretaries?.filter(s => !s.status || s.status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">لديهم ساعات عمل</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {secretaries?.filter(s => s.working_hours).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط الراتب</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">
              {secretaries?.length ?
                Math.round(secretaries.filter(s => s.salary).reduce((sum, s) => sum + (s.salary || 0), 0) / (secretaries.filter(s => s.salary).length || 1))
                : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>قائمة السكرتيرات</CardTitle>
            <div className="w-full sm:w-80">
              <Input
                placeholder="البحث عن سكرتير..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : filteredSecretaries?.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد سكرتيرات</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "لم يتم العثور على نتائج للبحث" : "لم يتم إضافة أي سكرتير بعد"}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreate}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة أول سكرتير
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم الكامل</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead>ساعات العمل</TableHead>
                  <TableHead>تاريخ التعيين</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSecretaries?.map((secretary) => (
                  <TableRow key={secretary.id}>
                    <TableCell className="font-medium">{secretary.full_name}</TableCell>
                    <TableCell>
                      {(() => {
                        switch (secretary.status) {
                          case 'active': return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
                          case 'inactive': return <Badge variant="secondary">غير نشط</Badge>;
                          case 'suspended': return <Badge variant="destructive">معلق</Badge>;
                          default: return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
                        }
                      })()}
                    </TableCell>
                    <TableCell>{secretary.email}</TableCell>
                    <TableCell>{secretary.phone || '-'}</TableCell>
                    <TableCell>{secretary.working_hours || '-'}</TableCell>
                    <TableCell>
                      {secretary.hired_date ? new Date(secretary.hired_date).toLocaleDateString() : new Date(secretary.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(secretary)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(secretary.id)}
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
              {editingSecretary ? "تعديل السكرتير" : "إضافة سكرتير جديد"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">الاسم الكامل *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="أدخل الاسم الكامل"
                  required
                />
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
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="أدخل البريد الإلكتروني"
                  required
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
              <div>
                <Label htmlFor="working_hours">ساعات العمل</Label>
                <Input
                  id="working_hours"
                  value={formData.working_hours}
                  onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                  placeholder="مثال: 9:00 ص - 5:00 م"
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
                {isSubmitting ? "جاري الحفظ..." : editingSecretary ? "تحديث" : "إضافة"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}