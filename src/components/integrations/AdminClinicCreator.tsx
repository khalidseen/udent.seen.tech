import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Plus, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CreateClinicFormData {
  name: string;
  license_number: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  subscription_plan: string;
  max_users: number;
  max_patients: number;
}

const AdminClinicCreator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdClinic, setCreatedClinic] = useState<any>(null);
  const [form, setForm] = useState<CreateClinicFormData>({
    name: '',
    license_number: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    subscription_plan: 'basic',
    max_users: 10,
    max_patients: 1000,
  });

  const updateField = (key: keyof CreateClinicFormData, value: string | number) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('اسم العيادة مطلوب');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_clinic_with_owner', {
        clinic_name: form.name,
        license_number: form.license_number || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        city: form.city || null,
        subscription_plan_name: form.subscription_plan,
        max_users: form.max_users,
        max_patients: form.max_patients,
      });

      if (error) throw error;

      setCreatedClinic(data);
      setSuccess(true);
      toast.success('تم إنشاء العيادة بنجاح! 🎉');
    } catch (err: any) {
      console.error('Error creating clinic:', err);
      toast.error(err.message || 'فشل في إنشاء العيادة');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({
      name: '', license_number: '', phone: '', email: '',
      address: '', city: '', subscription_plan: 'basic',
      max_users: 10, max_patients: 1000,
    });
    setSuccess(false);
    setCreatedClinic(null);
  };

  if (success && createdClinic) {
    return (
      <Card>
        <CardContent className="p-12 text-center space-y-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold">تم إنشاء العيادة بنجاح!</h2>
            <p className="text-muted-foreground mt-2">
              العيادة <strong>{createdClinic.clinic_name}</strong> جاهزة للاستخدام
            </p>
          </div>
          <div className="bg-muted p-4 rounded-lg text-sm text-right space-y-2">
            <p><strong>معرف العيادة:</strong> <code className="text-xs">{createdClinic.clinic_id}</code></p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleReset} variant="outline">
              إنشاء عيادة أخرى
            </Button>
            <Button onClick={() => window.location.reload()}>
              الانتقال للعيادة
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إنشاء عيادة جديدة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم العيادة *</Label>
              <Input
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="مثال: عيادة الابتسامة"
              />
            </div>
            <div className="space-y-2">
              <Label>رقم الترخيص</Label>
              <Input
                value={form.license_number}
                onChange={(e) => updateField('license_number', e.target.value)}
                placeholder="LIC-001"
              />
            </div>
            <div className="space-y-2">
              <Label>الهاتف</Label>
              <Input
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+964XXXXXXXXX"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="clinic@example.com"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Input
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="شارع المتنبي"
              />
            </div>
            <div className="space-y-2">
              <Label>المدينة</Label>
              <Input
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="بغداد"
              />
            </div>
          </div>

          {/* Subscription */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>خطة الاشتراك</Label>
              <Select value={form.subscription_plan} onValueChange={(v) => updateField('subscription_plan', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">أساسي (مجاني)</SelectItem>
                  <SelectItem value="Professional">احترافي</SelectItem>
                  <SelectItem value="Enterprise">مؤسسي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الحد الأقصى للمستخدمين</Label>
              <Input
                type="number"
                value={form.max_users}
                onChange={(e) => updateField('max_users', parseInt(e.target.value) || 10)}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>الحد الأقصى للمرضى</Label>
              <Input
                type="number"
                value={form.max_patients}
                onChange={(e) => updateField('max_patients', parseInt(e.target.value) || 1000)}
                min={100}
              />
            </div>
          </div>

          <Button onClick={handleCreate} disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جارٍ الإنشاء...
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4 ml-2" />
                إنشاء العيادة
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminClinicCreator;
