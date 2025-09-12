import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateClinicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateClinicDialog({ open, onOpenChange, onSuccess }: CreateClinicDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    license_number: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    subscription_plan: 'basic',
    max_users: '10',
    max_patients: '1000'
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "خطأ في التحقق",
        description: "اسم العيادة مطلوب",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // استخدام الدالة المحسنة لإنشاء العيادة
      const { data, error } = await supabase.rpc('create_clinic_with_owner', {
        clinic_name: formData.name.trim(),
        license_number: formData.license_number.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        subscription_plan_name: formData.subscription_plan,
        max_users: parseInt(formData.max_users),
        max_patients: parseInt(formData.max_patients)
      });

      if (error) {
        console.error('Clinic creation error:', error);
        throw new Error(error.message || 'فشل في إنشاء العيادة');
      }

      console.log('Created clinic successfully:', data);

      toast({
        title: "تم الإنشاء بنجاح",
        description: `تم إنشاء عيادة "${formData.name}" وإضافتك كمالك لها`,
      });

      // إعادة تعيين النموذج
      setFormData({
        name: '',
        license_number: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        subscription_plan: 'basic',
        max_users: '10',
        max_patients: '1000'
      });

      onOpenChange(false);
      onSuccess();
      
      // إعادة تحميل الصفحة لتحديث السياق
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error: any) {
      console.error('Error creating clinic:', error);
      toast({
        title: "خطأ في إنشاء العيادة",
        description: error.message || "حدث خطأ أثناء إنشاء العيادة الجديدة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إنشاء عيادة جديدة</DialogTitle>
          <DialogDescription>
            أدخل بيانات العيادة الجديدة في الحقول أدناه
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">اسم العيادة *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="عيادة الدكتور أحمد"
                required
              />
            </div>

            <div>
              <Label htmlFor="license_number">رقم الترخيص</Label>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                placeholder="LIC-2024-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">الهاتف</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+966123456789"
              />
            </div>

            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="info@clinic.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">المدينة</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="الرياض"
              />
            </div>

            <div>
              <Label htmlFor="subscription_plan">خطة الاشتراك</Label>
              <Select
                value={formData.subscription_plan}
                onValueChange={(value) => setFormData(prev => ({ ...prev, subscription_plan: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">أساسي</SelectItem>
                  <SelectItem value="professional">احترافي</SelectItem>
                  <SelectItem value="premium">مميز</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="address">العنوان</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="الشارع، الحي، المدينة"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max_users">الحد الأقصى للمستخدمين</Label>
              <Input
                id="max_users"
                type="number"
                min="1"
                value={formData.max_users}
                onChange={(e) => setFormData(prev => ({ ...prev, max_users: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="max_patients">الحد الأقصى للمرضى</Label>
              <Input
                id="max_patients"
                type="number"
                min="1"
                value={formData.max_patients}
                onChange={(e) => setFormData(prev => ({ ...prev, max_patients: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إنشاء العيادة
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}