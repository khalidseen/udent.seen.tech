import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCog, Plus, Edit, Shield } from "lucide-react";

const AdvancedPermissionsManagement = () => {
  return (
    <PageContainer>
      <PageHeader 
        title="إدارة الصلاحيات المتقدمة" 
        description="إدارة شاملة لصلاحيات المستخدمين والأدوار"
      />
      
      <div className="space-y-6">
        <div className="flex gap-4">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            دور جديد
          </Button>
          <Button variant="outline">
            <Shield className="h-4 w-4 mr-2" />
            إعدادات الأمان
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { role: "مدير العيادة", users: 2, permissions: 25 },
            { role: "طبيب", users: 5, permissions: 18 },
            { role: "مساعد طبيب", users: 3, permissions: 12 },
            { role: "سكرتير", users: 4, permissions: 8 },
            { role: "محاسب", users: 1, permissions: 10 },
            { role: "مشرف تقني", users: 1, permissions: 15 }
          ].map((role, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  {role.role}
                </CardTitle>
                <CardDescription>
                  {role.users} مستخدم • {role.permissions} صلاحية
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" variant="outline" className="w-full">
                  <Edit className="h-3 w-3 mr-2" />
                  تعديل الصلاحيات
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};

export default AdvancedPermissionsManagement;
