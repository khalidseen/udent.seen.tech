import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

<<<<<<< HEAD
interface Doctor {
  id?: string;
  full_name: string;
  email?: string;
  phone?: string;
  specialization: string;
  license_number?: string;
  qualifications?: string;
  experience_years?: number;
  consultation_fee?: number;
  working_hours?: string;
  address?: string;
  bio?: string;
  gender?: string;
  date_of_birth?: string;
  hired_date?: string;
  status: string;
  notes?: string;
}

=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
interface AddDoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
<<<<<<< HEAD
  editingDoctor?: Doctor;
=======
  editingDoctor?: any;
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
}

export default function AddDoctorDialog({ open, onOpenChange, onSuccess, editingDoctor }: AddDoctorDialogProps) {
  const [formData, setFormData] = useState({
    full_name: editingDoctor?.full_name || "",
    email: editingDoctor?.email || "",
    phone: editingDoctor?.phone || "",
    specialization: editingDoctor?.specialization || "",
    license_number: editingDoctor?.license_number || "",
    qualifications: editingDoctor?.qualifications || "",
    experience_years: editingDoctor?.experience_years?.toString() || "",
    consultation_fee: editingDoctor?.consultation_fee?.toString() || "",
    working_hours: editingDoctor?.working_hours || "",
    address: editingDoctor?.address || "",
    bio: editingDoctor?.bio || "",
    gender: editingDoctor?.gender || "",
    date_of_birth: editingDoctor?.date_of_birth || "",
    hired_date: editingDoctor?.hired_date || new Date().toISOString().split('T')[0],
    status: editingDoctor?.status || "active",
    notes: editingDoctor?.notes || ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const specializations = [
    "طب عام",
    "طب أسنان",
    "جراحة الفم والأسنان",
    "تقويم الأسنان",
    "طب أسنان الأطفال",
    "علاج العصب",
    "أمراض اللثة",
    "التركيبات السنية",
    "جراحة الوجه والفكين"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.specialization) {
      toast({
        title: "خطأ",
        description: "يرجى ملء الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user profile for clinic_id
<<<<<<< HEAD
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('المستخدم غير مسجل الدخول');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.user.id)
=======
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
        .single();

      if (!profile) throw new Error('لم يتم العثور على ملف المستخدم');

      const doctorData = {
        clinic_id: profile.id,
<<<<<<< HEAD
        full_name: formData.full_name.trim(),
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        specialization: formData.specialization,
        license_number: formData.license_number?.trim() || null,
        qualifications: formData.qualifications?.trim() || null,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : 0,
        consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : 0,
        working_hours: formData.working_hours?.trim() || null,
        address: formData.address?.trim() || null,
        bio: formData.bio?.trim() || null,
=======
        full_name: formData.full_name,
        email: formData.email || null,
        phone: formData.phone || null,
        specialization: formData.specialization,
        license_number: formData.license_number || null,
        qualifications: formData.qualifications || null,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : 0,
        consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : 0,
        working_hours: formData.working_hours || null,
        address: formData.address || null,
        bio: formData.bio || null,
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
        hired_date: formData.hired_date || new Date().toISOString().split('T')[0],
        status: formData.status,
<<<<<<< HEAD
        notes: formData.notes?.trim() || null
      };

      console.log('Doctor data to save:', doctorData);

      if (editingDoctor) {
        console.log('Updating doctor with ID:', editingDoctor.id);
=======
        notes: formData.notes || null
      };

      if (editingDoctor) {
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
        const { error } = await supabase
          .from('doctors')
          .update(doctorData)
          .eq('id', editingDoctor.id);

<<<<<<< HEAD
        if (error) {
          console.error('Update error:', error);
          throw error;
        }
=======
        if (error) throw error;
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a

        toast({
          title: "تم التحديث",
          description: "تم تحديث بيانات الطبيب بنجاح",
        });
      } else {
<<<<<<< HEAD
        console.log('Inserting new doctor');
        const { data, error } = await supabase
          .from('doctors')
          .insert(doctorData)
          .select();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }

        console.log('Doctor inserted successfully:', data);
=======
        const { error } = await supabase
          .from('doctors')
          .insert(doctorData);

        if (error) throw error;

>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
        toast({
          title: "تم الإضافة",
          description: "تم إضافة الطبيب بنجاح",
        });
      }

<<<<<<< HEAD
      // Reset form
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        specialization: "",
        license_number: "",
        qualifications: "",
        experience_years: "",
        consultation_fee: "",
        working_hours: "",
        address: "",
        bio: "",
        gender: "",
        date_of_birth: "",
        hired_date: new Date().toISOString().split('T')[0],
        status: "active",
        notes: ""
      });
      
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      toast({
        title: "خطأ",
        description: (error as Error)?.message || "حدث خطأ أثناء حفظ البيانات",
=======
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حفظ البيانات",
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingDoctor ? "تعديل الطبيب" : "إضافة طبيب جديد"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">المعلومات الأساسية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="specialization">التخصص *</Label>
                <Select
                  value={formData.specialization}
                  onValueChange={(value) => setFormData({ ...formData, specialization: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التخصص" />
                  </SelectTrigger>
                  <SelectContent>
                    {specializations.map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

              <div>
                <Label htmlFor="gender">الجنس</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الجنس" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ذكر</SelectItem>
                    <SelectItem value="female">أنثى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date_of_birth">تاريخ الميلاد</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">المعلومات المهنية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="license_number">رقم الترخيص</Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  placeholder="أدخل رقم الترخيص"
                />
              </div>

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
                <Label htmlFor="consultation_fee">أتعاب الاستشارة</Label>
                <Input
                  id="consultation_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.consultation_fee}
                  onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                  placeholder="أدخل أتعاب الاستشارة"
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
                <Label htmlFor="status">الحالة</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
                    <SelectItem value="suspended">معلق</SelectItem>
                  </SelectContent>
                </Select>
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
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">معلومات إضافية</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="qualifications">المؤهلات</Label>
                <Textarea
                  id="qualifications"
                  value={formData.qualifications}
                  onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                  placeholder="أدخل المؤهلات والشهادات"
                  rows={3}
                />
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

              <div>
                <Label htmlFor="bio">السيرة الذاتية</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="أدخل نبذة عن الطبيب"
                  rows={3}
                />
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
            </div>
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : editingDoctor ? "تحديث" : "إضافة"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}