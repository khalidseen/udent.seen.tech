import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ViewUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
}

export const ViewUserDialog = ({ open, onOpenChange, user }: ViewUserDialogProps) => {
  if (!user) return null;

  const getRoleNameAr = (role: string) => {
    const roleNames: Record<string, string> = {
      'super_admin': 'مدير النظام',
      'clinic_owner': 'مالك العيادة',
      'doctor': 'طبيب',
      'receptionist': 'موظف استقبال',
      'financial_manager': 'مدير مالي',
      'medical_assistant': 'مساعد طبي',
      'secretary': 'سكرتير'
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'super_admin': 'bg-red-100 text-red-800',
      'clinic_owner': 'bg-purple-100 text-purple-800',
      'doctor': 'bg-green-100 text-green-800',
      'receptionist': 'bg-blue-100 text-blue-800',
      'financial_manager': 'bg-yellow-100 text-yellow-800',
      'medical_assistant': 'bg-cyan-100 text-cyan-800',
      'secretary': 'bg-pink-100 text-pink-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>عرض ملف المستخدم</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {user.full_name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-medium">{user.full_name}</h3>
              <p className="text-sm text-muted-foreground">
                معرف المستخدم: {user.user_id.slice(0, 8)}...
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">الدور:</span>
              <Badge className={getRoleColor(user.role)}>
                {getRoleNameAr(user.role)}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">الحالة:</span>
              <Badge variant={user.status === 'approved' ? 'default' : 'secondary'}>
                {user.status === 'approved' ? 'نشط' : 'معلق'}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">تاريخ الانضمام:</span>
              <span className="text-sm">
                {format(new Date(user.created_at), 'dd MMMM yyyy', { locale: ar })}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">آخر تحديث:</span>
              <span className="text-sm">
                {format(new Date(user.updated_at), 'dd MMMM yyyy', { locale: ar })}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};