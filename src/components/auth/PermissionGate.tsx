import { ReactNode, useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';

interface PermissionGateProps {
  permissions?: string[];
  roles?: string[];
  features?: string[];
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  checkSubscription?: boolean;
}

export const PermissionGate = ({ 
  permissions = [], 
  roles = [], 
  features = [],
  requireAll = false,
  children, 
  fallback = null,
  checkSubscription = true
}: PermissionGateProps) => {
  const { hasPermission, hasRole, loading } = usePermissions();
  const [hasFeatureAccess, setHasFeatureAccess] = useState(true);
  const [featureLoading, setFeatureLoading] = useState(features.length > 0);
  const [user, setUser] = useState<any>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Check plan features
  useEffect(() => {
    const checkPlanFeatures = async () => {
      if (features.length === 0 || !checkSubscription) {
        setHasFeatureAccess(true);
        setFeatureLoading(false);
        return;
      }

      try {
        const featureChecks = await Promise.all(
          features.map(feature => 
            supabase.rpc('has_plan_feature', { feature_key_param: feature })
          )
        );

        const hasAllFeatures = requireAll 
          ? featureChecks.every(result => result.data === true)
          : featureChecks.some(result => result.data === true);

        setHasFeatureAccess(hasAllFeatures);
      } catch (error) {
        console.error('Error checking plan features:', error);
        setHasFeatureAccess(false);
      } finally {
        setFeatureLoading(false);
      }
    };

    checkPlanFeatures();
  }, [features, requireAll, checkSubscription]);

  // Show loading state if needed
  if (loading || featureLoading) {
    return fallback;
  }

  // Check permissions
  const hasRequiredPermissions = permissions.length === 0 || (
    requireAll 
      ? permissions.every(permission => hasPermission(permission))
      : permissions.some(permission => hasPermission(permission))
  );

  // Check roles
  const hasRequiredRoles = roles.length === 0 || (
    requireAll 
      ? roles.every(role => hasRole(role))
      : roles.some(role => hasRole(role))
  );

  // All conditions must be met - إعطاء صلاحيات كاملة لمدير النظام
  const isSystemAdmin = user?.email === 'eng.khalid.work@gmail.com';
  const hasAccess = isSystemAdmin || (hasRequiredPermissions && hasRequiredRoles && hasFeatureAccess);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};