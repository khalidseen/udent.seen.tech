import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Users, Shield, Clock, Plus, Edit, Eye, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ClinicRole {
  role_name: string;
  level: number;
  can_manage: string[];
  permissions: Record<string, Record<string, boolean>>;
  description: string;
  description_ar: string;
}

interface User {
  id: string;
  full_name?: string;
  email?: string;
  user_id: string;
  clinic_id?: string;
  created_at: string;
  current_clinic_role?: string;
}

export const AdvancedPermissionsManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPermission, setSelectedPermission] = useState<string>('');
  const [permissionDuration, setPermissionDuration] = useState<string>('');
  const [permissionReason, setPermissionReason] = useState<string>('');
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<ClinicRole | null>(null);

  // الحصول على الأدوار والتسلسل الهرمي
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['clinic-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinic_role_hierarchy')
        .select('*')
        .order('level');
      
      if (error) throw error;
      return data as ClinicRole[];
    }
  });

  // الحصول على المستخدمين
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['clinic-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      return data as User[];
    }
  });

  // تحديث صلاحيات الدور
  const updateRolePermissionsMutation = useMutation({
    mutationFn: async ({ roleName, permissions }: { roleName: any; permissions: Record<string, Record<string, boolean>> }) => {
      const { error } = await supabase
        .from('clinic_role_hierarchy')
        .update({ permissions })
        .eq('role_name', roleName);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'تم تحديث صلاحيات الدور',
        description: 'تم تحديث صلاحيات الدور بنجاح'
      });
      queryClient.invalidateQueries({ queryKey: ['clinic-roles'] });
      setEditingRole(null);
    }
  });

  const handleRolePermissionChange = (category: string, permission: string, value: boolean) => {
    if (!editingRole) return;
    
    const updatedPermissions = {
      ...editingRole.permissions,
      [category]: {
        ...editingRole.permissions[category],
        [permission]: value
      }
    };
    
    setEditingRole({
      ...editingRole,
      permissions: updatedPermissions
    });
  };

  const saveRolePermissions = () => {
    if (!editingRole) return;
    
    updateRolePermissionsMutation.mutate({
      roleName: editingRole.role_name as any,
      permissions: editingRole.permissions
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

  const getRoleBadgeColor = (roleName: string) => {
    const colors: Record<string, string> = {
      owner: 'bg-red-500 text-white',
      clinic_manager: 'bg-orange-500 text-white',
      dentist: 'bg-blue-500 text-white',
      accountant: 'bg-green-500 text-white',
      assistant: 'bg-purple-500 text-white',
      receptionist: 'bg-teal-500 text-white',
      secretary: 'bg-gray-500 text-white'
    };
    return colors[roleName] || 'bg-gray-400 text-white';
  };

  if (rolesLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جاري تحميل بيانات الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة الصلاحيات المتقدمة</h2>
          <p className="text-muted-foreground">إدارة شاملة لصلاحيات المستخدمين والأدوار</p>
        </div>
      </div>

      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            الأدوار
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            الصلاحيات
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            سجل المراجعة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-4">
            {roles.map((role) => (
              <Card key={role.role_name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Badge className={getRoleBadgeColor(role.role_name)}>
                        {role.description_ar}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        المستوى {role.level}
                      </span>
                    </CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingRole(role)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    تعديل الصلاحيات
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    يمكنه إدارة: {role.can_manage.length > 0 ? role.can_manage.join(', ') : 'لا يوجد'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          {editingRole && (
            <Card>
              <CardHeader>
                <CardTitle>تعديل صلاحيات دور: {editingRole.description_ar}</CardTitle>
                <CardDescription>
                  يمكنك تعديل الصلاحيات المختلفة لهذا الدور
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {getPermissionCategories().map((category) => (
                  <div key={category.key} className="space-y-3">
                    <h4 className="font-medium">{category.name}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {getPermissionsByCategory(category.key).map((permission) => (
                        <div key={permission} className="flex items-center space-x-2 space-x-reverse">
                          <Switch
                            id={`${category.key}-${permission}`}
                            checked={editingRole.permissions[category.key]?.[permission] || false}
                            onCheckedChange={(value) => 
                              handleRolePermissionChange(category.key, permission, value)
                            }
                          />
                          <Label htmlFor={`${category.key}-${permission}`} className="text-sm">
                            {permission}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingRole(null)}>
                    إلغاء
                  </Button>
                  <Button onClick={saveRolePermissions}>
                    حفظ التغييرات
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>سجل مراجعة الصلاحيات</CardTitle>
              <CardDescription>
                سيتم تطوير هذه الميزة في النسخة القادمة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">قريباً: سجل تفصيلي لجميع تغييرات الصلاحيات</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};