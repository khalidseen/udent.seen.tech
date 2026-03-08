import React from "react";
import { Navigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { Shield } from "lucide-react";

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  fallback?: React.ReactNode;
}

const ADMIN_ROLES = ['super_admin', 'owner', 'admin', 'manager', 'clinic_owner'];

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallback,
}) => {
  const { user, loading: userLoading } = useCurrentUser();
  const { hasAnyPermission, loading: permLoading } = usePermissions();

  if (userLoading || permLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Admins have full access
  if (ADMIN_ROLES.includes(user.role)) return <>{children}</>;

  // Check role requirement
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return fallback ? <>{fallback}</> : <AccessDenied />;
  }

  // Check permission requirement
  if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
    return fallback ? <>{fallback}</> : <AccessDenied />;
  }

  return <>{children}</>;
};

const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center h-64 gap-4">
    <Shield className="h-16 w-16 text-muted-foreground" />
    <h2 className="text-xl font-bold">غير مصرح بالوصول</h2>
    <p className="text-muted-foreground">ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة</p>
  </div>
);

export default PermissionGuard;
