import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User, Mail, Phone, Key, UserCheck, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface RoleInfo {
  role_name: string;
  role_name_ar: string;
  description: string;
  permissions: string[];
}

const roles: RoleInfo[] = [
  {
    role_name: 'super_admin',
    role_name_ar: 'مدير النظام',
    description: 'صلاحيات كاملة على النظام',
    permissions: ['كافة الصلاحيات']
  },
  {
    role_name: 'clinic_owner',
    role_name_ar: 'مالك العيادة',
    description: 'إدارة كاملة للعيادة عدا إدارة النظام',
    permissions: ['إدارة المرضى', 'إدارة المواعيد', 'الإدارة المالية', 'إدارة المخزون', 'إدارة الموظفين']
  },
  {
    role_name: 'doctor',
    role_name_ar: 'طبيب',
    description: 'صلاحيات طبية ومرضى ومواعيد',
    permissions: ['المرضى', 'المواعيد', 'السجلات الطبية', 'الوصفات الطبية', 'التشخيص الذكي']
  },
  {
    role_name: 'receptionist',
    role_name_ar: 'موظف استقبال',
    description: 'مواعيد ومرضى (عرض فقط)',
    permissions: ['عرض المرضى', 'إدارة المواعيد', 'طلبات المواعيد', 'الإشعارات']
  },
  {
    role_name: 'financial_manager',
    role_name_ar: 'مدير مالي',
    description: 'الإدارة المالية والتقارير',
    permissions: ['الفواتير', 'المدفوعات', 'التقارير المالية', 'عرض المرضى']
  }
];

export function AddUserDialog({ open, onOpenChange, onSuccess }: AddUserDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear success message when user starts typing
    if (successMessage) setSuccessMessage('');
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.fullName || !selectedRole) {
      toast({
        title: 'بيانات ناقصة',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return false;
    }

    if (formData.password.length < 8) {
      toast({
        title: 'كلمة مرور ضعيفة',
        description: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل',
        variant: 'destructive'
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'إيميل غير صحيح',
        description: 'يرجى إدخال عنوان إيميل صالح',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setSuccessMessage('');
      console.log('Submitting user creation form...');

      // استخدام Edge Function لإنشاء المستخدم
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: selectedRole,
          phone: formData.phone || '',
          notes: formData.notes || ''
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'خطأ في استدعاء الدالة');
      }

      // التحقق من نجاح العملية
      if (!data?.success) {
        const errorMsg = data?.error || 'فشل في إنشاء المستخدم';
        console.error('Creation failed:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('User created successfully:', data.user);
      
      setSuccessMessage(`تم إنشاء المستخدم بنجاح! الاسم: ${formData.fullName}, الدور: ${roles.find(r => r.role_name === selectedRole)?.role_name_ar}`);

      toast({
        title: 'تم إنشاء المستخدم بنجاح!',
        description: `تم إنشاء حساب ${formData.fullName} بصلاحية ${roles.find(r => r.role_name === selectedRole)?.role_name_ar}`,
      });

      // إعادة تعيين النموذج
      setFormData({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        notes: ''
      });
      setSelectedRole('');
      
      // إعادة تحميل قائمة المستخدمين مع تأخير للتأكد من حفظ البيانات
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
      
      // إغلاق الحوار بعد فترة قصيرة لإظهار رسالة النجاح
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMessage('');
      }, 3000);

    } catch (error: any) {
      console.error('Error in user creation:', error);
      let errorMessage = 'حدث خطأ أثناء إنشاء المستخدم';
      
      if (error.message) {
        if (error.message.includes('already registered') || error.message.includes('email_exists') || error.message.includes('User already registered')) {
          errorMessage = 'هذا البريد الإلكتروني مسجل مسبقاً';
        } else if (error.message.includes('email')) {
          errorMessage = 'خطأ في البريد الإلكتروني';
        } else if (error.message.includes('password')) {
          errorMessage = 'كلمة المرور غير قوية بما فيه الكفاية';
        } else if (error.message.includes('Network') || error.message.includes('network')) {
          errorMessage = 'خطأ في الاتصال بالخادم - يرجى المحاولة مرة أخرى';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'خطأ في إنشاء المستخدم',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedRoleInfo = roles.find(r => r.role_name === selectedRole);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            إضافة مستخدم جديد
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* رسالة النجاح */}
          {successMessage && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* معلومات المستخدم الأساسية */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-4 h-4" />
                المعلومات الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">الاسم الكامل *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="أدخل الاسم الكامل"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="user@example.com"
                      className="pl-9"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور *</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="text"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="أدخل كلمة المرور"
                        className="pl-9"
                        disabled={loading}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateRandomPassword}
                      className="whitespace-nowrap"
                      disabled={loading}
                    >
                      إنشاء عشوائي
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    يجب أن تكون 8 أحرف على الأقل
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="05xxxxxxxx"
                      className="pl-9"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="ملاحظات إضافية عن المستخدم..."
                  rows={3}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          {/* اختيار الدور والصلاحيات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                الدور والصلاحيات
              </CardTitle>
              <CardDescription>
                اختر دور المستخدم لتحديد صلاحياته في النظام
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">الدور *</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر دور المستخدم" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.role_name} value={role.role_name}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{role.role_name_ar}</span>
                          <span className="text-xs text-muted-foreground">
                            ({role.role_name})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRoleInfo && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm">{selectedRoleInfo.role_name_ar}</h4>
                        <p className="text-xs text-muted-foreground">
                          {selectedRoleInfo.description}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs font-medium mb-2">الصلاحيات المتاحة:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedRoleInfo.permissions.map((permission, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* تنبيه أمني */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              سيتم إنشاء حساب جديد وإرسال إيميل تأكيد للمستخدم. تأكد من صحة البريد الإلكتروني المُدخل.
            </AlertDescription>
          </Alert>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSuccessMessage('');
            }}
            disabled={loading}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedRole || !formData.email || !formData.password || !formData.fullName}
          >
            {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
            {loading ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}