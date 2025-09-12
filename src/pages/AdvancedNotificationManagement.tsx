import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Plus, Settings, Send } from "lucide-react";

const AdvancedNotificationManagement = () => {
  return (
    <PageContainer>
      <PageHeader 
        title="إدارة الإشعارات المتقدمة" 
        description="نظام شامل لإدارة وإرسال الإشعارات للمرضى والموظفين"
      />
      
      <div className="space-y-6">
        <div className="flex gap-4">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            إشعار جديد
          </Button>
          <Button variant="outline">
            <Send className="h-4 w-4 mr-2" />
            إرسال جماعي
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            إعدادات الإشعارات
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إشعارات اليوم</p>
                  <p className="text-2xl font-bold">47</p>
                </div>
                <Bell className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">معدل القراءة</p>
                  <p className="text-2xl font-bold">89%</p>
                </div>
                <Bell className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إشعارات معلقة</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <Bell className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>الإشعارات الأخيرة</CardTitle>
            <CardDescription>آخر الإشعارات المرسلة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "تذكير بموعد", recipient: "أحمد محمد", time: "منذ 5 دقائق", status: "مقروء" },
                { title: "تأكيد حجز", recipient: "فاطمة علي", time: "منذ 15 دقيقة", status: "مرسل" },
                { title: "تذكير بالدفع", recipient: "محمد خالد", time: "منذ 30 دقيقة", status: "مقروء" }
              ].map((notification, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.recipient}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">{notification.time}</p>
                    <p className="text-xs">{notification.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default AdvancedNotificationManagement;
