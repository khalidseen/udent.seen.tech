import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateProps {
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PermissionGate = ({ 
  permissions = [], 
  roles = [], 
  requireAll = false,
  children, 
  fallback = null 
}: PermissionGateProps) => {
  const { hasPermission, hasRole, loading } = usePermissions();

  // Show loading state if needed
  if (loading) {
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

  // Both conditions must be met if both are specified
  const hasAccess = hasRequiredPermissions && hasRequiredRoles;

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};