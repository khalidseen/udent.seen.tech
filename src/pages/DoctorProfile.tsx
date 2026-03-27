import { useState } from "react";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Phone, Mail, Stethoscope, Calendar, FileText, Users, Clock, Award, CreditCard, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageContainer } from "@/components/layout/PageContainer";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const DoctorProfile = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();

  const { data: doctor, isLoading } = useQuery({
    queryKey: ['doctor-profile', doctorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', doctorId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!doctorId,
  });

  const { data: appointments } = useQuery({
    queryKey: ['doctor-appointments', doctorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, patients(full_name, phone)')
        .eq('doctor_id', doctorId!)
        .order('appointment_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!doctorId,
  });

  const { data: treatments } = useQuery({
    queryKey: ['doctor-treatments', doctorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dental_treatments')
        .select('*, patients(full_name)')
        .eq('assigned_doctor_id', doctorId!)
        .order('treatment_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!doctorId,
  });

  const { data: patients } = useQuery({
    queryKey: ['doctor-patients', doctorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, phone, email, patient_status, date_of_birth, gender')
        .eq('assigned_doctor_id', doctorId!)
        .order('full_name');
      if (error) throw error;
      return data;
    },
    enabled: !!doctorId,
  });

  const { data: assistants } = useQuery({
    queryKey: ['doctor-assistants-profile', doctorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctor_assistants')
        .select('id, full_name, phone, specialization')
        .eq('doctor_id', doctorId!);
      if (error) throw error;
      return data;
    },
    enabled: !!doctorId,
  });

  const todayAppointments = appointments?.filter(a => {
    const today = new Date().toISOString().split('T')[0];
    return a.appointment_date.startsWith(today) && ['scheduled', 'confirmed'].includes(a.status);
  }).length || 0;

  const completedTreatments = treatments?.filter(t => t.status === 'completed').length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case 'inactive': return <Badge variant="secondary">غير نشط</Badge>;
      case 'suspended': return <Badge variant="destructive">معلق</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAppointmentStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      scheduled: { cls: "bg-blue-100 text-blue-800", label: "مجدول" },
      confirmed: { cls: "bg-green-100 text-green-800", label: "مؤكد" },
      completed: { cls: "bg-gray-100 text-gray-800", label: "مكتمل" },
      cancelled: { cls: "bg-red-100 text-red-800", label: "ملغي" },
      no_show: { cls: "bg-yellow-100 text-yellow-800", label: "لم يحضر" },
    };
    const s = map[status] || { cls: "", label: status };
    return <Badge className={s.cls}>{s.label}</Badge>;
  };

  if (isLoading) {
    return <PageContainer><PageSkeleton variant="form" /></PageContainer>;
  }

  if (!doctor) {
    return <PageContainer><div className="text-center py-12">لم يتم العثور على الطبيب</div></PageContainer>;
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/doctors')}>
          <ArrowRight className="w-4 h-4 ml-1" />
          العودة للأطباء
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/appointments?doctor=${doctorId}`)}>
            <Calendar className="w-4 h-4 ml-1" />
            المواعيد
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/dental-treatments-management?doctor=${doctorId}`)}>
            <Stethoscope className="w-4 h-4 ml-1" />
            العلاجات
          </Button>
        </div>
      </div>

      {/* Doctor Info Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0 w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Stethoscope className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{doctor.full_name}</h1>
                {getStatusBadge(doctor.status)}
              </div>
              {doctor.specialization && <p className="text-muted-foreground">{doctor.specialization}</p>}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                {doctor.phone && (
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" />{doctor.phone}</div>
                )}
                {doctor.email && (
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" />{doctor.email}</div>
                )}
                {doctor.experience_years && (
                  <div className="flex items-center gap-2"><Award className="w-4 h-4 text-muted-foreground" />{doctor.experience_years} سنة خبرة</div>
                )}
                {doctor.license_number && (
                  <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" />رخصة: {doctor.license_number}</div>
                )}
                {doctor.consultation_fee && (
                  <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-muted-foreground" />رسوم الاستشارة: {doctor.consultation_fee}</div>
                )}
                {doctor.working_hours && (
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" />{doctor.working_hours}</div>
                )}
                {doctor.address && (
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" />{doctor.address}</div>
                )}
                {doctor.gender && (
                  <div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" />{doctor.gender === 'male' ? 'ذكر' : 'أنثى'}</div>
                )}
              </div>
              {doctor.bio && <p className="text-sm text-muted-foreground border-t pt-3 mt-3">{doctor.bio}</p>}
              {doctor.qualifications && <p className="text-sm"><span className="font-medium">المؤهلات:</span> {doctor.qualifications}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-primary">{todayAppointments}</div>
            <div className="text-xs text-muted-foreground">مواعيد اليوم</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-primary">{patients?.length || 0}</div>
            <div className="text-xs text-muted-foreground">المرضى</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-primary">{treatments?.length || 0}</div>
            <div className="text-xs text-muted-foreground">العلاجات</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-primary">{assistants?.length || 0}</div>
            <div className="text-xs text-muted-foreground">المساعدون</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="appointments" dir="rtl">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="appointments"><Calendar className="w-4 h-4 ml-1" />المواعيد ({appointments?.length || 0})</TabsTrigger>
          <TabsTrigger value="treatments"><FileText className="w-4 h-4 ml-1" />العلاجات ({treatments?.length || 0})</TabsTrigger>
          <TabsTrigger value="patients"><Users className="w-4 h-4 ml-1" />المرضى ({patients?.length || 0})</TabsTrigger>
          <TabsTrigger value="assistants"><User className="w-4 h-4 ml-1" />المساعدون ({assistants?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <Card>
            <CardHeader><CardTitle>المواعيد</CardTitle></CardHeader>
            <CardContent>
              {!appointments?.length ? (
                <p className="text-center text-muted-foreground py-4">لا توجد مواعيد</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المريض</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>نوع العلاج</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((a) => (
                      <TableRow key={a.id} className="cursor-pointer" onClick={() => navigate('/appointments')}>
                        <TableCell className="font-medium">{(a.patients as any)?.full_name || '—'}</TableCell>
                        <TableCell>{format(new Date(a.appointment_date), 'yyyy/MM/dd HH:mm', { locale: ar })}</TableCell>
                        <TableCell>{a.treatment_type || '—'}</TableCell>
                        <TableCell>{getAppointmentStatusBadge(a.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Treatments Tab */}
        <TabsContent value="treatments">
          <Card>
            <CardHeader><CardTitle>العلاجات</CardTitle></CardHeader>
            <CardContent>
              {!treatments?.length ? (
                <p className="text-center text-muted-foreground py-4">لا توجد علاجات</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المريض</TableHead>
                      <TableHead>التشخيص</TableHead>
                      <TableHead>خطة العلاج</TableHead>
                      <TableHead>السن</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {treatments.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium cursor-pointer text-primary" onClick={() => navigate(`/patients/${t.patient_id}`)}>{(t.patients as any)?.full_name || '—'}</TableCell>
                        <TableCell>{t.diagnosis}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{t.treatment_plan}</TableCell>
                        <TableCell>{t.tooth_number}</TableCell>
                        <TableCell>{format(new Date(t.treatment_date), 'yyyy/MM/dd')}</TableCell>
                        <TableCell>
                          <Badge variant={t.status === 'completed' ? 'default' : 'secondary'}>
                            {t.status === 'completed' ? 'مكتمل' : t.status === 'planned' ? 'مخطط' : t.status === 'in_progress' ? 'جاري' : t.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patients Tab */}
        <TabsContent value="patients">
          <Card>
            <CardHeader><CardTitle>المرضى المعينون</CardTitle></CardHeader>
            <CardContent>
              {!patients?.length ? (
                <p className="text-center text-muted-foreground py-4">لا يوجد مرضى معينون لهذا الطبيب</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>الهاتف</TableHead>
                      <TableHead>البريد</TableHead>
                      <TableHead>الجنس</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((p) => (
                      <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/patients/${p.id}`)}>
                        <TableCell className="font-medium text-primary">{p.full_name}</TableCell>
                        <TableCell>{p.phone || '—'}</TableCell>
                        <TableCell>{p.email || '—'}</TableCell>
                        <TableCell>{p.gender === 'male' ? 'ذكر' : p.gender === 'female' ? 'أنثى' : '—'}</TableCell>
                        <TableCell>
                          <Badge variant={p.patient_status === 'active' ? 'default' : 'secondary'}>
                            {p.patient_status === 'active' ? 'نشط' : 'غير نشط'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assistants Tab */}
        <TabsContent value="assistants">
          <Card>
            <CardHeader><CardTitle>المساعدون</CardTitle></CardHeader>
            <CardContent>
              {!assistants?.length ? (
                <p className="text-center text-muted-foreground py-4">لا يوجد مساعدون معينون</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>الهاتف</TableHead>
                      <TableHead>التخصص</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assistants.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.full_name}</TableCell>
                        <TableCell>{a.phone || '—'}</TableCell>
                        <TableCell>{a.specialization || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default DoctorProfile;
