import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Permission {
  permission_key: string;
  permission_name: string;
  permission_name_ar: string;
  category: string;
}

export interface UserRole {
  role_name: string;
  role_name_ar: string;
  is_primary: boolean;
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // إعطاء صلاحيات كاملة لمدير النظام
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const fetchUserPermissions = async () => {
    try {
      setLoading(true);
      
      // إعطاء صلاحيات كاملة لمدير النظام
      if (user?.email === 'eng.khalid.work@gmail.com') {
        // إعطاء جميع الصلاحيات
        const { data: allPermissions } = await supabase
          .from('permissions')
          .select('*')
          .eq('is_active', true);
        
        const formattedPermissions = allPermissions?.map((p: any) => ({
          permission_key: p.permission_key,
          permission_name: p.permission_name,
          permission_name_ar: p.permission_name_ar,
          category: p.category
        })) || [];
        
        setPermissions(formattedPermissions);
        setUserRoles([{ role_name: 'admin', role_name_ar: 'مدير النظام', is_primary: true }]);
        setLoading(false);
        return;
      }

      // استخدام الدالة الجديدة للحصول على جميع الصلاحيات الفعلية
      const { data: permissionsData, error: permissionsError } = await supabase
        .rpc('get_user_effective_permissions');

      if (permissionsError) {
        console.error('Error fetching permissions:', permissionsError);
        throw permissionsError;
      }

      // استخدام البيانات الجديدة مع البنية المحدثة
      const formattedPermissions = permissionsData?.map((p: any) => ({
        permission_key: p.permission_key,
        permission_name: p.permission_name,
        permission_name_ar: p.permission_name_ar,
        category: p.category
      })) || [];

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .rpc('get_user_roles');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        throw rolesError;
      }

      setPermissions(formattedPermissions);
      setUserRoles(rolesData || []);
    } catch (error) {
      console.error('Error in fetchUserPermissions:', error);
      toast({
        title: 'خطأ في جلب الصلاحيات',
        description: 'حدث خطأ أثناء جلب صلاحيات المستخدم',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permissionKey: string): boolean => {
    // إعطاء جميع الصلاحيات لمدير النظام
    if (user?.email === 'eng.khalid.work@gmail.com') {
      return true;
    }
    return permissions.some(permission => permission.permission_key === permissionKey);
  };

  const hasAnyPermission = (permissionKeys: string[]): boolean => {
    // إعطاء جميع الصلاحيات لمدير النظام
    if (user?.email === 'eng.khalid.work@gmail.com') {
      return true;
    }
    return permissionKeys.some(key => hasPermission(key));
  };

  const getPermissionsByCategory = (category: string): Permission[] => {
    return permissions.filter(permission => permission.category === category);
  };

  const getPrimaryRole = (): UserRole | undefined => {
    return userRoles.find(role => role.is_primary);
  };

  const hasRole = (roleName: string): boolean => {
    // إعطاء جميع الأدوار لمدير النظام
    if (user?.email === 'eng.khalid.work@gmail.com') {
      return true;
    }
    return userRoles.some(role => role.role_name === roleName);
  };

  useEffect(() => {
    fetchUserPermissions();
  }, [user]);

  return {
    permissions,
    userRoles,
    loading,
    hasPermission,
    hasAnyPermission,
    getPermissionsByCategory,
    getPrimaryRole,
    hasRole,
    refetch: fetchUserPermissions,
  };
};