import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users } from 'lucide-react';

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NewRole {
  role_name: string;
  description: string;
  description_ar: string;
  level: number;
  can_manage: ('super_admin' | 'clinic_manager' | 'dentist' | 'assistant' | 'accountant' | 'owner' | 'receptionist' | 'secretary')[];
  permissions: Record<string, Record<string, boolean>>;
}

export const CreateRoleDialog = ({ open, onOpenChange }: CreateRoleDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newRole, setNewRole] = useState<NewRole>({
    role_name: '',
    description: '',
    description_ar: '',
    level: 1,
    can_manage: [],
    permissions: {}
  });

  const createRoleMutation = useMutation({
    mutationFn: async (roleData: NewRole) => {
      const { error } = await supabase
        .from('clinic_role_hierarchy')
        .insert([{
          role_name: roleData.role_name as any,
          description: roleData.description,
          description_ar: roleData.description_ar,
          level: roleData.level,
          can_manage: roleData.can_manage as any,
          permissions: roleData.permissions as any
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'تم إنشاء الدور',
        description: 'تم إنشاء الدور الجديد بنجاح'
      });
      queryClient.invalidateQueries({ queryKey: ['clinic-roles'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'خطأ في إنشاء الدور',
        description: 'فشل في إنشاء الدور الجديد',
        variant: 'destructive'
      });
    }
  });

  const resetForm = () => {
    setNewRole({
      role_name: '',
      description: '',
      description_ar: '',
      level: 1,
      can_manage: [],
      permissions: {}
    });
  };

  const getPermissionCategories = () => {
    return [
      { key: 'patients', name: 'إدارة المرضى' },
      { key: 'appointments', name: 'إدارة المواعيد' },
      { key: 'medical_records', name: 'السجلات الطبية' },
      { key: 'financial', name: 'الإدارة المالية' },
      { key: 'inventory', name: 'إدارة المخزون' },
      { key: 'staff', name: 'إدارة الموظفين' },
      { key: 'reports', name: 'التقارير' },
      { key: 'settings', name: 'الإعدادات' }
    ];
  };

  const getPermissionsByCategory = (category: string) => {
    const permissions: Record<string, string[]> = {
      patients: ['view', 'create', 'edit', 'delete', 'export'],
      appointments: ['view', 'create', 'edit', 'delete', 'manage_schedule'],
      medical_records: ['view', 'create', 'edit', 'delete', 'view_sensitive'],
      financial: ['view', 'create_invoice', 'edit_invoice', 'delete_invoice', 'view_reports', 'manage_payments'],
      inventory: ['view', 'create', 'edit', 'delete', 'manage_orders'],
      staff: ['view', 'create', 'edit', 'delete', 'manage_roles'],
      reports: ['view', 'generate', 'export', 'financial_reports'],
      settings: ['view', 'edit_clinic', 'manage_permissions', 'system_settings']
    };
    
    return permissions[category] || [];
  };

  const handlePermissionChange = (category: string, permission: string, value: boolean) => {
    setNewRole(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [category]: {
          ...prev.permissions[category],
          [permission]: value
        }
      }
    }));
  };

  const handleCreateRole = () => {
    if (!newRole.role_name || !newRole.description_ar) {
      toast({
        title: 'بيانات ناقصة',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    createRoleMutation.mutate(newRole);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            إنشاء دور جديد
          </DialogTitle>
          <DialogDescription>
            قم بإنشاء دور جديد وتحديد صلاحياته في النظام
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* معلومات الدور الأساسية */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات الدور</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role_name">اسم الدور (بالإنجليزية)</Label>
                  <Input
                    id="role_name"
                    value={newRole.role_name}
                    onChange={(e) => setNewRole({ ...newRole, role_name: e.target.value })}
                    placeholder="مثال: custom_manager"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description_ar">اسم الدور (بالعربية)</Label>
                  <Input
                    id="description_ar"
                    value={newRole.description_ar}
                    onChange={(e) => setNewRole({ ...newRole, description_ar: e.target.value })}
                    placeholder="مثال: مدير مخصص"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">وصف الدور</Label>
                <Textarea
                  id="description"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="وصف مفصل لمسؤوليات هذا الدور"
                />
              </div>

              <div>
                <Label htmlFor="level">مستوى الدور</Label>
                <Select value={newRole.level.toString()} onValueChange={(value) => setNewRole({ ...newRole, level: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مستوى الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">مستوى 1 - أساسي</SelectItem>
                    <SelectItem value="2">مستوى 2 - متوسط</SelectItem>
                    <SelectItem value="3">مستوى 3 - متقدم</SelectItem>
                    <SelectItem value="4">مستوى 4 - إداري</SelectItem>
                    <SelectItem value="5">مستوى 5 - إدارة عليا</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* صلاحيات الدور */}
          <Card>
            <CardHeader>
              <CardTitle>صلاحيات الدور</CardTitle>
              <CardDescription>
                حدد الصلاحيات التي سيتمتع بها هذا الدور
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {getPermissionCategories().map((category) => (
                <div key={category.key} className="space-y-3">
                  <h4 className="font-medium text-primary">{category.name}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {getPermissionsByCategory(category.key).map((permission) => (
                      <div key={permission} className="flex items-center space-x-2 space-x-reverse">
                        <Switch
                          id={`${category.key}-${permission}`}
                          checked={newRole.permissions[category.key]?.[permission] || false}
                          onCheckedChange={(value) => handlePermissionChange(category.key, permission, value)}
                        />
                        <Label htmlFor={`${category.key}-${permission}`} className="text-sm">
                          {permission}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleCreateRole} disabled={createRoleMutation.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            {createRoleMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الدور'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};