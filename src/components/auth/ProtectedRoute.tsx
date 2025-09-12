import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean;
  children: ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute = ({ 
  permissions = [], 
  roles = [], 
  requireAll = false,
  children, 
  redirectTo = "/" 
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyPermission, hasRole, loading: permissionsLoading, getPrimaryRole } = usePermissions();
  
  const loading = authLoading || permissionsLoading;

  // Redirect to auth page if user is not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading state while checking permissions
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // Check permissions
  const hasRequiredPermissions = permissions.length === 0 || (
    requireAll 
      ? permissions.every(permission => hasAnyPermission([permission]))
      : hasAnyPermission(permissions)
  );

  // Check roles
  const hasRequiredRoles = roles.length === 0 || (
    requireAll 
      ? roles.every(role => hasRole(role))
      : roles.some(role => hasRole(role))
  );

  // Both conditions must be met if both are specified
  const hasAccess = hasRequiredPermissions && hasRequiredRoles;

  if (!hasAccess) {
    const primaryRole = getPrimaryRole();
    
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="max-w-md w-full">
          <Alert className="border-destructive/50">
            <Lock className="h-4 w-4" />
            <AlertDescription className="mt-2 space-y-3">
              <div className="font-medium text-destructive">
                غير مصرح لك بالوصول إلى هذه الصفحة
              </div>
              
              <div className="text-sm text-muted-foreground space-y-2">
                {primaryRole && (
                  <div>
                    <span className="font-medium">دورك الحالي:</span> {primaryRole.role_name_ar}
                  </div>
                )}
                
                {permissions.length > 0 && (
                  <div>
                    <span className="font-medium">الصلاحيات المطلوبة:</span>
                    <ul className="list-disc list-inside mt-1 text-xs space-y-1">
                      {permissions.map(permission => (
                        <li key={permission} className="text-muted-foreground">
                          {permission}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="pt-2">
                <button
                  onClick={() => window.history.back()}
                  className="text-sm text-primary hover:underline"
                >
                  العودة للصفحة السابقة
                </button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};