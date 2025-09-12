import React from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, Settings } from 'lucide-react';
import { AdvancedPermissionsManagement } from '@/components/admin/AdvancedPermissionsManagement';
import { AdvancedUserManagement as UserManagementComponent } from '@/components/admin/AdvancedUserManagement';

export default function AdvancedManagement() {
  return (
    <PageContainer>
      <PageHeader 
        title="الإدارة المتقدمة" 
        description="نظام شامل لإدارة المستخدمين والصلاحيات في النظام متعدد العيادات"
      />
      
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            إدارة المستخدمين
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            إدارة الصلاحيات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UserManagementComponent />
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <AdvancedPermissionsManagement />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}