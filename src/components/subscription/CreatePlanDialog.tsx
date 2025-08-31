import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';

interface CreatePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreatePlanDialog = ({ open, onOpenChange }: CreatePlanDialogProps) => {
  const { createPlan } = useSubscriptionPlans();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    description: '',
    description_ar: '',
    price: 0,
    currency: 'SAR',
    duration_months: 1,
    max_users: 5,
    max_patients: 500,
    max_monthly_appointments: 1000,
    max_storage_gb: 10,
    is_active: true,
    is_customizable: false,
    is_trial: false,
    trial_duration_days: 30,
    display_order: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.name_ar) return;

    try {
      setLoading(true);
      await createPlan(formData);
      onOpenChange(false);
      setFormData({
        name: '',
        name_ar: '',
        description: '',
        description_ar: '',
        price: 0,
        currency: 'SAR',
        duration_months: 1,
        max_users: 5,
        max_patients: 500,
        max_monthly_appointments: 1000,
        max_storage_gb: 10,
        is_active: true,
        is_customizable: false,
        is_trial: false,
        trial_duration_days: 30,
        display_order: 0
      });
    } catch (error) {
      console.error('Error creating plan:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء خطة اشتراك جديدة</DialogTitle>
          <DialogDescription>
            إنشاء خطة اشتراك جديدة مع تحديد الحدود والميزات
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم الخطة (إنجليزي)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Basic Plan"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_ar">اسم الخطة (عربي)</Label>
              <Input
                id="name_ar"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                placeholder="الخطة الأساسية"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">الوصف (إنجليزي)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Plan description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description_ar">الوصف (عربي)</Label>
              <Textarea
                id="description_ar"
                value={formData.description_ar}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                placeholder="وصف الخطة"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">السعر</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">العملة</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                  <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                  <SelectItem value="EUR">يورو (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">المدة (شهر)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={formData.duration_months}
                onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_users">الحد الأقصى للمستخدمين</Label>
              <Input
                id="max_users"
                type="number"
                min="1"
                value={formData.max_users}
                onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_patients">الحد الأقصى للمرضى</Label>
              <Input
                id="max_patients"
                type="number"
                min="1"
                value={formData.max_patients}
                onChange={(e) => setFormData({ ...formData, max_patients: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_appointments">الحد الأقصى للمواعيد الشهرية</Label>
              <Input
                id="max_appointments"
                type="number"
                min="1"
                value={formData.max_monthly_appointments}
                onChange={(e) => setFormData({ ...formData, max_monthly_appointments: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_storage">مساحة التخزين (GB)</Label>
              <Input
                id="max_storage"
                type="number"
                min="1"
                value={formData.max_storage_gb}
                onChange={(e) => setFormData({ ...formData, max_storage_gb: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">الخطة نشطة</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_customizable">قابلة للتخصيص</Label>
              <Switch
                id="is_customizable"
                checked={formData.is_customizable}
                onCheckedChange={(checked) => setFormData({ ...formData, is_customizable: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_trial">خطة تجريبية</Label>
              <Switch
                id="is_trial"
                checked={formData.is_trial}
                onCheckedChange={(checked) => setFormData({ ...formData, is_trial: checked })}
              />
            </div>

            {formData.is_trial && (
              <div className="space-y-2">
                <Label htmlFor="trial_duration">مدة التجريب (يوم)</Label>
                <Input
                  id="trial_duration"
                  type="number"
                  min="1"
                  value={formData.trial_duration_days}
                  onChange={(e) => setFormData({ ...formData, trial_duration_days: parseInt(e.target.value) || 30 })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="display_order">ترتيب العرض</Label>
              <Input
                id="display_order"
                type="number"
                min="0"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الإنشاء...' : 'إنشاء الخطة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};