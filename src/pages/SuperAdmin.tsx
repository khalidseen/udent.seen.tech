import { PermissionGate } from '@/components/auth/PermissionGate';
import { SuperAdminDashboard } from '@/components/super-admin/SuperAdminDashboard';
import { SubscriptionNotifications } from '@/components/subscription/SubscriptionNotifications';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SuperAdmin() {
  return (
    <PageContainer>
      <PageHeader 
        title="لوحة تحكم مدير النظام" 
        description="إدارة شاملة لجميع العيادات والمستخدمين في النظام"
      />
      
      <PermissionGate 
        permissions={['system.manage_all_clinics']}
        roles={['super_admin']}
        fallback={
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                غير مصرح لك بالوصول
              </CardTitle>
              <CardDescription>
                تحتاج إلى صلاحيات مدير النظام للوصول إلى هذه الصفحة.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                يرجى التواصل مع مدير النظام لمنحك الصلاحيات اللازمة.
              </p>
            </CardContent>
          </Card>
        }
      >
        <div className="space-y-6">
          <SubscriptionNotifications />
          <SuperAdminDashboard />
        </div>
      </PermissionGate>
    </PageContainer>
  );
}