import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Building, Shield, Bell, Monitor, Database } from "lucide-react";

// Import settings components
import { InterfaceSettings } from "@/components/settings/InterfaceSettings";
import { ClinicSettings } from "@/components/settings/ClinicSettings";
import { SystemSettings } from "@/components/settings/SystemSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("interface");

  const settingsTabs = [
    {
      value: "interface",
      label: "الواجهة",
      icon: Monitor,
      description: "تخصيص مظهر وسلوك واجهة النظام",
      component: InterfaceSettings
    },
    {
      value: "clinic",
      label: "العيادة", 
      icon: Building,
      description: "معلومات العيادة وأوقات العمل",
      component: ClinicSettings
    },
    {
      value: "notifications",
      label: "الإشعارات",
      icon: Bell,
      description: "إعدادات التنبيهات والإشعارات",
      component: NotificationSettings
    },
    {
      value: "system",
      label: "النظام",
      icon: Shield,
      description: "الأمان والنسخ الاحتياطي",
      component: SystemSettings
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <SettingsIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">الإعدادات</h1>
          <p className="text-muted-foreground">إدارة وتخصيص إعدادات النظام</p>
        </div>
      </div>

      {/* Settings Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Tabs Navigation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">أقسام الإعدادات</CardTitle>
            <CardDescription>اختر القسم الذي تريد تعديل إعداداته</CardDescription>
          </CardHeader>
          <CardContent>
            <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto p-1">
              {settingsTabs.map(tab => {
                const IconComponent = tab.icon;
                return (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value}
                    className="flex flex-col gap-2 h-16 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </CardContent>
        </Card>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {settingsTabs.map(tab => {
            const ComponentToRender = tab.component;
            return (
              <TabsContent key={tab.value} value={tab.value} className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <tab.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">إعدادات {tab.label}</CardTitle>
                        <CardDescription>{tab.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ComponentToRender />
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </div>
      </Tabs>
    </div>
  );
}
