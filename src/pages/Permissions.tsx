import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { AdvancedPermissionsManagement } from '@/components/settings/AdvancedPermissionsManagement';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Permissions() {
  return (
    <PageContainer>
      <PageHeader 
        title="إدارة الصلاحيات والأدوار" 
        description="إدارة وتعديل صلاحيات المستخدمين والأدوار في النظام"
      />
      
      <PermissionGate 
        permissions={['permissions.manage']}
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
                تحتاج إلى صلاحية "permissions.manage" للوصول إلى إدارة الصلاحيات والأدوار.
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
        <AdvancedPermissionsManagement />
      </PermissionGate>
    </PageContainer>
  );
}