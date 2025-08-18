import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Save } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

const AddPatientForm = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: '',
    address: '',
    medical_history: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim()) {
      toast({
        title: 'خطأ',
        description: 'يجب إدخال اسم المريض',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('Current user:', user);
      
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      // Get or create user's profile
      let { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      // If no profile exists, create one
      if (!profile && !profileFetchError) {
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم جديد',
            role: 'doctor'
          })
          .select('id')
          .single();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error('فشل في إنشاء ملف المستخدم: ' + profileError.message);
        }
        profile = newProfile;
      }

      if (!profile) {
        throw new Error('لم يتم العثور على ملف المستخدم أو فشل في إنشاؤه');
      }

      const { error } = await supabase
        .from('patients')
        .insert({
          clinic_id: profile.id,
          full_name: formData.full_name,
          phone: formData.phone || null,
          email: formData.email || null,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
          address: formData.address || null,
          medical_history: formData.medical_history || null,
          notes: formData.notes || null
        });

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم إضافة المريض بنجاح'
      });

      // Reset form
      setFormData({
        full_name: '',
        phone: '',
        email: '',
        date_of_birth: '',
        gender: '',
        address: '',
        medical_history: '',
        notes: ''
      });

    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        title="إضافة مريض جديد" 
        description="أدخل بيانات المريض الجديد" 
      />

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="w-5 h-5 ml-2" />
            بيانات المريض
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* First Row: Name, Phone, Email */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">اسم المريض *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  placeholder="الاسم الكامل"
                  required
                  className="h-12"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+201234567890"
                  type="tel"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="patient@example.com"
                  type="email"
                  className="h-12"
                />
              </div>
            </div>

            {/* Second Row: Date of Birth, Gender, Address */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">تاريخ الميلاد</Label>
                <Input
                  id="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                  type="date"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">الجنس</Label>
                <Select onValueChange={(value) => handleChange('gender', value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="اختر الجنس" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ذكر</SelectItem>
                    <SelectItem value="female">أنثى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">العنوان</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="عنوان المريض"
                  className="h-12"
                />
              </div>
            </div>

            {/* Medical Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="medical_history">التاريخ المرضي</Label>
                <Textarea
                  id="medical_history"
                  value={formData.medical_history}
                  onChange={(e) => handleChange('medical_history', e.target.value)}
                  placeholder="التاريخ المرضي والحساسيات..."
                  rows={4}
                  className="resize-none"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات إضافية</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="أي ملاحظات أو معلومات إضافية..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading} size="lg" className="px-12 h-12">
                <Save className="w-5 h-5 ml-2" />
                {loading ? 'جاري الحفظ...' : 'حفظ المريض'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default AddPatientForm;