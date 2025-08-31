import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useRoles } from '@/hooks/useRoles';

interface Permission {
  permission_key: string;
  permission_name: string;
  permission_name_ar: string;
  category: string;
}

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: Permission[];
  onSuccess: () => void;
}

export const CreateRoleDialog = ({ open, onOpenChange, permissions, onSuccess }: CreateRoleDialogProps) => {
  const { toast } = useToast();
  const { createRole } = useRoles();
  const [loading, setLoading] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    role_name: '',
    role_name_ar: '',
    description: ''
  });

  const categoryNames = {
    'main_menu': 'القائمة الرئيسية',
    'ai_features': 'الذكاء الاصطناعي',
    'staff_management': 'إدارة الموظفين',
    'financial_management': 'الإدارة المالية',
    'inventory_management': 'إدارة المخزون',
    'system_management': 'إدارة النظام',
    'advanced_features': 'الميزات المتقدمة'
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = permission.category || 'أخرى';
    const categoryDisplayName = categoryNames[category as keyof typeof categoryNames] || category;
    if (!acc[categoryDisplayName]) {
      acc[categoryDisplayName] = [];
    }
    acc[categoryDisplayName].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.role_name.trim() || !formData.role_name_ar.trim()) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى إدخال اسم الدور باللغتين العربية والإنجليزية',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const success = await createRole({
        role_name: formData.role_name.trim().toLowerCase().replace(/\s+/g, '_'),
        role_name_ar: formData.role_name_ar.trim(),
        description: formData.description.trim(),
        is_active: true,
        is_system_role: false
      });

      if (success) {
        toast({
          title: 'تم إنشاء الدور',
          description: 'تم إنشاء الدور الجديد بنجاح',
        });

        // Reset form
        setFormData({
          role_name: '',
          role_name_ar: '',
          description: ''
        });
        setSelectedPermissions([]);
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error creating role:', error);
      toast({
        title: 'خطأ في الإنشاء',
        description: 'حدث خطأ أثناء إنشاء الدور الجديد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionKey: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionKey)
        ? prev.filter(p => p !== permissionKey)
        : [...prev, permissionKey]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle>إنشاء دور جديد</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role_name">اسم الدور (إنجليزي)</Label>
              <Input
                id="role_name"
                placeholder="مثل: clinic_manager"
                value={formData.role_name}
                onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role_name_ar">اسم الدور (عربي)</Label>
              <Input
                id="role_name_ar"
                placeholder="مثل: مدير العيادة"
                value={formData.role_name_ar}
                onChange={(e) => setFormData({ ...formData, role_name_ar: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              placeholder="وصف الدور والمسؤوليات..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label>الصلاحيات</Label>
            <ScrollArea className="h-48 border rounded-md p-3">
              <div className="space-y-4">
                {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{category}</Badge>
                      <span className="text-xs text-muted-foreground">
                        ({categoryPermissions.length} صلاحية)
                      </span>
                    </div>
                    <div className="grid gap-2 pr-4">
                      {categoryPermissions.map((permission) => (
                        <div key={permission.permission_key} className="flex items-center space-x-2 space-x-reverse">
                          <Checkbox
                            id={permission.permission_key}
                            checked={selectedPermissions.includes(permission.permission_key)}
                            onCheckedChange={() => handlePermissionToggle(permission.permission_key)}
                          />
                          <div className="flex-1">
                            <label htmlFor={permission.permission_key} className="text-sm font-medium cursor-pointer">
                              {permission.permission_name_ar}
                            </label>
                            <p className="text-xs text-muted-foreground">{permission.permission_key}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <p className="text-xs text-muted-foreground">
              تم تحديد {selectedPermissions.length} من {permissions.length} صلاحية
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'جاري الإنشاء...' : 'إنشاء الدور'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};