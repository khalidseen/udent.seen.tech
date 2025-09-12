import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExpiringCache } from '@/lib/performance';
import { debounce } from '@/lib/performance';

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

// Legacy cache for backward compatibility
const legacyPermissionsCache = new ExpiringCache<Permission[]>();
const legacyRolesCache = new ExpiringCache<UserRole[]>();

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  // System admin check - مع تحسين الأداء
  const isSystemAdmin = useMemo(() => 
<<<<<<< HEAD
    user?.email === 'eng.khalid.work@gmail.com' || 
    user?.user_metadata?.role === 'super_admin', 
    [user?.email, user?.user_metadata?.role]
=======
    user?.email === 'eng.khalid.work@gmail.com', 
    [user?.email]
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
  );

  // Debounced fetch function to prevent excessive API calls
  const debouncedFetchPermissions = useMemo(
    () => debounce(async (currentUser: any) => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // System admin gets all permissions with caching
<<<<<<< HEAD
        if (currentUser.email === 'eng.khalid.work@gmail.com' || 
            currentUser.user_metadata?.role === 'super_admin') {
=======
        if (currentUser.email === 'eng.khalid.work@gmail.com') {
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
          const cacheKey = 'admin_all_permissions';
          const cachedPermissions = legacyPermissionsCache.get(cacheKey);
          
          if (cachedPermissions) {
            setPermissions(cachedPermissions);
            setUserRoles([{ role_name: 'admin', role_name_ar: 'مدير النظام', is_primary: true }]);
            setLoading(false);
            return;
          }

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
          
          // Cache admin permissions for 10 minutes
          legacyPermissionsCache.set(cacheKey, formattedPermissions, 10 * 60 * 1000);
          setLoading(false);
          return;
        }

        // Regular user permissions with caching and fallback
        const userCacheKey = `user_perms_${currentUser.id}`;
        const rolesCacheKey = `user_roles_${currentUser.id}`;
        
        const cachedPerms = legacyPermissionsCache.get(userCacheKey);
        const cachedRoles = legacyRolesCache.get(rolesCacheKey);
        
        if (cachedPerms && cachedRoles) {
          setPermissions(cachedPerms);
          setUserRoles(cachedRoles);
          setLoading(false);
          return;
        }

        // Attempt to fetch with fallback strategy
        let permissionsData = null;
        let rolesData = null;

        try {
          const [permsResult, rolesResult] = await Promise.all([
            supabase.rpc('get_user_effective_permissions'),
            supabase.rpc('get_user_roles')
          ]);

          if (!permsResult.error) permissionsData = permsResult.data;
          if (!rolesResult.error) rolesData = rolesResult.data;
        } catch (rpcError) {
          console.warn('RPC calls failed, using profile fallback:', rpcError);
        }

        // Fallback to profile-based permissions if RPC fails
        if (!permissionsData || !rolesData) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', currentUser.id)
            .single();
          
          if (profileData?.role) {
            // Set basic permissions based on role
            permissionsData = [];
            rolesData = [{
              role_name: profileData.role,
              role_name_ar: profileData.role === 'admin' ? 'مدير' : 'مستخدم',
              is_primary: true
            }];
          }
        }

        const formattedPermissions = permissionsData?.map((p: any) => ({
          permission_key: p.permission_key,
          permission_name: p.permission_name,
          permission_name_ar: p.permission_name_ar,
          category: p.category
        })) || [];

        setPermissions(formattedPermissions);
        setUserRoles(rolesData || []);

        // Cache for 2 minutes for regular users
        legacyPermissionsCache.set(userCacheKey, formattedPermissions, 2 * 60 * 1000);
        legacyRolesCache.set(rolesCacheKey, rolesData || [], 2 * 60 * 1000);

      } catch (error) {
        console.error('Error in fetchUserPermissions:', error);
        toast({
          title: 'خطأ في جلب الصلاحيات',
          description: 'سيتم إعادة المحاولة تلقائياً',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }, 300),
    [toast]
  );

  // Get current user with caching
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
<<<<<<< HEAD
        
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
        setUser(currentUser);
      } catch (error) {
        console.error('Error getting user:', error);
        setUser(null);
      }
    };
    getUser();
  }, []);

  // Fetch permissions when user changes
  useEffect(() => {
    debouncedFetchPermissions(user);
  }, [user, debouncedFetchPermissions]);

  // Memoized permission check functions for better performance
  const hasPermission = useMemo(() => 
    (permissionKey: string): boolean => {
      if (isSystemAdmin) return true;
      return permissions.some(permission => permission.permission_key === permissionKey);
    }, 
    [isSystemAdmin, permissions]
  );

  const hasAnyPermission = useMemo(() => 
    (permissionKeys: string[]): boolean => {
      if (isSystemAdmin) return true;
      return permissionKeys.some(key => hasPermission(key));
    }, 
    [isSystemAdmin, hasPermission]
  );

  const hasRole = useMemo(() => 
    (roleName: string): boolean => {
      if (isSystemAdmin) return true;
      return userRoles.some(role => role.role_name === roleName);
    }, 
    [isSystemAdmin, userRoles]
  );

  const getPermissionsByCategory = useMemo(() => 
    (category: string): Permission[] => {
      return permissions.filter(permission => permission.category === category);
    }, 
    [permissions]
  );

  const getPrimaryRole = useMemo(() => 
    (): UserRole | undefined => {
      return userRoles.find(role => role.is_primary);
    }, 
    [userRoles]
  );

  const refetch = async () => {
    legacyPermissionsCache.clear();
    legacyRolesCache.clear();
    await debouncedFetchPermissions(user);
  };

  return {
    permissions,
    userRoles,
    loading,
    user,
    hasPermission,
    hasAnyPermission,
    getPermissionsByCategory,
    getPrimaryRole,
    hasRole,
    refetch,
  };
};