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
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, User, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Secretary {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

export default function Secretaries() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSecretary, setEditingSecretary] = useState<Secretary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: secretaries, isLoading, refetch } = useQuery({
    queryKey: ['secretaries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('secretaries' as any)
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      return (data as any) as Secretary[];
    }
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
      phone: ""
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (secretary: Secretary) => {
    setEditingSecretary(secretary);
    setFormData({
      full_name: secretary.full_name,
      email: secretary.email,
      phone: secretary.phone || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (secretaryId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا السكرتير؟')) return;

    try {
      const { error } = await supabase
        .from('secretaries' as any)
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
        phone: formData.phone || null
      };

      if (editingSecretary) {
        const { error } = await supabase
          .from('secretaries' as any)
          .update(secretaryData)
          .eq('id', editingSecretary.id);

        if (error) throw error;

        toast({
          title: "تم التحديث",
          description: "تم تحديث بيانات السكرتير بنجاح",
        });
      } else {
        const { error } = await supabase
          .from('secretaries' as any)
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
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 ml-2" />
            إضافة سكرتير جديد
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
            <CardTitle className="text-sm font-medium">لديهم رقم هاتف</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {secretaries?.filter(s => s.phone).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">لديهم إيميل</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">
              {secretaries?.filter(s => s.email).length || 0}
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
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead>تاريخ الإضافة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSecretaries?.map((secretary) => (
                  <TableRow key={secretary.id}>
                    <TableCell className="font-medium">{secretary.full_name}</TableCell>
                    <TableCell>{secretary.email}</TableCell>
                    <TableCell>{secretary.phone || '-'}</TableCell>
                    <TableCell>
                      {new Date(secretary.created_at).toLocaleDateString('ar-SA')}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSecretary ? "تعديل السكرتير" : "إضافة سكرتير جديد"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="email">البريد الإلكتروني</Label>
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
                placeholder="أدخل رقم الهاتف (اختياري)"
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