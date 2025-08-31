import { PermissionGate } from '@/components/auth/PermissionGate';
import { SubscriptionPlansManagement } from '@/components/subscription/SubscriptionPlansManagement';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SubscriptionPlans() {
  return (
    <PageContainer>
      <PageHeader 
        title="إدارة خطط الاشتراك" 
        description="إدارة وتخصيص خطط الاشتراك والميزات للعيادات"
      />
      
      <PermissionGate 
        roles={['admin']}
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
        <SubscriptionPlansManagement />
      </PermissionGate>
    </PageContainer>
  );
}