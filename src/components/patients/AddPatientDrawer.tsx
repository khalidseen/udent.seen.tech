import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { offlineSupabase } from "@/lib/offline-supabase";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Save, Plus } from "lucide-react";

interface AddPatientDrawerProps {
  onPatientAdded?: () => void;
}

const AddPatientDrawer = ({ onPatientAdded }: AddPatientDrawerProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: '',
    address: '',
    medical_history: '',
    notes: '',
    national_id: '',
    emergency_contact: '',
    emergency_phone: '',
    patient_status: 'active',
    insurance_info: '',
    blood_type: '',
    occupation: '',
    marital_status: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      date_of_birth: '',
      gender: '',
      address: '',
      medical_history: '',
      notes: '',
      national_id: '',
      emergency_contact: '',
      emergency_phone: '',
      patient_status: 'active',
      insurance_info: '',
      blood_type: '',
      occupation: '',
      marital_status: ''
    });
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
      const { data: { user } } = await offlineSupabase.auth.getUser();
      
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      // Get or create user's profile
      const profileResult = await offlineSupabase.select('profiles', { 
        filter: { user_id: user.id } 
      });

      let profile = null;
      if (profileResult.data && profileResult.data.length > 0) {
        profile = profileResult.data[0];
      } else {
        // Create new profile if it doesn't exist
        const newProfile = await offlineSupabase.insert('profiles', {
          user_id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم جديد',
          role: 'doctor'
        });

        if (newProfile.error) {
          console.error('Profile creation error:', newProfile.error);
          throw new Error('فشل في إنشاء ملف المستخدم: ' + newProfile.error.message);
        }
        profile = newProfile.data;
      }

      if (!profile) {
        throw new Error('لم يتم العثور على ملف المستخدم أو فشل في إنشاؤه');
      }

      const result = await offlineSupabase.insert('patients', {
        clinic_id: profile.id,
        full_name: formData.full_name,
        phone: formData.phone || null,
        email: formData.email || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        address: formData.address || null,
        medical_history: formData.medical_history || null,
        notes: formData.notes || null,
        national_id: formData.national_id || null,
        emergency_contact: formData.emergency_contact || null,
        emergency_phone: formData.emergency_phone || null,
        patient_status: formData.patient_status || 'active',
        insurance_info: formData.insurance_info || null,
        blood_type: formData.blood_type || null,
        occupation: formData.occupation || null,
        marital_status: formData.marital_status || null
      });

      if (result.error) throw result.error;

      toast({
        title: 'تم بنجاح',
        description: 'تم إضافة المريض بنجاح'
      });

      resetForm();
      setOpen(false);
      onPatientAdded?.();

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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 ml-2" />
          إضافة مريض جديد
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center text-xl">
            <UserPlus className="w-6 h-6 ml-2" />
            إضافة مريض جديد
          </SheetTitle>
          <SheetDescription>
            أدخل بيانات المريض الجديد في النموذج أدناه
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground border-b pb-2">البيانات الأساسية</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">اسم المريض *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  placeholder="الاسم الكامل"
                  required
                  className="h-11"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+201234567890"
                    type="tel"
                    className="h-11"
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
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">تاريخ الميلاد</Label>
                  <Input
                    id="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={(e) => handleChange('date_of_birth', e.target.value)}
                    type="date"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">الجنس</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="اختر الجنس" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">ذكر</SelectItem>
                      <SelectItem value="female">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="national_id">رقم الهوية الوطنية</Label>
                <Input
                  id="national_id"
                  value={formData.national_id}
                  onChange={(e) => handleChange('national_id', e.target.value)}
                  placeholder="رقم الهوية الوطنية"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">العنوان</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="العنوان الكامل..."
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          {/* Personal & Emergency Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground border-b pb-2">المعلومات الشخصية والطوارئ</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="blood_type">فصيلة الدم</Label>
                <Select value={formData.blood_type} onValueChange={(value) => handleChange('blood_type', value)}>
                  <SelectTrigger className="h-11">
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
                  <SelectTrigger className="h-11">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">المهنة</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => handleChange('occupation', e.target.value)}
                placeholder="المهنة أو الوظيفة"
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact">جهة اتصال الطوارئ</Label>
                <Input
                  id="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={(e) => handleChange('emergency_contact', e.target.value)}
                  placeholder="اسم جهة الاتصال"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_phone">رقم هاتف الطوارئ</Label>
                <Input
                  id="emergency_phone"
                  value={formData.emergency_phone}
                  onChange={(e) => handleChange('emergency_phone', e.target.value)}
                  placeholder="+201234567890"
                  type="tel"
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="insurance_info">معلومات التأمين الطبي</Label>
              <Textarea
                id="insurance_info"
                value={formData.insurance_info}
                onChange={(e) => handleChange('insurance_info', e.target.value)}
                placeholder="معلومات التأمين الصحي..."
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient_status">حالة المريض</Label>
              <Select value={formData.patient_status} onValueChange={(value) => handleChange('patient_status', value)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="اختر حالة المريض" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                  <SelectItem value="transferred">محول</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Medical Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground border-b pb-2">المعلومات الطبية</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="medical_history">التاريخ المرضي</Label>
                <Textarea
                  id="medical_history"
                  value={formData.medical_history}
                  onChange={(e) => handleChange('medical_history', e.target.value)}
                  placeholder="التاريخ المرضي والحساسيات والأمراض المزمنة..."
                  rows={3}
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
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading} className="px-8">
              <Save className="w-4 h-4 ml-2" />
              {loading ? 'جاري الحفظ...' : 'حفظ المريض'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddPatientDrawer;