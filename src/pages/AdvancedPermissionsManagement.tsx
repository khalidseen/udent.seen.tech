import React, { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Lock, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface RoleHierarchy {
  id: string;
  role_name: string;
  level: number;
  description_ar: string | null;
  permissions: any;
}

interface PermissionItem {
  id: string;
  permission_key: string;
  permission_name: string;
  permission_name_ar: string;
  category: string;
  is_active: boolean;
}

interface RolePermission {
  role_id: string;
  permission_id: string;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'مدير النظام',
  owner: 'مالك العيادة',
  admin: 'مدير',
  manager: 'مدير عام',
  doctor: 'طبيب',
  assistant: 'مساعد طبيب',
  secretary: 'سكرتير',
  accountant: 'محاسب',
  receptionist: 'موظف استقبال',
  user: 'مستخدم',
};

const CATEGORY_LABELS: Record<string, string> = {
  patients: 'المرضى',
  appointments: 'المواعيد',
  treatments: 'العلاجات',
  financial: 'المالية',
  inventory: 'المخزون',
  reports: 'التقارير',
  settings: 'الإعدادات',
  users: 'المستخدمين',
  system: 'النظام',
};

const AdvancedPermissionsManagement = () => {
  const { user: currentUser } = useCurrentUser();
  const [roles, setRoles] = useState<RoleHierarchy[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const isAdmin = currentUser && ['super_admin', 'owner', 'admin'].includes(currentUser.role);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes, rpRes] = await Promise.all([
        supabase.from('clinic_role_hierarchy').select('*').order('level', { ascending: true }),
        supabase.from('permissions').select('*').eq('is_active', true).order('category, permission_name'),
        supabase.from('role_permissions').select('role_id, permission_id'),
      ]);

      if (rolesRes.error) throw rolesRes.error;
      if (permsRes.error) throw permsRes.error;

      setRoles(rolesRes.data || []);
      setPermissions(permsRes.data || []);
      setRolePermissions(rpRes.data || []);

      if (rolesRes.data && rolesRes.data.length > 0) {
        setSelectedRole(rolesRes.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching permissions data:', error);
      toast({ title: 'خطأ', description: 'فشل في تحميل بيانات الصلاحيات', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (roleId: string, permissionId: string, currentlyEnabled: boolean) => {
    if (!isAdmin) {
      toast({ title: 'غير مصرح', description: 'ليس لديك صلاحية لتعديل الصلاحيات', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      if (currentlyEnabled) {
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', roleId)
          .eq('permission_id', permissionId);
        if (error) throw error;
        setRolePermissions(prev => prev.filter(rp => !(rp.role_id === roleId && rp.permission_id === permissionId)));
      } else {
        const { error } = await supabase
          .from('role_permissions')
          .insert({ role_id: roleId, permission_id: permissionId });
        if (error) throw error;
        setRolePermissions(prev => [...prev, { role_id: roleId, permission_id: permissionId }]);
      }
      toast({ title: 'تم بنجاح', description: 'تم تحديث الصلاحية' });
    } catch (error) {
      console.error('Error toggling permission:', error);
      toast({ title: 'خطأ', description: 'فشل في تحديث الصلاحية', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const hasRolePermission = (roleId: string, permissionId: string) => {
    return rolePermissions.some(rp => rp.role_id === roleId && rp.permission_id === permissionId);
  };

  const getPermissionsByCategory = () => {
    const grouped: Record<string, PermissionItem[]> = {};
    permissions.forEach(p => {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    });
    return grouped;
  };

  const selectedRoleData = roles.find(r => r.id === selectedRole);
  const permsByCategory = getPermissionsByCategory();

  const getRolePermCount = (roleId: string) => {
    return rolePermissions.filter(rp => rp.role_id === roleId).length;
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="الأدوار والصلاحيات" description="إدارة أدوار المستخدمين وصلاحياتهم" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="الأدوار والصلاحيات" description="إدارة أدوار المستخدمين وصلاحياتهم في النظام" />

      <div className="space-y-6">
        {/* Role Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {roles.map((role) => (
            <Card
              key={role.id}
              className={`cursor-pointer transition-all ${selectedRole === role.id ? 'ring-2 ring-primary border-primary' : 'hover:shadow-md'}`}
              onClick={() => setSelectedRole(role.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  {ROLE_LABELS[role.role_name] || role.role_name}
                </CardTitle>
                <CardDescription className="text-xs">
                  {role.description_ar || `المستوى ${role.level}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Lock className="h-3 w-3 ml-1" />
                    {getRolePermCount(role.id)} صلاحية
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    مستوى {role.level}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Permissions Matrix */}
        {selectedRoleData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                صلاحيات: {ROLE_LABELS[selectedRoleData.role_name] || selectedRoleData.role_name}
              </CardTitle>
              <CardDescription>
                {selectedRoleData.description_ar || 'اختر الصلاحيات المتاحة لهذا الدور'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(permsByCategory).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Lock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد صلاحيات مسجلة في النظام</p>
                  <p className="text-xs mt-1">يتم إنشاء الصلاحيات تلقائياً عند إعداد النظام</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(permsByCategory).map(([category, perms]) => (
                    <div key={category}>
                      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-primary">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        {CATEGORY_LABELS[category] || category}
                        <Badge variant="outline" className="text-xs mr-auto">
                          {perms.filter(p => hasRolePermission(selectedRole, p.id)).length}/{perms.length}
                        </Badge>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {perms.map((perm) => {
                          const enabled = hasRolePermission(selectedRole, perm.id);
                          return (
                            <div
                              key={perm.id}
                              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${enabled ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'}`}
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium">{perm.permission_name_ar || perm.permission_name}</p>
                                <p className="text-xs text-muted-foreground">{perm.permission_key}</p>
                              </div>
                              {isAdmin ? (
                                <Switch
                                  checked={enabled}
                                  disabled={saving}
                                  onCheckedChange={() => togglePermission(selectedRole, perm.id, enabled)}
                                />
                              ) : (
                                enabled ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!isAdmin && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="h-5 w-5 text-amber-600" />
              <p className="text-sm text-amber-800">أنت في وضع العرض فقط. تعديل الصلاحيات يتطلب صلاحيات مدير.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
};

export default AdvancedPermissionsManagement;
