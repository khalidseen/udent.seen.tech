import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, User, Edit, Trash2, Stethoscope, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AddDoctorDialog from "@/components/doctors/AddDoctorDialog";
<<<<<<< HEAD
import DatabaseTestButton from "@/components/debug/DatabaseTestButton";
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a

interface Doctor {
  id: string;
  full_name: string;
  specialization: string | null;
  status: string;
  email: string | null;
  phone: string | null;
  experience_years: number | null;
  consultation_fee: number | null;
  working_hours: string | null;
  created_at: string;
}

const Doctors = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const { toast } = useToast();

  const { data: doctors, isLoading, refetch } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data as Doctor[];
    }
  });

  const filteredDoctors = doctors?.filter(doctor =>
    doctor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setEditingDoctor(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطبيب؟')) return;

    try {
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', id);

      if (error) throw error;

      refetch();
      toast({
        title: "تم الحذف",
        description: "تم حذف الطبيب بنجاح",
      });
<<<<<<< HEAD
    } catch (error: unknown) {
      toast({
        title: "خطأ",
        description: (error as Error)?.message || "حدث خطأ أثناء حذف الطبيب",
=======
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حذف الطبيب",
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">نشط</Badge>;
      case 'inactive':
        return <Badge variant="secondary">غير نشط</Badge>;
      case 'suspended':
        return <Badge variant="destructive">معلق</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <PageContainer>
      <PageToolbar
        title="إدارة الأطباء"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="البحث في الأطباء..."
        showViewToggle={false}
        showAdvancedFilter={false}
        actions={
<<<<<<< HEAD
          <div className="flex gap-2">
            <DatabaseTestButton />
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة طبيب جديد
            </Button>
          </div>
=======
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 ml-2" />
            إضافة طبيب جديد
          </Button>
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأطباء</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doctors?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أطباء نشطين</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {doctors?.filter(d => d.status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط الخبرة</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">
              {doctors?.length ? 
                Math.round(doctors.filter(d => d.experience_years).reduce((sum, d) => sum + (d.experience_years || 0), 0) / doctors.filter(d => d.experience_years).length) || 0
                : 0} سنة
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">جاري التحميل...</div>
          </CardContent>
        </Card>
      ) : filteredDoctors?.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد أطباء</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "لم يتم العثور على نتائج للبحث" : "لم يتم إضافة أي طبيب بعد"}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة أول طبيب
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors?.map((doctor) => (
            <Card key={doctor.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{doctor.full_name}</CardTitle>
                    {doctor.specialization && (
                      <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                    )}
                  </div>
                  {getStatusBadge(doctor.status)}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2">
                  {doctor.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{doctor.phone}</span>
                    </div>
                  )}
                  
                  {doctor.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{doctor.email}</span>
                    </div>
                  )}
                  
                  {doctor.experience_years && (
                    <div className="text-sm text-muted-foreground">
                      {doctor.experience_years} سنة خبرة
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(doctor)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(doctor.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>      
      )}
      
      <AddDoctorDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={refetch}
        editingDoctor={editingDoctor}
      />
    </PageContainer>
  );
};

export default Doctors;