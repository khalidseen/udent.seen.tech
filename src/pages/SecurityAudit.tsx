import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { AuditTrailDashboard } from '@/components/security/AuditTrailDashboard';
import { PageContainer } from '@/components/layout/PageContainer';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SecurityAudit() {
  return (
    <PageContainer>
      <PermissionGate 
        permissions={['audit.view']}
        roles={['admin', 'super_admin']}
        checkSubscription={false}
        fallback={
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                غير مصرح لك بالوصول
              </CardTitle>
              <CardDescription>
                تحتاج إلى صلاحية "audit.view" للوصول إلى لوحة مراقبة التدقيق الأمني.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                يرجى التواصل مع المدير لمنحك الصلاحيات اللازمة للوصول إلى هذه الصفحة.
              </p>
            </CardContent>
          </Card>
        }
      >
        <AuditTrailDashboard />
      </PermissionGate>
    </PageContainer>
  );
}