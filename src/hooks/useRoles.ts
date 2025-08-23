import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Role {
  id: string;
  role_name: string;
  role_name_ar: string;
  description: string;
  is_system_role: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by: string | null;
  assigned_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRoles = async () => {
    try {
      setLoading(true);
      
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('is_active', true)
        .order('role_name');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        throw rolesError;
      }

      setRoles(rolesData || []);
    } catch (error) {
      console.error('Error in fetchRoles:', error);
      toast({
        title: 'خطأ في جلب الأدوار',
        description: 'حدث خطأ أثناء جلب قائمة الأدوار',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleAssignments = async () => {
    try {
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('user_role_assignments')
        .select(`
          *,
          user_roles (
            role_name,
            role_name_ar
          )
        `)
        .eq('is_active', true);

      if (assignmentsError) {
        console.error('Error fetching role assignments:', assignmentsError);
        throw assignmentsError;
      }

      setRoleAssignments(assignmentsData || []);
    } catch (error) {
      console.error('Error in fetchRoleAssignments:', error);
      toast({
        title: 'خطأ في جلب تعيينات الأدوار',
        description: 'حدث خطأ أثناء جلب تعيينات الأدوار',
        variant: 'destructive',
      });
    }
  };

  const assignRoleToUser = async (userId: string, roleId: string, expiresAt?: string) => {
    try {
      const { error } = await supabase
        .from('user_role_assignments')
        .insert({
          user_id: userId,
          role_id: roleId,
          expires_at: expiresAt || null,
          is_active: true
        });

      if (error) {
        console.error('Error assigning role:', error);
        throw error;
      }

      toast({
        title: 'تم تعيين الدور بنجاح',
        description: 'تم تعيين الدور للمستخدم بنجاح',
      });

      await fetchRoleAssignments();
      return true;
    } catch (error) {
      console.error('Error in assignRoleToUser:', error);
      toast({
        title: 'خطأ في تعيين الدور',
        description: 'حدث خطأ أثناء تعيين الدور للمستخدم',
        variant: 'destructive',
      });
      return false;
    }
  };

  const revokeRoleFromUser = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('user_role_assignments')
        .update({ is_active: false })
        .eq('id', assignmentId);

      if (error) {
        console.error('Error revoking role:', error);
        throw error;
      }

      toast({
        title: 'تم إلغاء الدور بنجاح',
        description: 'تم إلغاء الدور من المستخدم بنجاح',
      });

      await fetchRoleAssignments();
      return true;
    } catch (error) {
      console.error('Error in revokeRoleFromUser:', error);
      toast({
        title: 'خطأ في إلغاء الدور',
        description: 'حدث خطأ أثناء إلغاء الدور من المستخدم',
        variant: 'destructive',
      });
      return false;
    }
  };

  const createRole = async (roleData: Partial<Role>) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          role_name: roleData.role_name,
          role_name_ar: roleData.role_name_ar,
          description: roleData.description,
          is_system_role: false,
          is_active: true
        });

      if (error) {
        console.error('Error creating role:', error);
        throw error;
      }

      toast({
        title: 'تم إنشاء الدور بنجاح',
        description: 'تم إنشاء الدور الجديد بنجاح',
      });

      await fetchRoles();
      return true;
    } catch (error) {
      console.error('Error in createRole:', error);
      toast({
        title: 'خطأ في إنشاء الدور',
        description: 'حدث خطأ أثناء إنشاء الدور الجديد',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateRole = async (roleId: string, roleData: Partial<Role>) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({
          role_name_ar: roleData.role_name_ar,
          description: roleData.description,
        })
        .eq('id', roleId)
        .eq('is_system_role', false); // Only allow updating non-system roles

      if (error) {
        console.error('Error updating role:', error);
        throw error;
      }

      toast({
        title: 'تم تحديث الدور بنجاح',
        description: 'تم تحديث معلومات الدور بنجاح',
      });

      await fetchRoles();
      return true;
    } catch (error) {
      console.error('Error in updateRole:', error);
      toast({
        title: 'خطأ في تحديث الدور',
        description: 'حدث خطأ أثناء تحديث معلومات الدور',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('id', roleId)
        .eq('is_system_role', false); // Only allow deleting non-system roles

      if (error) {
        console.error('Error deleting role:', error);
        throw error;
      }

      toast({
        title: 'تم حذف الدور بنجاح',
        description: 'تم حذف الدور بنجاح',
      });

      await fetchRoles();
      return true;
    } catch (error) {
      console.error('Error in deleteRole:', error);
      toast({
        title: 'خطأ في حذف الدور',
        description: 'حدث خطأ أثناء حذف الدور',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchRoleAssignments();
  }, []);

  return {
    roles,
    roleAssignments,
    loading,
    assignRoleToUser,
    revokeRoleFromUser,
    createRole,
    updateRole,
    deleteRole,
    refetch: () => {
      fetchRoles();
      fetchRoleAssignments();
    },
  };
};