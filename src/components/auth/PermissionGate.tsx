import { ReactNode, useState, useEffect, memo } from 'react';
import { usePermissions } from '@/contexts/PermissionsContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface PermissionGateProps {
  permissions?: string[];
  roles?: string[];
  features?: string[];
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  checkSubscription?: boolean;
  showLoadingSkeleton?: boolean;
}

export const PermissionGate = memo(({ 
  permissions = [], 
  roles = [], 
  features = [],
  requireAll = false,
  children, 
  fallback = null,
  checkSubscription = true,
  showLoadingSkeleton = true
}: PermissionGateProps) => {
  const { hasPermission, hasRole, loading, user } = usePermissions();
  const [hasFeatureAccess, setHasFeatureAccess] = useState(true);
  const [featureLoading, setFeatureLoading] = useState(features.length > 0);
  const [error, setError] = useState<string | null>(null);

  // Check plan features with improved error handling
  useEffect(() => {
    const checkPlanFeatures = async () => {
      if (features.length === 0 || !checkSubscription) {
        setHasFeatureAccess(true);
        setFeatureLoading(false);
        return;
      }

      try {
        setError(null);
        const featureChecks = await Promise.all(
          features.map(async (feature) => {
            try {
              const result = await supabase.rpc('has_plan_feature', { 
                feature_key_param: feature 
              });
              return result.data === true;
            } catch (error) {
              console.warn(`Failed to check feature ${feature}:`, error);
              return false; // Default to false on error
            }
          })
        );

        const hasAllFeatures = requireAll 
          ? featureChecks.every(result => result === true)
          : featureChecks.some(result => result === true);

        setHasFeatureAccess(hasAllFeatures);
      } catch (error) {
        console.error('Error checking plan features:', error);
        setError('خطأ في التحقق من ميزات الاشتراك');
        setHasFeatureAccess(false);
      } finally {
        setFeatureLoading(false);
      }
    };

    checkPlanFeatures();
  }, [features, requireAll, checkSubscription]);

  // Show loading skeleton or fallback
  if (loading || featureLoading) {
    if (showLoadingSkeleton && !fallback) {
      return <Skeleton className="h-32 w-full" />;
    }
    return fallback;
  }

  // Show error state
  if (error) {
    return (
      <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/10">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
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
});