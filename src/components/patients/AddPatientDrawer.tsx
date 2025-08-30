import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { offlineSupabase } from "@/lib/offline-supabase";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Save, Plus, Search, User, X } from "lucide-react";

interface AddPatientDrawerProps {
  onPatientAdded?: () => void;
}

const AddPatientDrawer = ({ onPatientAdded }: AddPatientDrawerProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [existingPatients, setExistingPatients] = useState<any[]>([]);
  const [showExistingPatients, setShowExistingPatients] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: '',
    address: '',
    medical_history: '',
    notes: '',
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
      emergency_contact: '',
      emergency_phone: '',
      patient_status: 'active',
      insurance_info: '',
      blood_type: '',
      occupation: '',
      marital_status: ''
    });
    setSearchQuery('');
    setShowExistingPatients(false);
  };

  const searchExistingPatients = async (query: string) => {
    if (!query.trim()) {
      setExistingPatients([]);
      setShowExistingPatients(false);
      return;
    }

    try {
      const { data: { user } } = await offlineSupabase.auth.getUser();
      if (!user) return;

      const profileResult = await offlineSupabase.select('profiles', { 
        filter: { user_id: user.id } 
      });

      if (!profileResult.data || profileResult.data.length === 0) return;

      const patients = await offlineSupabase.select('patients', {
        filter: { clinic_id: profileResult.data[0].id }
      });

      if (patients.data) {
        const filtered = patients.data.filter((patient: any) => 
          patient.full_name.toLowerCase().includes(query.toLowerCase())
        );
        setExistingPatients(filtered);
        setShowExistingPatients(true);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
    }
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          إضافة مريض جديد
        </Button>
      </DialogTrigger>
      <DialogContent className="w-screen h-screen max-w-none max-h-none p-0 m-0 rounded-none overflow-hidden">
        {/* Custom Header with Close Button */}
        <div className="sticky top-0 z-50 bg-background border-b border-border p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">إضافة مريض جديد</h2>
              <p className="text-sm text-muted-foreground">أدخل بيانات المريض الجديد في النموذج أدناه</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setOpen(false)}
            className="h-10 w-10 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 dark:hover:border-red-700 dark:hover:text-red-300"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="h-[calc(100vh-160px)] overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Search Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">البحث عن المرضى الموجودين</h3>
              
              <div className="space-y-2">
                <Label htmlFor="search">البحث بالاسم</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
                  <Input
                    id="search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchExistingPatients(e.target.value);
                    }}
                    placeholder="ابحث عن مريض موجود..."
                    className="h-11 pr-10"
                  />
                </div>
                
                {showExistingPatients && existingPatients.length > 0 && (
                  <div className="border border-border rounded-md max-h-40 overflow-y-auto bg-background z-10">
                    {existingPatients.map((patient: any) => (
                      <div key={patient.id} className="p-3 border-b last:border-b-0 hover:bg-accent/50 cursor-pointer flex items-center gap-3">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{patient.full_name}</div>
                          <div className="text-sm text-muted-foreground">{patient.phone} • {patient.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {showExistingPatients && existingPatients.length === 0 && searchQuery.trim() && (
                  <div className="text-sm text-muted-foreground p-2 border border-border rounded-md bg-background">
                    لا توجد نتائج مطابقة للبحث
                  </div>
                )}
              </div>
            </div>

            {/* Basic Info Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">البيانات الأساسية</h3>
              
              {/* السطر الأول: اسم المريض، رقم الهاتف، البريد الإلكتروني */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              {/* السطر الثاني: تاريخ الميلاد، الجنس */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <SelectContent className="bg-background border border-border z-50">
                      <SelectItem value="male">ذكر</SelectItem>
                      <SelectItem value="female">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* السطر الثالث: فصيلة الدم، الحالة الاجتماعية، المهنة */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="blood_type">فصيلة الدم</Label>
                  <Select value={formData.blood_type} onValueChange={(value) => handleChange('blood_type', value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="اختر فصيلة الدم" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
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
                    <SelectContent className="bg-background border border-border z-50">
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
                    placeholder="المهنة أو الوظيفة"
                    className="h-11"
                  />
                </div>
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

            {/* Personal & Emergency Info Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">معلومات الطوارئ والتأمين</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <SelectContent className="bg-background border border-border z-50">
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
          </form>
        </div>

        {/* Fixed Action Buttons */}
        <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border p-4">
          <div className="flex gap-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={loading}
              onClick={handleSubmit}
            >
              <Save className="w-4 h-4 ml-2" />
              {loading ? 'جاري الحفظ...' : 'حفظ المريض'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPatientDrawer;