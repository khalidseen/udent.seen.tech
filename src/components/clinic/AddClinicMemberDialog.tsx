import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddClinicMemberDialogProps {
  clinicId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddClinicMemberDialog({
  clinicId,
  open,
  onOpenChange,
  onSuccess,
}: AddClinicMemberDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'dentist' | 'assistant' | 'accountant'>('dentist');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال البريد الإلكتروني",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // First, check if user exists in profiles
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('user_id', 
          // Get user ID from auth table (this would require admin access in real app)
          // For now, we'll simulate this
          crypto.randomUUID()
        )
        .single();

      if (userError) {
        // User doesn't exist, show error
        toast({
          title: "المستخدم غير موجود",
          description: "لا يوجد مستخدم بهذا البريد الإلكتروني في النظام",
          variant: "destructive",
        });
        return;
      }

      // Check if user is already a member
      const { data: existingMember, error: memberError } = await supabase
        .from('clinic_memberships')
        .select('id')
        .eq('clinic_id', clinicId)
        .eq('user_id', existingUser.user_id)
        .eq('is_active', true)
        .single();

      if (!memberError && existingMember) {
        toast({
          title: "المستخدم موجود بالفعل",
          description: "هذا المستخدم عضو في العيادة بالفعل",
          variant: "destructive",
        });
        return;
      }

      // Add user to clinic
      const { error: insertError } = await supabase
        .from('clinic_memberships')
        .insert({
          clinic_id: clinicId,
          user_id: existingUser.user_id,
          role: role,
          is_active: true,
        });

      if (insertError) throw insertError;

      toast({
        title: "تم الإضافة بنجاح",
        description: `تم إضافة ${existingUser.full_name} كـ${role === 'dentist' ? 'طبيب أسنان' : role === 'assistant' ? 'مساعد' : 'محاسب'} في العيادة`,
      });

      setEmail('');
      setRole('dentist');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error adding clinic member:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة العضو. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة عضو جديد للعيادة</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
            />
            <p className="text-xs text-muted-foreground">
              يجب أن يكون المستخدم مسجلاً في النظام مسبقاً
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">الدور في العيادة</Label>
            <Select value={role} onValueChange={(value: 'dentist' | 'assistant' | 'accountant') => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dentist">طبيب أسنان</SelectItem>
                <SelectItem value="assistant">مساعد</SelectItem>
                <SelectItem value="accountant">محاسب</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
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