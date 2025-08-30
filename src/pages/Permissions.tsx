import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { AdvancedPermissionsManagement } from '@/components/settings/AdvancedPermissionsManagement';
import { PageContainer } from '@/components/layout/PageContainer';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Permissions() {
  return (
    <PageContainer>
      <PermissionGate 
        permissions={['permissions.manage']}
        fallback={
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                غير مصرح لك بالوصول
              </CardTitle>
              <CardDescription>
                تحتاج إلى صلاحية "permissions.manage" للوصول إلى إدارة الصلاحيات.
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
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">إدارة الصلاحيات والأدوار</h1>
            <p className="text-muted-foreground">
              تحكم في صلاحيات المستخدمين وإدارة الأدوار في النظام
            </p>
          </div>
          
          <AdvancedPermissionsManagement />
        </div>
      </PermissionGate>
    </PageContainer>
  );
}