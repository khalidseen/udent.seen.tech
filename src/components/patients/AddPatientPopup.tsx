import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { offlineSupabase } from "@/lib/offline-supabase";
import { toast } from "sonner";
import { UserPlus, Save, X } from "lucide-react";

interface AddPatientPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatientAdded?: () => void;
}

const AddPatientPopup = ({ open, onOpenChange, onPatientAdded }: AddPatientPopupProps) => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim()) {
      toast.error('اسم المريض مطلوب');
      return;
    }

    if (!formData.phone.trim()) {
      toast.error('رقم الهاتف مطلوب');
      return;
    }

    setLoading(true);

    try {
      await offlineSupabase.addPatient(formData);
      toast.success('تم إضافة المريض بنجاح');

      resetForm();
      onOpenChange(false);
      onPatientAdded?.();

    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none p-0 m-0 rounded-none overflow-hidden">
        {/* Custom Header with Close Button */}
        <div className="sticky top-0 z-50 bg-background border-b border-border p-6 flex items-center justify-between">
          <DialogHeader className="flex-1">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <UserPlus className="w-6 h-6 text-primary" />
              إضافة مريض جديد
            </DialogTitle>
          </DialogHeader>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-10 w-10 hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* الجسم القابل للتمرير */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
            {/* الصف الأول: الاسم، الهاتف، البريد الإلكتروني */}
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
                <Label htmlFor="phone">رقم الهاتف *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="05xxxxxxxx"
                  required
                  className="h-12"
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
                  className="h-12"
                />
              </div>
            </div>

            {/* الصف الثاني: تاريخ الميلاد، الجنس، المهنة */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">تاريخ الميلاد</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>الجنس</Label>
                <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
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
                <Label htmlFor="occupation">المهنة</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => handleChange('occupation', e.target.value)}
                  placeholder="مثال: مهندس، طبيب، طالب"
                  className="h-12"
                />
              </div>
            </div>

            {/* الصف الثالث: فصيلة الدم، الحالة الاجتماعية، معلومات التأمين */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>فصيلة الدم</Label>
                <Select value={formData.blood_type} onValueChange={(value) => handleChange('blood_type', value)}>
                  <SelectTrigger className="h-12">
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
                <Label>الحالة الاجتماعية</Label>
                <Select value={formData.marital_status} onValueChange={(value) => handleChange('marital_status', value)}>
                  <SelectTrigger className="h-12">
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
                <Label htmlFor="insurance_info">معلومات التأمين</Label>
                <Input
                  id="insurance_info"
                  value={formData.insurance_info}
                  onChange={(e) => handleChange('insurance_info', e.target.value)}
                  placeholder="شركة التأمين أو رقم البوليصة"
                  className="h-12"
                />
              </div>
            </div>

            {/* العنوان */}
            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="العنوان الكامل"
                rows={3}
                className="resize-none"
              />
            </div>

            {/* جهة الاتصال في حالة الطوارئ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact">جهة الاتصال في حالة الطوارئ</Label>
                <Input
                  id="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={(e) => handleChange('emergency_contact', e.target.value)}
                  placeholder="اسم الشخص"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_phone">رقم هاتف الطوارئ</Label>
                <Input
                  id="emergency_phone"
                  value={formData.emergency_phone}
                  onChange={(e) => handleChange('emergency_phone', e.target.value)}
                  placeholder="05xxxxxxxx"
                  className="h-12"
                />
              </div>
            </div>

            {/* التاريخ المرضي */}
            <div className="space-y-2">
              <Label htmlFor="medical_history">التاريخ المرضي</Label>
              <Textarea
                id="medical_history"
                value={formData.medical_history}
                onChange={(e) => handleChange('medical_history', e.target.value)}
                placeholder="الأمراض المزمنة، العمليات السابقة، الحساسية، الأدوية الحالية"
                rows={4}
                className="resize-none"
              />
            </div>

            {/* ملاحظات إضافية */}
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات إضافية</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="أي ملاحظات أخرى تخص المريض"
                rows={3}
                className="resize-none"
              />
            </div>
          </form>
        </div>

        {/* الأزرار السفلية الثابتة */}
        <div className="sticky bottom-0 bg-background border-t border-border p-6">
          <div className="max-w-4xl mx-auto flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="px-8 h-12"
            >
              إلغاء
            </Button>
            <Button
              type="button"
              className="px-8 h-12"
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

export default AddPatientPopup;
