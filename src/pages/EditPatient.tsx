import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

interface PatientFormData {
  full_name: string;
  phone: string;
  email: string;
  date_of_birth: string;
  gender: string;
  address: string;
  medical_history: string;
  emergency_contact: string;
  emergency_phone: string;
  blood_type: string;
  occupation: string;
  marital_status: string;
  patient_status: string;
  national_id: string;
}

export default function EditPatient() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<PatientFormData>({
    full_name: "",
    phone: "",
    email: "",
    date_of_birth: "",
    gender: "",
    address: "",
    medical_history: "",
    emergency_contact: "",
    emergency_phone: "",
    blood_type: "",
    occupation: "",
    marital_status: "",
    patient_status: "active",
    national_id: ""
  });

  // جلب بيانات المريض
  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  // ملء النموذج عند جلب البيانات
  useEffect(() => {
    if (patient) {
      setFormData({
        full_name: patient.full_name || "",
        phone: patient.phone || "",
        email: patient.email || "",
        date_of_birth: patient.date_of_birth || "",
        gender: patient.gender || "",
        address: patient.address || "",
        medical_history: patient.medical_history || "",
        emergency_contact: patient.emergency_contact || "",
        emergency_phone: patient.emergency_phone || "",
        blood_type: patient.blood_type || "",
        occupation: patient.occupation || "",
        marital_status: patient.marital_status || "",
        patient_status: patient.patient_status || "active",
        national_id: patient.national_id || ""
      });
    }
  }, [patient]);

  // تحديث بيانات المريض
  const updateMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      const { error } = await supabase
        .from('patients')
        .update(data)
        .eq('id', patientId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات المريض",
      });
      navigate(`/patients/${patientId}`);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث بيانات المريض",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.phone) {
      toast({
        title: "خطأ",
        description: "الاسم ورقم الهاتف مطلوبان",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate(formData);
  };

  const handleChange = (field: keyof PatientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }

  if (!patient) {
    return (
      <PageContainer>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">لم يتم العثور على المريض</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => navigate('/patients')}>
                <ArrowLeft className="w-4 h-4 ml-2" />
                العودة للقائمة
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="تعديل بيانات المريض"
        description={`تحديث معلومات المريض: ${patient.full_name}`}
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>البيانات الأساسية</CardTitle>
                <CardDescription>تحديث المعلومات الشخصية للمريض</CardDescription>
              </div>
              <Button type="button" variant="ghost" onClick={() => navigate(`/patients/${patientId}`)}>
                <ArrowLeft className="w-4 h-4 ml-2" />
                إلغاء
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* المعلومات الأساسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">الاسم الكامل *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  placeholder="أدخل الاسم الكامل"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+966xxxxxxxxx"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="example@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="national_id">رقم الهوية</Label>
                <Input
                  id="national_id"
                  value={formData.national_id}
                  onChange={(e) => handleChange('national_id', e.target.value)}
                  placeholder="1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">تاريخ الميلاد</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">الجنس</Label>
                <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الجنس" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ذكر</SelectItem>
                    <SelectItem value="female">أنثى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="blood_type">فصيلة الدم</Label>
                <Select value={formData.blood_type} onValueChange={(value) => handleChange('blood_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر فصيلة الدم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marital_status">الحالة الاجتماعية</Label>
                <Select value={formData.marital_status} onValueChange={(value) => handleChange('marital_status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحالة الاجتماعية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">أعزب</SelectItem>
                    <SelectItem value="married">متزوج</SelectItem>
                    <SelectItem value="divorced">مطلق</SelectItem>
                    <SelectItem value="widowed">أرمل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">المهنة</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => handleChange('occupation', e.target.value)}
                  placeholder="أدخل المهنة"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="patient_status">حالة المريض</Label>
                <Select value={formData.patient_status} onValueChange={(value) => handleChange('patient_status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
                    <SelectItem value="archived">مؤرشف</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* العنوان */}
            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="أدخل العنوان الكامل"
                rows={2}
              />
            </div>

            {/* معلومات الطوارئ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact">جهة اتصال الطوارئ</Label>
                <Input
                  id="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={(e) => handleChange('emergency_contact', e.target.value)}
                  placeholder="اسم الشخص"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_phone">رقم الطوارئ</Label>
                <Input
                  id="emergency_phone"
                  value={formData.emergency_phone}
                  onChange={(e) => handleChange('emergency_phone', e.target.value)}
                  placeholder="+966xxxxxxxxx"
                />
              </div>
            </div>

            {/* التاريخ الطبي */}
            <div className="space-y-2">
              <Label htmlFor="medical_history">التاريخ الطبي</Label>
              <Textarea
                id="medical_history"
                value={formData.medical_history}
                onChange={(e) => handleChange('medical_history', e.target.value)}
                placeholder="أدخل التاريخ الطبي، الأمراض المزمنة، الحساسية، إلخ..."
                rows={4}
              />
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/patients/${patientId}`)}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
              >
                <Save className="w-4 h-4 ml-2" />
                {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </PageContainer>
  );
}
