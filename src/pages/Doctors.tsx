import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, User, Phone, Mail, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Doctor {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  specialization?: string;
  license_number?: string;
  experience_years?: number;
  status: string;
  created_at: string;
}

const Doctors = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const { data: doctors = [], isLoading, refetch } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Doctor[];
    }
  });

  const filteredDoctors = doctors.filter(doctor =>
    doctor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطبيب؟')) return;
    
    try {
      const { error } = await supabase.from('doctors').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('تم حذف الطبيب بنجاح');
      refetch();
    } catch (error) {
      console.error('Error deleting doctor:', error);
      toast.error('حدث خطأ في حذف الطبيب');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: 'نشط', variant: 'default' as const },
      inactive: { label: 'غير نشط', variant: 'secondary' as const },
      suspended: { label: 'موقوف', variant: 'destructive' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <PageContainer>
      <PageHeader 
        title="إدارة الأطباء"
        description="إدارة الأطباء والكادر الطبي في العيادة"
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="البحث عن طبيب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button>
          <Plus className="w-4 h-4 ml-2" />
          إضافة طبيب جديد
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((doctor) => (
            <Card key={doctor.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{doctor.full_name}</CardTitle>
                      {doctor.specialization && (
                        <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(doctor.status)}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
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
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" />
                      <span>{doctor.experience_years} سنة خبرة</span>
                    </div>
                  )}
                  
                  {doctor.license_number && (
                    <div className="text-sm text-muted-foreground">
                      رقم الترخيص: {doctor.license_number}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="w-4 h-4 ml-1" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(doctor.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredDoctors.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد أطباء</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'لم يتم العثور على أطباء مطابقين للبحث' : 'لم يتم إضافة أي أطباء بعد'}
            </p>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              إضافة أول طبيب
            </Button>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
};

export default Doctors;