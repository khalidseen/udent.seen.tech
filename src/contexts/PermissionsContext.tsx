import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExpiringCache } from '@/lib/performance';

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

interface PermissionsContextType {
  permissions: Permission[];
  userRoles: UserRole[];
  loading: boolean;
  user: any;
  hasPermission: (permissionKey: string) => boolean;
  hasAnyPermission: (permissionKeys: string[]) => boolean;
  hasRole: (roleName: string) => boolean;
  getPermissionsByCategory: (category: string) => Permission[];
  getPrimaryRole: () => UserRole | undefined;
  refetch: () => Promise<void>;
  clearCache: () => void;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

// Global cache for permissions - prevents duplicate requests
const permissionsCache = new ExpiringCache<Permission[]>();
const rolesCache = new ExpiringCache<UserRole[]>();
const userCache = new ExpiringCache<any>();

export const PermissionsProvider = ({ children }: { children: React.ReactNode }) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  // System admin check - cached for performance
  const isSystemAdmin = user?.email === 'eng.khalid.work@gmail.com';

  const clearCache = () => {
    permissionsCache.clear();
    rolesCache.clear();
    userCache.clear();
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Check cache first
      const cachedUser = userCache.get('current_user');
      if (cachedUser && !isSystemAdmin) {
        setUser(cachedUser);
      } else {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        if (currentUser) {
          userCache.set('current_user', currentUser, 5 * 60 * 1000); // 5 minutes cache
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchUserPermissions = async () => {
    if (!user) return;

    try {
      // System admin gets all permissions
      if (isSystemAdmin) {
        const cachedPermissions = permissionsCache.get('all_permissions');
        if (cachedPermissions) {
          setPermissions(cachedPermissions);
          setUserRoles([{ role_name: 'admin', role_name_ar: 'مدير النظام', is_primary: true }]);
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
        
        // Cache for system admin
        permissionsCache.set('all_permissions', formattedPermissions, 10 * 60 * 1000);
        return;
      }

      // Check cache for regular users
      const cacheKey = `permissions_${user.id}`;
      const rolesCacheKey = `roles_${user.id}`;
      
      const cachedPermissions = permissionsCache.get(cacheKey);
      const cachedRoles = rolesCache.get(rolesCacheKey);
      
      if (cachedPermissions && cachedRoles) {
        setPermissions(cachedPermissions);
        setUserRoles(cachedRoles);
        return;
      }

      // Fetch fresh data with fallback approach and better error handling
      try {
        const { data: permissionsData, error: permissionsError } = await supabase
          .rpc('get_user_effective_permissions');

        if (!permissionsError && permissionsData) {
          const formattedPermissions = permissionsData.map((p: any) => ({
            permission_key: p.permission_key,
            permission_name: p.permission_name,
            permission_name_ar: p.permission_name_ar,
            category: p.category
          }));
          
          setPermissions(formattedPermissions);
          permissionsCache.set(cacheKey, formattedPermissions, 3 * 60 * 1000); // 3 minutes cache
        } else if (permissionsError?.code === '500' || permissionsError?.message?.includes('500')) {
          console.warn('Server error (500) for permissions, using fallback');
          throw new Error('Server error - using fallback');
        }
      } catch (permError) {
        console.warn('RPC permissions failed, using fallback:', permError);
        // Enhanced fallback to basic profile-based permissions
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();
            
          if (!profileError && profileData?.role) {
            // Set basic permissions based on role with retry logic
            const basicPermissions: Permission[] = [
              {
                permission_key: 'view_dashboard',
                permission_name: 'View Dashboard',
                permission_name_ar: 'عرض لوحة التحكم',
                category: 'dashboard'
              },
              {
                permission_key: 'view_patients',
                permission_name: 'View Patients',
                permission_name_ar: 'عرض المرضى',
                category: 'patients'
              }
            ];
            setPermissions(basicPermissions);
            permissionsCache.set(cacheKey, basicPermissions, 2 * 60 * 1000);
          } else {
            // Last resort: minimal permissions
            const minimalPermissions: Permission[] = [{
              permission_key: 'view_dashboard',
              permission_name: 'View Dashboard',
              permission_name_ar: 'عرض لوحة التحكم',
              category: 'dashboard'
            }];
            setPermissions(minimalPermissions);
          }
        } catch (fallbackError) {
          console.error('All permission fetching methods failed:', fallbackError);
          // Set empty array to prevent further errors
          setPermissions([]);
        }
      }

      // Fetch roles with fallback and better error handling
      try {
        const { data: rolesData, error: rolesError } = await supabase
          .rpc('get_user_roles');

        if (!rolesError && rolesData) {
          setUserRoles(rolesData);
          rolesCache.set(rolesCacheKey, rolesData, 3 * 60 * 1000);
        } else if (rolesError?.code === '500' || rolesError?.message?.includes('500')) {
          console.warn('Server error (500) for roles, using fallback');
          throw new Error('Server error - using fallback');
        }
      } catch (roleError) {
        console.warn('RPC roles failed, using fallback:', roleError);
        // Enhanced fallback to profile role
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();
            
          if (!profileError && profileData?.role) {
            const fallbackRole: UserRole[] = [{
              role_name: profileData.role,
              role_name_ar: profileData.role === 'admin' ? 'مدير' : 'مستخدم',
              is_primary: true
            }];
            setUserRoles(fallbackRole);
            rolesCache.set(rolesCacheKey, fallbackRole, 2 * 60 * 1000);
          } else {
            // Last resort: default user role
            const defaultRole: UserRole[] = [{
              role_name: 'user',
              role_name_ar: 'مستخدم',
              is_primary: true
            }];
            setUserRoles(defaultRole);
          }
        } catch (fallbackError) {
          console.error('All role fetching methods failed:', fallbackError);
          // Set default role to prevent further errors
          setUserRoles([{
            role_name: 'user',
            role_name_ar: 'مستخدم',
            is_primary: true
          }]);
        }
      }

    } catch (error) {
      console.error('Error in fetchUserPermissions:', error);
      
      // Set fallback permissions to prevent app crash
      const fallbackPermissions: Permission[] = [{
        permission_key: 'view_dashboard',
        permission_name: 'View Dashboard',
        permission_name_ar: 'عرض لوحة التحكم',
        category: 'dashboard'
      }];
      
      const fallbackRoles: UserRole[] = [{
        role_name: 'user',
        role_name_ar: 'مستخدم',
        is_primary: true
      }];
      
      setPermissions(fallbackPermissions);
      setUserRoles(fallbackRoles);
      
      // Only show toast for unexpected errors (not 500 errors)
      if (!error.message?.includes('500') && !error.message?.includes('fallback')) {
        toast({
          title: 'خطأ في جلب الصلاحيات',
          description: 'سيتم استخدام الصلاحيات الافتراضية',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permissionKey: string): boolean => {
    if (isSystemAdmin) return true;
    return permissions.some(permission => permission.permission_key === permissionKey);
  };

  const hasAnyPermission = (permissionKeys: string[]): boolean => {
    if (isSystemAdmin) return true;
    return permissionKeys.some(key => hasPermission(key));
  };

  const hasRole = (roleName: string): boolean => {
    if (isSystemAdmin) return true;
    return userRoles.some(role => role.role_name === roleName);
  };

  const getPermissionsByCategory = (category: string): Permission[] => {
    return permissions.filter(permission => permission.category === category);
  };

  const getPrimaryRole = (): UserRole | undefined => {
    return userRoles.find(role => role.is_primary);
  };

  const refetch = async () => {
    clearCache();
    await fetchUserData();
    await fetchUserPermissions();
  };

  // Initialize data
  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserPermissions();
    }
  }, [user]);

  // Auto-refresh every 5 minutes for non-admin users
  useEffect(() => {
    if (!isSystemAdmin) {
      const interval = setInterval(() => {
        refetch();
      }, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [isSystemAdmin]);

  const value: PermissionsContextType = {
    permissions,
    userRoles,
    loading,
    user,
    hasPermission,
    hasAnyPermission,
    hasRole,
    getPermissionsByCategory,
    getPrimaryRole,
    refetch,
    clearCache,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = (): PermissionsContextType => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};