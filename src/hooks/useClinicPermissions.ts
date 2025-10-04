import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ClinicRole = 'owner' | 'clinic_manager' | 'dentist' | 'accountant' | 'assistant' | 'super_admin';

export interface ClinicRoleInfo {
  role_name: ClinicRole;
  level: number;
  can_manage: ClinicRole[];
  permissions: Record<string, any>;
  description: string;
  description_ar: string;
}

export const useClinicPermissions = () => {
  const [userRole, setUserRole] = useState<ClinicRole>('assistant');
  const [roleHierarchy, setRoleHierarchy] = useState<ClinicRoleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const fetchUserRole = async () => {
    try {
      // إعطاء صلاحيات كاملة لمدير النظام
      if (user?.email === 'eng.khalid.work@gmail.com') {
        setUserRole('owner');
        return;
      }

      const { data, error } = await supabase.rpc('get_user_clinic_role');
      
      if (error) {
        console.error('Error fetching user clinic role:', error);
        throw error;
      }
      
      setUserRole(data || 'assistant');
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      toast({
        title: 'خطأ في جلب دور المستخدم',
        description: 'حدث خطأ أثناء جلب دور المستخدم في العيادة',
        variant: 'destructive',
      });
    }
  };

  const fetchRoleHierarchy = async () => {
    try {
      const { data, error } = await supabase
        .from('clinic_role_hierarchy')
        .select('*')
        .order('level');

      if (error) {
        console.error('Error fetching role hierarchy:', error);
        throw error;
      }

      // Map the data to our interface
      const mappedData: ClinicRoleInfo[] = (data || []).map(item => ({
        role_name: item.role_name as ClinicRole,
        level: item.level,
        can_manage: item.can_manage as ClinicRole[],
        permissions: item.permissions as Record<string, any>,
        description: item.description,
        description_ar: item.description_ar,
      }));

      setRoleHierarchy(mappedData);
    } catch (error) {
      console.error('Error in fetchRoleHierarchy:', error);
      toast({
        title: 'خطأ في جلب التسلسل الهرمي',
        description: 'حدث خطأ أثناء جلب التسلسل الهرمي للأدوار',
        variant: 'destructive',
      });
    }
  };

  const canManageRole = (targetRole: ClinicRole): boolean => {
    // إعطاء صلاحيات كاملة لمدير النظام
    if (user?.email === 'eng.khalid.work@gmail.com') {
      return true;
    }

    const currentRoleInfo = roleHierarchy.find(role => role.role_name === userRole);
    return currentRoleInfo?.can_manage?.includes(targetRole) || false;
  };

  const hasClinicPermission = (permissionKey: string): boolean => {
    // إعطاء صلاحيات كاملة لمدير النظام
    if (user?.email === 'eng.khalid.work@gmail.com') {
      return true;
    }

    const currentRoleInfo = roleHierarchy.find(role => role.role_name === userRole);
    if (!currentRoleInfo) return false;
    
    const permission = currentRoleInfo.permissions[permissionKey];
    return permission === true || permission === 'true';
  };

  const getAvailableRoles = (): ClinicRoleInfo[] => {
    // إعطاء جميع الأدوار لمدير النظام
    if (user?.email === 'eng.khalid.work@gmail.com') {
      return roleHierarchy;
    }

    const currentRoleInfo = roleHierarchy.find(role => role.role_name === userRole);
    if (!currentRoleInfo) return [];

    // إرجاع الأدوار التي يمكن للمستخدم الحالي إدارتها
    return roleHierarchy.filter(role => 
      currentRoleInfo.can_manage?.includes(role.role_name)
    );
  };

  const getRoleInfo = (role: ClinicRole): ClinicRoleInfo | undefined => {
    return roleHierarchy.find(r => r.role_name === role);
  };

  const isHigherRole = (role: ClinicRole): boolean => {
    const currentRoleInfo = roleHierarchy.find(r => r.role_name === userRole);
    const targetRoleInfo = roleHierarchy.find(r => r.role_name === role);
    
    if (!currentRoleInfo || !targetRoleInfo) return false;
    
    return targetRoleInfo.level < currentRoleInfo.level;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchRoleHierarchy(), fetchUserRole()]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user]);

  return {
    userRole,
    roleHierarchy,
    loading,
    canManageRole,
    hasClinicPermission,
    getAvailableRoles,
    getRoleInfo,
    isHigherRole,
    refetch: () => Promise.all([fetchRoleHierarchy(), fetchUserRole()]),
  };
};