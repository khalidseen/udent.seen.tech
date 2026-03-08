import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, User, Edit, Trash2, Stethoscope, Phone, Mail, Calendar, FileText, Users, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import AddDoctorDialog from "@/components/doctors/AddDoctorDialog";

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
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ['current-profile'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_current_user_profile');
      return data;
    }
  });

  const clinicId = profile?.id;

  const { data: doctors, isLoading, refetch } = useQuery({
    queryKey: ['doctors', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('clinic_id', clinicId!)
        .order('full_name', { ascending: true });
      if (error) throw error;
      return data as Doctor[];
    },
    enabled: !!clinicId
  });

  // Fetch appointment counts per doctor
  const { data: doctorAppointments } = useQuery({
    queryKey: ['doctor-appointment-counts', clinicId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('appointments')
        .select('doctor_id')
        .eq('clinic_id', clinicId!)
        .gte('appointment_date', `${today}T00:00:00`)
        .lte('appointment_date', `${today}T23:59:59`)
        .in('status', ['scheduled', 'confirmed']);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((a: any) => {
        if (a.doctor_id) counts[a.doctor_id] = (counts[a.doctor_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!clinicId
  });

  // Fetch treatment counts per doctor
  const { data: doctorTreatments } = useQuery({
    queryKey: ['doctor-treatment-counts', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dental_treatments')
        .select('assigned_doctor_id')
        .eq('clinic_id', clinicId!);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((t: any) => {
        if (t.assigned_doctor_id) counts[t.assigned_doctor_id] = (counts[t.assigned_doctor_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!clinicId
  });

  // Fetch patient counts per doctor
  const { data: doctorPatients } = useQuery({
    queryKey: ['doctor-patient-counts', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('assigned_doctor_id')
        .eq('clinic_id', clinicId!)
        .not('assigned_doctor_id', 'is', null);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((p: any) => {
        if (p.assigned_doctor_id) counts[p.assigned_doctor_id] = (counts[p.assigned_doctor_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!clinicId
  });

  const filteredDoctors = doctors?.filter(doctor =>
    doctor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => { setEditingDoctor(null); setIsDialogOpen(true); };
  const handleEdit = (doctor: Doctor) => { setEditingDoctor(doctor); setIsDialogOpen(true); };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطبيب؟')) return;
    try {
      const { error } = await supabase.from('doctors').delete().eq('id', id);
      if (error) throw error;
      refetch();
      toast({ title: "تم الحذف", description: "تم حذف الطبيب بنجاح" });
    } catch (error: unknown) {
      toast({ title: "خطأ", description: (error as Error)?.message || "حدث خطأ أثناء حذف الطبيب", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">نشط</Badge>;
      case 'inactive': return <Badge variant="secondary">غير نشط</Badge>;
      case 'suspended': return <Badge variant="destructive">معلق</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
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
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 ml-2" />
            إضافة طبيب جديد
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأطباء</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{doctors?.length || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أطباء نشطين</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{doctors?.filter(d => d.status === 'active').length || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط الخبرة</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {doctors?.length ? Math.round(doctors.filter(d => d.experience_years).reduce((sum, d) => sum + (d.experience_years || 0), 0) / doctors.filter(d => d.experience_years).length) || 0 : 0} سنة
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card><CardContent className="py-8"><div className="text-center">جاري التحميل...</div></CardContent></Card>
      ) : filteredDoctors?.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد أطباء</h3>
            <p className="text-muted-foreground mb-4">{searchQuery ? "لم يتم العثور على نتائج للبحث" : "لم يتم إضافة أي طبيب بعد"}</p>
            {!searchQuery && (<Button onClick={handleCreate}><Plus className="w-4 h-4 ml-2" />إضافة أول طبيب</Button>)}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors?.map((doctor) => (
            <Card key={doctor.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="cursor-pointer" onClick={() => navigate(`/doctors/${doctor.id}`)}>
                    <CardTitle className="text-lg hover:text-primary transition-colors">{doctor.full_name}</CardTitle>
                    {doctor.specialization && (<p className="text-sm text-muted-foreground">{doctor.specialization}</p>)}
                  </div>
                  {getStatusBadge(doctor.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {doctor.phone && (
                    <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" /><span>{doctor.phone}</span></div>
                  )}
                  {doctor.email && (
                    <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground" /><span>{doctor.email}</span></div>
                  )}
                  {doctor.experience_years && (
                    <div className="text-sm text-muted-foreground">{doctor.experience_years} سنة خبرة</div>
                  )}
                </div>

                {/* Live Stats */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">{doctorAppointments?.[doctor.id] || 0}</div>
                    <div className="text-[10px] text-muted-foreground">مواعيد اليوم</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">{doctorTreatments?.[doctor.id] || 0}</div>
                    <div className="text-[10px] text-muted-foreground">علاجات</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">{doctorPatients?.[doctor.id] || 0}</div>
                    <div className="text-[10px] text-muted-foreground">مرضى</div>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate(`/appointments?doctor=${doctor.id}`)}>
                    <Calendar className="w-3 h-3 ml-1" />المواعيد
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate(`/dental-treatments-management?doctor=${doctor.id}`)}>
                    <FileText className="w-3 h-3 ml-1" />العلاجات
                  </Button>
                </div>

                {/* Edit/Delete */}
                <div className="flex gap-2 mt-2 pt-2 border-t">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(doctor)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(doctor.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddDoctorDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={refetch} editingDoctor={editingDoctor} />
    </PageContainer>
  );
};

export default Doctors;
