import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useClinicPermissions, ClinicRole, ClinicRoleInfo } from '@/hooks/useClinicPermissions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, Shield, Stethoscope, Calculator, User } from 'lucide-react';

interface AddClinicMemberDialogProps {
  clinicId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddClinicMemberDialog({
  clinicId,
  open,
  onOpenChange,
  onSuccess,
}: AddClinicMemberDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ClinicRole>('assistant');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { getAvailableRoles, getRoleInfo } = useClinicPermissions();

  const getRoleIcon = (role: ClinicRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4" />;
      case 'clinic_manager':
        return <Shield className="h-4 w-4" />;
      case 'dentist':
        return <Stethoscope className="h-4 w-4" />;
      case 'accountant':
        return <Calculator className="h-4 w-4" />;
      case 'assistant':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !role) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      // Check if user exists in profiles by email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .ilike('full_name', `%${email}%`) // This is a workaround since we can't easily search by email
        .limit(1);

      if (profileError || !profileData || profileData.length === 0) {
        toast({
          title: 'المستخدم غير موجود',
          description: 'لا يوجد مستخدم مسجل بهذا البريد الإلكتروني أو الاسم',
          variant: 'destructive',
        });
        return;
      }

      const userData = profileData[0];

      // Check if user is already a member of this clinic
      const { data: existingMember } = await supabase
        .from('clinic_memberships')
        .select('id')
        .eq('user_id', userData.user_id)
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .single();

      if (existingMember) {
        toast({
          title: 'العضو موجود بالفعل',
          description: 'هذا المستخدم عضو في العيادة بالفعل',
          variant: 'destructive',
        });
        return;
      }

      // Special validation for owner role
      if (role === 'owner') {
        const { data: existingOwners } = await supabase
          .from('clinic_memberships')
          .select('id')
          .eq('clinic_id', clinicId)
          .eq('role', 'owner')
          .eq('is_active', true);

        if (existingOwners && existingOwners.length > 0) {
          toast({
            title: 'تحذير',
            description: 'يوجد مالك للعيادة بالفعل. هل تريد إضافة مالك إضافي؟',
            variant: 'destructive',
          });
          // يمكن إضافة تأكيد إضافي هنا
        }
      }

      // Add the user to the clinic
      const { error: memberError } = await supabase
        .from('clinic_memberships')
        .insert({
          user_id: userData.user_id,
          clinic_id: clinicId,
          role: role,
        });

      if (memberError) {
        console.error('Error adding clinic member:', memberError);
        throw memberError;
      }

      toast({
        title: 'تم إضافة العضو بنجاح',
        description: `تم إضافة ${userData.full_name} كـ ${getRoleInfo(role)?.description_ar || role} في العيادة`,
      });
      
      setEmail('');
      setRole('assistant');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error adding clinic member:', error);
      toast({
        title: 'خطأ في إضافة العضو',
        description: 'حدث خطأ أثناء إضافة العضو للعيادة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const availableRoles = getAvailableRoles();
  const selectedRoleInfo = getRoleInfo(role);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة عضو جديد للعيادة</DialogTitle>
          <DialogDescription>
            أدخل البريد الإلكتروني أو اسم المستخدم واختر دوره في العيادة
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني أو الاسم</Label>
            <Input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@clinic.com أو الاسم الكامل"
              required
            />
            <p className="text-xs text-muted-foreground">
              يجب أن يكون المستخدم مسجلاً في النظام مسبقاً
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">الدور في العيادة</Label>
            <Select value={role} onValueChange={(value: ClinicRole) => setRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الدور" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((roleInfo) => (
                  <SelectItem key={roleInfo.role_name} value={roleInfo.role_name}>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(roleInfo.role_name)}
                      <span>{roleInfo.description_ar}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRoleInfo && (
            <Alert>
              <AlertDescription>
                <strong>صلاحيات {selectedRoleInfo.description_ar}:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  {Object.entries(selectedRoleInfo.permissions).map(([key, value]) => {
                    if (value === true || value === 'true') {
                      return (
                        <li key={key}>
                          {key === 'clinic_management' && 'إدارة العيادة'}
                          {key === 'user_management' && 'إدارة المستخدمين'}
                          {key === 'financial_management' && 'الإدارة المالية'}
                          {key === 'medical_management' && 'الإدارة الطبية'}
                          {key === 'patient_management' && 'إدارة المرضى'}
                          {key === 'appointment_management' && 'إدارة المواعيد'}
                          {key === 'treatment_management' && 'إدارة العلاجات'}
                          {key === 'prescription_management' && 'إدارة الوصفات الطبية'}
                          {key === 'invoice_management' && 'إدارة الفواتير'}
                          {key === 'payment_management' && 'إدارة المدفوعات'}
                          {key === 'inventory_management' && 'إدارة المخزون'}
                          {key === 'data_entry' && 'إدخال البيانات'}
                          {key === 'appointment_scheduling' && 'جدولة المواعيد'}
                          {key === 'basic_patient_info' && 'معلومات المرضى الأساسية'}
                          {key === 'reports_access' && 'الوصول للتقارير'}
                          {key === 'settings_management' && 'إدارة الإعدادات'}
                        </li>
                      );
                    }
                    return null;
                  })}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {role === 'owner' && (
            <Alert>
              <Crown className="h-4 w-4" />
              <AlertDescription>
                <strong>تحذير:</strong> مالك العيادة يملك صلاحيات كاملة على جميع جوانب العيادة ويمكنه إدارة جميع الأعضاء الآخرين.
              </AlertDescription>
            </Alert>
          )}

          {role === 'clinic_manager' && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>ملاحظة:</strong> مدير العيادة يملك صلاحيات إدارية واسعة ويمكنه إدارة الأطباء والمحاسبين والمساعدين.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الإضافة...' : 'إضافة العضو'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}